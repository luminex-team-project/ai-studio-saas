-- Premium AI Studio — initial schema
-- profiles, templates, ai_models, video_jobs, transactions + RLS + triggers.

-- ═══════════════════════════════════════════════════════════════
-- Enums
-- ═══════════════════════════════════════════════════════════════

create type public.template_category as enum (
  '트렌드', '댄스', '패션', '제품', '일상', '챌린지', '스타일', '역동적'
);

create type public.video_job_type as enum ('selfie', 'product');

create type public.video_job_status as enum (
  'pending', 'processing', 'completed', 'failed', 'cancelled'
);

create type public.transaction_kind as enum (
  'purchase', 'consume', 'refund', 'grant'
);

create type public.transaction_status as enum (
  'pending', 'succeeded', 'failed', 'refunded'
);

-- ═══════════════════════════════════════════════════════════════
-- updated_at helper
-- ═══════════════════════════════════════════════════════════════

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 1. profiles — mirrors auth.users + app-specific fields
-- ═══════════════════════════════════════════════════════════════

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  credits integer not null default 100 check (credits >= 0),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile on signup and grant 100 free credits.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.transactions (user_id, kind, status, credits_delta, note)
  values (new.id, 'grant', 'succeeded', 100, '가입 보너스 크레딧');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- 2. templates — selfie video template catalog
-- ═══════════════════════════════════════════════════════════════

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category public.template_category not null,
  thumbnail_url text,
  preview_video_url text,
  popular boolean not null default false,
  trending boolean not null default false,
  is_premium boolean not null default false,
  likes_count integer not null default 0,
  uses_count integer not null default 0,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index templates_trending_idx
  on public.templates (trending, uses_count desc);
create index templates_category_idx on public.templates (category);

create trigger templates_touch_updated_at
  before update on public.templates
  for each row execute function public.touch_updated_at();

alter table public.templates enable row level security;

create policy "templates: public read"
  on public.templates for select
  using (true);

-- Mutations reserved for service_role (which bypasses RLS).

-- ═══════════════════════════════════════════════════════════════
-- 3. ai_models — product video AI model library
-- ═══════════════════════════════════════════════════════════════

create table public.ai_models (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  style text,
  age_range text,
  avatar_url text,
  preview_video_url text,
  popular boolean not null default false,
  is_premium boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index ai_models_popular_idx
  on public.ai_models (popular, display_order);

alter table public.ai_models enable row level security;

create policy "ai_models: public read"
  on public.ai_models for select
  using (true);

-- ═══════════════════════════════════════════════════════════════
-- 4. video_jobs — generation work items (async pipeline target)
-- ═══════════════════════════════════════════════════════════════

create table public.video_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.video_job_type not null,
  status public.video_job_status not null default 'pending',

  -- Input
  template_id uuid references public.templates(id) on delete set null,
  ai_model_id uuid references public.ai_models(id) on delete set null,
  scenario text,
  options jsonb not null default '{}'::jsonb, -- {duration, music, ...}
  source_image_urls text[] not null default '{}',

  -- Output
  output_video_url text,
  output_thumbnail_url text,
  duration_seconds integer,
  progress integer not null default 0 check (progress between 0 and 100),
  error_message text,

  -- Economics / provider reference
  credits_cost integer not null check (credits_cost > 0),
  provider text,           -- 'kling' | 'minimax'
  provider_job_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index video_jobs_user_id_idx
  on public.video_jobs (user_id, created_at desc);
create index video_jobs_active_status_idx
  on public.video_jobs (status)
  where status in ('pending', 'processing');

create trigger video_jobs_touch_updated_at
  before update on public.video_jobs
  for each row execute function public.touch_updated_at();

alter table public.video_jobs enable row level security;

create policy "video_jobs: read own"
  on public.video_jobs for select
  using (auth.uid() = user_id);

create policy "video_jobs: insert own"
  on public.video_jobs for insert
  with check (auth.uid() = user_id);

-- Updates + status transitions handled server-side with service_role.

-- ═══════════════════════════════════════════════════════════════
-- 5. transactions — credit ledger (purchase / consume / refund / grant)
-- ═══════════════════════════════════════════════════════════════

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind public.transaction_kind not null,
  status public.transaction_status not null default 'pending',
  credits_delta integer not null, -- + for purchase/grant/refund, − for consume
  amount_krw integer,             -- null for non-purchase kinds
  provider text,                  -- 'stripe' | 'toss'
  provider_reference text,        -- Stripe payment_intent id / Toss paymentKey
  plan text,                      -- 'starter' | 'pro' | 'business'
  video_job_id uuid references public.video_jobs(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index transactions_user_id_idx
  on public.transactions (user_id, created_at desc);

alter table public.transactions enable row level security;

create policy "transactions: read own"
  on public.transactions for select
  using (auth.uid() = user_id);

-- Inserts/updates reserved for service_role (webhooks + worker).

-- ═══════════════════════════════════════════════════════════════
-- Credit debit helper — atomic check + deduct + ledger write.
-- Called from server actions before enqueueing a job.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.consume_credits(
  p_user_id uuid,
  p_credits integer,
  p_video_job_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_credits integer;
begin
  select credits into current_credits
  from public.profiles
  where id = p_user_id
  for update;

  if current_credits is null then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  if current_credits < p_credits then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  update public.profiles
  set credits = credits - p_credits
  where id = p_user_id;

  insert into public.transactions
    (user_id, kind, status, credits_delta, video_job_id, note)
  values
    (p_user_id, 'consume', 'succeeded', -p_credits, p_video_job_id, '영상 생성 크레딧 차감');
end;
$$;

revoke all on function public.consume_credits(uuid, integer, uuid) from public;
grant execute on function public.consume_credits(uuid, integer, uuid) to service_role;
