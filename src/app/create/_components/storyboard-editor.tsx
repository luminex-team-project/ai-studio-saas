'use client'

import { useState } from 'react'
import { Sparkles, Clock, Target, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StoryboardShot = {
  shot: 'hook' | 'problem' | 'use' | 'cta'
  label: string
  duration_sec: number
  prompt: string
}

const DEFAULT_SHOTS: StoryboardShot[] = [
  { shot: 'hook',    label: 'Hook',    duration_sec: 2, prompt: '' },
  { shot: 'problem', label: 'Problem / Desire', duration_sec: 3, prompt: '' },
  { shot: 'use',     label: 'Product Use',      duration_sec: 5, prompt: '' },
  { shot: 'cta',     label: 'CTA',     duration_sec: 5, prompt: '' },
]

const SHOT_META: Record<StoryboardShot['shot'], { icon: typeof Sparkles; hint: string; color: string }> = {
  hook:    { icon: Sparkles,  hint: '시선 사로잡는 1~2초. 제품 클로즈업 + 임팩트 자막.', color: 'text-neon-pink' },
  problem: { icon: Target,    hint: '고객이 겪는 문제/욕구 묘사. 모델의 공감 표정.',    color: 'text-neon-purple' },
  use:     { icon: Clock,     hint: '제품 사용 장면. 손-얼굴/손-제품 자연스러운 동선.', color: 'text-neon-blue' },
  cta:     { icon: Megaphone, hint: '행동 유도. 제품명 + 구매/체험 메시지.',          color: 'text-neon-cyan' },
}

export function StoryboardEditor({
  value,
  onChange,
}: {
  value: StoryboardShot[]
  onChange: (shots: StoryboardShot[]) => void
}) {
  const [shots] = useState<StoryboardShot[]>(value.length === 4 ? value : DEFAULT_SHOTS)

  function updateShot(i: number, patch: Partial<StoryboardShot>) {
    const next = shots.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    onChange(next)
  }

  const totalDuration = shots.reduce((acc, s) => acc + s.duration_sec, 0)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg">스토리보드 4샷</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Hook → Problem → Use → CTA 구조. 각 샷의 프롬프트를 한국어로 적어주세요.
          </p>
        </div>
        <span className="rounded-full border border-border bg-space-gray/60 px-3 py-1 text-xs text-muted-foreground">
          총 {totalDuration}초
        </span>
      </div>

      <ol className="space-y-4">
        {shots.map((s, i) => {
          const meta = SHOT_META[s.shot]
          const Icon = meta.icon
          return (
            <li
              key={s.shot}
              className="rounded-2xl border border-border bg-space-gray/40 p-4 transition hover:border-border-strong"
            >
              <div className="flex items-start gap-4">
                <div className={cn('flex size-10 items-center justify-center rounded-xl bg-deep-space', meta.color)}>
                  <Icon className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      <span className="text-muted-foreground">Shot {i + 1}</span>
                      <span className="mx-2 text-muted-foreground/40">·</span>
                      <span className="text-foreground">{s.label}</span>
                    </span>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="number"
                        min={1}
                        max={15}
                        value={s.duration_sec}
                        onChange={(e) => {
                          const n = Number(e.target.value)
                          if (!Number.isNaN(n)) updateShot(i, { duration_sec: Math.min(15, Math.max(1, n)) })
                        }}
                        className="w-14 rounded-md border border-border bg-deep-space px-2 py-1 text-center text-sm text-foreground outline-none focus:border-neon-purple"
                      />
                      초
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground/80">{meta.hint}</p>
                  <textarea
                    rows={2}
                    value={s.prompt}
                    onChange={(e) => updateShot(i, { prompt: e.target.value })}
                    placeholder="예) 화장품을 든 손이 얼굴에 스며드는 매크로 샷"
                    className="mt-3 w-full resize-none rounded-lg border border-border bg-deep-space px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-neon-purple"
                  />
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export { DEFAULT_SHOTS }
