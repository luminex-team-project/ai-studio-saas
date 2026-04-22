'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Play, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { createSelfieJob } from '../_actions/create-job'
import { StepIndicator } from '../_components/step-indicator'
import { PhotoDrop, type DroppedPhoto } from '../_components/photo-drop'

// Stages: if a template is preselected via URL we skip 'template'.
type Stage = 'template' | 'compose' | 'options'

export type TemplateOption = {
  id: string
  slug: string
  name: string
  category: string
  popular: boolean
  previewVideoUrl: string | null
  thumbnailUrl: string | null
  examplePrompt: string | null
  replaceTargetHint: string | null
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

const MAX_PHOTOS = 3

export function SelfieWizard({
  userId,
  templates,
  preselectedId,
}: {
  userId: string
  templates: TemplateOption[]
  preselectedId: string | null
}) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>(preselectedId ? 'compose' : 'template')
  const [templateId, setTemplateId] = useState<string | null>(preselectedId)
  const [photos, setPhotos] = useState<DroppedPhoto[]>([])
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState<Duration>('15')
  const [music, setMusic] = useState<Music>('트렌디 팝')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const template = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  )

  // Auto-fill the prompt from the template's example when the selection
  // changes, but only if the user hasn't typed anything custom yet.
  useEffect(() => {
    if (!template) return
    setPrompt((current) =>
      current.trim().length === 0 ? template.examplePrompt ?? '' : current,
    )
  }, [template])

  const steps = [
    {
      number: 1,
      label: '템플릿 선택',
      active: stage === 'template',
      completed: stage !== 'template',
    },
    {
      number: 2,
      label: '사진 + 프롬프트',
      active: stage === 'compose',
      completed: stage === 'options',
    },
    { number: 3, label: '옵션 설정', active: stage === 'options', completed: false },
  ]

  async function submit() {
    if (!templateId) {
      setError('템플릿을 선택해주세요')
      return
    }
    if (photos.length === 0) {
      setError('사진을 1장 이상 첨부해주세요')
      return
    }
    if (prompt.trim().length < 5) {
      setError('프롬프트를 5자 이상 입력해주세요')
      return
    }

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
        prompt: prompt.trim(),
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
        {stage === 'template' ? (
          <TemplateStage
            templates={templates}
            selectedId={templateId}
            onSelect={setTemplateId}
            onNext={() => setStage('compose')}
          />
        ) : null}

        {stage === 'compose' && template ? (
          <ComposeStage
            template={template}
            photos={photos}
            onPhotos={setPhotos}
            prompt={prompt}
            onPrompt={setPrompt}
            onBack={() =>
              preselectedId ? router.push('/templates') : setStage('template')
            }
            onNext={() => setStage('options')}
            canChangeTemplate={!preselectedId}
          />
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
                <Secondary onClick={() => setStage('compose')} disabled={submitting}>
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

function TemplateStage({
  templates,
  selectedId,
  onSelect,
  onNext,
}: {
  templates: TemplateOption[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNext: () => void
}) {
  return (
    <section>
      <div className="text-center">
        <h1 className="font-display text-4xl">템플릿을 선택하세요</h1>
        <p className="mt-3 text-muted-foreground">
          인기 트렌드부터 클래식까지, 클릭하면 미리보기 영상이 재생돼요
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={cn(
              'group relative aspect-[9/16] overflow-hidden rounded-2xl border bg-space-gray/60 text-left transition',
              selectedId === t.id
                ? 'border-neon-purple shadow-[0_0_24px_rgba(139,92,246,0.45)]'
                : 'border-border hover:border-border-strong',
            )}
          >
            {t.previewVideoUrl ? (
              <video
                src={t.previewVideoUrl}
                poster={t.thumbnailUrl ?? undefined}
                muted
                playsInline
                preload="metadata"
                loop
                onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})}
                onMouseLeave={(e) => {
                  e.currentTarget.pause()
                  e.currentTarget.currentTime = 0
                }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div
                aria-hidden
                className={`absolute inset-0 bg-gradient-to-br ${t.accent}`}
              />
            )}
            {t.popular ? (
              <span className="absolute right-3 top-3 rounded-full border border-neon-purple/40 bg-neon-purple/25 px-2 py-1 text-xs text-neon-purple backdrop-blur">
                인기
              </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-xs text-muted-foreground">{t.category}</p>
              <p className="mt-1 text-base text-white">{t.name}</p>
            </div>
          </button>
        ))}
      </div>

      <Footer
        right={
          <Primary disabled={!selectedId} onClick={onNext}>
            다음 단계
            <ArrowRight className="size-4" />
          </Primary>
        }
      />
    </section>
  )
}

function ComposeStage({
  template,
  photos,
  onPhotos,
  prompt,
  onPrompt,
  onBack,
  onNext,
  canChangeTemplate,
}: {
  template: TemplateOption
  photos: DroppedPhoto[]
  onPhotos: (p: DroppedPhoto[]) => void
  prompt: string
  onPrompt: (v: string) => void
  onBack: () => void
  onNext: () => void
  canChangeTemplate: boolean
}) {
  const canProceed = photos.length > 0 && prompt.trim().length >= 5

  return (
    <section>
      <div className="grid gap-8 md:grid-cols-[minmax(220px,280px)_1fr] md:items-start">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            선택한 템플릿
          </p>
          <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-border bg-space-gray/60">
            {template.previewVideoUrl ? (
              <video
                src={template.previewVideoUrl}
                poster={template.thumbnailUrl ?? undefined}
                muted
                playsInline
                loop
                autoPlay
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                aria-hidden
                className={`absolute inset-0 bg-gradient-to-br ${template.accent}`}
              />
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/85 to-transparent p-3">
              <Play className="size-3 text-white/70" />
              <span className="text-sm text-white">{template.name}</span>
            </div>
          </div>
          {canChangeTemplate ? (
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              다른 템플릿으로 변경
            </button>
          ) : null}
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="font-display text-3xl">사진 첨부</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              영상 속에서 <span className="text-foreground">{template.replaceTargetHint ?? '주인공'}</span>
              을(를) 대체할 사진을 올려주세요. 최대 {MAX_PHOTOS}장까지 첨부할 수 있어요.
            </p>
            <div className="mt-5">
              <PhotoDrop
                value={photos}
                onChange={onPhotos}
                multiple
                max={MAX_PHOTOS}
                helper={`JPG, PNG · 최대 10MB · 최대 ${MAX_PHOTOS}장`}
              />
            </div>
          </div>

          <div>
            <h2 className="font-display text-3xl">프롬프트</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              영상에서 어떻게 재연출할지 설명해주세요. 예시 프롬프트를 바로 사용하거나 자유롭게 편집할 수 있어요.
            </p>
            <textarea
              value={prompt}
              onChange={(e) => onPrompt(e.target.value)}
              rows={6}
              maxLength={2000}
              placeholder={template.examplePrompt ?? ''}
              className="mt-4 w-full rounded-2xl border border-border bg-space-gray/60 px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground focus:border-neon-purple focus:shadow-[0_0_24px_rgba(139,92,246,0.25)]"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => onPrompt(template.examplePrompt ?? '')}
                disabled={!template.examplePrompt}
                className="underline-offset-4 transition hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-40"
              >
                예시 프롬프트로 초기화
              </button>
              <span>{prompt.length} / 2000</span>
            </div>
          </div>
        </div>
      </div>

      <Footer
        left={
          <Secondary onClick={onBack}>
            <ArrowLeft className="size-4" />
            {canChangeTemplate ? '이전' : '갤러리로'}
          </Secondary>
        }
        right={
          <Primary disabled={!canProceed} onClick={onNext}>
            다음 단계
            <ArrowRight className="size-4" />
          </Primary>
        }
      />
    </section>
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
