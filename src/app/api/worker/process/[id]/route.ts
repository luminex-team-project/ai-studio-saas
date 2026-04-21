import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enqueueVideoJob } from '@/lib/queue/video-queue'
import { runVideoJob } from '@/lib/video-providers/runner'

// Enqueue a pending video_job for the BullMQ worker to pick up. Falls back to
// inline execution when REDIS_URL is absent — useful for dev without Redis.

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const { data: job, error: jobErr } = await supabase
    .from('video_jobs')
    .select('id, user_id, status, progress')
    .eq('id', id)
    .maybeSingle()

  if (jobErr || !job) {
    return NextResponse.json({ ok: false, error: 'job_not_found' }, { status: 404 })
  }
  if (job.user_id !== user.id) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }
  if (job.status !== 'pending') {
    return NextResponse.json({ ok: true, status: job.status, progress: job.progress })
  }

  // Prefer BullMQ. Fall back to inline when Redis is not configured so local
  // dev without Upstash keys still works.
  if (process.env.REDIS_URL) {
    try {
      await enqueueVideoJob(job.id)
      return NextResponse.json({ ok: true, status: 'queued' })
    } catch (e) {
      // Log and fall through to inline execution as a safety net.
      console.error('enqueue_failed, running inline:', e)
    }
  }

  const result = await runVideoJob(job.id)
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }
  return NextResponse.json({ ok: true, status: result.status })
}
