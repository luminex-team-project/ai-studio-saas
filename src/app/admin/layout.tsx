import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Shield, Users, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <header className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon-pink to-neon-purple text-white">
            <Shield className="size-5" />
          </span>
          <div>
            <h1 className="text-xl">관리자</h1>
            <p className="text-xs text-muted-foreground">Admin Console · {user.email}</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/admin/product-models"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-space-gray/60 px-4 py-2 hover:bg-metal-gray"
          >
            <Users className="size-4" /> AI 모델
          </Link>
          <Link
            href="/admin/templates"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-space-gray/60 px-4 py-2 hover:bg-metal-gray"
          >
            <Layers className="size-4" /> 프롬프트 템플릿
          </Link>
        </nav>
      </header>
      <main className="mt-8">{children}</main>
    </div>
  )
}
