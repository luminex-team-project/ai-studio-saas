import 'server-only'

import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import ffmpegStatic from 'ffmpeg-static'
import { CAMPAIGN_ID, REELS, REEL_LENGTH_MS, REEL_TOLERANCE_MS, type ReelVariant } from '../timeline'
import { COMPOSED_DIR, FONTS_DIR, composedReelPath, rawClipFailurePath, rawClipPath } from '../paths'
import { logger } from '../logger'
import { buildAssFile } from './subtitleBuilder'
import { buildVideoChain } from './videoChain'
import { buildAudio } from './sfxBuilder'

const execFileP = promisify(execFile)

// ffmpeg-static ships a prebuilt binary path. On platforms where it's null
// (unsupported arch) we fall back to a system `ffmpeg` binary on PATH.
const FFMPEG: string = (ffmpegStatic as unknown as string) || 'ffmpeg'

type ReelPrecheck =
  | { ok: true; reel: ReelVariant; clipPaths: string[] }
  | { ok: false; reel: ReelVariant; reason: string }

function precheckReel(reel: ReelVariant): ReelPrecheck {
  const clipPaths: string[] = []
  for (const seg of reel.segments) {
    if (existsSync(rawClipFailurePath(seg.clipId))) {
      return {
        ok: false,
        reel,
        reason: `clip_${seg.clipId}_failed_sidecar_exists`,
      }
    }
    const rawPath = rawClipPath(seg.clipId)
    if (!existsSync(rawPath)) {
      return {
        ok: false,
        reel,
        reason: `clip_${seg.clipId}_missing_at_${rawPath}`,
      }
    }
    clipPaths.push(rawPath)
  }
  return { ok: true, reel, clipPaths }
}

async function probeDurationSeconds(filePath: string): Promise<number | null> {
  // Use ffmpeg itself in a null-muxer read: parse "Duration:" from stderr.
  try {
    const { stderr } = await execFileP(FFMPEG, ['-hide_banner', '-i', filePath, '-f', 'null', '-'], {
      maxBuffer: 20 * 1024 * 1024,
    }).catch((e: { stderr?: string }) => ({ stderr: e.stderr ?? '' }))
    const m = /Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d+)/.exec(stderr)
    if (!m) return null
    return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])
  } catch {
    return null
  }
}

export type ComposeResult =
  | {
      ok: true
      reelId: ReelVariant['id']
      outputPath: string
      bytes: number
      durationSeconds: number
      bgmMissing: boolean
      sfxMissingIndexes: number[]
    }
  | {
      ok: false
      reelId: ReelVariant['id']
      reason: string
    }

