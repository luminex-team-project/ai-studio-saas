'use client'

import { Check, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PromptTemplateOption = {
  id: string
  category: string | null
  subcategory: string
  display_name: string
  description: string | null
  duration_sec: number
  recommended_model_slugs: string[]
  caption_template: string | null
}

export function PromptTemplatePicker({
  templates,
  value,
  onChange,
  emptyLabel = '등록된 템플릿이 없습니다.',
}: {
  templates: PromptTemplateOption[]
  value: string | null
  onChange: (templateId: string) => void
  emptyLabel?: string
}) {
  if (templates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {templates.map((t) => {
        const selected = value === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              'group relative flex flex-col rounded-xl border bg-space-gray/40 p-4 text-left transition',
              selected
                ? 'border-neon-purple shadow-[0_0_18px_rgba(139,92,246,0.25)]'
                : 'border-border hover:border-border-strong',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-foreground">{t.display_name}</div>
                {t.description ? (
                  <div className="mt-1 text-xs text-muted-foreground">{t.description}</div>
                ) : null}
              </div>
              {selected ? (
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-neon-purple text-white">
                  <Check className="size-3.5" />
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" /> {t.duration_sec}초
              </span>
              {t.category ? (
                <span className="rounded-full bg-deep-space px-2 py-0.5">{t.category}</span>
              ) : null}
              {t.recommended_model_slugs.length > 0 ? (
                <span className="text-muted-foreground/70">
                  추천: {t.recommended_model_slugs.join(', ')}
                </span>
              ) : null}
            </div>
          </button>
        )
      })}
    </div>
  )
}
