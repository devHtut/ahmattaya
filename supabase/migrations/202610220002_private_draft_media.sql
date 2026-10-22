-- Run once after 202610220001_private_drafts.sql. No public media access.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('draft-media', 'draft-media', false, 20971520,
  array['image/jpeg','image/png','image/webp','audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/webm']);

-- Content-addressed files are immutable to clients, including their owner.
-- Restrictive policies keep this bucket private even if another bucket uses
-- a broader permissive policy. Existing buckets are left alone.
create policy draft_media_read on storage.objects for select to authenticated
  using (bucket_id = 'draft-media' and name ~ ('^' || (select auth.uid())::text || '/(image|audio)/[a-f0-9]{64}$'));
create policy draft_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'draft-media' and name ~ ('^' || (select auth.uid())::text || '/(image|audio)/[a-f0-9]{64}$'));
create policy draft_media_private_read on storage.objects as restrictive for select to public
  using (bucket_id <> 'draft-media' or name ~ ('^' || (select auth.uid())::text || '/(image|audio)/[a-f0-9]{64}$'));
create policy draft_media_private_insert on storage.objects as restrictive for insert to public
  with check (bucket_id <> 'draft-media' or name ~ ('^' || (select auth.uid())::text || '/(image|audio)/[a-f0-9]{64}$'));
create policy draft_media_no_update on storage.objects as restrictive for update to public
  using (bucket_id <> 'draft-media') with check (bucket_id <> 'draft-media');
create policy draft_media_no_delete on storage.objects as restrictive for delete to public
  using (bucket_id <> 'draft-media');

create function public.valid_draft_media(card jsonb, media jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  refs text[] := array[]::text[];
  seen text[] := array[]::text[];
  ref text;
  item jsonb;
  kind text;
  bytes bigint;
begin
  if jsonb_typeof(media) is distinct from 'array' or jsonb_array_length(media) > 10 then return false; end if;
  for ref in
    select 'image:' || (bg ->> 'assetId') from (
      select card -> 'background' as bg
      union all select page -> 'background' from jsonb_array_elements(card -> 'pages') as page
    ) as backgrounds where bg is not null and bg <> 'null'::jsonb
  loop
    if ref is null then return false; end if;
    if not (ref = any(refs)) then refs := array_append(refs, ref); end if;
  end loop;
  if card #> '{music,custom}' is not null and card #> '{music,custom}' <> 'null'::jsonb then
    ref := 'audio:' || (card #>> '{music,custom,assetId}');
    if ref is null then return false; end if;
    refs := array_append(refs, ref);
  end if;
  for item in select jsonb_array_elements(media) loop
    kind := item ->> 'kind';
    if kind is null or kind not in ('image','audio') or (item ->> 'id') is null
      or (item ->> 'id') !~ '^[a-f0-9]{64}$'
      or jsonb_typeof(item -> 'bytes') is distinct from 'number'
      or (item ->> 'bytes') !~ '^[0-9]+$' then return false; end if;
    bytes := (item ->> 'bytes')::bigint;
    if bytes <= 0 or bytes > (case when kind = 'image' then 204800 else 20971520 end) then return false; end if;
    if item ->> 'mime' is null then return false; end if;
    if kind = 'image' and item ->> 'mime' not in ('image/jpeg','image/png','image/webp') then return false; end if;
    if kind = 'audio' and (item ->> 'mime' not in ('audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/webm')
      or bytes is distinct from (card #>> '{music,custom,bytes}')::bigint) then return false; end if;
    ref := kind || ':' || (item ->> 'id');
    if not (ref = any(refs)) or ref = any(seen) then return false; end if;
    seen := array_append(seen, ref);
  end loop;
  return cardinality(seen) = cardinality(refs);
exception when others then return false;
end;
$$;
revoke all on function public.valid_draft_media(jsonb, jsonb) from public, anon;
grant execute on function public.valid_draft_media(jsonb, jsonb) to authenticated;

alter table public.private_drafts add column media jsonb not null default '[]'::jsonb;
alter table public.private_drafts add constraint private_drafts_media_valid
  check (octet_length(media::text) <= 8192 and public.valid_draft_media(card, media));
grant insert (media), update (media) on public.private_drafts to authenticated;
notify pgrst, 'reload schema';
commit;