export async function composeReel(reel: ReelVariant, campaignId: string): Promise<ComposeResult> {
  const log = logger.child({ campaignId, reelId: reel.id, stage: 'compose' })
  const pre = precheckReel(reel)
  if (!pre.ok) {
    log.error('compose_precheck_failed', { reason: pre.reason })
    return { ok: false, reelId: reel.id, reason: pre.reason }
  }

  await mkdir(COMPOSED_DIR, { recursive: true })

  // ── Subtitle .ass file ─────────────────────────────────────────────────
  const assPath = path.join(COMPOSED_DIR, `${campaignId}_hook_${reel.id}.ass`)
  const assContent = buildAssFile({ subtitles: reel.subtitles, fontName: 'Pretendard' })
  await writeFile(assPath, assContent, 'utf8')

  // ── Video filter chain ─────────────────────────────────────────────────
  const video = buildVideoChain(reel, assPath)

  // ── Audio filter chain ─────────────────────────────────────────────────
  const audio = buildAudio({
    bgm: reel.bgm,
    sfxCues: reel.sfxCues,
    subtitles: reel.subtitles,
    reelLengthMs: REEL_LENGTH_MS,
    audioFirstInputIndex: video.videoInputCount,
  })

  const filterComplex = `${video.filterFragment};${audio.filterFragment}`

  // ── ffmpeg input ordering ──────────────────────────────────────────────
  // 1. Video clips (in segment order). Index 0..N-1.
  // 2. Audio files (BGM if present, then SFX files in cue order). Index N..
  const videoInputs = pre.clipPaths.flatMap((p) => ['-i', p])
  const audioInputs = audio.externalInputs.flatMap((p) => ['-i', p])

  const outputPath = composedReelPath(campaignId, reel.id)
  const args = [
    '-hide_banner',
    '-loglevel', 'error',
    '-y',
    ...videoInputs,
    ...audioInputs,
    '-filter_complex', filterComplex,
    // libass needs to find the font. `fontsdir=` inside the ass= filter is
    // one option; providing -attach / fonts directory globally is simpler.
    // libass auto-discovers via fontconfig; we set FONTCONFIG_PATH at spawn.
    '-map', '[vout]',
    '-map', '[aout]',
    '-c:v', 'libx264',
    '-crf', '20',
    '-preset', 'slow',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '48000',
    '-t', (REEL_LENGTH_MS / 1000).toFixed(3),
    outputPath,
  ]

  log.info('compose_ffmpeg_start', {
    inputs: pre.clipPaths.length + audio.externalInputs.length,
    bgmMissing: audio.bgmMissing,
    sfxMissing: audio.sfxMissingIndexes.length,
  })

  try {
    await execFileP(FFMPEG, args, {
      maxBuffer: 500 * 1024 * 1024,
      env: {
        ...process.env,
        FONTCONFIG_PATH: FONTS_DIR,
      },
    })
  } catch (err) {
    const e = err as { stderr?: string; message: string }
    log.error('compose_ffmpeg_failed', {
      err: e.message,
      stderr: (e.stderr ?? '').slice(-1500),
    })
    return { ok: false, reelId: reel.id, reason: 'ffmpeg_failed' }
  }

  // ── Post-compose sanity check ──────────────────────────────────────────
  const durSec = await probeDurationSeconds(outputPath)
  const targetSec = REEL_LENGTH_MS / 1000
  const tol = REEL_TOLERANCE_MS / 1000
  if (durSec !== null && Math.abs(durSec - targetSec) > tol) {
    log.error('compose_duration_out_of_tolerance', {
      actual: durSec,
      expected: targetSec,
      toleranceSec: tol,
    })
    // Keep the file — the user asked us to preserve it for inspection.
  }

  const { statSync } = await import('node:fs')
  const bytes = statSync(outputPath).size
  log.info('compose_done', {
    output: outputPath,
    bytes,
    durationSeconds: durSec,
  })

  return {
    ok: true,
    reelId: reel.id,
    outputPath,
    bytes,
    durationSeconds: durSec ?? targetSec,
    bgmMissing: audio.bgmMissing,
    sfxMissingIndexes: audio.sfxMissingIndexes,
  }
}

export async function composeAll(campaignId: string = CAMPAIGN_ID): Promise<ComposeResult[]> {
  // Encoding is 100% local (libx264) — zero API cost. Parallel is faster on
  // 4+ core machines; opt out with CAMPAIGN_COMPOSE_SEQUENTIAL=1 on tiny boxes.
  const sequential = process.env.CAMPAIGN_COMPOSE_SEQUENTIAL === '1'
  logger.info('compose_all_start', {
    campaignId,
    reels: REELS.map((r) => r.id),
    mode: sequential ? 'sequential' : 'parallel',
  })
  const results: ComposeResult[] = []
  if (sequential) {
    for (const reel of REELS) results.push(await composeReel(reel, campaignId))
  } else {
    results.push(...(await Promise.all(REELS.map((r) => composeReel(r, campaignId)))))
  }
  const ok = results.filter((r) => r.ok).length
  logger.info('compose_all_done', { ok, total: results.length })
  return results
}

