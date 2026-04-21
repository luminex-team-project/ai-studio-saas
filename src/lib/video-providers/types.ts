import type { VideoJobRow } from '@/lib/supabase/types'

export type ProviderResult = {
  outputVideoUrl: string | null   // storage key within 'videos' bucket, or null
  outputThumbnailUrl: string | null // storage key within 'thumbnails' bucket
  durationSeconds: number
  providerJobId: string | null
  providerModel: string           // e.g. 'kling-v2-5-pro', 'gen4_turbo', 'ray-2'
}

export type ProviderContext = {
  job: VideoJobRow
  onProgress: (progress: number) => Promise<void>
}

export type ProviderKind = 'runway' | 'kling' | 'luma' | 'mock'

export interface VideoProvider {
  name: ProviderKind
  run(ctx: ProviderContext): Promise<ProviderResult>
}

// Helper types used by provider-shared utilities.
export type DurationTarget = 5 | 10 | 15

export type ProviderInputs = {
  // Canonical prompt. For image-to-video this is the scene description that
  // goes alongside the reference image(s).
  prompt: string
  // Public HTTP(S) URLs the provider can fetch. Empty array for text2video.
  imageUrls: string[]
  target: DurationTarget
  aspectRatio: '16:9' | '9:16' | '1:1'
}
