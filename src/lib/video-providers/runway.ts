import 'server-only'

import RunwayML, { TaskFailedError } from '@runwayml/sdk'
import { requireRunwayEnv } from '@/lib/env'
import { stageSourceImagesToCloudinary, mirrorProviderOutputToSupabase } from '@/lib/media/storage-bridge'
import type { VideoProvider, DurationTarget } from './types'

// Runway Gen-4 family adapter.
//
// Model selection:
//   - image-to-video: `gen4_turbo` (5s/10s, supports vertical 720:1280)
//   - text-to-video:  `gen4.5` (2–10s, supports 1280:720 or 720:1280)
//
// Runway's SDK has no native "extend to 15s" path for gen4/gen4.5, so when
// target=15 we cap at the model's 10s maximum and note the limitation in the
// returned durationSeconds. The Kling/Luma adapters handle true 15s via
// provider-native extension.
//
// Pricing (as of 2026-04):
//   gen4_turbo: ~0.05 credits/sec → 5s=$0.25, 10s=$0.50
//   gen4.5:     ~0.10 credits/sec → 5s=$0.50, 10s=$1.00

function runwayClient() {
  const { apiKey } = requireRunwayEnv()
  return new RunwayML({ apiKey })
}

function aspectToRatio(aspect: '16:9' | '9:16' | '1:1'):
  | '1280:720'
  | '720:1280'
  | '960:960' {
  if (aspect === '9:16') return '720:1280'
  if (aspect === '1:1') return '960:960'
  return '1280:720'
}

async function waitForTask(
  client: RunwayML,
  taskId: string,
  onProgress: (p: number) => Promise<void>,
  progressFrom: number,
  progressTo: number,
): Promise<string> {
  // Poll task status. Runway updates at most every 5s.
  const start = Date.now()
  const timeoutMs = 10 * 60 * 1000
  let lastProgress = progressFrom
  while (true) {
    const task = await client.tasks.retrieve(taskId)
    if (task.status === 'SUCCEEDED') {
      await onProgress(progressTo)
      if (!task.output?.[0]) throw new Error('runway_task_no_output')
      return task.output[0]
    }
    if (task.status === 'FAILED') {
      throw new TaskFailedError(task as never)
    }
    // Runway reports `progress` 0..1 while RUNNING.
    const native = task.status === 'RUNNING' ? (task.progress ?? 0) : 0
    const scaled = Math.round(progressFrom + (progressTo - progressFrom) * native)
    const elapsed = Date.now() - start
    const timeFallback = Math.round(
      progressFrom + (progressTo - progressFrom) * Math.min(elapsed / timeoutMs, 0.9),
    )
    const next = Math.min(progressTo - 2, Math.max(scaled, timeFallback))
    if (next > lastProgress) {
      lastProgress = next
      await onProgress(next)
    }
    if (elapsed > timeoutMs) throw new Error('runway_task_timeout')
    await new Promise((r) => setTimeout(r, 5000))
  }
}

export const runwayProvider: VideoProvider = {
  name: 'runway',

  async run({ job, onProgress }) {
    const phase = (job.phase === 'final_15s' ? 'final_15s' : 'preview_5s') as
      | 'preview_5s'
      | 'final_15s'
    const target: DurationTarget = phase === 'final_15s' ? 15 : 5
    const aspectRatio =
      (job.options as { aspect_ratio?: '16:9' | '9:16' | '1:1' })?.aspect_ratio ?? '9:16'
    const prompt = job.prompt ?? job.scenario ?? ''

    await onProgress(10)

    const imageUrls = job.source_image_urls.length
      ? await stageSourceImagesToCloudinary(job)
      : []
    await onProgress(20)

    const client = runwayClient()
    const ratio = aspectToRatio(aspectRatio)
    // Runway caps at 10s; request 10s for final, 5s for preview.
    const duration = target >= 10 ? 10 : 5
    let taskId: string
    let modelUsed: string

    if (imageUrls.length > 0) {
      // Image-to-video with gen4_turbo (cheaper) or gen4.5 (higher quality).
      modelUsed = phase === 'final_15s' ? 'gen4.5' : 'gen4_turbo'
      if (modelUsed === 'gen4.5') {
        const task = await client.imageToVideo.create({
          model: 'gen4.5',
          promptImage: imageUrls[0],
          promptText: prompt.slice(0, 1000),
          ratio: ratio === '960:960' ? '960:960' : ratio,
          duration,
        })
        taskId = task.id
      } else {
        const task = await client.imageToVideo.create({
          model: 'gen4_turbo',
          promptImage: imageUrls[0],
          promptText: prompt.slice(0, 1000),
          ratio: ratio === '960:960' ? '960:960' : ratio,
          duration,
        })
        taskId = task.id
      }
    } else {
      // Text-to-video: only gen4.5 supports it in this SDK.
      modelUsed = 'gen4.5'
      const t2vRatio: '1280:720' | '720:1280' = ratio === '720:1280' ? '720:1280' : '1280:720'
      const task = await client.textToVideo.create({
        model: 'gen4.5',
        promptText: prompt.slice(0, 1000),
        ratio: t2vRatio,
        duration,
      })
      taskId = task.id
    }

    const remoteUrl = await waitForTask(client, taskId, onProgress, 25, 88)
    await onProgress(90)
    const mirrored = await mirrorProviderOutputToSupabase(remoteUrl, job)
    await onProgress(100)

    return {
      outputVideoUrl: mirrored.videoKey,
      outputThumbnailUrl: mirrored.thumbKey,
      // Runway tops out at 10s — report what we actually got, not the target.
      durationSeconds: mirrored.durationSeconds || duration,
      providerJobId: taskId,
      providerModel: modelUsed,
    }
  },
}
