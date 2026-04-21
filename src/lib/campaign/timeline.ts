import { CORE_CLIP_PROMPTS, type CoreClipId } from './prompts/clips'
import { HOOK_PROMPTS, type HookId } from './prompts/hooks'

// ═══════════════════════════════════════════════════════════════════════════
// Timeline manifest — the ONLY source of truth for the EloM viral campaign.
// Producers, workers, and the compositor all read from this file and nothing
// else. Edit here, never inline elsewhere.
// ═══════════════════════════════════════════════════════════════════════════

export type Provider = 'runway' | 'luma' | 'kling'

export type ModelId =
  | 'gen4_turbo' //            Runway image-to-video, 5s/10s, 720×1280
  | 'ray-2' //                 Luma Dream Machine, highest quality
  | 'kling-v2-1-master' //     Kling master, best prompt fidelity (0.8 cfg)

export type SourceImage = 'mask_0' | 'mask_1' | 'mask_2'

export type ClipId = CoreClipId | HookId

export interface ClipSpec {
  id: ClipId
  role: 'hook' | 'core'
  useCase: string
  sourceImage: SourceImage
  provider: Provider
  model: ModelId
  duration: 5
  aspectRatio: '9:16'
  resolution: '720p' | '1080p'
  seed: 42
  prompt: string
  negativePrompt: string
  // Optional provider-specific guidance strength. Kling master benefits from
  // 0.8; other models default to 0.5 inside the adapter.
  cfgScale?: number
}

export interface SubtitleCue {
  startMs: number
  endMs: number
  text: string
  style: 'hook' | 'body' | 'cta'
}

export interface SfxCue {
  atMs: number
  file: 'whoosh' | 'chime' | 'droplet' | 'impact'
  gainDb: number
}

export interface Segment {
  clipId: ClipId
  /** Where this segment lands on the final 15 000ms reel timeline. */
  timelineStartMs: number
  /** Wall-clock length of this segment on the final timeline. */
  durationMs: number
  /** In-point within the source clip (source clips are 5 000ms long). */
  trimSourceStartMs: number
  transitionIn: 'cut' | 'fade' | 'crossfade'
  /** Crossfade length into the next segment; 0 = hard cut. */
  transitionOutMs: number
}

export interface BgmSpec {
  file: string
  gainDb: number
  fadeInMs: number
  fadeOutMs: number
  /** dB to dip BGM while a subtitle is on-screen (static sidechain approximation). */
  duckingDb: number
}

export interface ReelVariant {
  id: 'A' | 'B' | 'C'
  name: 'Mystery' | 'Shock' | 'Lifestyle'
  hookClipId: HookId
  segments: Segment[]
  subtitles: SubtitleCue[]
  sfxCues: SfxCue[]
  bgm: BgmSpec
  /** Path (relative to repo root) to the .cube LUT file. */
  lut: string
}

// ───────────────────────────────────────────────────────────────────────────
// Shared constants
// ───────────────────────────────────────────────────────────────────────────

export const CAMPAIGN_ID = 'elom-trouble-patch-viral-v1'
export const REEL_LENGTH_MS = 15_000
export const REEL_TOLERANCE_MS = 50
export const LUT_PATH = 'assets/lut/kbeauty_warm_pastel.cube'

const SHARED_CFG = {
  seed: 42 as const,
  aspectRatio: '9:16' as const,
  resolution: '1080p' as const,
  duration: 5 as const,
}

// ───────────────────────────────────────────────────────────────────────────
// CLIPS — 6 core + 3 hooks. Routing encoded here (provider + model).
// ───────────────────────────────────────────────────────────────────────────

