'use client'

import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CommercialAdBrief = {
  product_name: string
  category: 'cosmetic' | 'health-supplement'
  usp: string
  benefit: string
  target: string
  tone: 'friendly' | 'premium' | 'energetic' | 'trustworthy'
  duration_sec: 15 | 20 | 25 | 30
}

export const DEFAULT_BRIEF: CommercialAdBrief = {
  product_name: '',
  category: 'cosmetic',
  usp: '',
  benefit: '',
  target: '',
  tone: 'friendly',
  duration_sec: 20,
}

const CATEGORIES: { value: CommercialAdBrief['category']; label: string }[] = [
  { value: 'cosmetic', label: '화장품' },
  { value: 'health-supplement', label: '건강식품' },
]

const TONES: { value: CommercialAdBrief['tone']; label: string; hint: string }[] = [
  { value: 'friendly',     label: '친근',     hint: '자연스럽고 일상적' },
  { value: 'premium',      label: '프리미엄', hint: '우아하고 고급스러운' },
  { value: 'energetic',    label: '에너제틱', hint: '밝고 활기찬' },
  { value: 'trustworthy',  label: '신뢰감',   hint: '차분하고 전문적' },
]

const DURATIONS: CommercialAdBrief['duration_sec'][] = [15, 20, 25, 30]

export function BriefForm({
  value,
  onChange,
}: {
  value: CommercialAdBrief
  onChange: (v: CommercialAdBrief) => void
}) {
  function patch(p: Partial<CommercialAdBrief>) {
    onChange({ ...value, ...p })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg">제품 브리프</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          광고 설계에 필요한 기본 정보를 입력해주세요.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm">제품명 *</label>
          <input
            type="text"
            value={value.product_name}
            onChange={(e) => patch({ product_name: e.target.value })}
            placeholder="예) 글로우 워터 크림"
            maxLength={40}
            className="w-full rounded-lg border border-border bg-deep-space px-3 py-2 text-sm outline-none focus:border-neon-purple"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm">카테고리 *</label>
          <div className="flex gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => patch({ category: c.value })}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm transition',
                  value.category === c.value
                    ? 'border-neon-purple bg-neon-purple/15 text-neon-purple'
                    : 'border-border bg-space-gray/40 text-muted-foreground hover:text-foreground',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm">
          핵심 효능 / USP *
          <span className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="size-3" />
            한 줄로 설명
          </span>
        </label>
        <input
          type="text"
          value={value.usp}
          onChange={(e) => patch({ usp: e.target.value })}
          placeholder="예) 24시간 수분 잠금, 피부 탄력 복원"
          maxLength={80}
          className="w-full rounded-lg border border-border bg-deep-space px-3 py-2 text-sm outline-none focus:border-neon-purple"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm">체감 포인트 *</label>
        <input
          type="text"
          value={value.benefit}
          onChange={(e) => patch({ benefit: e.target.value })}
          placeholder="예) 한 달 쓰니 확실히 탄력이 달라짐"
          maxLength={100}
          className="w-full rounded-lg border border-border bg-deep-space px-3 py-2 text-sm outline-none focus:border-neon-purple"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm">타깃 *</label>
        <input
          type="text"
          value={value.target}
          onChange={(e) => patch({ target: e.target.value })}
          placeholder="예) 30~40대 여성 / 건조 피부 고민"
          maxLength={80}
          className="w-full rounded-lg border border-border bg-deep-space px-3 py-2 text-sm outline-none focus:border-neon-purple"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm">톤 / 분위기</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TONES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => patch({ tone: t.value })}
              className={cn(
                'rounded-lg border px-3 py-3 text-left text-sm transition',
                value.tone === t.value
                  ? 'border-neon-purple bg-neon-purple/15 text-neon-purple'
                  : 'border-border bg-space-gray/40 text-muted-foreground hover:text-foreground',
              )}
            >
              <div className="font-medium">{t.label}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground/80">{t.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm">길이</label>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => patch({ duration_sec: d })}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm transition',
                value.duration_sec === d
                  ? 'border-neon-purple bg-neon-purple/15 text-neon-purple'
                  : 'border-border bg-space-gray/40 text-muted-foreground hover:text-foreground',
              )}
            >
              {d}초
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
