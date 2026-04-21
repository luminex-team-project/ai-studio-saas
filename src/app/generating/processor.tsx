'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { VideoJobStatus } from '@/lib/supabase/types'

const STAGES = [
  { at: 20, label: '사진 분석 중' },
  { at: 40, label: 'AI 모델 적용 중' },
  { at: 60, label: '모션 생성 중' },
  { at: 80, label: '최종 렌더링 중' },
] as const

export function Processor({
  jobId,
  initialStatus,
  initialProgress,
  credits,
}: {
  jobId: string
  initialStatus: VideoJobStatus
  initialProgress: number
  credits: number
}) {
  const router = useRouter()
  const [status, setStatus] = useState<VideoJobStatus>(initialStatus)
  const [progress, setProgress] = useState(initialProgress || 5)
  const [error, setError] = useState<string | null>(null)
  const kickedRef = useRef(false)

  // Kick the worker once on mount if the job is still pending.
  useEffect(() => {
    if (kickedRef.current) return
    kickedRef.current = true
    if (initialStatus !== 'pending') return
    ;(async () => {
      try {
        const res = await fetch(`/api/worker/process/${jobId}`, { method: 'POST' })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(body.error ?? `worker responded ${res.status}`)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'worker_unreachable')
      }
    })()
  }, [jobId, initialStatus])

  // Subscribe to Realtime updates on this job row.
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`job:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const row = payload.new as {
            status: VideoJobStatus
            progress: number
            error_message: string | null
          }
          setStatus(row.status)
          setProgress(row.progress)
          if (row.status === 'failed' && row.error_message) {
            setError(row.error_message)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [jobId])

  // Navigate to result when complete.
  useEffect(() => {
    if (status !== 'completed') return
    const t = setTimeout(() => router.push(`/result/${jobId}`), 600)
    return () => clearTimeout(t)
  }, [status, jobId, router])

  const failed = status === 'failed'

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <span
        className={cn(
          'inline-flex size-16 items-center justify-center rounded-2xl text-white',
          failed
            ? 'bg-red-500/70 shadow-[0_0_32px_rgba(239,68,68,0.45)]'
            : 'bg-gradient-to-br from-neon-purple to-neon-blue shadow-[0_0_32px_rgba(139,92,246,0.55)]',
        )}
      >
        <Sparkles className="size-7" />
      </span>
      <h1 className="mt-8 font-display text-4xl">
        {failed ? '생성에 실패했어요' : 'AI가 영상을 생성하고 있어요'}
      </h1>
      <p className="mt-3 text-xl text-muted-foreground">
        {failed
          ? '크레딧은 자동으로 환불되었습니다. 다시 시도해주세요.'
          : '잠시만 기다려주세요. 약 60초 정도 소요됩니다.'}
      </p>

      {!failed ? (
        <div className="mt-10 w-full max-w-md">
          <div className="h-2 overflow-hidden rounded-full bg-space-gray">
            <div
              className="h-full rounded-full bg-gradient-to-r from-neon-purple via-neon-blue to-neon-cyan transition-[width] duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{Math.round(progress)}%</p>
        </div>
      ) : null}

      {!failed ? (
        <div className="mt-10 w-full max-w-md rounded-2xl border border-border bg-space-gray/60 p-6 text-left">
          <h3 className="mb-4 text-center text-sm text-muted-foreground">처리 중...</h3>
          <ul className="space-y-3">
            {STAGES.map((s) => {
              const completed = progress > s.at
              const active = progress > s.at - 20 && !completed
              return (
                <li key={s.label} className="flex items-center gap-3 text-sm">
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full border transition',
                      completed &&
                        'border-neon-purple bg-neon-purple/20 text-neon-purple',
                      active && 'border-neon-blue text-neon-blue',
                      !completed && !active && 'border-border text-muted-foreground',
                    )}
                  >
                    {completed ? (
                      <Check className="size-3.5" />
                    ) : active ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <span
                    className={cn(
                      completed && 'text-foreground',
                      !completed && !active && 'text-muted-foreground',
                    )}
                  >
                    {s.label}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p className="mt-8 max-w-md rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <p className="mt-8 text-xs text-muted-foreground">크레딧 {credits}개 사용 중</p>
    </div>
  )
}
