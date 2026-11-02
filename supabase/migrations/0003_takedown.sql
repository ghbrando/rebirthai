-- #27 Operator takedown. SCHEMA CHANGE: needs owner approval before applying to a hosted project.
-- (0002 belongs to PR #40, retired_handles.)

alter table public.testimonies
  add column takedown_reason text,
  add column takedown_at timestamptz;

-- Reports keep the handle and survive deletion of the page or account (anonymized, ~90 day retention, POLICY 9).
alter table public.reports add column handle text;
alter table public.reports alter column testimony_id drop not null;
alter table public.reports drop constraint reports_testimony_id_fkey;
alter table public.reports
  add constraint reports_testimony_id_fkey foreign key (testimony_id)
  references public.testimonies(id) on delete set null;
update public.reports r set handle = p.handle
  from public.testimonies t join public.profiles p on p.id = t.profile_id
  where r.testimony_id = t.id and r.handle is null;

-- Operator-only record of takedowns and restores, keyed by handle so it outlives the page.
create table public.moderation_log (
  id uuid primary key default gen_random_uuid(),
  handle text not null,
  action text not null check (action in ('takedown','restore')),
  reason text,
  created_at timestamptz not null default now()
);
alter table public.moderation_log enable row level security; -- no policies: service role only
revoke all on public.moderation_log from anon, authenticated;

-- Guard: only the service role (or a privileged SQL session) may touch takedown state.
-- Fails closed: anything that is not clearly privileged is treated as an ordinary caller.
create or replace function public.guard_takedown() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare
  claims text := nullif(current_setting('request.jwt.claims', true), '');
  privileged boolean;
begin
  if claims is not null then
    privileged := (claims::jsonb ->> 'role') = 'service_role';
  else
    -- supabase_auth_admin runs account deletion (cascade); users can always take their story back.
    privileged := current_user in ('postgres', 'supabase_admin', 'supabase_auth_admin');
  end if;
  if privileged then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.takedown_at is not null then raise exception 'page_taken_down'; end if;
    return old;
  end if;
  if tg_op = 'INSERT' then
    if new.takedown_at is not null or new.takedown_reason is not null or new.status <> 'draft' then
      raise exception 'takedown_fields_are_operator_only';
    end if;
    return new;
  end if;
  -- UPDATE
  if new.takedown_at is distinct from old.takedown_at
     or new.takedown_reason is distinct from old.takedown_reason then
    raise exception 'takedown_fields_are_operator_only';
  end if;
  if old.takedown_at is not null and new.status = 'published' then
    raise exception 'page_taken_down';
  end if;
  return new;
end $$;
revoke execute on function public.guard_takedown() from public;

create trigger testimonies_guard_takedown before insert or update or delete on public.testimonies
for each row execute function public.guard_takedown();

-- Defense in depth: a taken-down page never appears in the public views, whatever its status.
create or replace view public.public_profiles as
  select p.id, p.handle, p.display_name, p.bio, p.photo_path, p.church,
         p.share_contact,
         case when p.share_contact then p.contact_phone end as contact_phone,
         case when p.share_contact then p.contact_email end as contact_email
  from public.profiles p
  where exists (select 1 from public.testimonies t
                where t.profile_id = p.id and t.status = 'published' and t.takedown_at is null);

create or replace view public.public_testimonies as
  select t.id, t.profile_id, p.handle, t.published_title as title,
         t.published_content as content, t.visibility, t.published_at
  from public.testimonies t join public.profiles p on p.id = t.profile_id
  where t.status = 'published' and t.takedown_at is null;
