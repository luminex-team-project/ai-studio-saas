import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { confirmTossPayment } from '@/lib/payments/toss'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{
    paymentKey?: string
    orderId?: string
    amount?: string
  }>
}

export default async function TossSuccessPage({ searchParams }: PageProps) {
  const { paymentKey, orderId, amount } = await searchParams

  if (!paymentKey || !orderId || !amount) {
    return <FailureView title="잘못된 결제 요청이에요" message="필수 파라미터가 누락됐습니다." />
  }

  const amountNum = Number(amount)
  if (!Number.isFinite(amountNum)) {
    return <FailureView title="잘못된 결제 금액" message={`amount=${amount}`} />
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return <FailureView title="로그인이 필요해요" message="다시 로그인하고 시도해주세요." />
  }

  // The orderId we passed Toss is the transactions.id. Validate ownership
  // and that the stored amount matches what Toss echoed back.
  const { data: tx } = await supabase
    .from('transactions')
    .select('id, user_id, amount_krw, credits_delta, status, plan, expires_at')
    .eq('id', orderId)
    .maybeSingle()

  if (!tx || tx.user_id !== user.id) {
    return <FailureView title="결제 기록을 찾을 수 없어요" message="잠시 후 다시 시도해주세요." />
  }
  if (tx.amount_krw !== amountNum) {
    return (
      <FailureView
        title="결제 금액이 일치하지 않아요"
        message={`요청 금액(${tx.amount_krw}원)과 실제 결제액(${amountNum}원)이 다릅니다.`}
      />
    )
  }

  // If already confirmed (e.g. page refresh), skip straight to the success UI.
  if (tx.status === 'succeeded') {
    return <SuccessView credits={tx.credits_delta} planLabel={tx.plan} />
  }

  const confirmation = await confirmTossPayment({
    paymentKey,
    orderId,
    amount: amountNum,
  })

  if (!confirmation.ok) {
    const admin = createAdminClient()
    await admin.rpc('fail_purchase', {
      p_transaction_id: tx.id,
      p_note: `[toss] ${confirmation.error}`,
    })
    return (
      <FailureView
        title="결제 승인에 실패했어요"
        message={confirmation.error}
      />
    )
  }

  const admin = createAdminClient()
  const { error: rpcErr } = await admin.rpc('confirm_purchase', {
    p_transaction_id: tx.id,
    p_provider_reference: confirmation.data.paymentKey,
    p_expires_at: tx.expires_at ?? undefined,
  })
  if (rpcErr) {
    return (
      <FailureView
        title="크레딧 적립 중 오류가 발생했어요"
        message={rpcErr.message}
      />
    )
  }

  return <SuccessView credits={tx.credits_delta} planLabel={tx.plan} />
}

function SuccessView({ credits, planLabel }: { credits: number; planLabel: string | null }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-purple to-neon-blue text-white shadow-[0_0_32px_rgba(139,92,246,0.55)]">
        <Check className="size-7" />
      </span>
      <h1 className="mt-8 font-display text-4xl">결제 완료!</h1>
      <p className="mt-3 text-xl text-muted-foreground">
        {planLabel ?? ''} 플랜의 <span className="text-neon-purple">{credits} 크레딧</span>이
        지금 지갑에 들어왔어요.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/create"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-7 text-sm font-medium text-white transition hover:shadow-[0_0_24px_rgba(139,92,246,0.5)]"
        >
          <Sparkles className="size-4" />
          지금 영상 만들기
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

function FailureView({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-red-500/70 text-white shadow-[0_0_32px_rgba(239,68,68,0.45)]">
        !
      </span>
      <h1 className="mt-8 font-display text-4xl">{title}</h1>
      <p className="mt-3 text-base text-muted-foreground">{message}</p>
      <Link
        href="/pricing"
        className="mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-7 text-sm font-medium text-white transition hover:shadow-[0_0_24px_rgba(139,92,246,0.5)]"
      >
        요금제로 돌아가기
      </Link>
    </div>
  )
}
