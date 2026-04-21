import type { ReelVariant, Segment } from '../timeline'

// Builds the video half of the reel's filter_complex.
//
// Crossfade math:
//   Each segment i is trimmed from its source at [trimSourceStartMs,
//   trimSourceStartMs + durationMs + transitionOutMs]. The extra
//   transitionOutMs is the "bonus" material that fades into the next
//   segment. Segment 6 has transitionOutMs=0, so it's pulled at exact
//   durationMs.
//
//   xfade chain uses cumulative offsets. With `v_i` pulled at
//   (D_i + X_i), we chain:
//     [v0][v1] xfade=offset=D_0:d=X_0 → length D_0 + D_1 + X_1
//     [v01][v2] xfade=offset=D_0+D_1:d=X_1 → length D_0+D_1+D_2+X_2
//     ...
//   Final length = sum(D_i) = 15_000 ms exactly.
//
// Color grade (Kbeauty warm pastel) is approximated via ffmpeg's built-in
// color filters (colorbalance + eq) rather than a .cube LUT, per the
// project decision to stay asset-free.

export type BuiltVideo = {
  filterFragment: string
  /** Number of video inputs consumed (always = segments.length). */
  videoInputCount: number
}

function secFrom(ms: number): string {
  return (ms / 1000).toFixed(3)
}

/** Kbeauty warm pastel grade — warm highlights, pink shadows,
 *  desaturated midtones, skin-tone preserved via gamma bias on R. */
const KBEAUTY_COLOR_GRADE =
  'colorbalance=rs=0.06:gs=0.00:bs=-0.04:' +
  'rm=0.04:gm=0.00:bm=-0.03:' +
  'rh=0.05:gh=0.01:bh=-0.03,' +
  'eq=saturation=0.88:contrast=1.05:brightness=0.02:' +
  'gamma_r=1.03:gamma_g=0.99:gamma_b=0.96'

export function buildVideoChain(reel: ReelVariant, assFilePath: string): BuiltVideo {
  const segs = reel.segments
  const frags: string[] = []

  // Per-segment trim → uniform scale/fps → label [v{i}].
  segs.forEach((seg, i) => {
    const startSec = secFrom(seg.trimSourceStartMs)
    const pullMs = seg.durationMs + seg.transitionOutMs
    const durSec = secFrom(pullMs)
    // scale=increase + crop centers and fills 1080×1920. fps=30 normalizes
    // cadence so xfade blending is clean regardless of source framerate.
    frags.push(
      `[${i}:v]trim=start=${startSec}:duration=${durSec},setpts=PTS-STARTPTS,` +
        `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30[v${i}]`,
    )
  })

  // xfade chain. After each xfade the output stream length is
  //   (prev_cumulative_visible) + (current_pull) = ∑D_{0..i-1} + (D_i + X_i)
  // and the next blend starts at ∑D_{0..i} on that stream. That accumulator
  // `cumulative` is exactly the xfade offset for each iteration.
  let prevLabel = '[v0]'
  let cumulative = 0
  for (let i = 1; i < segs.length; i++) {
    const prev = segs[i - 1]
    cumulative += prev.durationMs
    const outLabel = i === segs.length - 1 ? '[vxfade]' : `[v0_${i}]`
    const offsetSec = secFrom(cumulative)
    // xfade requires duration > 0; fall back to a 10 ms cut if a segment
    // declares transitionOut=0 mid-chain (shouldn't happen with current
    // layout but be defensive).
    const durSec = secFrom(prev.transitionOutMs > 0 ? prev.transitionOutMs : 10)
    frags.push(
      `${prevLabel}[v${i}]xfade=transition=fade:duration=${durSec}:offset=${offsetSec}${outLabel}`,
    )
    prevLabel = outLabel
  }

  // 1-segment edge case (shouldn't occur in production): pass [v0] through.
  if (segs.length === 1) {
    frags.push('[v0]null[vxfade]')
  }

  // Color grade + subtitle burn-in.
  const escapedAss = assFilePath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'")
  frags.push(`[vxfade]${KBEAUTY_COLOR_GRADE}[vgrade]`)
  frags.push(`[vgrade]ass=filename=${escapedAss}[vout]`)

  return {
    filterFragment: frags.join(';'),
    videoInputCount: segs.length,
  }
}
