import Image from 'next/image'
import { redirect } from 'next/navigation'
import { User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from '@/app/dashboard/sign-out'
import { SignOutAllButton } from '@/app/settings/signout-all-button'
import { DeleteAccountButton } from './delete-account-button'

export const dynamic = 'force-dynamic'

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

export default async function MyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/mypage')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, credits, created_at, email')
    .eq('id', user.id)
    .maybeSingle()

  const avatarUrl =
    profile?.avatar_url ??
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null
  const displayName =
    profile?.display_name ??
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    '사용자'
  const email = profile?.email ?? user.email ?? ''
  const credits = profile?.credits ?? 0
  const joinedAt = profile?.created_at ? dateFormatter.format(new Date(profile.created_at)) : '—'

  const provider =
    (user.app_metadata?.provider as string | undefined) ??
    (user.identities?.[0]?.provider as string | undefined) ??
    'email'

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-14">
      <header>
        <h1 className="font-display text-4xl">마이페이지</h1>
        <p className="mt-3 text-xl text-muted-foreground">
          계정 정보와 보안 설정을 관리하세요
        </p>
      </header>

      <section className="mt-10 rounded-2xl border border-border bg-space-gray/60 p-6 sm:p-8">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-space-gray">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${displayName} 프로필 사진`}
                width={96}
                height={96}
                className="size-24 object-cover"
                unoptimized
              />
            ) : (
              <div className="flex size-24 items-center justify-center bg-gradient-to-br from-neon-purple/30 to-neon-blue/30 text-muted-foreground">
                <User className="size-10" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="truncate text-2xl">{displayName}</h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">{email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-neon-purple/40 bg-neon-purple/10 px-3 py-1 text-xs text-neon-purple">
                {credits} 크레딧
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-space-gray px-3 py-1 text-xs text-muted-foreground">
                {provider === 'google' ? 'Google 로그인' : provider === 'kakao' ? '카카오 로그인' : provider}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-space-gray px-3 py-1 text-xs text-muted-foreground">
                가입일 {joinedAt}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-space-gray/60 p-6">
          <h3 className="text-lg">로그아웃</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            이 브라우저에서만 로그아웃합니다. 다른 기기의 세션은 유지됩니다.
          </p>
          <div className="mt-5">
            <SignOutButton />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-space-gray/60 p-6">
          <h3 className="text-lg">모든 기기에서 로그아웃</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            다른 브라우저·모바일 세션을 포함해 전부 종료합니다.
          </p>
          <div className="mt-5">
            <SignOutAllButton />
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <h3 className="text-lg text-red-200">계정 삭제</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          계정과 연결된 모든 영상, 크레딧 내역, 업로드한 파일이 즉시 영구 삭제됩니다. 복구할 수 없습니다.
        </p>
        <div className="mt-5">
          <DeleteAccountButton email={email} />
        </div>
      </section>
    </div>
  )
}
