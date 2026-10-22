-- Compatibility for Storage deployments without download operation context.
begin;
create or replace function public.can_access_published_media(p_name text, p_write boolean default false)
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
  -- Exact download paths support Storage versions that do not set the operation
  -- context. POST listings/signing and generic table reads remain denied.
  return (storage.allow_only_operation('object.get_authenticated') or (
    current_setting('request.method',true)='GET' and
    current_setting('request.path',true) in (
      '/object/published-media/' || p_name,
      '/object/authenticated/published-media/' || p_name,
      '/storage/v1/object/published-media/' || p_name,
      '/storage/v1/object/authenticated/published-media/' || p_name
    )
  )) and exists(
    select 1 from public.published_cards p, jsonb_array_elements(p.media) m
    where p.id=pid and p.active and m->>'kind'=kind and m->>'id'=aid);
exception when invalid_text_representation then return false;
end;
$$;

notify pgrst,'reload schema';
commit;
