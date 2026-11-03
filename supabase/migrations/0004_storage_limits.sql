-- 0004: storage enforces the media allow-list itself (#13 security review, RC-06, RC-09).
-- STORAGE POLICY CHANGE: needs owner approval before it is applied to a hosted project.
--
-- Before: the buckets accepted any type and size, and media_public_avatars allowed every operation
-- (including listing) on any file name under avatars/<uid>/. Browser uploads (signed URL, TUS, avatar)
-- were limited only by client-side checks and the server's reservation step.
-- After: both buckets accept only the allow-listed types (lib/types.ts MEDIA_LIMITS) up to 100 MB
-- (the video limit; images stay limited to 10 MB by the app), and authors may only insert, update
-- or delete image files in their own avatars/<uid>/ folder. Everything else is unchanged.

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'],
    file_size_limit = 104857600 -- 100 MB, matches MEDIA_LIMITS.video.maxBytes
where id in ('media-private', 'media-public');

drop policy if exists media_public_avatars on storage.objects;

-- profile photos: path = avatars/{user_id}/{file}.{jpg|jpeg|png|webp}. No SELECT: the bucket is public,
-- so photos are served by public URL, and authors never need to list or read through the API.
create policy media_public_avatars_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media-public' and (storage.foldername(name))[1] = 'avatars'
              and (storage.foldername(name))[2] = auth.uid()::text
              and array_length(storage.foldername(name), 1) = 2
              and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp'));

create policy media_public_avatars_update on storage.objects
  for update to authenticated
  using (bucket_id = 'media-public' and (storage.foldername(name))[1] = 'avatars'
         and (storage.foldername(name))[2] = auth.uid()::text
         and array_length(storage.foldername(name), 1) = 2
         and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp'))
  with check (bucket_id = 'media-public' and (storage.foldername(name))[1] = 'avatars'
              and (storage.foldername(name))[2] = auth.uid()::text
              and array_length(storage.foldername(name), 1) = 2
              and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp'));

create policy media_public_avatars_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'media-public' and (storage.foldername(name))[1] = 'avatars'
         and (storage.foldername(name))[2] = auth.uid()::text
         and array_length(storage.foldername(name), 1) = 2
         and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp'));
