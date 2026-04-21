'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { MoreVertical, BookOpen, Mail } from 'lucide-react'

// Top-right "more" dropdown. Two static items only:
//   - Documentation → /guide
//   - Contact Support → mailto:support@luminexofficial.net
//
// Kept small intentionally. Anything richer (account menu, notifications,
// theme toggle) belongs in its own component.

const SUPPORT_EMAIL = 'support@luminexofficial.net'

export function MoreMenu() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="더보기"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-9 items-center justify-center rounded-full border border-border-strong bg-surface/60 text-foreground transition hover:bg-surface-elevated"
      >
        <MoreVertical className="size-4" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-11 w-56 overflow-hidden rounded-xl border border-border bg-deep-space shadow-xl"
        >
          <Link
            href="/guide"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-metal-gray"
          >
            <BookOpen className="size-4 text-neon-purple" />
            <div>
              <p>도움말</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Documentation</p>
            </div>
          </Link>

          <div className="h-px bg-border" aria-hidden />

          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('[Premium AI Studio] 문의')}`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-metal-gray"
          >
            <Mail className="size-4 text-neon-cyan" />
            <div>
              <p>문의</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Contact Support</p>
            </div>
          </a>
        </div>
      ) : null}
    </div>
  )
}
