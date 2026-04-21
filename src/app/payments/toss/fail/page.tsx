import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{
    code?: string
    message?: string
    orderId?: string
  }>
}

export default async function TossFailPage({ searchParams }: PageProps) {
  const { code, message, orderId } = await searchParams

  // Best-effort: mark the pending transaction as failed so the ledger matches.
  if (orderId) {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: tx } = await supabase
          .from('transactions')
          .select('id, user_id, status')
          .eq('id', orderId)
          .maybeSingle()
        if (tx && tx.user_id === user.id && tx.status === 'pending') {
          const admin = createAdminClient()
          await admin.rpc('fail_purchase', {
            p_transaction_id: tx.id,
            p_note: `[toss] ${code ?? ''} ${message ?? ''}`.trim(),
          })
        }
      }
    } catch {
      // Log markdown failure silently; user-facing UI still renders.
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-red-500/70 text-white shadow-[0_0_32px_rgba(239,68,68,0.45)]">
        !
      </span>
      <h1 className="mt-8 font-display text-4xl">결제가 취소됐어요</h1>
      <p className="mt-3 text-base text-muted-foreground">
        {message ?? '결제 도중 문제가 발생했습니다. 다시 시도해주세요.'}
      </p>
      {code ? (
        <p className="mt-1 text-xs text-muted-foreground">코드: {code}</p>
      ) : null}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/pricing"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-7 text-sm font-medium text-white transition hover:shadow-[0_0_24px_rgba(139,92,246,0.5)]"
        >
          다시 시도하기
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-12 items-center gap-2 rounded-full border border-border-strong bg-space-gray/60 px-7 text-sm text-foreground transition hover:bg-metal-gray"
        >
          대시보드로 이동
        </Link>
      </div>
    </div>
  )
}
