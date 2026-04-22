'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Sparkles, Film } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { StepIndicator } from '../_components/step-indicator'
import { PhotoDrop, type DroppedPhoto } from '../_components/photo-drop'
import {
  PromptTemplatePicker,
  type PromptTemplateOption,
} from '../_components/prompt-template-picker'
import { createSceneReenactJob } from '../_actions/create-workflow-job'

type Stage = 'archetype' | 'face' | 'scene-details' | 'review'

export function SceneReenactWizard({
  userId,
  templates,
}: {
  userId: string
  templates: PromptTemplateOption[]
}) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('archetype')
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [facePhotos, setFacePhotos] = useState<DroppedPhoto[]>([])
  const [referencePhoto, setReferencePhoto] = useState<DroppedPhoto[]>([])
  const [originalTitle, setOriginalTitle] = useState('')
  const [sceneDescription, setSceneDescription] = useState('')
  const [outfit, setOutfit] = useState('')
  const [background, setBackground] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stages: Stage[] = ['archetype', 'face', 'scene-details', 'review']
  const currentIdx = stages.indexOf(stage)

  const steps = [
    { number: 1, label: '장면 타입', active: stage === 'archetype',     completed: currentIdx > 0 },
    { number: 2, label: '얼굴 사진', active: stage === 'face',          completed: currentIdx > 1 },
    { number: 3, label: '장면 디테일', active: stage === 'scene-details', completed: currentIdx > 2 },
    { number: 4, label: '검토',      active: stage === 'review',        completed: false },
  ]

  async function submit() {
    if (!templateId) return setError('장면 타입을 선택해주세요')
    if (facePhotos.length === 0) return setError('내 얼굴 사진을 1장 이상 첨부해주세요')
    if (originalTitle.trim().length === 0) return setError('원작 작품명을 입력해주세요')

    setSubmitting(true)
    setError(null)
    try {
      const supabase = createClient()
      const facePaths: string[] = []
      for (const p of facePhotos) {
        const key = `${userId}/${crypto.randomUUID()}-${sanitize(p.file.name)}`
        const { error: upErr } = await supabase.storage
          .from('sources')
          .upload(key, p.file, { contentType: p.file.type, upsert: false })
        if (upErr) throw new Error(`업로드 실패: ${upErr.message}`)
        facePaths.push(key)
      }

      let referencePath: string | null = null
      if (referencePhoto[0]) {
        const ref = referencePhoto[0]
        const key = `${userId}/${crypto.randomUUID()}-${sanitize(ref.file.name)}`
        const { error: upErr } = await supabase.storage
          .from('sources')
          .upload(key, ref.file, { contentType: ref.file.type, upsert: false })
        if (upErr) throw new Error(`레퍼런스 업로드 실패: ${upErr.message}`)
        referencePath = key
      }

      const result = await createSceneReenactJob({
        prompt_template_id: templateId,
        face_image_paths: facePaths,
        reference_image_path: referencePath,
        scene: {
          original_title: originalTitle.trim(),
          description: sceneDescription.trim(),
          outfit: outfit.trim(),
          background: background.trim(),
        },
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`/generating?type=scene_reenact&job=${result.jobId}`)
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
        {stage === 'archetype' ? (
          <Section title="장면 타입 선택" subtitle="재현할 명장면의 유형을 고르세요">
            <PromptTemplatePicker
              templates={templates}
              value={templateId}
              onChange={setTemplateId}
            />
            <Footer
              right={
                <PrimaryButton disabled={!templateId} onClick={() => setStage('face')}>
                  다음 <ArrowRight className="size-4" />
                </PrimaryButton>
              }
            />
          </Section>
        ) : null}

        {stage === 'face' ? (
          <Section title="내 얼굴 사진" subtitle="정면 / 45도 / 측면 3장 권장 (최대 3장)">
            <PhotoDrop value={facePhotos} onChange={setFacePhotos} multiple max={3} />
            <div className="mt-8 rounded-2xl border border-dashed border-border bg-space-gray/30 p-5">
              <div className="flex items-center gap-2 text-sm">
                <Film className="size-4 text-neon-blue" />
                <span>원작 명장면 레퍼런스 (선택)</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                원작 명장면을 스크린샷/프레임으로 1장 첨부하면 더 정확한 재현이 가능합니다. 저작권을 위해 상업적 2차 활용은 피하세요.
              </p>
              <div className="mt-4">
                <PhotoDrop value={referencePhoto} onChange={setReferencePhoto} max={1} />
              </div>
            </div>
            <Footer
              left={<SecondaryButton onClick={() => setStage('archetype')}><ArrowLeft className="size-4" /> 이전</SecondaryButton>}
              right={<PrimaryButton disabled={facePhotos.length === 0} onClick={() => setStage('scene-details')}>다음 <ArrowRight className="size-4" /></PrimaryButton>}
            />
          </Section>
        ) : null}

        {stage === 'scene-details' ? (
          <Section title="장면 디테일" subtitle="원작 명장면의 분위기를 구체적으로 묘사해주세요">
            <div className="space-y-5">
              <Field label="원작 작품명 *" hint="저작권 안전을 위해 캡션에 자동으로 'AI 패러디' 표기가 붙습니다.">
                <input
                  type="text"
                  value={originalTitle}
                  onChange={(e) => setOriginalTitle(e.target.value)}
                  placeholder="예) 나 혼자만 레벨업"
                  maxLength={60}
                  className="w-full rounded-lg border border-border bg-deep-space px-3 py-2 text-sm outline-none focus:border-neon-purple"
                />
              </Field>
              <Field label="장면 설명 (한 줄)">
                <input
                  type="text"
                  value={sceneDescription}
                  onChange={(e) => setSceneDescription(e.target.value)}
                  placeholder="예) 폐허 신전에서 각성하는 변신씬"
                  maxLength={100}
                  className="w-full rounded-lg border border-border bg-deep-space px-3 py-2 text-sm outline-none focus:border-neon-purple"
                />
              </Field>
              <Field label="의상 / 스타일 (영어 권장)" hint="검정 후드 망토, 은빛 갑옷 등">
                <input
                  type="text"
                  value={outfit}
                  onChange={(e) => setOutfit(e.target.value)}
                  placeholder="black hooded cloak, silver shadow armor"
                  maxLength={120}
                  className="w-full rounded-lg border border-border bg-deep-space px-3 py-2 text-sm outline-none focus:border-neon-purple"
                />
              </Field>
              <Field label="배경 / 분위기 (영어 권장)" hint="로케이션 + 조명 + 디테일 3개">
                <input
                  type="text"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="ruined ancient temple, blue moonlight, swirling mist"
                  maxLength={160}
                  className="w-full rounded-lg border border-border bg-deep-space px-3 py-2 text-sm outline-none focus:border-neon-purple"
                />
              </Field>
            </div>
            <Footer
              left={<SecondaryButton onClick={() => setStage('face')}><ArrowLeft className="size-4" /> 이전</SecondaryButton>}
              right={<PrimaryButton onClick={() => setStage('review')}>다음 <ArrowRight className="size-4" /></PrimaryButton>}
            />
          </Section>
        ) : null}

        {stage === 'review' ? (
          <Section title="검토 및 생성" subtitle="모든 내용을 확인한 뒤 생성하세요">
            <div className="rounded-2xl border border-border bg-space-gray/50 p-5">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Row label="장면 타입" value={templates.find((t) => t.id === templateId)?.display_name ?? '—'} />
                <Row label="원작" value={originalTitle} />
                <Row label="설명" value={sceneDescription} />
                <Row label="의상" value={outfit} />
                <Row label="배경" value={background} />
                <Row label="얼굴 사진" value={`${facePhotos.length}장`} />
                <Row label="레퍼런스" value={referencePhoto.length > 0 ? '첨부됨' : '없음'} />
              </dl>
            </div>
            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
            <Footer
              left={<SecondaryButton onClick={() => setStage('scene-details')}><ArrowLeft className="size-4" /> 이전</SecondaryButton>}
              right={
                <PrimaryButton disabled={submitting} onClick={submit}>
                  {submitting ? '생성 중...' : <><Sparkles className="size-4" /> 명장면 재연 생성 (20 크레딧)</>}
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
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
          : 'neon-glow bg-gradient-to-r from-neon-blue to-neon-cyan text-white hover:brightness-110',
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
