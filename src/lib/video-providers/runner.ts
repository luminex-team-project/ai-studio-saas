import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { resolveProvider } from '@/lib/video-providers'

// Pure runner used by both the legacy inline /api route (dev convenience) and
// the BullMQ worker process. Takes a job id, drives the provider state
// machine, persists progress / final state, and refunds credits on failure.

export async function runVideoJob(jobId: string): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  const admin = createAdminClient()

  const { data: job, error: jobErr } = await admin
    .from('video_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle()

  if (jobErr || !job) return { ok: false, error: jobErr?.message ?? 'job_not_found' }
  if (job.status !== 'pending') {
    return { ok: true, status: job.status }
  }

  const provider = resolveProvider(job)

  await admin
    .from('video_jobs')
    .update({
      status: 'processing',
      progress: 5,
      started_at: new Date().toISOString(),
      provider: provider.name,
      provider_kind: provider.name,
    })
    .eq('id', job.id)

  try {
    const result = await provider.run({
      job,
      async onProgress(progress) {
        await admin.from('video_jobs').update({ progress }).eq('id', job.id)
      },
    })

    await admin
      .from('video_jobs')
      .update({
        status: 'completed',
        progress: 100,
        output_video_url: result.outputVideoUrl,
        output_thumbnail_url: result.outputThumbnailUrl,
        duration_seconds: result.durationSeconds,
        provider_job_id: result.providerJobId,
        provider_model: result.providerModel,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return { ok: true, status: 'completed' }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'provider_error'
    await admin
      .from('video_jobs')
      .update({
        status: 'failed',
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    await refundCredits(admin, job.user_id, job.credits_cost, job.id)
    return { ok: false, error: message }
  }
}

async function refundCredits(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  credits: number,
  jobId: string,
) {
  const { data: profile } = await admin
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .maybeSingle()
  if (!profile) return

  await admin
    .from('profiles')
    .update({ credits: profile.credits + credits })
    .eq('id', userId)

  await admin.from('transactions').insert({
    user_id: userId,
    kind: 'refund',
    status: 'succeeded',
    credits_delta: credits,
    video_job_id: jobId,
    note: '생성 실패로 인한 크레딧 환불',
  })
}
