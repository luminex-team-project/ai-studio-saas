'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Star,
  Wand2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { createProductJob } from '../_actions/create-job'
import { StepIndicator } from '../_components/step-indicator'
import { PhotoDrop, type DroppedPhoto } from '../_components/photo-drop'

type Stage = 'upload' | 'model' | 'scenario'

export type ModelOption = {
  id: string
  name: string
  style: string
  age: string
  popular: boolean
  accent: string
}

type Scenario = {
  id: string
  name: string
  desc: string
  icon: LucideIcon
}

const SCENARIOS: Scenario[] = [
  { id: 'unboxing',      name: '언박싱',      desc: '제품을 처음 개봉하는 설렘을 전달', icon: Package },
  { id: 'review',        name: '사용 리뷰',   desc: '실제 사용하는 모습을 자연스럽게', icon: Star },
  { id: 'before-after',  name: '비포/애프터', desc: '사용 전후 변화를 극적으로',       icon: Wand2 },
]

export function ProductWizard({
  userId,
  models,
}: {
  userId: string
  models: ModelOption[]
}) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('upload')
  const [photos, setPhotos] = useState<DroppedPhoto[]>([])
  const [modelId, setModelId] = useState<string | null>(null)
  const [scenarioId, setScenarioId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const steps = [
    { number: 1, label: '제품 사진', active: stage === 'upload', completed: stage !== 'upload' },
    { number: 2, label: 'AI 모델', active: stage === 'model', completed: stage === 'scenario' },
    { number: 3, label: '시나리오', active: stage === 'scenario', completed: false },
  ]

  async function submit() {
    if (!modelId || !scenarioId) return
    setSubmitting(true)
    setError(null)
    try {
      const supabase = createClient()
      const paths: string[] = []
      for (const p of photos) {
        const key = `${userId}/${crypto.randomUUID()}-${sanitize(p.file.name)}`
        const { error: upErr } = await supabase.storage
          .from('sources')
          .upload(key, p.file, { contentType: p.file.type, upsert: false })
        if (upErr) throw new Error(`업로드 실패: ${upErr.message}`)
        paths.push(key)
      }

      const result = await createProductJob({
        ai_model_id: modelId,
        scenario: scenarioId,
        source_image_paths: paths,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`/generating?type=product&job=${result.jobId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <StepIndicator steps={steps} />

      <div className="mt-14">
        {stage === 'upload' ? (
          <section>
            <div className="text-center">
              <h1 className="font-display text-4xl">제품 사진을 업로드하세요</h1>
              <p className="mt-3 text-muted-foreground">
                다양한 각도의 사진을 업로드하면 더 풍부한 영상을 만들 수 있어요 (최대 3장)
              </p>
            </div>
            <div className="mt-10">
              <PhotoDrop value={photos} onChange={setPhotos} multiple max={3} />
            </div>
            <Footer
              right={
                <Primary disabled={photos.length === 0} onClick={() => setStage('model')}>
                  다음 단계
                  <ArrowRight className="size-4" />
                </Primary>
              }
            />
          </section>
        ) : null}

        {stage === 'model' ? (
          <section>
            <div className="text-center">
              <h1 className="font-display text-4xl">AI 모델을 선택하세요</h1>
              <p className="mt-3 text-muted-foreground">
                제품 컨셉에 맞는 AI 모델이 영상에 등장합니다
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {models.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModelId(m.id)}
                  className={cn(
                    'relative aspect-[9/16] overflow-hidden rounded-2xl border bg-space-gray/60 text-left transition',
                    modelId === m.id
                      ? 'border-neon-blue shadow-[0_0_24px_rgba(59,130,246,0.45)]'
                      : 'border-border hover:border-border-strong',
                  )}
                >
                  <div aria-hidden className={`absolute inset-0 bg-gradient-to-br ${m.accent}`} />
                  {m.popular ? (
                    <span className="absolute right-4 top-4 rounded-full border border-neon-blue/40 bg-neon-blue/20 px-2 py-1 text-xs text-neon-blue">
                      인기
                    </span>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-base">{m.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {m.style}
                      {m.age ? ` · ${m.age}` : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <Footer
              left={
                <Secondary onClick={() => setStage('upload')}>
                  <ArrowLeft className="size-4" />
                  이전
                </Secondary>
              }
              right={
                <Primary disabled={!modelId} onClick={() => setStage('scenario')}>
                  다음 단계
                  <ArrowRight className="size-4" />
                </Primary>
              }
            />
          </section>
        ) : null}

        {stage === 'scenario' ? (
          <section>
            <div className="text-center">
              <h1 className="font-display text-4xl">시나리오를 선택하세요</h1>
              <p className="mt-3 text-muted-foreground">
                영상 콘셉트에 맞는 스토리라인을 선택하세요
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {SCENARIOS.map((s) => {
                const selected = scenarioId === s.id
                const Icon = s.icon
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScenarioId(s.id)}
                    className={cn(
                      'flex flex-col gap-4 rounded-2xl border p-6 text-left transition',
                      selected
                        ? 'border-neon-blue bg-neon-blue/5 shadow-[0_0_24px_rgba(59,130,246,0.35)]'
                        : 'border-border bg-space-gray/60 hover:bg-metal-gray',
                    )}
                  >
                    <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-neon-blue to-neon-cyan text-white">
                      <Icon className="size-6" />
                    </span>
                    <div>
                      <h3 className="text-lg">{s.name}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{s.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {error ? (
              <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <Footer
              left={
                <Secondary onClick={() => setStage('model')} disabled={submitting}>
                  <ArrowLeft className="size-4" />
                  이전
                </Secondary>
              }
              right={
                <Primary disabled={!scenarioId || submitting} onClick={submit}>
                  <Sparkles className="size-4" />
                  {submitting ? '생성 요청 중...' : '영상 생성하기 (25 크레딧)'}
                </Primary>
              }
            />
          </section>
        ) : null}
      </div>
    </div>
  )
}

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
}

function Footer({ left, right }: { left?: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="mt-10 flex items-center justify-between">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  )
}

function Primary({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-neon-blue to-neon-cyan px-7 text-sm font-medium text-white transition hover:shadow-[0_0_24px_rgba(59,130,246,0.5)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
    >
      {children}
    </button>
  )
}

function Secondary({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex h-12 items-center gap-2 rounded-full border border-border-strong bg-space-gray/60 px-6 text-sm text-foreground transition hover:bg-metal-gray disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  )
}
