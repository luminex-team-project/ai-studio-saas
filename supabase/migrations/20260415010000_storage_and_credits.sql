-- Storage buckets + RLS, and a safer consume_credits signature.

-- ═══════════════════════════════════════════════════════════════
-- Storage buckets
-- ═══════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('sources',    'sources',    false, 10485760,  array['image/jpeg', 'image/png']),
  ('videos',     'videos',     false, 104857600, array['video/mp4']),
  ('thumbnails', 'thumbnails', false, 5242880,   array['image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: `<user_id>/<sub-path>`. We match the first segment.

drop policy if exists "sources: owner select" on storage.objects;
drop policy if exists "sources: owner insert" on storage.objects;
drop policy if exists "sources: owner delete" on storage.objects;
drop policy if exists "videos: owner select"  on storage.objects;
drop policy if exists "thumbnails: owner select" on storage.objects;

create policy "sources: owner select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'sources'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "sources: owner insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'sources'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "sources: owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'sources'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- videos + thumbnails: read-own; writes happen via service_role (worker).
create policy "videos: owner select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "thumbnails: owner select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════════════════════════════
-- consume_credits — replace to scope deductions to auth.uid() so
-- authenticated users can invoke it without impersonating others.
-- ═══════════════════════════════════════════════════════════════

drop function if exists public.consume_credits(uuid, integer, uuid);

create function public.consume_credits(
  p_credits integer,
  p_video_job_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  current_credits integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select credits into current_credits
  from public.profiles
  where id = v_user_id
  for update;

  if current_credits is null then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  if current_credits < p_credits then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  update public.profiles
  set credits = credits - p_credits
  where id = v_user_id;

  insert into public.transactions
    (user_id, kind, status, credits_delta, video_job_id, note)
  values
    (v_user_id, 'consume', 'succeeded', -p_credits, p_video_job_id, '영상 생성 크레딧 차감');
end;
$$;

grant execute on function public.consume_credits(integer, uuid) to authenticated;
