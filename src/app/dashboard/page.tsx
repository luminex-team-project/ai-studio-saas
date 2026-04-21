import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Camera, Package, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from './sign-out'

export const dynamic = 'force-dynamic'

const VIDEO_ACCENTS = [
  'from-neon-purple/35 to-neon-pink/15',
  'from-neon-blue/35 to-neon-cyan/15',
  'from-neon-cyan/35 to-neon-purple/15',
]

const TEMPLATE_ACCENTS = [
  'from-neon-purple/30 to-neon-pink/10',
  'from-neon-blue/30 to-neon-cyan/10',
  'from-neon-cyan/30 to-neon-purple/10',
  'from-neon-pink/30 to-neon-blue/10',
]

const relativeTime = new Intl.RelativeTimeFormat('ko', { numeric: 'auto' })

function timeAgo(iso: string) {
  const then = new Date(iso).getTime()
  const diffMs = then - Date.now()
  const absHours = Math.abs(diffMs / 3_600_000)
  if (absHours < 1) return relativeTime.format(Math.round(diffMs / 60_000), 'minute')
  if (absHours < 24) return relativeTime.format(Math.round(diffMs / 3_600_000), 'hour')
  return relativeTime.format(Math.round(diffMs / 86_400_000), 'day')
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/dashboard')

  const [{ data: profile }, { data: recentRows }, { data: trendingRows }] = await Promise.all([
    supabase.from('profiles').select('display_name, credits').eq('id', user.id).maybeSingle(),
    supabase
      .from('video_jobs')
      .select('id, type, status, duration_seconds, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('templates')
      .select('id, name, trending')
      .eq('trending', true)
      .order('uses_count', { ascending: false })
      .limit(4),
  ])

  const displayName = profile?.display_name ?? user.email ?? '크리에이터'

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-14">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">환영합니다 👋</h1>
          <p className="mt-2 text-muted-foreground">
            {displayName}님, 오늘도 멋진 영상을 만들어보세요
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1 rounded-full border border-neon-purple/40 bg-neon-purple/10 px-3 py-1 text-sm text-neon-purple sm:inline-flex">
            <Sparkles className="size-3.5" />
            {profile?.credits ?? 0} 크레딧
          </span>
          <SignOutButton />
        </div>
      </div>

      <section className="mt-12">
        <h2 className="mb-6 text-xl">빠른 시작</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <QuickStartCard
            href="/create/selfie"
            icon={Camera}
            badge={{ label: '인기', color: 'neon-purple' }}
            accent="from-neon-purple to-neon-pink"
            title="내 사진으로 영상 만들기"
            desc="전신 사진 한 장으로 트렌디한 숏폼 영상 생성"
          />
          <QuickStartCard
            href="/create/product"
            icon={Package}
            badge={{ label: '프리미엄', color: 'neon-blue' }}
            accent="from-neon-blue to-neon-cyan"
            title="제품 홍보 영상 만들기"
            desc="AI 모델과 함께하는 전문 제품 홍보 영상"
          />
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl">최근 영상</h2>
          <Link href="/my-videos" className="text-sm text-neon-purple hover:underline">
            전체 보기 →
          </Link>
        </div>
        {recentRows && recentRows.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentRows.map((v, i) => (
              <Link
                key={v.id}
                href={`/result/${v.id}`}
                className="group overflow-hidden rounded-2xl border border-border bg-space-gray/60 transition hover:border-border-strong"
              >
                <div className="relative aspect-[9/16]">
                  <div
                    aria-hidden
                    className={`absolute inset-0 bg-gradient-to-br ${VIDEO_ACCENTS[i % VIDEO_ACCENTS.length]}`}
                  />
                  {v.status === 'processing' || v.status === 'pending' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <span className="size-8 animate-spin rounded-full border-2 border-neon-purple border-t-transparent" />
                      <p className="text-sm text-muted-foreground">생성 중...</p>
                    </div>
                  ) : null}
                  <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs">
                    {v.duration_seconds ? `${v.duration_seconds}s` : '—'}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="truncate text-base">
                    {v.type === 'selfie' ? '셀피 영상' : '제품 홍보 영상'}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {timeAgo(v.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-space-gray/60 p-10 text-center">
            <p className="text-muted-foreground">아직 만든 영상이 없어요</p>
            <Link
              href="/create"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-5 text-sm text-white transition hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]"
            >
              첫 영상 만들기
            </Link>
          </div>
        )}
      </section>

      <section className="mt-14">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl">트렌딩 템플릿</h2>
          <Link href="/templates" className="text-sm text-neon-purple hover:underline">
            모두 보기 →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(trendingRows ?? []).map((t, i) => (
            <Link
              key={t.id}
              href="/templates"
              className="group relative aspect-[9/16] overflow-hidden rounded-2xl border border-border bg-space-gray/60 transition hover:border-border-strong"
            >
              <div
                aria-hidden
                className={`absolute inset-0 bg-gradient-to-br ${TEMPLATE_ACCENTS[i % TEMPLATE_ACCENTS.length]}`}
              />
              <div className="relative flex h-full flex-col justify-end p-4">
                <span className="inline-flex w-fit items-center gap-1 rounded-full border border-neon-purple/40 bg-neon-purple/10 px-2 py-0.5 text-[10px] text-neon-purple">
                  <Sparkles className="size-3" />
                  트렌딩
                </span>
                <p className="mt-2 text-sm">{t.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function QuickStartCard({
  href,
  icon: Icon,
  badge,
  accent,
  title,
  desc,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge: { label: string; color: 'neon-purple' | 'neon-blue' }
  accent: string
  title: string
  desc: string
}) {
  const badgeClass =
    badge.color === 'neon-purple'
      ? 'bg-neon-purple/10 text-neon-purple border-neon-purple/30'
      : 'bg-neon-blue/10 text-neon-blue border-neon-blue/30'
  const arrowClass =
    badge.color === 'neon-purple' ? 'text-neon-purple' : 'text-neon-blue'
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-border bg-space-gray/60 p-7 transition hover:bg-metal-gray"
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-10 transition group-hover:opacity-20`}
      />
      <div className="relative flex items-center justify-between">
        <span
          className={`inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-[0_0_16px_rgba(139,92,246,0.35)]`}
        >
          <Icon className="size-6" />
        </span>
        <span className={`rounded-full border px-3 py-1 text-xs ${badgeClass}`}>
          {badge.label}
        </span>
      </div>
      <h3 className="relative mt-6 text-2xl">{title}</h3>
      <p className="relative mt-2 text-muted-foreground">{desc}</p>
      <div className={`relative mt-5 flex items-center gap-2 text-sm ${arrowClass}`}>
        시작하기
        <ArrowRight className="size-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
  )
}
