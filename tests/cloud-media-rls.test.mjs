import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('private media migration preserves bucket isolation and forbids overwrites, deletion and broken manifests', async () => {
  const db = new PGlite()
  try {
    const owner = '11111111-1111-4111-8111-111111111111',
      other = '22222222-2222-4222-8222-222222222222'
    await db.exec(`create role anon; create role authenticated; create schema auth;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create schema storage;
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   create table storage.objects(bucket_id text,name text,primary key(bucket_id,name));
   alter table storage.objects enable row level security;
   grant usage on schema auth,storage,public to authenticated,anon;
   grant all on storage.objects to authenticated,anon;
   grant execute on function auth.uid() to authenticated,anon;
   insert into auth.users values ('${owner}'),('${other}');
   -- Even an unrelated pre-existing broad policy cannot expose this bucket.
   create policy existing_broad_policy on storage.objects for all to public using(true) with check(true);
  `)
    for (const file of [
      '202610220001_private_drafts.sql',
      '202610220002_private_draft_media.sql',
    ])
      await db.exec(
        await readFile(
          new URL(`../supabase/migrations/${file}`, import.meta.url),
          'utf8',
        ),
      )
    assert.equal(
      (
        await db.query(
          "select public from storage.buckets where id='draft-media'",
        )
      ).rows[0].public,
      false,
    )
    async function as(role, id = '') {
      await db.exec('reset role')
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id,
      ])
      await db.exec(`set role ${role}`)
    }
    const path = `${owner}/image/${'a'.repeat(64)}`
    await as('authenticated', owner)
    await db.query('insert into storage.objects values($1,$2)', [
      'draft-media',
      path,
    ])
    assert.equal(
      (await db.query('select * from storage.objects')).rows.length,
      1,
    )
    assert.equal(
      (
        await db.query(
          "update storage.objects set name='overwritten' returning *",
        )
      ).rows.length,
      0,
    )
    assert.equal(
      (await db.query('delete from storage.objects returning *')).rows.length,
      0,
    )
    for (const bad of [
      `${other}/image/${'a'.repeat(64)}`,
      `${owner}/image/../../bad`,
      `${owner}/video/${'a'.repeat(64)}`,
    ])
      await assert.rejects(
        db.query('insert into storage.objects values($1,$2)', [
          'draft-media',
          bad,
        ]),
        /row-level security/,
      )
    const card = {
      schemaVersion: 10,
      pages: [],
      photos: [],
      background: { assetId: 'a'.repeat(64) },
      music: { custom: null },
    }
    const media = [
      { kind: 'image', id: 'a'.repeat(64), bytes: 20, mime: 'image/png' },
    ]
    await db.query(
      'insert into public.private_drafts(owner_id,id,name,card,media) values($1,$2,$3,$4,$5)',
      [
        owner,
        'media-card',
        'Test',
        JSON.stringify(card),
        JSON.stringify(media),
      ],
    )
    for (const bad of [
      [],
      [...media, ...media],
      [{ ...media[0], id: 'b'.repeat(64) }],
      [{ ...media[0], bytes: 204801 }],
      [{ ...media[0], mime: 'image/svg+xml' }],
    ])
      await assert.rejects(
        db.query('update public.private_drafts set media=$1 where id=$2', [
          JSON.stringify(bad),
          'media-card',
        ]),
        /private_drafts_media_valid/,
      )
    await as('authenticated', other)
    assert.equal(
      (
        await db.query(
          "select * from storage.objects where bucket_id='draft-media'",
        )
      ).rows.length,
      0,
    )
    await assert.rejects(
      db.query('insert into storage.objects values($1,$2)', [
        'draft-media',
        path,
      ]),
      /row-level security/,
    )
    await as('anon')
    assert.equal(
      (
        await db.query(
          "select * from storage.objects where bucket_id='draft-media'",
        )
      ).rows.length,
      0,
    )
    await assert.rejects(
      db.query('insert into storage.objects values($1,$2)', [
        'draft-media',
        path,
      ]),
      /row-level security/,
    )
    // Unrelated existing buckets retain their policies.
    await db.query('insert into storage.objects values($1,$2)', [
      'other-bucket',
      'public.png',
    ])
    assert.equal(
      (
        await db.query(
          "select * from storage.objects where bucket_id='other-bucket'",
        )
      ).rows.length,
      1,
    )
  } finally {
    await db.close()
  }
})
