'use client'

import { Newspaper, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type NewsAngle = {
  headline: string
  source_url: string
  summary: string
  key_numbers: string
  korea_impact: string
}

export const DEFAULT_NEWS_ANGLE: NewsAngle = {
  headline: '',
  source_url: '',
  summary: '',
  key_numbers: '',
  korea_impact: '',
}

export function NewsAngleForm({
  value,
  onChange,
}: {
  value: NewsAngle
  onChange: (v: NewsAngle) => void
}) {
  function patch(p: Partial<NewsAngle>) {
    onChange({ ...value, ...p })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-space-gray/40 p-4">
        <Newspaper className="mt-0.5 size-5 shrink-0 text-neon-cyan" />
        <div className="text-xs text-muted-foreground">
          뉴스 발생 후 <span className="text-foreground">12시간 이내</span> 게시할수록 알고리즘 노출이 유리합니다.
          신뢰할 수 있는 공식 소스(X 공식 계정, 기업 블로그, AI 타임스 등) URL을 첨부해주세요.
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm">뉴스 헤드라인 (한국어 25자 내) *</label>
        <input
          type="text"
          value={value.headline}
          onChange={(e) => patch({ headline: e.target.value })}
          placeholder="예) GPT-5 정식 출시"
          maxLength={30}
          className="w-full rounded-lg border border-border bg-deep-space px-3 py-2 text-sm outline-none focus:border-neon-purple"
        />
        <div className="mt-1 text-right text-xs text-muted-foreground/60">
          {value.headline.length}/30
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm">공식 소스 URL *</label>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-deep-space px-3 py-2">
          <Link2 className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="url"
            value={value.source_url}
            onChange={(e) => patch({ source_url: e.target.value })}
            placeholder="https://openai.com/blog/..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm">2~3줄 요약 *</label>
        <textarea
          value={value.summary}
          onChange={(e) => patch({ summary: e.target.value })}
          placeholder="예) GPT-5가 GPT-4 대비 벤치마크 30% 향상. 가격은 동결. 한국어 추론 속도 2배."
          rows={3}
          maxLength={300}
          className={cn(
            'w-full resize-none rounded-lg border border-border bg-deep-space px-3 py-2 text-sm outline-none focus:border-neon-purple',
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm">핵심 수치 / 변화</label>
          <input
            type="text"
            value={value.key_numbers}
            onChange={(e) => patch({ key_numbers: e.target.value })}
            placeholder="예) 벤치마크 30% ↑, 가격 동결"
            maxLength={60}
            className="w-full rounded-lg border border-border bg-deep-space px-3 py-2 text-sm outline-none focus:border-neon-purple"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm">한국 사용자 영향</label>
          <input
            type="text"
            value={value.korea_impact}
            onChange={(e) => patch({ korea_impact: e.target.value })}
            placeholder="예) 한국어 추론 속도 2배"
            maxLength={60}
            className="w-full rounded-lg border border-border bg-deep-space px-3 py-2 text-sm outline-none focus:border-neon-purple"
          />
        </div>
      </div>
    </div>
  )
}
