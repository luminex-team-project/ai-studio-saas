'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_BYTES = 10 * 1024 * 1024 // 10MB

export type DroppedPhoto = { file: File; previewUrl: string }

export function PhotoDrop({
  value,
  onChange,
  multiple = false,
  max = 1,
  accept = 'image/jpeg,image/png',
  helper = 'JPG, PNG 파일 지원 · 최대 10MB',
}: {
  value: DroppedPhoto[]
  onChange: (photos: DroppedPhoto[]) => void
  multiple?: boolean
  max?: number
  accept?: string
  helper?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Revoke object URLs when photos change to avoid memory leaks.
  useEffect(() => {
    return () => {
      value.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
  }, [value])

  const accepted = accept.split(',').map((s) => s.trim())

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null)
      const incoming = Array.from(files)
      const valid: DroppedPhoto[] = []
      for (const f of incoming) {
        if (!accepted.includes(f.type)) {
          setError('JPG 또는 PNG 파일만 업로드할 수 있어요')
          continue
        }
        if (f.size > MAX_BYTES) {
          setError('10MB 이하 파일만 업로드할 수 있어요')
          continue
        }
        valid.push({ file: f, previewUrl: URL.createObjectURL(f) })
      }
      const combined = multiple ? [...value, ...valid].slice(0, max) : valid.slice(0, 1)
      onChange(combined)
    },
    [accepted, max, multiple, onChange, value],
  )

  function removeAt(i: number) {
    const next = [...value]
    const [removed] = next.splice(i, 1)
    if (removed) URL.revokeObjectURL(removed.previewUrl)
    onChange(next)
  }

  const empty = value.length === 0

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="사진 업로드"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition',
          dragging
            ? 'border-neon-purple bg-neon-purple/5'
            : 'border-border bg-space-gray/40 hover:border-border-strong hover:bg-space-gray/60',
        )}
      >
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-purple to-neon-blue text-white">
          <Upload className="size-6" />
        </span>
        <h3 className="mt-4 text-xl">
          {empty ? '사진을 드래그하거나 클릭하세요' : '사진을 추가로 올리려면 클릭'}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-300">{error}</p>
      ) : null}

      {value.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {value.map((p, i) => (
            <div
              key={p.previewUrl}
              className="relative aspect-[9/16] overflow-hidden rounded-xl border border-border bg-black"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.previewUrl}
                alt={p.file.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeAt(i)
                }}
                aria-label="사진 제거"
                className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
