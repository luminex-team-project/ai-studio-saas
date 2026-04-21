'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const [pending, setPending] = useState(false)
  async function handle() {
    setPending(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }
  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      className="inline-flex h-9 items-center rounded-full border border-border-strong bg-surface/60 px-4 text-sm text-foreground transition hover:bg-surface-elevated disabled:opacity-60"
    >
      {pending ? '로그아웃 중...' : '로그아웃'}
    </button>
  )
}
