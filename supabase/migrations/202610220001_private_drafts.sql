-- Run once in the Supabase SQL Editor for the configured AhMatTaYa project.
-- Private draft storage only: no public cards, storage buckets or public links.
begin;

create table public.private_drafts (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (char_length(id) between 1 and 100),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  card jsonb not null,
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (owner_id, id),
  constraint private_drafts_card_shape check (
    (jsonb_typeof(card) = 'object'
      and card -> 'schemaVersion' = '10'::jsonb
      and jsonb_typeof(card -> 'pages') = 'array'
      and jsonb_typeof(card -> 'photos') = 'array') is true
  ),
  constraint private_drafts_card_bytes check (octet_length(card::text) <= 2097152)
);

create index private_drafts_owner_updated
  on public.private_drafts (owner_id, updated_at desc, id);

alter table public.private_drafts enable row level security;

create policy private_drafts_read_own on public.private_drafts
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy private_drafts_insert_own on public.private_drafts
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy private_drafts_update_own on public.private_drafts
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- Ownership, identity, revision and timestamps cannot be supplied by updates.
-- An anonymous Auth guest uses the authenticated role; an unauthenticated
-- request uses anon and has no access at all.
revoke all on public.private_drafts from public, anon, authenticated;
grant select on public.private_drafts to authenticated;
grant insert (owner_id, id, name, card) on public.private_drafts to authenticated;
grant update (name, card) on public.private_drafts to authenticated;

create function public.advance_private_draft_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function public.advance_private_draft_revision() from public, anon, authenticated;
create trigger private_drafts_revision
  before update on public.private_drafts for each row
  execute function public.advance_private_draft_revision();

notify pgrst, 'reload schema';
commit;
