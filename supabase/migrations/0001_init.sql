-- RebirthAI initial schema (SDD §5.3). Apply with `supabase db push` or paste into the SQL editor.

create extension if not exists pgcrypto;

-- ---------- tables ----------
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null,
  bio text,
  photo_path text,
  church text,
  contact_phone text,
  contact_email text,
  share_contact boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.testimonies (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade, -- DD-08
  title text not null default '',
  draft_content jsonb not null default '{"type":"doc","content":[]}',
  published_content jsonb,
  published_title text,
  status text not null default 'draft' check (status in ('draft','published','unpublished')),
  visibility text not null default 'public' check (visibility in ('public','unlisted')),
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  testimony_id uuid not null references public.testimonies(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  section text check (section in ('before','turning_point','after','other')),
  created_at timestamptz not null default now()
);
create index on public.coach_messages (testimony_id, created_at);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  testimony_id uuid not null references public.testimonies(id) on delete cascade,
  kind text not null check (kind in ('image','video')),
  storage_path text not null,
  public_path text,
  mime text not null,
  bytes bigint not null,
  alt_text text,
  caption text
);

create table public.handle_redirects (
  old_handle text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  testimony_id uuid not null references public.testimonies(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open','reviewed','dismissed'))
);

-- ---------- triggers ----------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger testimonies_touch before update on public.testimonies
for each row execute function public.touch_updated_at();

-- DD-08: one testimony row per profile, created automatically.
create or replace function public.create_testimony_for_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.testimonies (profile_id) values (new.id);
  return new;
end $$;

create trigger profiles_create_testimony after insert on public.profiles
for each row execute function public.create_testimony_for_profile();

-- RC-03: handle changes leave a permanent redirect; released handles are never reassigned.
create or replace function public.guard_handle() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.handle is distinct from old.handle then
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

create trigger profiles_guard_handle before insert or update of handle on public.profiles
for each row execute function public.guard_handle();

-- ---------- RLS (RC-02) ----------
alter table public.profiles enable row level security;
alter table public.testimonies enable row level security;
alter table public.coach_messages enable row level security;
alter table public.media enable row level security;
alter table public.handle_redirects enable row level security;
alter table public.reports enable row level security;

create policy profiles_owner on public.profiles
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy testimonies_owner on public.testimonies
  for all to authenticated
  using (profile_id in (select id from public.profiles where user_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where user_id = auth.uid()));

create policy coach_messages_owner on public.coach_messages
  for all to authenticated
  using (testimony_id in (
    select t.id from public.testimonies t join public.profiles p on p.id = t.profile_id
    where p.user_id = auth.uid()))
  with check (testimony_id in (
    select t.id from public.testimonies t join public.profiles p on p.id = t.profile_id
    where p.user_id = auth.uid()));

create policy media_owner on public.media
  for all to authenticated
  using (testimony_id in (
    select t.id from public.testimonies t join public.profiles p on p.id = t.profile_id
    where p.user_id = auth.uid()))
  with check (testimony_id in (
    select t.id from public.testimonies t join public.profiles p on p.id = t.profile_id
    where p.user_id = auth.uid()));

create policy handle_redirects_owner on public.handle_redirects
  for select to authenticated
  using (profile_id in (select id from public.profiles where user_id = auth.uid()));

-- anyone may file a report; nobody but the service role reads them
create policy reports_insert on public.reports
  for insert to anon, authenticated with check (true);

-- Anonymous access goes through views that expose only public fields.
-- (Views run with owner rights; the base tables stay closed to anon.)
create view public.public_profiles as
  select p.id, p.handle, p.display_name, p.bio, p.photo_path, p.church,
         p.share_contact,
         case when p.share_contact then p.contact_phone end as contact_phone,
         case when p.share_contact then p.contact_email end as contact_email
  from public.profiles p
  where exists (select 1 from public.testimonies t where t.profile_id = p.id and t.status = 'published');

create view public.public_testimonies as
  select t.id, t.profile_id, p.handle, t.published_title as title,
         t.published_content as content, t.visibility, t.published_at
  from public.testimonies t join public.profiles p on p.id = t.profile_id
  where t.status = 'published';

create view public.handle_lookup as
  select r.old_handle, p.handle as new_handle
  from public.handle_redirects r join public.profiles p on p.id = r.profile_id;

grant select on public.public_profiles, public.public_testimonies, public.handle_lookup to anon, authenticated;

-- ---------- storage ----------
insert into storage.buckets (id, name, public) values
  ('media-private', 'media-private', false),
  ('media-public', 'media-public', true)
on conflict (id) do nothing;

-- private draft media: path = {user_id}/{testimony_id}/{file}
create policy media_private_owner on storage.objects
  for all to authenticated
  using (bucket_id = 'media-private' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'media-private' and (storage.foldername(name))[1] = auth.uid()::text);

-- profile photos: path = avatars/{user_id}/{file}; testimony media is copied here by the server (service role)
create policy media_public_avatars on storage.objects
  for all to authenticated
  using (bucket_id = 'media-public' and (storage.foldername(name))[1] = 'avatars'
         and (storage.foldername(name))[2] = auth.uid()::text)
  with check (bucket_id = 'media-public' and (storage.foldername(name))[1] = 'avatars'
         and (storage.foldername(name))[2] = auth.uid()::text);
