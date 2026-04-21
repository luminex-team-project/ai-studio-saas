import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './profile-form'
import { SignOutAllButton } from './signout-all-button'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/settings')

  const initialNickname =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    '사용자'

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
      <div>
        <h1 className="font-display text-4xl">설정</h1>
        <p className="mt-3 text-xl text-muted-foreground">
          계정 및 환경 설정을 관리하세요
        </p>
      </div>

      <section className="mt-10 rounded-2xl border border-border bg-space-gray/60 p-6">
        <h2 className="text-2xl">프로필</h2>
        <ProfileForm email={user.email ?? ''} initialNickname={initialNickname} />
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-space-gray/60 p-6">
        <h2 className="text-2xl">보안</h2>
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm">모든 기기에서 로그아웃</p>
            <p className="mt-1 text-xs text-muted-foreground">
              다른 브라우저·모바일 세션까지 전부 종료합니다. 비밀번호 변경이나 분실한 기기
              탈취가 의심될 때 사용하세요.
            </p>
          </div>
          <SignOutAllButton />
        </div>
      </section>
    </div>
  )
}
