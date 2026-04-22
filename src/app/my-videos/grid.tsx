'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Download, Play, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type VideoJobType =
  | 'selfie'
  | 'product'
  | 'text2video'
  | 'commercial_ad'
  | 'scene_reenact'
  | 'trend_clone'
  | 'ai_news'

export type VideoCard = {
  id: string
  type: VideoJobType
  status: 'completed' | 'processing' | 'pending' | 'failed' | 'cancelled'
  duration: string
  title: string
  createdAt: string
  thumbnail: string | null
  accent: string
}

const FILTERS: Array<{ id: 'all' | VideoJobType; label: string }> = [
  { id: 'all',           label: '전체' },
  { id: 'commercial_ad', label: '상업 광고' },
  { id: 'scene_reenact', label: '명장면 재연' },
  { id: 'trend_clone',   label: '트렌드 복제' },
  { id: 'ai_news',       label: 'AI 뉴스' },
  { id: 'selfie',        label: '셀피 (legacy)' },
  { id: 'product',       label: '제품 (legacy)' },
  { id: 'text2video',    label: '텍스트 (legacy)' },
]

const TYPE_LABEL: Record<VideoJobType, string> = {
  selfie: '셀피',
  product: '제품',
  text2video: '텍스트',
  commercial_ad: '상업 광고',
  scene_reenact: '명장면',
  trend_clone: '트렌드',
  ai_news: 'AI 뉴스',
}

const TYPE_ACCENT: Record<VideoJobType, string> = {
  selfie:        'border-neon-purple/40 bg-neon-purple/15 text-neon-purple',
  product:       'border-neon-blue/40 bg-neon-blue/15 text-neon-blue',
  text2video:    'border-neon-cyan/40 bg-neon-cyan/15 text-neon-cyan',
  commercial_ad: 'border-neon-purple/40 bg-neon-purple/15 text-neon-purple',
  scene_reenact: 'border-neon-blue/40 bg-neon-blue/15 text-neon-blue',
  trend_clone:   'border-neon-cyan/40 bg-neon-cyan/15 text-neon-cyan',
  ai_news:       'border-neon-pink/40 bg-neon-pink/15 text-neon-pink',
}

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function MyVideosGrid({ videos }: { videos: VideoCard[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')

  const visible = useMemo(
    () => (filter === 'all' ? videos : videos.filter((v) => v.type === filter)),
    [filter, videos],
  )

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-14">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">내 영상</h1>
          <p className="mt-2 text-muted-foreground">
            지금까지 만든{' '}
            <span className="text-foreground">{videos.length}개</span>의 영상
          </p>
        </div>
        <Link
          href="/create"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-5 text-sm font-medium text-white transition hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]"
        >
          새 영상 만들기
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm transition',
              filter === f.id
                ? 'border-neon-purple bg-neon-purple/15 text-neon-purple'
                : 'border-border bg-space-gray/60 text-muted-foreground hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="mt-24 rounded-2xl border border-border bg-space-gray/60 p-10 text-center">
          <p className="text-muted-foreground">
            {videos.length === 0
              ? '아직 만든 영상이 없어요'
              : '해당 조건의 영상이 없어요'}
          </p>
          {videos.length === 0 ? (
            <Link
              href="/create"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-5 text-sm text-white transition hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]"
            >
              첫 영상 만들기
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {visible.map((v) => (
            <article
              key={v.id}
              className="group overflow-hidden rounded-2xl border border-border bg-space-gray/60 transition hover:border-border-strong"
            >
              <Link href={`/result/${v.id}`} className="relative block aspect-[9/16] overflow-hidden">
                <div aria-hidden className={`absolute inset-0 bg-gradient-to-br ${v.accent}`} />
                <span
                  className={cn(
                    'absolute left-3 top-3 rounded-full border px-2 py-0.5 text-[10px]',
                    TYPE_ACCENT[v.type],
                  )}
                >
                  {TYPE_LABEL[v.type]}
                </span>
                <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs">
                  {v.duration}
                </span>
                {v.status === 'processing' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
                    생성 중...
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="inline-flex size-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                      <Play className="size-6 text-white" />
                    </span>
                  </div>
                )}
              </Link>
              <div className="p-4">
                <h3 className="truncate text-base">{v.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dateFormatter.format(new Date(v.createdAt))}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={`/result/${v.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-strong bg-space-gray/80 px-3 py-2 text-xs text-foreground transition hover:bg-metal-gray"
                  >
                    <Download className="size-3.5" />
                    다운로드
                  </Link>
                  <button
                    type="button"
                    aria-label="공유"
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-border-strong bg-space-gray/80 text-foreground transition hover:bg-metal-gray"
                  >
                    <Share2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
