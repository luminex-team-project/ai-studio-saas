'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'

// Calls /api/auth/signout-all which revokes all refresh tokens for this user
// (every browser / device) via `signOut({ scope: 'global' })`. After success
// we bounce to /auth so the freshly-cleared cookie takes effect on the next
// page load.

export function SignOutAllButton() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handle() {
    if (!confirm('모든 기기에서 로그아웃할까요? 다른 브라우저·모바일 세션도 모두 종료됩니다.')) {
      return
    }
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/signout-all', { method: 'POST' })
      const payload = (await res.json()) as { ok: boolean; error?: string }
      if (!payload.ok) throw new Error(payload.error ?? 'signout_failed')
      window.location.href = '/auth'
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown_error')
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handle}
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-5 text-sm text-red-200 transition hover:bg-red-500/20 disabled:opacity-60"
      >
        <LogOut className="size-4" />
        {pending ? '로그아웃 중...' : '모든 기기에서 로그아웃'}
      </button>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  )
}
