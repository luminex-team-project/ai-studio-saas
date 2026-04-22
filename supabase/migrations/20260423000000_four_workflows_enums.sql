-- Part 1 of 2: enum additions for 4-workflow redesign.
-- PostgreSQL forbids using a newly added enum value in the same transaction
-- that created it — constraint usage lives in the sibling migration
-- 20260423000100_four_workflows_tables.sql.
--
-- Four new job types replace the legacy selfie/product/text2video split:
--   commercial_ad  — 상업용 광고 (제품 광고, Concept 1)
--   scene_reenact  — 명장면 재연 (웹툰/애니, Concept 2)
--   trend_clone    — 트렌드 복제 (영상/URL 업로드, Concept 3)
--   ai_news        — AI 뉴스/정보 (아바타 + B-roll, Concept 4)
--
-- Legacy 'selfie' / 'product' / 'text2video' values stay in the enum for
-- backwards compatibility with existing job rows.

alter type public.video_job_type add value if not exists 'commercial_ad';
alter type public.video_job_type add value if not exists 'scene_reenact';
alter type public.video_job_type add value if not exists 'trend_clone';
alter type public.video_job_type add value if not exists 'ai_news';

-- New providers added to the video_provider enum.
-- Identity Lock, avatar, audio-native video, lipsync providers for the
-- four-workflow pipeline. Stub implementations land in src/lib/video-providers/
-- and route to Kling as fallback until real API keys are provisioned.

alter type public.video_provider add value if not exists 'seedance';
alter type public.video_provider add value if not exists 'heygen';
alter type public.video_provider add value if not exists 'veo';
alter type public.video_provider add value if not exists 'hedra';
