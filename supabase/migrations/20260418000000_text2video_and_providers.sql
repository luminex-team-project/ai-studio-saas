-- Part 1 of 2: enum additions only.
-- PostgreSQL forbids using a newly added enum value in the same transaction
-- that created it, so the constraint that references 'text2video' lives in
-- a sibling migration (20260418000100_text2video_constraints.sql).

alter type public.video_job_type add value if not exists 'text2video';

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'video_provider'
  ) then
    create type public.video_provider as enum ('runway', 'kling', 'luma', 'mock');
  end if;
end $$;
