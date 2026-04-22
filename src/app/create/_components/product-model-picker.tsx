'use client'

import Image from 'next/image'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ProductModelOption = {
  id: string
  slug: string
  display_name: string
  age_label: string
  persona: string
  best_for: string[]
  front_image_url: string | null
}

export function ProductModelPicker({
  models,
  value,
  onChange,
}: {
  models: ProductModelOption[]
  value: string | null
  onChange: (modelId: string) => void
}) {
  if (models.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        등록된 AI 모델이 없습니다. 관리자가 등록한 뒤 다시 시도해주세요.
      </div>
    )
  }
  return (
    <div>
      <h3 className="text-lg">AI 모델 선택</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        고정 페르소나 3명. 시리즈 전체에서 동일한 얼굴 유지.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {models.map((m) => {
          const selected = value === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={cn(
                'group relative overflow-hidden rounded-2xl border bg-space-gray/60 text-left transition',
                selected
                  ? 'border-neon-purple shadow-[0_0_24px_rgba(139,92,246,0.3)]'
                  : 'border-border hover:border-border-strong',
              )}
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-deep-space">
                {m.front_image_url ? (
                  <Image
                    src={m.front_image_url}
                    alt={m.display_name}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-space-gray to-deep-space text-xs text-muted-foreground">
                    레퍼런스 이미지 대기 중
                  </div>
                )}
                {selected ? (
                  <span className="absolute right-3 top-3 inline-flex size-7 items-center justify-center rounded-full bg-neon-purple text-white">
                    <Check className="size-4" />
                  </span>
                ) : null}
              </div>
              <div className="p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg">{m.display_name}</span>
                  <span className="text-xs text-muted-foreground">{m.age_label}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{m.persona}</p>
                <ul className="mt-3 space-y-0.5">
                  {m.best_for.slice(0, 2).map((b) => (
                    <li key={b} className="text-[11px] text-muted-foreground/80">
                      · {b}
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
