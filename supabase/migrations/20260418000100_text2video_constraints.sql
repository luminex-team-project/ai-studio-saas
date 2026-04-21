-- Part 2 of 2: columns + constraint using the 'text2video' enum value from
-- the previous migration. This runs in its own transaction so Postgres
-- lets us reference the new enum value.

alter table public.video_jobs
  add column if not exists provider_kind public.video_provider,
  add column if not exists provider_model text,        -- e.g. 'kling-v2-5-pro', 'gen4_turbo', 'ray-2'
  add column if not exists phase text                  -- 'preview_5s' | 'final_15s'
    check (phase is null or phase in ('preview_5s', 'final_15s')),
  add column if not exists parent_job_id uuid
    references public.video_jobs(id) on delete set null,
  add column if not exists prompt text;

create index if not exists video_jobs_parent_idx
  on public.video_jobs (parent_job_id);

-- selfie/product rows must carry ≥1 source image; text2video may have none.
alter table public.video_jobs drop constraint if exists video_jobs_sources_present;
alter table public.video_jobs add constraint video_jobs_sources_present
  check (
    type = 'text2video'
    or array_length(source_image_urls, 1) >= 1
  );

comment on column public.video_jobs.credits_cost is
  'Credits deducted from the user. Preview(5s)≈3, Final(15s)≈10–25.';
