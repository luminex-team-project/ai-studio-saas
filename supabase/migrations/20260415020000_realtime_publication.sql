-- Enable Realtime on video_jobs so clients on /generating can subscribe to
-- status + progress updates driven by the worker.

alter publication supabase_realtime add table public.video_jobs;
