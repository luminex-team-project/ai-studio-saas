import type { ClipId, ModelId, Provider } from '../timeline'

export type AspectRatio = '9:16' | '16:9' | '1:1'

export interface ClipGenInput {
  clipId: ClipId
  provider: Provider
  model: ModelId
  prompt: string
  negativePrompt: string
  /** Public, provider-reachable image URL (no auth required). */
  imageUrl: string
  duration: 5
  aspectRatio: AspectRatio
  resolution: '720p' | '1080p'
  seed: number
  /** Optional guidance strength. Kling master expects 0.8; others default 0.5. */
  cfgScale?: number
}

export interface ClipGenResult {
  /** Provider-served mp4 URL (typically expires within hours). */
  remoteUrl: string
  providerJobId: string
  /** Actual model string reported back or sent to the provider. */
  providerModel: string
  /** Reported duration in seconds (may be approximate). */
  durationSeconds: number
}

export type ProgressFn = (pct: number) => void | Promise<void>

export interface CampaignProvider {
  readonly name: Provider
  generate(input: ClipGenInput, onProgress?: ProgressFn): Promise<ClipGenResult>
}
