'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

// Two-stage confirmation: open modal → user must type their email exactly
// before the destructive button unlocks. Matches common SaaS patterns (GitHub,
// Stripe) to avoid accidental deletion.

export function DeleteAccountButton({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canDelete = confirmText.trim() === email && !pending

  async function handle() {
    if (!canDelete) return
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'POST' })
      const payload = (await res.json()) as { ok: boolean; error?: string }
      if (!payload.ok) throw new Error(payload.error ?? 'delete_failed')
      // Account is gone. Cookies were cleared server-side; bounce to the
      // landing page.
      window.location.href = '/'
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown_error')
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-5 text-sm text-red-200 transition hover:bg-red-500/20"
      >
        <Trash2 className="size-4" />
        계정 삭제
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget && !pending) setOpen(false)
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-deep-space p-6 shadow-xl">
            <h2 id="delete-account-title" className="font-display text-2xl text-red-200">
              정말 계정을 삭제하시겠어요?
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              삭제되는 항목: 프로필, 크레딧 잔액, 모든 영상 작업·결과물, 업로드한 파일, 결제 이력.
              이 작업은 되돌릴 수 없습니다.
            </p>

            <label className="mt-6 block text-sm text-muted-foreground">
              확인을 위해 가입한 이메일을 입력해주세요
            </label>
            <p className="mt-1 break-all text-xs text-foreground/80">{email}</p>
            <input
              type="text"
              autoComplete="off"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={email}
              className="mt-2 w-full rounded-xl border border-border bg-space-gray/80 px-4 py-3 text-sm outline-none transition focus:border-red-500/60 focus:ring-2 focus:ring-red-500/30"
            />

            {error ? (
              <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="inline-flex h-11 items-center rounded-xl border border-border-strong bg-space-gray/60 px-5 text-sm transition hover:bg-metal-gray disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handle}
                disabled={!canDelete}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="size-4" />
                {pending ? '삭제 중...' : '영구 삭제'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
