'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { createSelfieJob } from '../_actions/create-job'
import { StepIndicator } from '../_components/step-indicator'
import { PhotoDrop, type DroppedPhoto } from '../_components/photo-drop'

type Stage = 'upload' | 'template' | 'options'

export type TemplateOption = {
  id: string
  name: string
  category: string
  popular: boolean
  accent: string
}

const DURATIONS = [
  { id: '15', label: '15초', hint: '숏폼 표준' },
  { id: '30', label: '30초', hint: '스토리텔링' },
  { id: '60', label: '60초', hint: '최대 길이' },
] as const

const MUSICS = ['트렌디 팝', '힙합 비트', '일렉트로닉', '없음'] as const

type Duration = (typeof DURATIONS)[number]['id']
type Music = (typeof MUSICS)[number]

export function SelfieWizard({
  userId,
  templates,
}: {
  userId: string
  templates: TemplateOption[]
}) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('upload')
  const [photos, setPhotos] = useState<DroppedPhoto[]>([])
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [duration, setDuration] = useState<Duration>('15')
  const [music, setMusic] = useState<Music>('트렌디 팝')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const steps = [
    { number: 1, label: '사진 업로드', active: stage === 'upload', completed: stage !== 'upload' },
    { number: 2, label: '템플릿 선택', active: stage === 'template', completed: stage === 'options' },
    { number: 3, label: '옵션 설정', active: stage === 'options', completed: false },
  ]

  async function submit() {
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

      const result = await createSelfieJob({
        template_id: templateId,
        source_image_paths: paths,
        options: { duration, music },
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`/generating?type=selfie&job=${result.jobId}`)
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
              <h1 className="font-display text-4xl">전신 사진을 업로드하세요</h1>
              <p className="mt-3 text-muted-foreground">
                최상의 결과를 위해 배경이 깔끔하고 전신이 잘 보이는 사진을 사용하세요
              </p>
            </div>
            <div className="mt-10">
              <PhotoDrop value={photos} onChange={setPhotos} />
            </div>
            <Footer
              right={
                <Primary disabled={photos.length === 0} onClick={() => setStage('template')}>
                  다음 단계
                  <ArrowRight className="size-4" />
                </Primary>
              }
            />
          </section>
        ) : null}

        {stage === 'template' ? (
          <section>
            <div className="text-center">
              <h1 className="font-display text-4xl">템플릿을 선택하세요</h1>
              <p className="mt-3 text-muted-foreground">
                인기 트렌드부터 클래식까지 다양한 스타일을 만나보세요
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={cn(
                    'relative aspect-[9/16] overflow-hidden rounded-2xl border bg-space-gray/60 text-left transition',
                    templateId === t.id
                      ? 'border-neon-purple shadow-[0_0_24px_rgba(139,92,246,0.45)]'
                      : 'border-border hover:border-border-strong',
                  )}
                >
                  <div aria-hidden className={`absolute inset-0 bg-gradient-to-br ${t.accent}`} />
                  {t.popular ? (
                    <span className="absolute right-4 top-4 rounded-full border border-neon-purple/40 bg-neon-purple/20 px-2 py-1 text-xs text-neon-purple">
                      인기
                    </span>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-xs text-muted-foreground">{t.category}</p>
                    <p className="mt-1 text-base">{t.name}</p>
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
                <Primary disabled={!templateId} onClick={() => setStage('options')}>
                  다음 단계
                  <ArrowRight className="size-4" />
                </Primary>
              }
            />
          </section>
        ) : null}

        {stage === 'options' ? (
          <section>
            <div className="text-center">
              <h1 className="font-display text-4xl">옵션을 설정하세요</h1>
              <p className="mt-3 text-muted-foreground">
                영상 길이와 배경음악을 선택하세요
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-border bg-space-gray/60 p-6">
              <h3 className="text-lg">영상 길이</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {DURATIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDuration(d.id)}
                    className={cn(
                      'rounded-xl border p-4 text-left transition',
                      duration === d.id
                        ? 'border-neon-purple bg-neon-purple/10'
                        : 'border-border bg-space-gray/80 hover:bg-metal-gray',
                    )}
                  >
                    <p className="text-2xl">{d.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{d.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-space-gray/60 p-6">
              <h3 className="text-lg">배경 음악</h3>
              <div className="mt-4 space-y-2">
                {MUSICS.map((m) => (
                  <label
                    key={m}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition',
                      music === m
                        ? 'border-neon-purple bg-neon-purple/10'
                        : 'border-border bg-space-gray/80 hover:bg-metal-gray',
                    )}
                  >
                    <input
                      type="radio"
                      name="music"
                      value={m}
                      checked={music === m}
                      onChange={() => setMusic(m)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        'inline-flex size-4 items-center justify-center rounded-full border',
                        music === m ? 'border-neon-purple' : 'border-muted-foreground',
                      )}
                    >
                      {music === m ? <span className="size-2 rounded-full bg-neon-purple" /> : null}
                    </span>
                    {m}
                  </label>
                ))}
              </div>
            </div>

            {error ? (
              <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <Footer
              left={
                <Secondary onClick={() => setStage('template')} disabled={submitting}>
                  <ArrowLeft className="size-4" />
                  이전
                </Secondary>
              }
              right={
                <Primary onClick={submit} disabled={submitting}>
                  <Sparkles className="size-4" />
                  {submitting ? '생성 요청 중...' : '영상 생성하기 (10 크레딧)'}
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
      className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-7 text-sm font-medium text-white transition hover:shadow-[0_0_24px_rgba(139,92,246,0.5)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
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
