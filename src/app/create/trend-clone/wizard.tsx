'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Sparkles, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { StepIndicator } from '../_components/step-indicator'
import { PhotoDrop, type DroppedPhoto } from '../_components/photo-drop'
import { VideoURLInput, type VideoUrlValidation } from '../_components/video-url-input'
import {
  PromptTemplatePicker,
  type PromptTemplateOption,
} from '../_components/prompt-template-picker'
import { createTrendCloneJob } from '../_actions/create-workflow-job'

type Stage = 'source' | 'mode' | 'image' | 'customize' | 'review'
type SourceKind = 'url' | 'file'

const VIDEO_MAX_BYTES = 60 * 1024 * 1024 // 60MB

export function TrendCloneWizard({
  userId,
  modes,
}: {
  userId: string
  modes: PromptTemplateOption[]
}) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('source')
  const [sourceKind, setSourceKind] = useState<SourceKind>('url')
  const [url, setUrl] = useState<VideoUrlValidation>({ url: '', platform: null, valid: false })
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoFileError, setVideoFileError] = useState<string | null>(null)
  const [modeId, setModeId] = useState<string | null>(null)
  const [images, setImages] = useState<DroppedPhoto[]>([])
  const [trendName, setTrendName] = useState('')
  const [trendVibe, setTrendVibe] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stages: Stage[] = ['source', 'mode', 'image', 'customize', 'review']
  const currentIdx = stages.indexOf(stage)

  const steps = [
    { number: 1, label: '트렌드 소스',  active: stage === 'source',    completed: currentIdx > 0 },
    { number: 2, label: '복제 모드',     active: stage === 'mode',      completed: currentIdx > 1 },
    { number: 3, label: '이미지',        active: stage === 'image',     completed: currentIdx > 2 },
    { number: 4, label: '커스텀',        active: stage === 'customize', completed: currentIdx > 3 },
    { number: 5, label: '검토',          active: stage === 'review',    completed: false },
  ]

  const sourceValid = sourceKind === 'url' ? url.valid : videoFile !== null
  const selectedMode = modes.find((m) => m.id === modeId)

  function onVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (!f) {
      setVideoFile(null)
      return
    }
    if (f.size > VIDEO_MAX_BYTES) {
      setVideoFileError('60MB 이하 파일만 업로드 가능합니다')
      return
    }
    if (!['video/mp4', 'video/quicktime', 'video/webm'].includes(f.type)) {
      setVideoFileError('MP4 · MOV · WebM 만 지원합니다')
      return
    }
    setVideoFileError(null)
    setVideoFile(f)
  }

  async function submit() {
    if (!modeId) return setError('복제 모드를 선택해주세요')
    if (!sourceValid) return setError('트렌드 소스 (URL 또는 파일)를 입력해주세요')

    setSubmitting(true)
    setError(null)
    try {
      const supabase = createClient()

      const imagePaths: string[] = []
      for (const p of images) {
        const key = `${userId}/${crypto.randomUUID()}-${sanitize(p.file.name)}`
        const { error: upErr } = await supabase.storage
          .from('sources')
          .upload(key, p.file, { contentType: p.file.type, upsert: false })
        if (upErr) throw new Error(`이미지 업로드 실패: ${upErr.message}`)
        imagePaths.push(key)
      }

      let trendReferencePath: string | null = null
      if (sourceKind === 'file' && videoFile) {
        const key = `${userId}/${crypto.randomUUID()}-trend-${sanitize(videoFile.name)}`
        const { error: upErr } = await supabase.storage
          .from('sources')
          .upload(key, videoFile, { contentType: videoFile.type, upsert: false })
        if (upErr) throw new Error(`트렌드 영상 업로드 실패: ${upErr.message}`)
        trendReferencePath = key
      }

      const result = await createTrendCloneJob({
        prompt_template_id: modeId,
        source_image_paths: imagePaths,
        trend_reference_url: sourceKind === 'url' ? url.url : null,
        trend_reference_path: trendReferencePath,
        trend_name: trendName.trim(),
        trend_vibe: trendVibe.trim(),
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`/generating?type=trend_clone&job=${result.jobId}`)
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
        {stage === 'source' ? (
          <Section title="트렌드 영상 소스" subtitle="URL 또는 파일로 복제할 트렌드 영상을 업로드">
            <div className="flex gap-2">
              {(['url', 'file'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSourceKind(k)}
                  className={cn(
                    'flex-1 rounded-lg border px-4 py-3 text-sm transition',
                    sourceKind === k
                      ? 'border-neon-cyan bg-neon-cyan/15 text-neon-cyan'
                      : 'border-border bg-space-gray/40 text-muted-foreground hover:text-foreground',
                  )}
                >
                  {k === 'url' ? 'URL 붙여넣기' : '파일 업로드'}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {sourceKind === 'url' ? (
                <VideoURLInput value={url.url} onChange={setUrl} />
              ) : (
                <div>
                  <label className="mb-2 block text-sm">트렌드 영상 파일 (MP4 · MOV · WebM, 최대 60MB)</label>
                  <div
                    className={cn(
                      'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition',
                      videoFile
                        ? 'border-neon-cyan/60 bg-neon-cyan/5'
                        : 'border-border bg-space-gray/40 hover:border-border-strong',
                    )}
                    onClick={() => document.getElementById('trend-video-input')?.click()}
                  >
                    <Video className="size-6 text-neon-cyan" />
                    <h3 className="mt-3 text-base">
                      {videoFile ? videoFile.name : '클릭해서 영상을 업로드하세요'}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {videoFile ? `${Math.round(videoFile.size / 1024 / 1024)}MB` : '화면 녹화/다운로드한 트렌드 영상'}
                    </p>
                    <input
                      id="trend-video-input"
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      hidden
                      onChange={onVideoFile}
                    />
                  </div>
                  {videoFileError ? (
                    <p className="mt-2 text-sm text-red-300">{videoFileError}</p>
                  ) : null}
                </div>
              )}
            </div>

            <Footer
              right={<PrimaryButton disabled={!sourceValid} onClick={() => setStage('mode')}>다음 <ArrowRight className="size-4" /></PrimaryButton>}
            />
          </Section>
        ) : null}

        {stage === 'mode' ? (
          <Section title="복제 모드 선택" subtitle="A: 자체 템플릿 / B: 본인 합성 / C: 풀 AI 메타 변환">
            <PromptTemplatePicker templates={modes} value={modeId} onChange={setModeId} />
            <Footer
              left={<SecondaryButton onClick={() => setStage('source')}><ArrowLeft className="size-4" /> 이전</SecondaryButton>}
              right={<PrimaryButton disabled={!modeId} onClick={() => setStage('image')}>다음 <ArrowRight className="size-4" /></PrimaryButton>}
            />
          </Section>
        ) : null}

        {stage === 'image' ? (
          <Section title="참고 이미지" subtitle="본인 셀카 또는 AI 모델 이미지 (모드 C는 선택사항)">
            <PhotoDrop
              value={images}
              onChange={setImages}
              multiple
              max={3}
              helper={
                selectedMode?.subcategory === 'full-ai-meta'
                  ? '모드 C는 이미지 없이도 생성 가능 · JPG, PNG · 최대 10MB'
                  : 'JPG, PNG · 최대 10MB'
              }
            />
            <Footer
              left={<SecondaryButton onClick={() => setStage('mode')}><ArrowLeft className="size-4" /> 이전</SecondaryButton>}
              right={<PrimaryButton onClick={() => setStage('customize')}>다음 <ArrowRight className="size-4" /></PrimaryButton>}
            />
          </Section>
        ) : null}

        {stage === 'customize' ? (
          <Section title="트렌드 커스텀" subtitle="트렌드 이름과 분위기 메모">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm">트렌드 이름</label>
                <input
                  type="text"
                  value={trendName}
                  onChange={(e) => setTrendName(e.target.value)}
                  placeholder="예) Apple Watch Dance Challenge"
                  maxLength={60}
                  className="w-full rounded-lg border border-border bg-deep-space px-3 py-2 text-sm outline-none focus:border-neon-cyan"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm">분위기 (영어 권장)</label>
                <input
                  type="text"
                  value={trendVibe}
                  onChange={(e) => setTrendVibe(e.target.value)}
                  placeholder="playful confident energetic"
                  maxLength={120}
                  className="w-full rounded-lg border border-border bg-deep-space px-3 py-2 text-sm outline-none focus:border-neon-cyan"
                />
              </div>
            </div>
            <Footer
              left={<SecondaryButton onClick={() => setStage('image')}><ArrowLeft className="size-4" /> 이전</SecondaryButton>}
              right={<PrimaryButton onClick={() => setStage('review')}>다음 <ArrowRight className="size-4" /></PrimaryButton>}
            />
          </Section>
        ) : null}

        {stage === 'review' ? (
          <Section title="검토 및 생성" subtitle="내용을 확인한 뒤 생성하세요">
            <div className="rounded-2xl border border-border bg-space-gray/50 p-5">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Row label="트렌드 소스" value={sourceKind === 'url' ? `${url.platform ?? 'URL'}` : `파일 (${videoFile?.name ?? '—'})`} />
                <Row label="복제 모드" value={selectedMode?.display_name ?? '—'} />
                <Row label="이미지" value={`${images.length}장`} />
                <Row label="트렌드 이름" value={trendName} />
                <Row label="분위기" value={trendVibe} />
              </dl>
            </div>
            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
            <Footer
              left={<SecondaryButton onClick={() => setStage('customize')}><ArrowLeft className="size-4" /> 이전</SecondaryButton>}
              right={
                <PrimaryButton disabled={submitting} onClick={submit}>
                  {submitting ? '생성 중...' : <><Sparkles className="size-4" /> 트렌드 복제 생성 (10 크레딧)</>}
                </PrimaryButton>
              }
            />
          </Section>
        ) : null}
      </div>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-center">
        <h1 className="font-display text-4xl">{title}</h1>
        <p className="mt-3 text-muted-foreground">{subtitle}</p>
      </div>
      <div className="mt-10">{children}</div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value || '—'}</dd>
    </div>
  )
}

function Footer({ left, right }: { left?: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <div>{left ?? null}</div>
      <div>{right}</div>
    </div>
  )
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm transition',
        disabled
          ? 'cursor-not-allowed bg-space-gray/60 text-muted-foreground'
          : 'neon-glow bg-gradient-to-r from-neon-cyan to-neon-blue text-white hover:brightness-110',
      )}
    >
      {children}
    </button>
  )
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-border-strong bg-space-gray/60 px-5 text-sm text-foreground hover:bg-metal-gray"
    >
      {children}
    </button>
  )
}

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
}
