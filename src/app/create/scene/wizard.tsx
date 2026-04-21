'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Sparkles, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createSceneJob } from '../_actions/create-job'
import { StepIndicator } from '../_components/step-indicator'

type Stage = 'prompt' | 'options'
type Aspect = '9:16' | '16:9' | '1:1'

const SUGGESTIONS = [
  {
    label: '게임/액티비티',
    text: '예쁘고 귀엽고 활발한 여중생 4명이 아케이드 펌프 발판게임을 하며 협동모드로 즐기고, 배꼽잡고 웃는 역동적인 15초 영상. 스튜디오 조명, 얼굴 클로즈업 교차, 엔딩에 하이파이브',
  },
  {
    label: '내러티브/컨셉',
    text: '성공한 0.1% 상위 부자들의 생활을 보여주는 15초 몽타주. 고급 오피스, 새벽 운동, 독서하는 모습, 전망 좋은 창문 앞에서 사색하는 장면. 시네마틱 컬러, 느린 카메라 이동',
  },
  {
    label: '라이프스타일',
    text: '한강이 보이는 카페에서 노트북으로 일하는 20대 여성. 따뜻한 햇살, 커피 한 모금, 미소, 밖의 나무에서 바람에 흔들리는 잎사귀. 자연광, 15초',
  },
]

const ASPECTS: { id: Aspect; label: string; hint: string }[] = [
  { id: '9:16', label: '세로 9:16', hint: '릴스/쇼츠' },
  { id: '16:9', label: '가로 16:9', hint: '유튜브' },
  { id: '1:1', label: '정사각 1:1', hint: '피드 광고' },
]

export function SceneWizard() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('prompt')
  const [prompt, setPrompt] = useState('')
  const [aspect, setAspect] = useState<Aspect>('9:16')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const steps = [
    { number: 1, label: '스토리 입력', active: stage === 'prompt', completed: stage === 'options' },
    { number: 2, label: '옵션 & 생성', active: stage === 'options', completed: false },
  ]

  async function submit() {
    if (prompt.trim().length < 5) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await createSceneJob({
        prompt: prompt.trim(),
        aspect_ratio: aspect,
        phase: 'final_15s',
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`/generating?type=text2video&job=${result.jobId}`)
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
        {stage === 'prompt' ? (
          <section>
            <div className="text-center">
              <h1 className="font-display text-4xl">어떤 장면을 만들까요?</h1>
              <p className="mt-3 text-muted-foreground">
                사진 없이 텍스트만으로 15초 영상을 생성합니다. 장면 구성, 인물 묘사, 분위기를 자세히 적을수록 결과가 좋아져요.
              </p>
            </div>

            <div className="mt-10">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 5000))}
                placeholder="예) 성공한 0.1% 상위 부자들의 생활을 보여주는 15초 몽타주. 고급 오피스, 새벽 운동, 독서..."
                className="min-h-[240px] w-full resize-none rounded-2xl border border-border bg-space-gray/60 p-5 text-base leading-7 outline-none transition focus:border-neon-blue focus:shadow-[0_0_24px_rgba(59,130,246,0.25)]"
              />
              <div className="mt-2 flex justify-end text-xs text-muted-foreground">
                {prompt.length} / 5000
              </div>
            </div>

            <div className="mt-8">
              <p className="mb-3 text-sm text-muted-foreground">빠른 예시</p>
              <div className="grid gap-3 md:grid-cols-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setPrompt(s.text)}
                    className="rounded-2xl border border-border bg-space-gray/40 p-4 text-left transition hover:bg-metal-gray"
                  >
                    <p className="text-sm text-neon-cyan">{s.label}</p>
                    <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{s.text}</p>
                  </button>
                ))}
              </div>
            </div>

            <Footer
              right={
                <Primary disabled={prompt.trim().length < 5} onClick={() => setStage('options')}>
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
              <h1 className="font-display text-4xl">영상 규격을 골라주세요</h1>
              <p className="mt-3 text-muted-foreground">
                15초, 720p, 주제에 최적화된 AI 모델이 자동 선택됩니다
              </p>
            </div>

            <div className="mt-10">
              <p className="mb-3 text-sm text-muted-foreground">화면 비율</p>
              <div className="grid gap-4 md:grid-cols-3">
                {ASPECTS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAspect(a.id)}
                    className={cn(
                      'rounded-2xl border p-6 text-left transition',
                      aspect === a.id
                        ? 'border-neon-blue bg-neon-blue/5 shadow-[0_0_24px_rgba(59,130,246,0.35)]'
                        : 'border-border bg-space-gray/60 hover:bg-metal-gray',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Wand2 className="size-5 text-neon-cyan" />
                      <p className="text-base">{a.label}</p>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{a.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-border bg-space-gray/40 p-5">
              <p className="text-sm text-muted-foreground">프롬프트 미리보기</p>
              <p className="mt-2 line-clamp-4 text-sm leading-6">{prompt}</p>
            </div>

            {error ? (
              <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <Footer
              left={
                <Secondary onClick={() => setStage('prompt')} disabled={submitting}>
                  <ArrowLeft className="size-4" />
                  이전
                </Secondary>
              }
              right={
                <Primary disabled={submitting} onClick={submit}>
                  <Sparkles className="size-4" />
                  {submitting ? '생성 요청 중...' : '영상 생성 (15 크레딧)'}
                </Primary>
              }
            />
          </section>
        ) : null}
      </div>
    </div>
  )
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
