import path from 'node:path'
import { existsSync } from 'node:fs'
import { SFX_DIR, BGM_DIR } from '../paths'
import type { BgmSpec, SfxCue, SubtitleCue } from '../timeline'

// Builds the audio portion of the reel's filter_complex:
//   - BGM: base gain + fadein/fadeout + static ducking windows during subs
//   - SFX: one per cue, delayed + gain-staged, all mixed with BGM
//
// When an asset is missing, we substitute `anullsrc` (silent stereo) at that
// slot so the compose never fails. Ducking is implemented as chained
// `volume=...:enable='between(t,a,b)'` filters — a clean static-sidechain
// approximation since subtitle text has no audio to drive a real compressor.

export type BuiltAudio = {
  /** ffmpeg filter_complex fragment ending in a labeled `[aout]` output. */
  filterFragment: string
  /** External audio files needed by the fragment, in the order they should
   *  be passed to ffmpeg via `-i` flags. */
  externalInputs: string[]
  bgmMissing: boolean
  /** SFX cue indexes that were substituted with silence. */
  sfxMissingIndexes: number[]
}

function secFrom(ms: number): string {
  // ffmpeg accepts either seconds or HH:MM:SS. Three-decimal seconds gives
  // enough precision for xfade/ducking timing.
  return (ms / 1000).toFixed(3)
}

function resolveSfxPath(file: SfxCue['file']): string {
  return path.join(SFX_DIR, `${file}.mp3`)
}

function resolveBgmPath(file: string): string {
  return path.join(BGM_DIR, file)
}

export function buildAudio(opts: {
  bgm: BgmSpec
  sfxCues: readonly SfxCue[]
  subtitles: readonly SubtitleCue[]
  reelLengthMs: number
  /** ffmpeg input-stream index of the FIRST audio input in the full cmd. */
  audioFirstInputIndex: number
}): BuiltAudio {
  const reelLenSec = secFrom(opts.reelLengthMs)
  const externalInputs: string[] = []
  let nextIndex = opts.audioFirstInputIndex

  // ── BGM ────────────────────────────────────────────────────────────────
  const bgmPath = resolveBgmPath(opts.bgm.file)
  const bgmMissing = !existsSync(bgmPath)
  let bgmRef: string
  const preambleFragments: string[] = []
  if (bgmMissing) {
    preambleFragments.push(
      `anullsrc=channel_layout=stereo:sample_rate=48000,atrim=0:${reelLenSec},asetpts=N/SR/TB[bgm_src]`,
    )
    bgmRef = '[bgm_src]'
  } else {
    externalInputs.push(bgmPath)
    bgmRef = `[${nextIndex}:a]`
    nextIndex++
  }

  const fadeOutStartSec = secFrom(opts.reelLengthMs - opts.bgm.fadeOutMs)
  const fadeInDurSec = secFrom(opts.bgm.fadeInMs)
  const fadeOutDurSec = secFrom(opts.bgm.fadeOutMs)

  const duckSteps = opts.subtitles
    .map((cue) => {
      const a = secFrom(cue.startMs)
      const b = secFrom(cue.endMs)
      return `volume=volume=${opts.bgm.duckingDb}dB:enable='between(t,${a},${b})'`
    })
    .join(',')

  const bgmChain =
    `${bgmRef}` +
    `atrim=0:${reelLenSec},asetpts=N/SR/TB,` +
    `volume=volume=${opts.bgm.gainDb}dB,` +
    `afade=t=in:st=0:d=${fadeInDurSec},` +
    `afade=t=out:st=${fadeOutStartSec}:d=${fadeOutDurSec}` +
    (duckSteps ? `,${duckSteps}` : '') +
    `[bgm_out]`

  // ── SFX ────────────────────────────────────────────────────────────────
  const sfxChains: string[] = []
  const sfxLabels: string[] = []
  const sfxMissingIndexes: number[] = []
  opts.sfxCues.forEach((cue, idx) => {
    const sfxPath = resolveSfxPath(cue.file)
    const label = `sfx_${idx}`
    if (!existsSync(sfxPath)) {
      sfxMissingIndexes.push(idx)
      sfxChains.push(
        `anullsrc=channel_layout=stereo:sample_rate=48000,atrim=0:${reelLenSec},asetpts=N/SR/TB[${label}]`,
      )
    } else {
      externalInputs.push(sfxPath)
      const streamIdx = nextIndex
      nextIndex++
      sfxChains.push(
        `[${streamIdx}:a]` +
          `adelay=${cue.atMs}|${cue.atMs},` +
          `volume=volume=${cue.gainDb}dB,` +
          `apad=whole_dur=${reelLenSec},atrim=0:${reelLenSec},asetpts=N/SR/TB[${label}]`,
      )
    }
    sfxLabels.push(`[${label}]`)
  })

  // ── Mix ────────────────────────────────────────────────────────────────
  const mixInputs = ['[bgm_out]', ...sfxLabels]
  const mixFilter =
    `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=first:normalize=0[aout]`

  const fragment = [...preambleFragments, bgmChain, ...sfxChains, mixFilter].join(';')

  return {
    filterFragment: fragment,
    externalInputs,
    bgmMissing,
    sfxMissingIndexes,
  }
}
