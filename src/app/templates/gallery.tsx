'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Flame, Heart, Play, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TemplateCard = {
  id: string
  slug: string
  name: string
  category: string
  trending: boolean
  likes: number
  uses: number
  accent: string
  previewVideoUrl: string | null
  thumbnailUrl: string | null
}

const CATEGORIES = ['전체', '트렌드', '댄스', '패션', '제품', '일상', '챌린지'] as const

const formatter = new Intl.NumberFormat('ko-KR')

export function TemplatesGallery({ templates }: { templates: TemplateCard[] }) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('전체')

  const visible = useMemo(
    () =>
      category === '전체'
        ? templates
        : templates.filter((t) => t.category === category),
    [category, templates],
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-14">
      <div className="flex flex-col items-start gap-3">
        <h1 className="font-display text-5xl">템플릿 갤러리</h1>
        <p className="text-xl text-muted-foreground">
          트렌디한 템플릿으로 바로 시작하세요
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm transition',
              category === c
                ? 'border-neon-purple bg-neon-purple/15 text-neon-purple'
                : 'border-border bg-space-gray/60 text-muted-foreground hover:text-foreground',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {visible.map((t) => (
          <Link
            key={t.id}
            href={`/create/selfie?template=${t.slug}`}
            className="group relative aspect-[9/16] overflow-hidden rounded-2xl border border-border bg-space-gray/60 transition hover:border-border-strong"
          >
            {t.previewVideoUrl ? (
              <video
                src={t.previewVideoUrl}
                poster={t.thumbnailUrl ?? undefined}
                muted
                playsInline
                loop
                preload="metadata"
                onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})}
                onMouseLeave={(e) => {
                  e.currentTarget.pause()
                  e.currentTarget.currentTime = 0
                }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div aria-hidden className={`absolute inset-0 bg-gradient-to-br ${t.accent}`} />
            )}

            {t.trending ? (
              <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full border border-neon-pink/40 bg-neon-pink/15 px-2 py-1 text-xs text-neon-pink">
                <Flame className="size-3" />
                트렌딩
              </span>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-xs text-muted-foreground">{t.category}</p>
              <p className="mt-1 text-base text-white">{t.name}</p>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Heart className="size-3" />
                  {formatter.format(t.likes)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Play className="size-3" />
                  {formatter.format(t.uses)}
                </span>
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue px-6 py-3 text-sm text-white shadow-[0_0_24px_rgba(139,92,246,0.5)] transition-transform group-hover:scale-105">
                <Sparkles className="size-4" />이 템플릿 사용하기
              </span>
            </div>
          </Link>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-20 text-center text-muted-foreground">
          해당 카테고리의 템플릿이 아직 없어요
        </p>
      ) : null}
    </div>
  )
}
