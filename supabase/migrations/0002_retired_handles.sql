-- RebirthAI 0002: retire handles of deleted accounts (Issue #26, RC-03, POLICY §11).
--
-- A link saved in someone's contacts can never be updated, so a handle that ever pointed to a
-- testimony must never point to a stranger's story. Before this migration, deleting a profile
-- freed its handle (profiles.handle unique row gone) and its old handles (handle_redirects rows
-- cascade away). This keeps every such handle reserved forever.
--
-- Only the handle text and a timestamp are kept: no user id, no name, no link to the person.

create table public.retired_handles (
  handle text primary key,
  retired_at timestamptz not null default now()
);

-- RLS on, no policies: authors and visitors cannot read or write it directly (RC-02).
-- It is written by the trigger below and read through is_handle_retired().
alter table public.retired_handles enable row level security;

-- Runs for direct profile deletes and for the cascade from auth.users. BEFORE DELETE, so the
-- profile's handle_redirects rows still exist (the FK cascade removes them afterwards).
create or replace function public.retire_profile_handles() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.retired_handles (handle) values (old.handle)
  on conflict (handle) do nothing;
  insert into public.retired_handles (handle)
    select r.old_handle from public.handle_redirects r where r.profile_id = old.id
  on conflict (handle) do nothing;
  return old;
end $$;

create trigger profiles_retire_handles before delete on public.profiles
for each row execute function public.retire_profile_handles();

-- RC-03: same as 0001, plus retired handles can never be taken again.
create or replace function public.guard_handle() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.handle is distinct from old.handle then
    if exists (select 1 from public.retired_handles h where h.handle = new.handle) then
      raise exception 'handle_unavailable';
    end if;
    if exists (
      select 1 from public.handle_redirects r
      where r.old_handle = new.handle and r.profile_id <> new.id
    ) then
      raise exception 'handle_unavailable';
    end if;
    -- reclaiming one of your own old handles removes the redirect row
    delete from public.handle_redirects where old_handle = new.handle and profile_id = new.id;
  end if;
  if tg_op = 'UPDATE' and new.handle is distinct from old.handle then
    insert into public.handle_redirects (old_handle, profile_id) values (old.handle, new.id)
    on conflict (old_handle) do nothing;
  end if;
  return new;
end $$;

-- Yes/no lookup for the public page and contact card ("no longer available").
-- One handle at a time: the list of retired handles cannot be read or enumerated.
create or replace function public.is_handle_retired(h text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.retired_handles where handle = lower(h));
$$;

revoke all on function public.is_handle_retired(text) from public;
grant execute on function public.is_handle_retired(text) to anon, authenticated;
