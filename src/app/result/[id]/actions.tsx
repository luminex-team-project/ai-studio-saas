'use client'

import { useState } from 'react'
import { Check, Copy, Download } from 'lucide-react'

export function ResultActions({
  mode,
  shareUrl,
  videoUrl,
  thumbUrl,
}: {
  mode: 'download' | 'share'
  shareUrl?: string
  videoUrl?: string | null
  thumbUrl?: string | null
}) {
  if (mode === 'download') {
    return <DownloadButtons videoUrl={videoUrl ?? null} thumbUrl={thumbUrl ?? null} />
  }
  return <ShareButtons shareUrl={shareUrl ?? ''} />
}

function DownloadButtons({
  videoUrl,
  thumbUrl,
}: {
  videoUrl: string | null
  thumbUrl: string | null
}) {
  const primary = videoUrl ?? thumbUrl
  const primaryLabel = videoUrl ? '1080p 다운로드' : '썸네일 다운로드'

  return (
    <div className="flex flex-col gap-2">
      <a
        href={primary ?? '#'}
        download
        aria-disabled={!primary}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue px-4 text-sm font-medium text-white transition hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] data-[disabled]:opacity-60"
        data-disabled={primary ? undefined : ''}
      >
        <Download className="size-4" />
        {primaryLabel}
      </a>
      {thumbUrl && videoUrl ? (
        <a
          href={thumbUrl}
          download
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-strong bg-space-gray/80 px-4 text-sm text-foreground transition hover:bg-metal-gray"
        >
          <Download className="size-4" />
          썸네일 다운로드
        </a>
      ) : null}
    </div>
  )
}

function ShareButtons({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      const full =
        typeof window !== 'undefined'
          ? new URL(shareUrl, window.location.origin).toString()
          : shareUrl
      await navigator.clipboard.writeText(full)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt('이 링크를 복사하세요', shareUrl)
    }
  }
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-strong bg-space-gray/80 px-4 text-sm text-foreground transition hover:bg-metal-gray"
      >
        {copied ? (
          <Check className="size-4 text-neon-purple" />
        ) : (
          <Copy className="size-4" />
        )}
        {copied ? '복사됨' : '링크 복사'}
      </button>
    </div>
  )
}