export const CLIPS: ClipSpec[] = [
  {
    id: 'clip_1',
    role: 'core',
    useCase: CORE_CLIP_PROMPTS.clip_1.useCase,
    sourceImage: 'mask_0',
    provider: 'runway',
    model: 'gen4_turbo',
    ...SHARED_CFG,
    prompt: CORE_CLIP_PROMPTS.clip_1.prompt,
    negativePrompt: CORE_CLIP_PROMPTS.clip_1.negativePrompt,
  },
  {
    id: 'clip_2',
    role: 'core',
    useCase: CORE_CLIP_PROMPTS.clip_2.useCase,
    sourceImage: 'mask_0',
    provider: 'luma',
    model: 'ray-2',
    ...SHARED_CFG,
    prompt: CORE_CLIP_PROMPTS.clip_2.prompt,
    negativePrompt: CORE_CLIP_PROMPTS.clip_2.negativePrompt,
  },
  {
    id: 'clip_3',
    role: 'core',
    useCase: CORE_CLIP_PROMPTS.clip_3.useCase,
    sourceImage: 'mask_0',
    provider: 'runway',
    model: 'gen4_turbo',
    ...SHARED_CFG,
    prompt: CORE_CLIP_PROMPTS.clip_3.prompt,
    negativePrompt: CORE_CLIP_PROMPTS.clip_3.negativePrompt,
  },
  {
    id: 'clip_4',
    role: 'core',
    useCase: CORE_CLIP_PROMPTS.clip_4.useCase,
    sourceImage: 'mask_1',
    provider: 'luma',
    model: 'ray-2',
    ...SHARED_CFG,
    prompt: CORE_CLIP_PROMPTS.clip_4.prompt,
    negativePrompt: CORE_CLIP_PROMPTS.clip_4.negativePrompt,
  },
  {
    id: 'clip_5',
    role: 'core',
    useCase: CORE_CLIP_PROMPTS.clip_5.useCase,
    sourceImage: 'mask_2',
    provider: 'kling',
    model: 'kling-v2-1-master',
    ...SHARED_CFG,
    prompt: CORE_CLIP_PROMPTS.clip_5.prompt,
    negativePrompt: CORE_CLIP_PROMPTS.clip_5.negativePrompt,
    cfgScale: 0.8,
  },
  {
    id: 'clip_6',
    role: 'core',
    useCase: CORE_CLIP_PROMPTS.clip_6.useCase,
    sourceImage: 'mask_0',
    provider: 'runway',
    model: 'gen4_turbo',
    ...SHARED_CFG,
    prompt: CORE_CLIP_PROMPTS.clip_6.prompt,
    negativePrompt: CORE_CLIP_PROMPTS.clip_6.negativePrompt,
  },
  {
    id: 'hook_a',
    role: 'hook',
    useCase: `Hook A — ${HOOK_PROMPTS.hook_a.name}`,
    sourceImage: 'mask_0',
    provider: 'runway',
    model: 'gen4_turbo',
    ...SHARED_CFG,
    prompt: HOOK_PROMPTS.hook_a.prompt,
    negativePrompt: HOOK_PROMPTS.hook_a.negativePrompt,
  },
  {
    id: 'hook_b',
    role: 'hook',
    useCase: `Hook B — ${HOOK_PROMPTS.hook_b.name}`,
    sourceImage: 'mask_0',
    provider: 'runway',
    model: 'gen4_turbo',
    ...SHARED_CFG,
    prompt: HOOK_PROMPTS.hook_b.prompt,
    negativePrompt: HOOK_PROMPTS.hook_b.negativePrompt,
  },
  {
    id: 'hook_c',
    role: 'hook',
    useCase: `Hook C — ${HOOK_PROMPTS.hook_c.name}`,
    sourceImage: 'mask_0',
    provider: 'runway',
    model: 'gen4_turbo',
    ...SHARED_CFG,
    prompt: HOOK_PROMPTS.hook_c.prompt,
    negativePrompt: HOOK_PROMPTS.hook_c.negativePrompt,
  },
]

