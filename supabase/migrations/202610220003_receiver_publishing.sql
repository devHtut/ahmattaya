-- Run once after the private draft/media migrations. Published links are
-- read-only capabilities; private drafts and private media remain owner-only.
begin;

create table public.published_cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  active boolean not null default false,
  revision integer not null default 0,
  source_revision integer,
  published_at timestamptz,
  card jsonb,
  media jsonb not null default '[]'::jsonb,
  unique (owner_id, project_id),
  foreign key (owner_id, project_id) references public.private_drafts(owner_id, id) on delete cascade
);
create table public.publication_builds (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null unique references public.published_cards(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  base_revision integer not null,
  source_revision integer not null,
  card jsonb not null,
  media jsonb not null,
  created_at timestamptz not null default clock_timestamp()
);
alter table public.published_cards enable row level security;
alter table public.publication_builds enable row level security;
revoke all on public.published_cards, public.publication_builds from public, anon, authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('published-media','published-media',false,20971520,
  array['image/jpeg','image/png','image/webp','audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/webm']);

create function public.begin_card_publication(p_project_id text, p_revision integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid(); d public.private_drafts; p public.published_cards; b public.publication_builds;
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into d from public.private_drafts where owner_id=uid and id=p_project_id for share;
  if not found or d.revision <> p_revision then raise exception 'Draft revision conflict' using errcode='P0001'; end if;
  -- Server bounds plus exact media references; both sender and receiver also
  -- validate every card field with the application schema.
  if octet_length(d.card::text)>2097152 or jsonb_array_length(d.card->'pages')>8
    or jsonb_array_length(d.card->'photos')>5 or not public.valid_draft_media(d.card,d.media)
    then raise exception 'Invalid snapshot' using errcode='22023'; end if;
  insert into public.published_cards(owner_id,project_id) values(uid,p_project_id)
    on conflict(owner_id,project_id) do nothing;
  select * into p from public.published_cards where owner_id=uid and project_id=p_project_id for update;
  delete from public.publication_builds where publication_id=p.id;
  insert into public.publication_builds(publication_id,owner_id,base_revision,source_revision,card,media)
    values(p.id,uid,p.revision,d.revision,d.card,d.media) returning * into b;
  return jsonb_build_object('build_id',b.id,'id',p.id,'source_revision',b.source_revision,'card',b.card,'media',b.media);
end;
$$;

create function public.can_access_published_media(p_name text, p_write boolean default false)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare pid uuid; kind text; aid text; uid uuid := auth.uid();
begin
  if p_name !~ '^[a-f0-9-]{36}/(image|audio)/[a-f0-9]{64}$' then return false; end if;
  pid := split_part(p_name,'/',1)::uuid; kind := split_part(p_name,'/',2); aid := split_part(p_name,'/',3);
  if p_write then
    return uid is not null and exists(select 1 from public.publication_builds b,
      jsonb_array_elements(b.media) m where b.publication_id=pid and b.owner_id=uid
      and m->>'kind'=kind and m->>'id'=aid);
  end if;
  -- Owners may verify existing copies, including copies from unfinished builds.
  if uid is not null and exists(select 1 from public.published_cards p where p.id=pid and p.owner_id=uid) then return true; end if;
  -- No listing, signing, transforms, S3 or generic table reads for recipients.
  -- This prevents enumerating unknown receiver IDs through Storage list().
  return storage.allow_only_operation('object.get_authenticated') and exists(
    select 1 from public.published_cards p, jsonb_array_elements(p.media) m
    where p.id=pid and p.active and m->>'kind'=kind and m->>'id'=aid);
exception when invalid_text_representation then return false;
end;
$$;

create policy published_media_read on storage.objects for select to anon,authenticated
  using(bucket_id='published-media' and public.can_access_published_media(name,false));
create policy published_media_insert on storage.objects for insert to authenticated
  with check(bucket_id='published-media' and public.can_access_published_media(name,true));
create policy published_media_private_read on storage.objects as restrictive for select to public
  using(bucket_id<>'published-media' or public.can_access_published_media(name,false));
create policy published_media_private_insert on storage.objects as restrictive for insert to public
  with check(bucket_id<>'published-media' or public.can_access_published_media(name,true));
create policy published_media_no_update on storage.objects as restrictive for update to public
  using(bucket_id<>'published-media') with check(bucket_id<>'published-media');
create policy published_media_no_delete on storage.objects as restrictive for delete to public
  using(bucket_id<>'published-media');

create function public.finish_card_publication(p_build_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); b public.publication_builds; p public.published_cards; m jsonb; path text;
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into b from public.publication_builds where id=p_build_id and owner_id=uid;
  if not found then raise exception 'Publication conflict' using errcode='P0001'; end if;
  -- Lock publication first, matching begin/unpublish, then recheck staging.
  select * into p from public.published_cards where id=b.publication_id and owner_id=uid for update;
  select * into b from public.publication_builds where id=p_build_id and owner_id=uid for update;
  if not found or p.revision<>b.base_revision then raise exception 'Publication conflict' using errcode='P0001'; end if;
  for m in select jsonb_array_elements(b.media) loop
    path := p.id::text || '/' || (m->>'kind') || '/' || (m->>'id');
    if not exists(select 1 from storage.objects o where o.bucket_id='published-media' and o.name=path
      and (o.metadata->>'size')::bigint=(m->>'bytes')::bigint
      and o.metadata->>'mimetype'=m->>'mime') then
      raise exception 'Published file missing' using errcode='22023';
    end if;
  end loop;
  update public.published_cards set active=true, revision=revision+1, source_revision=b.source_revision,
    published_at=clock_timestamp(),card=b.card,media=b.media where id=p.id returning * into p;
  delete from public.publication_builds where id=b.id;
  return jsonb_build_object('id',p.id,'active',p.active,'revision',p.revision,'source_revision',p.source_revision,'published_at',p.published_at);
end;
$$;

create function public.get_my_card_publication(p_project_id text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id',id,'active',active,'revision',revision,'source_revision',source_revision,'published_at',published_at)
  from public.published_cards where owner_id=(select auth.uid()) and project_id=p_project_id;
$$;
create function public.unpublish_card(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.published_cards;
begin
  select * into p from public.published_cards where id=p_id and owner_id=(select auth.uid()) for update;
  if not found then raise exception 'Publication unavailable' using errcode='42501'; end if;
  delete from public.publication_builds where publication_id=p.id;
  update public.published_cards set active=false,revision=revision+1 where id=p.id returning * into p;
  return jsonb_build_object('id',p.id,'active',p.active,'revision',p.revision,'source_revision',p.source_revision,'published_at',p.published_at);
end;
$$;
create function public.get_published_card(p_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id',id,'revision',revision,'published_at',published_at,'card',card,'media',media)
  from public.published_cards where id=p_id and active;
$$;

revoke all on function public.begin_card_publication(text,integer),
  public.finish_card_publication(uuid),public.get_my_card_publication(text),public.unpublish_card(uuid),
  public.get_published_card(uuid),public.can_access_published_media(text,boolean) from public,anon,authenticated;
grant execute on function public.begin_card_publication(text,integer),public.finish_card_publication(uuid),
  public.get_my_card_publication(text),public.unpublish_card(uuid) to authenticated;
grant execute on function public.get_published_card(uuid),public.can_access_published_media(text,boolean) to anon,authenticated;
notify pgrst,'reload schema';
commit;
