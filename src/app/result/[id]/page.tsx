import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { RotateCcw, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ResultActions } from './actions'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

const SIGNED_URL_TTL = 60 * 60 // 1h

export default async function ResultPage({ params }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { id } = await params
  if (!user) redirect(`/auth?next=/result/${id}`)

  const { data: job } = await supabase
    .from('video_jobs')
    .select(
      'id, user_id, type, status, output_video_url, output_thumbnail_url, duration_seconds, credits_cost, created_at',
    )
    .eq('id', id)
    .maybeSingle()

  if (!job || job.user_id !== user.id) notFound()
  if (job.status === 'pending' || job.status === 'processing') {
    redirect(`/generating?job=${job.id}&type=${job.type}`)
  }

  // Sign the output assets for this user + TTL.
  let videoUrl: string | null = null
  let thumbUrl: string | null = null
  if (job.output_video_url) {
    const { data } = await supabase.storage
      .from('videos')
      .createSignedUrl(job.output_video_url, SIGNED_URL_TTL)
    videoUrl = data?.signedUrl ?? null
  }
  if (job.output_thumbnail_url) {
    const { data } = await supabase.storage
      .from('thumbnails')
      .createSignedUrl(job.output_thumbnail_url, SIGNED_URL_TTL)
    thumbUrl = data?.signedUrl ?? null
  }

  const failed = job.status === 'failed' || job.status === 'cancelled'
  const retryHref =
    job.type === 'selfie'
      ? '/create/selfie'
      : job.type === 'product'
        ? '/create/product'
        : '/create/scene'

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-14">
      <div className="text-center">
        <h1 className="font-display text-4xl">
          {failed ? '생성에 실패했어요' : '영상이 완성되었어요! 🎉'}
        </h1>
        <p className="mt-3 text-xl text-muted-foreground">
          {failed ? '크레딧은 환불되었습니다. 다시 시도해주세요.' : '결과가 마음에 드시나요?'}
        </p>
      </div>

      <div className="relative mx-auto mt-10 aspect-[9/16] w-full max-w-xs overflow-hidden rounded-2xl border border-border bg-space-gray">
        {videoUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={videoUrl}
            poster={thumbUrl ?? undefined}
            controls
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt="결과 썸네일"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.35),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.3),transparent_55%)]"
            />
            <div className="relative flex h-full items-center justify-center">
              <p className="text-muted-foreground">
                {failed ? '출력 없음' : '영상 미리보기 없음'}
              </p>
            </div>
          </>
        )}
      </div>

      {!failed ? (
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Panel title="다운로드 옵션">
            <ResultActions
              mode="download"
              videoUrl={videoUrl}
              thumbUrl={thumbUrl}
            />
          </Panel>

          <Panel title="공유하기">
            <ResultActions mode="share" shareUrl={`/result/${id}`} />
          </Panel>

          <Panel title="더 만들기">
            <div className="flex flex-col gap-2">
              <Link
                href={retryHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-strong bg-space-gray/80 px-4 text-sm text-foreground transition hover:bg-metal-gray"
              >
                <RotateCcw className="size-4" />
                다시 생성하기
              </Link>
              <Link
                href="/create"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue px-4 text-sm font-medium text-white transition hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]"
              >
                <Sparkles className="size-4" />
                새 영상 만들기
              </Link>
            </div>
          </Panel>
        </div>
      ) : (
        <div className="mt-10 flex justify-center">
          <Link
            href={retryHref}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-7 text-sm font-medium text-white transition hover:shadow-[0_0_24px_rgba(139,92,246,0.5)]"
          >
            <RotateCcw className="size-4" />
            다시 시도하기
          </Link>
        </div>
      )}

      <div className="mt-10 flex items-center justify-between rounded-2xl border border-border bg-space-gray/60 px-5 py-4">
        <span className="text-sm text-muted-foreground">사용된 크레딧</span>
        <span className="text-lg text-neon-purple">{job.credits_cost}</span>
      </div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-space-gray/60 p-5">
      <h3 className="mb-4 text-base">{title}</h3>
      {children}
    </div>
  )
}