export const CLIP_INDEX: Readonly<Record<ClipId, ClipSpec>> = Object.freeze(
  Object.fromEntries(CLIPS.map((c) => [c.id, c])) as Record<ClipId, ClipSpec>,
)

// ───────────────────────────────────────────────────────────────────────────
// Segment layout — identical shape for all 3 reels; only the hook clip varies.
// Wall-clock-on-timeline semantics: segment[i+1].timelineStart =
// segment[i].timelineStart + segment[i].durationMs. Crossfade overlap is
// absorbed into the segment duration (compositor handles xfade offsets).
// ───────────────────────────────────────────────────────────────────────────

function buildSegments(hookClipId: HookId): Segment[] {
  return [
    {
      clipId: hookClipId,
      timelineStartMs: 0,
      durationMs: 2000,
      trimSourceStartMs: 0,
      transitionIn: 'cut',
      transitionOutMs: 200,
    },
    {
      clipId: 'clip_2',
      timelineStartMs: 2000,
      durationMs: 1500,
      trimSourceStartMs: 500,
      transitionIn: 'crossfade',
      transitionOutMs: 150,
    },
    {
      clipId: 'clip_3',
      timelineStartMs: 3500,
      durationMs: 2000,
      trimSourceStartMs: 0,
      transitionIn: 'crossfade',
      transitionOutMs: 200,
    },
    {
      clipId: 'clip_4',
      timelineStartMs: 5500,
      durationMs: 3500,
      trimSourceStartMs: 0,
      transitionIn: 'crossfade',
      transitionOutMs: 250,
    },
    {
      clipId: 'clip_5',
      timelineStartMs: 9000,
      durationMs: 3000,
      trimSourceStartMs: 500,
      transitionIn: 'crossfade',
      transitionOutMs: 200,
    },
    {
      clipId: 'clip_6',
      timelineStartMs: 12_000,
      durationMs: 3000,
      trimSourceStartMs: 0,
      transitionIn: 'crossfade',
      transitionOutMs: 0,
    },
  ]
}

// ───────────────────────────────────────────────────────────────────────────
// Subtitles — body + CTA are shared across all 3 reels; hook line varies.
// ───────────────────────────────────────────────────────────────────────────

const SHARED_BODY_SUBTITLES: readonly SubtitleCue[] = Object.freeze([
  { startMs: 2200, endMs: 3400, text: '수국 정원에서 발견한 비밀', style: 'body' },
  { startMs: 3700, endMs: 5300, text: '로고 하나로 증명되는 미니멀리즘', style: 'body' },
  { startMs: 5800, endMs: 7200, text: '티트리 비옴 집중 케어', style: 'body' },
  { startMs: 7500, endMs: 8900, text: '물방울처럼 스며드는 진정감', style: 'body' },
  { startMs: 9200, endMs: 10_800, text: 'Control Bio 95, 과학이 보장하는 균형', style: 'body' },
  { startMs: 11_000, endMs: 11_900, text: '트러블 끝, 매일 깨끗', style: 'body' },
  { startMs: 12_200, endMs: 13_800, text: 'EloM — Trouble Patch Mask', style: 'cta' },
  { startMs: 13_900, endMs: 14_900, text: '지금, 당신의 피부에게', style: 'cta' },
])

const HOOK_SUBTITLE_BY_REEL: Record<ReelVariant['id'], SubtitleCue> = {
  A: { startMs: 200, endMs: 1800, text: '잠깐, 이 마스크팩…', style: 'hook' },
  B: { startMs: 200, endMs: 1800, text: '트러블, 진심 끝낼게요', style: 'hook' },
  C: { startMs: 200, endMs: 1800, text: '내 아침, 피부가 달라졌다', style: 'hook' },
}

function buildSubtitles(reelId: ReelVariant['id']): SubtitleCue[] {
  return [HOOK_SUBTITLE_BY_REEL[reelId], ...SHARED_BODY_SUBTITLES]
}

