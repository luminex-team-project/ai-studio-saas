import type { SubtitleCue } from '../timeline'

// Generates an Advanced SubStation Alpha (.ass) file with 3 styles keyed to
// the timeline.ts subtitle `style` field. libass ships with ffmpeg-static and
// is the only reliable way to burn Korean text with outlines onto video.
//
// Layout assumptions (matches the reel output):
//   PlayResX = 1080, PlayResY = 1920
//   Vertical bottom-anchored subtitles, MarginV = 280 from the bottom edge.
//
// Color format is ASS-native: &HAABBGGRR (alpha first, BGR not RGB).

function msToAssTime(ms: number): string {
  // ASS format: H:MM:SS.CC  (centiseconds, max precision = 10ms).
  const totalCs = Math.round(ms / 10)
  const h = Math.floor(totalCs / 360_000)
  const m = Math.floor((totalCs % 360_000) / 6000)
  const s = Math.floor((totalCs % 6000) / 100)
  const cs = totalCs % 100
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

function escapeAssText(text: string): string {
  // ASS uses `\N` for hard newlines. Strip any lone `\` that could break
  // override-tag parsing; keep Korean chars as-is (UTF-8 is supported).
  return text.replace(/\\/g, '').replace(/\n/g, '\\N')
}

export function buildAssFile(opts: {
  subtitles: readonly SubtitleCue[]
  fontName?: string // typically "Pretendard Bold" — libass falls back if missing
}): string {
  const font = opts.fontName ?? 'Pretendard'

  // Style table — all colors are &HAABBGGRR.
  //   PrimaryColour = fill  (0x00 alpha = opaque)
  //   OutlineColour = stroke
  //   BackColour    = shadow (uses 0x99 alpha = ~60% transparent black)
  //
  // Alignment 2 = bottom-center; MarginV pushes it up from the frame bottom.
  const styles = [
    [
      'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour,',
      ' Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle,',
      ' BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    ].join(''),
    // Hook: 58pt, slight scale up via style, bold white with outline
    `Style: Hook,${font},58,&H00FFFFFF,&H00FFFFFF,&H00000000,&H99000000,-1,0,0,0,110,110,0,0,1,2,4,2,80,80,280,1`,
    // Body: 52pt, neutral weight
    `Style: Body,${font},52,&H00FFFFFF,&H00FFFFFF,&H00000000,&H99000000,-1,0,0,0,100,100,0,0,1,2,4,2,80,80,280,1`,
    // CTA: 68pt, dark text on white rounded box (BorderStyle=3 = box)
    `Style: Cta,${font},68,&H001A1A1A,&H001A1A1A,&H80FFFFFF,&H80FFFFFF,-1,0,0,0,125,125,0,0,3,6,0,2,100,100,300,1`,
  ]

  const header = [
    '[Script Info]',
    'ScriptType: v4.00+',
    'PlayResX: 1080',
    'PlayResY: 1920',
    'ScaledBorderAndShadow: yes',
    'Collisions: Normal',
    'WrapStyle: 2',
    '',
    '[V4+ Styles]',
    ...styles,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ]

  const dialogues = opts.subtitles.map((cue) => {
    const styleName = cue.style === 'hook' ? 'Hook' : cue.style === 'cta' ? 'Cta' : 'Body'
    // `\fad(in,out)` gives a 150ms fade-in/out around the cue window.
    const text = `{\\fad(150,150)}${escapeAssText(cue.text)}`
    return `Dialogue: 0,${msToAssTime(cue.startMs)},${msToAssTime(cue.endMs)},${styleName},,0,0,0,,${text}`
  })

  return [...header, ...dialogues, ''].join('\n')
}
