import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('private draft migration enforces owner RLS, immutable ownership and revision conflicts', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
      insert into auth.users values
        ('11111111-1111-4111-8111-111111111111'),
        ('22222222-2222-4222-8222-222222222222');
    `)
    await db.exec(
      await readFile(
        new URL(
          '../supabase/migrations/202610220001_private_drafts.sql',
          import.meta.url,
        ),
        'utf8',
      ),
    )
    const owner = '11111111-1111-4111-8111-111111111111'
    const other = '22222222-2222-4222-8222-222222222222'
    const card = JSON.stringify({ schemaVersion: 10, pages: [], photos: [] })
    async function as(role, id = '') {
      await db.exec('reset role')
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
        id,
      ])
      await db.exec(`set role ${role}`)
    }
    await as('authenticated', owner)
    const inserted = await db.query(
      'insert into public.private_drafts (owner_id,id,name,card) values ($1,$2,$3,$4) returning *',
      [owner, 'card-1', 'Private memory', card],
    )
    assert.equal(inserted.rows[0].revision, 1)
    await assert.rejects(
      db.query(
        'insert into public.private_drafts (owner_id,id,name,card) values ($1,$2,$3,$4)',
        [other, 'forged', 'No', card],
      ),
      /row-level security/,
    )
    await assert.rejects(
      db.query('update public.private_drafts set owner_id=$1 where id=$2', [
        other,
        'card-1',
      ]),
      /permission denied/,
    )
    await assert.rejects(
      db.query('update public.private_drafts set revision=99 where id=$1', [
        'card-1',
      ]),
      /permission denied/,
    )
    const updated = await db.query(
      'update public.private_drafts set name=$1 where id=$2 and revision=1 returning revision',
      ['Updated', 'card-1'],
    )
    assert.equal(updated.rows[0].revision, 2)
    const stale = await db.query(
      'update public.private_drafts set name=$1 where id=$2 and revision=1 returning revision',
      ['Stale tab', 'card-1'],
    )
    assert.equal(stale.rows.length, 0)
    await assert.rejects(
      db.query('delete from public.private_drafts where id=$1', ['card-1']),
      /permission denied/,
    )
    await assert.rejects(
      db.query(
        'insert into public.private_drafts (owner_id,id,name,card) values ($1,$2,$3,$4)',
        [owner, 'bad', 'No', '{}'],
      ),
      /private_drafts_card_shape/,
    )
    await assert.rejects(
      db.query(
        'insert into public.private_drafts (owner_id,id,name,card) values ($1,$2,$3,$4)',
        [
          owner,
          'large',
          'No',
          JSON.stringify({
            schemaVersion: 10,
            pages: [],
            photos: [],
            message: 'x'.repeat(2097152),
          }),
        ],
      ),
      /private_drafts_card_bytes/,
    )
    await as('authenticated', other)
    assert.deepEqual(
      (await db.query('select * from public.private_drafts')).rows,
      [],
    )
    assert.equal(
      (
        await db.query(
          'update public.private_drafts set name=$1 where id=$2 returning id',
          ['Hacked', 'card-1'],
        )
      ).rows.length,
      0,
    )
    // Same local identity is independent for a different owner.
    await db.query(
      'insert into public.private_drafts (owner_id,id,name,card) values ($1,$2,$3,$4)',
      [other, 'card-1', 'Other owner', card],
    )
    assert.equal(
      (await db.query('select name from public.private_drafts')).rows[0].name,
      'Other owner',
    )
    await as('anon')
    await assert.rejects(
      db.query('select * from public.private_drafts'),
      /permission denied/,
    )
    await assert.rejects(
      db.query(
        'insert into public.private_drafts (owner_id,id,name,card) values ($1,$2,$3,$4)',
        [owner, 'anon', 'No', card],
      ),
      /permission denied/,
    )
    await as('authenticated', owner)
    assert.equal(
      (await db.query('select name from public.private_drafts')).rows[0].name,
      'Updated',
    )
  } finally {
    await db.close()
  }
})