// ───────────────────────────────────────────────────────────────────────────
// SFX — identical across all 3 reels (hook-provider-agnostic).
// ───────────────────────────────────────────────────────────────────────────

const SHARED_SFX_CUES: readonly SfxCue[] = Object.freeze([
  { atMs: 0, file: 'whoosh', gainDb: -6 },
  { atMs: 1850, file: 'impact', gainDb: -9 },
  { atMs: 2000, file: 'whoosh', gainDb: -12 },
  { atMs: 5500, file: 'whoosh', gainDb: -10 },
  { atMs: 5700, file: 'droplet', gainDb: -8 },
  { atMs: 7000, file: 'droplet', gainDb: -10 },
  { atMs: 9000, file: 'chime', gainDb: -12 },
  { atMs: 9500, file: 'chime', gainDb: -18 },
  { atMs: 12_000, file: 'whoosh', gainDb: -14 },
  { atMs: 14_500, file: 'chime', gainDb: -6 },
])

// ───────────────────────────────────────────────────────────────────────────
// BGM — identical across all 3 reels. Beat drop ≈ 2000ms (hook→bridge).
// ───────────────────────────────────────────────────────────────────────────

const SHARED_BGM: BgmSpec = {
  file: 'lofi_drop.mp3',
  gainDb: -20,
  fadeInMs: 300,
  fadeOutMs: 800,
  duckingDb: -6,
}

// ───────────────────────────────────────────────────────────────────────────
// Reel variants — the three deliverables.
// ───────────────────────────────────────────────────────────────────────────

function buildReel(id: ReelVariant['id'], hookClipId: HookId): ReelVariant {
  const name = HOOK_PROMPTS[hookClipId].name
  return {
    id,
    name,
    hookClipId,
    segments: buildSegments(hookClipId),
    subtitles: buildSubtitles(id),
    sfxCues: [...SHARED_SFX_CUES],
    bgm: { ...SHARED_BGM },
    lut: LUT_PATH,
  }
}

export const REEL_A: ReelVariant = buildReel('A', 'hook_a')
export const REEL_B: ReelVariant = buildReel('B', 'hook_b')
export const REEL_C: ReelVariant = buildReel('C', 'hook_c')
export const REELS: readonly ReelVariant[] = Object.freeze([REEL_A, REEL_B, REEL_C])

// ───────────────────────────────────────────────────────────────────────────
// Invariants — cheap sanity checks run at module load time. Catches a typo in
// segment math long before ffmpeg runs.
// ───────────────────────────────────────────────────────────────────────────

export function assertSegmentsSumToReelLength(reel: ReelVariant): void {
  const total = reel.segments.reduce((acc, s) => acc + s.durationMs, 0)
  if (total !== REEL_LENGTH_MS) {
    throw new Error(
      `timeline_invariant: reel ${reel.id} segments sum to ${total}ms, expected ${REEL_LENGTH_MS}ms`,
    )
  }
  // Verify each timelineStartMs is the cumulative sum of prior durations.
  let cumulative = 0
  for (const seg of reel.segments) {
    if (seg.timelineStartMs !== cumulative) {
      throw new Error(
        `timeline_invariant: reel ${reel.id} segment ${seg.clipId} timelineStart=${seg.timelineStartMs} but expected ${cumulative}`,
      )
    }
    cumulative += seg.durationMs
  }
}

export function assertAllReelsValid(): void {
  for (const reel of REELS) assertSegmentsSumToReelLength(reel)
}

// Unique clipIds that need to be generated across all reels (for dedupe math
// / progress display). 6 core + 3 hooks = 9 jobs.
export function distinctClipIdsForCampaign(): ClipId[] {
  const ids = new Set<ClipId>()
  for (const reel of REELS) {
    for (const seg of reel.segments) ids.add(seg.clipId)
  }
  return [...ids]
}

// Run invariants at import time so a broken manifest is caught immediately.
assertAllReelsValid()
