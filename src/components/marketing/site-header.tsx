import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MoreMenu } from './more-menu'

const NAV = [
  { href: '/dashboard', label: '대시보드' },
  { href: '/create', label: '영상 만들기' },
  { href: '/templates', label: '템플릿' },
  { href: '/my-videos', label: '내 영상' },
  { href: '/pricing', label: '요금제' },
] as const

export async function SiteHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let credits: number | null = null
  let avatarUrl: string | null = null
  let displayName = ''
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits, avatar_url, display_name')
      .eq('id', user.id)
      .maybeSingle()
    credits = profile?.credits ?? null
    avatarUrl =
      profile?.avatar_url ??
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.picture as string | undefined) ??
      null
    displayName = profile?.display_name ?? (user.email ?? '')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-deep-space/70 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg tracking-wide">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue text-white shadow-[0_0_16px_rgba(139,92,246,0.45)]">
            <Sparkles className="size-4" />
          </span>
          Premium AI Studio
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden items-center gap-1 rounded-full border border-neon-purple/40 bg-neon-purple/10 px-3 py-1 text-xs text-neon-purple sm:inline-flex">
                <Sparkles className="size-3" />
                {credits ?? 0} 크레딧
              </span>
              <Link
                href="/mypage"
                aria-label="마이페이지"
                className="relative size-9 overflow-hidden rounded-full border border-border-strong bg-surface transition hover:ring-2 hover:ring-neon-purple/40"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName || '프로필'}
                    width={36}
                    height={36}
                    className="size-9 object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="flex size-9 items-center justify-center text-muted-foreground">
                    <User className="size-4" />
                  </span>
                )}
              </Link>
              <MoreMenu />
            </>
          ) : (
            <>
              <Link href="/auth" className="text-sm text-muted-foreground hover:text-foreground">
                로그인
              </Link>
              <Link
                href="/auth"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-4 text-sm font-medium text-white transition hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]"
              >
                무료로 시작하기
                <ArrowRight className="size-4" />
              </Link>
              <MoreMenu />
            </>
          )}
        </div>
      </div>
    </header>
  )
}
