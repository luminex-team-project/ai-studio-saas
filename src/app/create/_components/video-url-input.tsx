'use client'

import { useMemo, useState } from 'react'
import { Link2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const URL_PATTERNS = [
  { name: 'TikTok', regex: /^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\//i },
  { name: 'Instagram Reels', regex: /^https?:\/\/(www\.)?instagram\.com\/(reel|reels|p)\//i },
  { name: 'YouTube Shorts', regex: /^https?:\/\/(www\.)?(youtube\.com\/shorts\/|youtu\.be\/)/i },
  { name: 'YouTube', regex: /^https?:\/\/(www\.)?(youtube\.com\/watch|youtu\.be\/)/i },
] as const

export type VideoUrlValidation = {
  url: string
  platform: string | null
  valid: boolean
}

export function VideoURLInput({
  value,
  onChange,
  placeholder = 'https://www.tiktok.com/@user/video/...',
}: {
  value: string
  onChange: (v: VideoUrlValidation) => void
  placeholder?: string
}) {
  const [local, setLocal] = useState(value)

  const validation = useMemo<VideoUrlValidation>(() => {
    const trimmed = local.trim()
    if (!trimmed) return { url: '', platform: null, valid: false }
    const match = URL_PATTERNS.find((p) => p.regex.test(trimmed))
    return {
      url: trimmed,
      platform: match?.name ?? null,
      valid: Boolean(match),
    }
  }, [local])

  return (
    <div>
      <label className="mb-2 block text-sm">트렌드 영상 URL</label>
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border bg-space-gray/50 px-4 py-3 transition',
          validation.url
            ? validation.valid
              ? 'border-neon-cyan/60 shadow-[0_0_16px_rgba(6,182,212,0.15)]'
              : 'border-red-400/50'
            : 'border-border',
        )}
      >
        <Link2 className="size-5 shrink-0 text-muted-foreground" />
        <input
          type="url"
          value={local}
          onChange={(e) => {
            setLocal(e.target.value)
            const trimmed = e.target.value.trim()
            const match = URL_PATTERNS.find((p) => p.regex.test(trimmed))
            onChange({ url: trimmed, platform: match?.name ?? null, valid: Boolean(match) })
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
        />
        {validation.url ? (
          validation.valid ? (
            <span className="inline-flex items-center gap-1 text-xs text-neon-cyan">
              <CheckCircle2 className="size-4" /> {validation.platform}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-red-300">
              <AlertCircle className="size-4" /> 지원 안 됨
            </span>
          )
        ) : null}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        TikTok · Instagram Reels · YouTube Shorts 링크만 지원합니다.
      </p>
    </div>
  )
}
