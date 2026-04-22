-- Template asset bucket + template-prompt scaffolding.
--
-- New UX: the /templates gallery shows preview videos. Clicking a card opens
-- /create/selfie?template=<slug> where the user drops photos and edits a
-- pre-filled example prompt describing how the template should be re-shot
-- with their likeness. The bucket here hosts the public preview mp4 +
-- thumbnail for each template.

-- ═══════════════════════════════════════════════════════════════
-- 1. Public 'templates' storage bucket
-- ═══════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'templates',
  'templates',
  true,
  52428800, -- 50MB per file (preview mp4s stay small)
  array['video/mp4', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read (bucket is public, but be explicit for storage.objects policy).
drop policy if exists "templates: public read" on storage.objects;
create policy "templates: public read"
  on storage.objects for select
  using (bucket_id = 'templates');

-- Writes only via service_role. Authenticated users must not mutate templates.
-- (service_role bypasses RLS, so we simply don't define an insert/update/delete
-- policy for 'templates' bucket.)

-- ═══════════════════════════════════════════════════════════════
-- 2. templates table: example prompt + replace-target hint
-- ═══════════════════════════════════════════════════════════════

alter table public.templates
  add column if not exists example_prompt text,
  add column if not exists replace_target_hint text;
