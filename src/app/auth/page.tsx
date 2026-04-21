import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Sparkles, Video, Clock, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AuthProviderButtons } from './auth-buttons'

type PageProps = {
  searchParams: Promise<{ next?: string; error?: string }>
}

export default async function AuthPage({ searchParams }: PageProps) {
  const { next, error } = await searchParams

  // If already authenticated, skip the login screen entirely.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect(next ?? '/')

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-display text-lg tracking-wide"
          >
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue text-white shadow-[0_0_16px_rgba(139,92,246,0.45)]">
              <Sparkles className="size-4" />
            </span>
            Premium AI Studio
          </Link>
          <h1 className="mt-10 text-3xl">환영합니다</h1>
          <p className="mt-2 text-muted-foreground">
            소셜 로그인으로 간편하게 시작하세요
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-space-gray/60 p-6 shadow-sm">
          {error ? (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              로그인에 실패했어요. 다시 시도해주세요. ({decodeURIComponent(error)})
            </div>
          ) : null}

          <AuthProviderButtons next={next} />

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-space-gray px-4 text-muted-foreground">
                빠르고 안전한 로그인
              </span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            로그인 시{' '}
            <span className="text-neon-purple">100 크레딧</span>을 무료로 드려요
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          계속 진행하면{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
            이용약관
          </Link>
          {' '}및{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
            개인정보처리방침
          </Link>
          에 동의하게 됩니다
        </p>

        <div className="mt-10 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: Video, label: 'AI 영상 생성' },
            { icon: Clock, label: '60초 생성' },
            { icon: Layers, label: '100+ 템플릿' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-space-gray/40 px-3 py-4"
            >
              <Icon className="mx-auto size-5 text-neon-purple" />
              <p className="mt-2 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
