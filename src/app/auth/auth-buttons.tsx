'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type OAuthProvider = 'google' | 'kakao'

const providers: Array<{
  id: OAuthProvider
  label: string
  className: string
  icon: React.ReactNode
}> = [
  {
    id: 'google',
    label: 'Google로 계속하기',
    className: 'bg-white text-gray-700 hover:bg-white/90',
    icon: <GoogleIcon />,
  },
  {
    id: 'kakao',
    label: '카카오로 계속하기',
    className: 'bg-[#FEE500] text-[#191919] hover:brightness-95',
    icon: <KakaoIcon />,
  },
]

export function AuthProviderButtons({ next }: { next?: string }) {
  const [pending, setPending] = useState<OAuthProvider | null>(null)

  async function signIn(provider: OAuthProvider) {
    setPending(provider)
    try {
      const supabase = createClient()
      const redirectTo = new URL('/auth/callback', window.location.origin)
      if (next) redirectTo.searchParams.set('next', next)

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectTo.toString() },
      })
      if (error) throw error
    } catch (err) {
      setPending(null)
      const message = err instanceof Error ? err.message : 'unknown_error'
      window.location.href = `/auth?error=${encodeURIComponent(message)}`
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {providers.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => signIn(p.id)}
          disabled={pending !== null}
          className={cn(
            'inline-flex h-12 items-center justify-center gap-2.5 rounded-xl px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
            p.className,
          )}
        >
          {pending === p.id ? <Spinner /> : p.icon}
          {p.label}
        </button>
      ))}
    </div>
  )
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.603 4.603 0 0 1-1.996 3.018v2.51h3.227c1.887-1.737 2.987-4.296 2.987-7.35z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.895 6.613-2.422l-3.227-2.51c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.124H3.068v2.591A9.996 9.996 0 0 0 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.405 13.9a6.003 6.003 0 0 1 0-3.8V7.509H3.068a10.004 10.004 0 0 0 0 8.982L6.405 13.9z"
      />
      <path
        fill="#EA4335"
        d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.867-2.867C16.96 2.99 14.695 2 12 2 8.09 2 4.716 4.245 3.068 7.51L6.405 10.1C7.19 7.736 9.395 5.977 12 5.977z"
      />
    </svg>
  )
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M12 3C6.477 3 2 6.524 2 10.871c0 2.762 1.818 5.188 4.574 6.57l-1.17 4.274a.4.4 0 0 0 .619.43l5.093-3.355c.293.021.588.032.884.032 5.523 0 10-3.524 10-7.871C22 6.524 17.523 3 12 3z"
      />
    </svg>
  )
}
