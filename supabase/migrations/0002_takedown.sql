-- #27 Operator takedown. SCHEMA CHANGE: needs owner approval before applying to a hosted project.
-- Adds two columns recording an operator takedown, and guards them so only the service role writes them.

alter table public.testimonies
  add column takedown_reason text,
  add column takedown_at timestamptz;

-- The owner policy testimonies_owner stays as is (authors read and edit their own row, so they can read
-- the takedown fields). This trigger stops authors and anonymous callers from changing the takedown
-- fields or from re-publishing a taken-down page through the API directly. The service role
-- (operator script, server routes) and migrations/SQL editor sessions are not affected.
create or replace function public.guard_takedown() returns trigger
language plpgsql set search_path = public as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    if new.takedown_at is distinct from old.takedown_at
       or new.takedown_reason is distinct from old.takedown_reason then
      raise exception 'takedown_fields_are_operator_only';
    end if;
    if old.takedown_at is not null and new.status = 'published' then
      raise exception 'page_taken_down';
    end if;
  end if;
  return new;
end $$;

create trigger testimonies_guard_takedown before update on public.testimonies
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
