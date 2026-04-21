'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function ProfileForm({
  email,
  initialNickname,
}: {
  email: string
  initialNickname: string
}) {
  const [nickname, setNickname] = useState(initialNickname)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = nickname.trim()
    if (!trimmed) {
      setStatus('error')
      setErrorMessage('닉네임을 입력해주세요')
      return
    }
    setStatus('saving')
    setErrorMessage(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ data: { name: trimmed } })
    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 1500)
  }

  return (
    <form onSubmit={save} className="mt-6 space-y-5">
      <div>
        <label className="mb-2 block text-sm text-muted-foreground">이메일</label>
        <input
          type="email"
          value={email}
          readOnly
          className="w-full cursor-not-allowed rounded-xl border border-border bg-space-gray/80 px-4 py-3 text-sm text-muted-foreground"
        />
      </div>

      <div>
        <label htmlFor="nickname" className="mb-2 block text-sm text-muted-foreground">
          닉네임
        </label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={40}
          className="w-full rounded-xl border border-border bg-space-gray/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/30"
        />
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-300">{errorMessage}</p>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        {status === 'saved' ? (
          <span className="inline-flex items-center gap-1 text-sm text-neon-purple">
            <Check className="size-4" />
            저장됨
          </span>
        ) : null}
        <button
          type="submit"
          disabled={status === 'saving'}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue px-6 text-sm font-medium text-white transition hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] disabled:opacity-60"
        >
          {status === 'saving' ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
