-- Part 2 of 2: tables, columns, and constraints for the 4-workflow redesign.
-- Safe to reference enum values added in 20260423000000_four_workflows_enums.sql.

-- ═══════════════════════════════════════════════════════════════
-- 1. product_models — Commercial ad fixed identity models (Concept 1)
--    3 Seedance 2.0 Identity Lock personas: yuna, jihoon, haewon.
--    Reference images (front/45/side) stored in the 'templates' public bucket
--    under templates/product-models/<slug>/{front,three_quarter,side}.jpg.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.product_models (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  age_label text not null,                    -- e.g. '20대 후반'
  persona text not null,                      -- e.g. '친근/자연스러움'
  physical_description text,                  -- detailed look (for prompts)
  brand_tone text,                            -- copy/voice direction
  best_for text[] not null default array[]::text[],
  reference_front_path text,                  -- 'product-models/yuna/front.jpg'
  reference_three_quarter_path text,
  reference_side_path text,
  seedance_identity_lock_id text,             -- filled after Seedance registration
  midjourney_cref_url text,                   -- fallback: Midjourney --cref URL
  elevenlabs_voice_id text,                   -- voice for this persona
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger product_models_touch_updated_at
  before update on public.product_models
  for each row execute function public.touch_updated_at();

create index if not exists product_models_active_idx
  on public.product_models (is_active, display_order);

alter table public.product_models enable row level security;

create policy "product_models: public read"
  on public.product_models for select
  using (is_active = true);

-- Mutations reserved for service_role / admin API.

-- ═══════════════════════════════════════════════════════════════
-- 2. prompt_templates — Structured prompt library for all 4 concepts.
--    Seeded from content-marketing/concept-[1-4]/prompts.json.
--    `stages` jsonb mirrors the pipeline steps (image/video/voice/edit).
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.prompt_templates (
  id uuid primary key default gen_random_uuid(),
  concept_id integer not null check (concept_id between 1 and 4),
  concept_name text not null,                 -- 'ai-model-product', 'webtoon-acting', 'trend-replication', 'ai-news'
  category text,                              -- 'cosmetic', 'health-supplement', 'transformation', ...
  subcategory text not null,                  -- 'morning-routine', 'before-after', ...
  display_name text not null,                 -- "화장품 모닝 루틴"
  description text,
  duration_sec integer not null default 25 check (duration_sec > 0),
  platform_target text[] not null default array['tiktok','shorts','reels']::text[],
  recommended_model_slugs text[] not null default array[]::text[],  -- → product_models.slug
  stages jsonb not null default '[]'::jsonb,  -- [{stage,tool,prompt,params,...}, ...]
  variables jsonb not null default '{}'::jsonb,  -- {PRODUCT_NAME,MODEL_SLUG,...}
  caption_template text,
  hashtags_pool text,                         -- ref path to hashtag-library
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (concept_id, subcategory, category)
);

create trigger prompt_templates_touch_updated_at
  before update on public.prompt_templates
  for each row execute function public.touch_updated_at();

create index if not exists prompt_templates_concept_idx
  on public.prompt_templates (concept_id, display_order);
create index if not exists prompt_templates_active_idx
  on public.prompt_templates (is_active, concept_id);

alter table public.prompt_templates enable row level security;

create policy "prompt_templates: public read"
  on public.prompt_templates for select
  using (is_active = true);

-- ═══════════════════════════════════════════════════════════════
-- 3. video_jobs — columns for the 4 new workflows.
-- ═══════════════════════════════════════════════════════════════

alter table public.video_jobs
  add column if not exists concept_id integer
    check (concept_id is null or concept_id between 1 and 4),
  add column if not exists product_model_id uuid
    references public.product_models(id) on delete set null,
  add column if not exists prompt_template_id uuid
    references public.prompt_templates(id) on delete set null,
  add column if not exists trend_reference_url text,              -- Concept 3: user-provided URL
  add column if not exists trend_reference_path text,             -- Concept 3: uploaded file path
  add column if not exists storyboard jsonb,                      -- Concept 1: 4-shot Hook→Problem→Use→CTA
  add column if not exists delivery_type text
    check (delivery_type is null or delivery_type in ('self_post', 'b2b_delivery'))
    default 'self_post',
  add column if not exists brief jsonb;                           -- Concept 1: {product_name,usp,target,tone,duration}

create index if not exists video_jobs_concept_idx
  on public.video_jobs (concept_id, created_at desc)
  where concept_id is not null;

-- ═══════════════════════════════════════════════════════════════
-- 4. Relax source_image_urls constraint for trend_clone / ai_news.
--    trend_clone accepts URL (no image) or file; ai_news often has no image.
-- ═══════════════════════════════════════════════════════════════

alter table public.video_jobs drop constraint if exists video_jobs_sources_present;
alter table public.video_jobs add constraint video_jobs_sources_present
  check (
    type in ('text2video', 'ai_news')
    or (type = 'trend_clone' and (trend_reference_url is not null or trend_reference_path is not null or array_length(source_image_urls, 1) >= 1))
    or array_length(source_image_urls, 1) >= 1
  );

-- ═══════════════════════════════════════════════════════════════
-- 5. Admin role read policies (for /admin pages).
-- ═══════════════════════════════════════════════════════════════

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "product_models: admin read all" on public.product_models;
create policy "product_models: admin read all"
  on public.product_models for select
  using (public.is_admin());

drop policy if exists "prompt_templates: admin read all" on public.prompt_templates;
create policy "prompt_templates: admin read all"
  on public.prompt_templates for select
  using (public.is_admin());

comment on column public.video_jobs.storyboard is
  'Concept 1 (commercial_ad) 4-shot storyboard: [{shot:"hook",duration_sec:2,prompt:"...",...}, ...]';
comment on column public.video_jobs.brief is
  'Concept 1 brief intake: {product_name, usp, target, tone, category, benefit, duration_sec}.';
comment on column public.video_jobs.trend_reference_url is
  'Concept 3 trend source URL (TikTok/Reels/Shorts link).';
comment on column public.video_jobs.trend_reference_path is
  'Concept 3 trend source file in the sources bucket.';
