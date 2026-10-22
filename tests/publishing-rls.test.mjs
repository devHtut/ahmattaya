import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('publication snapshots are atomic, owner controlled and non-enumerable; revocation cancels pending builds', async () => {
  const db = new PGlite()
  try {
    const owner = '11111111-1111-4111-8111-111111111111',
      other = '22222222-2222-4222-8222-222222222222'
    await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create schema storage;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(bucket_id text,name text,metadata jsonb,primary key(bucket_id,name));
 create function storage.allow_only_operation(op text) returns boolean language sql stable as $$select current_setting('storage.operation',true)='storage.'||op$$;
 alter table storage.objects enable row level security;
 grant usage on schema auth,storage,public to authenticated,anon;
 grant all on storage.objects to authenticated,anon;
 create policy broad on storage.objects for all to public using(true) with check(true);
 insert into auth.users values('${owner}'),('${other}');`)
    for (const f of [
      '202610220001_private_drafts.sql',
      '202610220002_private_draft_media.sql',
      '202610220003_receiver_publishing.sql',
      '202610220004_receiver_download_context.sql',
      '202610220005_receiver_exact_download.sql',
      '202610220006_receiver_uncached_download.sql',
    ])
      await db.exec(
        await readFile(
          new URL('../supabase/migrations/' + f, import.meta.url),
          'utf8',
        ),
      )
    async function as(role, id = '', op = 'storage.object.get_authenticated') {
      await db.exec('reset role')
      await db.query(
        "select set_config('request.jwt.claim.sub',$1,false),set_config('storage.operation',$2,false)",
        [id, op],
      )
      await db.exec('set role ' + role)
    }
    async function rpc(name, args = [], params = '') {
      return (
        await db.query(
          `select public.${name}(${params || args.map((_, i) => '$' + (i + 1)).join(',')}) as result`,
          args,
        )
      ).rows[0].result
    }
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
    await as('authenticated', owner)
    await db.query(
      'insert into public.private_drafts(owner_id,id,name,card,media) values($1,$2,$3,$4,$5)',
      [owner, 'card', 'Test', JSON.stringify(card), JSON.stringify(media)],
    )
    await assert.rejects(
      rpc('begin_card_publication', ['card', 99]),
      /revision conflict/,
    )
    const b = await rpc('begin_card_publication', ['card', 1]),
      path = b.id + '/image/' + media[0].id
    assert.equal(await rpc('get_published_card', [b.id]), null)
    await assert.rejects(
      rpc('finish_card_publication', [b.build_id]),
      /file missing/,
    )
    await assert.rejects(
      db.query('select * from public.published_cards'),
      /permission denied/,
    )
    await as('authenticated', other)
    await assert.rejects(
      rpc('finish_card_publication', [b.build_id]),
      /conflict/,
    )
    await assert.rejects(rpc('unpublish_card', [b.id]), /unavailable/)
    await assert.rejects(
      db.query("insert into storage.objects values('published-media',$1,$2)", [
        path,
        { size: 20, mimetype: 'image/png' },
      ]),
      /row-level security/,
    )
    await as('authenticated', owner)
    await db.query(
      "insert into storage.objects values('published-media',$1,$2)",
      [path, { size: 20, mimetype: 'image/png' }],
    )
    await rpc('finish_card_publication', [b.build_id])
    await as('anon')
    await db.query(
      "select set_config('request.method','GET',false),set_config('request.path',$1,false)",
      ['/different-prefix/published-media/' + path],
    )
    const snapshot = await rpc('get_published_card', [b.id])
    assert.deepEqual(
      Object.keys(snapshot).sort(),
      ['id', 'revision', 'published_at', 'card', 'media'].sort(),
    )
    assert.equal(
      (await db.query('select * from storage.objects')).rows.length,
      1,
    )
    for (const op of [
      'storage.object.list',
      'storage.object.list_v2',
      'storage.object.sign',
      'storage.s3.get_object',
      '',
    ]) {
      await as('anon', '', op)
      await db.query(
        "select set_config('request.method','POST',false),set_config('request.path','/object/list/published-media',false)",
      )
      assert.equal(
        (await db.query('select * from storage.objects')).rows.length,
        0,
      )
    }
    await as('anon', '', '')
    await db.query(
      "select set_config('request.method','GET',false),set_config('request.path',$1,false)",
      ['/object/published-media/' + path],
    )
    assert.equal(
      (await db.query('select * from storage.objects')).rows.length,
      1,
    )
    await db.query("select set_config('request.path',$1,false)", [
      '/object/published-media/' + path + '?cacheNonce=unique',
    ])
    assert.equal(
      (await db.query('select * from storage.objects')).rows.length,
      1,
    )
    for (const badPath of [
      '/object/list/published-media',
      '/object/published-media',
      '/rest/v1/objects',
    ]) {
      await db.query("select set_config('request.path',$1,false)", [badPath])
      assert.equal(
        (await db.query('select * from storage.objects')).rows.length,
        0,
      )
    }
    await db.query("select set_config('request.path',$1,false)", [
      '/object/published-media/' + path,
    ])
    await db.query("select set_config('request.method','POST',false)")
    assert.equal(
      (await db.query('select * from storage.objects')).rows.length,
      0,
    )
    await db.query("select set_config('request.path','',false)")
    await as('authenticated', owner)
    await db.query(
      "update public.private_drafts set name='Changed' where id='card'",
    )
    const next = await rpc('begin_card_publication', ['card', 2])
    assert.equal(next.id, b.id)
    assert.equal((await rpc('get_published_card', [b.id])).revision, 1)
    await rpc('unpublish_card', [b.id])
    await assert.rejects(
      rpc('finish_card_publication', [next.build_id]),
      /conflict/,
    )
    await as('anon')
    assert.equal(await rpc('get_published_card', [b.id]), null)
    assert.equal(
      (await db.query('select * from storage.objects')).rows.length,
      0,
    )
    await assert.rejects(
      rpc('begin_card_publication', ['card', 2]),
      /permission denied/,
    )
    await as('authenticated', owner)
    const again = await rpc('begin_card_publication', ['card', 2])
    await rpc('finish_card_publication', [again.build_id])
    assert.equal((await rpc('get_published_card', [b.id])).revision, 3)
    assert.equal(
      (
        await db.query(
          "delete from storage.objects where bucket_id='published-media' returning *",
        )
      ).rows.length,
      0,
    )
  } finally {
    await db.close()
  }
})
