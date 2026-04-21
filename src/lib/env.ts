import { z } from 'zod'

// Supabase renamed `anon key` → `publishable key` in 2025.
// Use the new name as canonical; accept legacy `ANON_KEY` as a fallback.
function resolvePublishableKey(): string | undefined {
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (publishable && publishable.length > 0) return publishable
  const legacy = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return legacy && legacy.length > 0 ? legacy : undefined
}

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, {
    error:
      'Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local',
  }),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  // Optional until payments are wired in. Validated separately when needed.
  NEXT_PUBLIC_TOSS_CLIENT_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
})

const optionalSecret = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const ServerEnvSchema = PublicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  TOSS_SECRET_KEY: optionalSecret,

  // Video providers
  RUNWAY_API_KEY: optionalSecret,
  KLING_API_KEY: optionalSecret,
  KLING_API_SECRET: optionalSecret,
  LUMA_API_KEY: optionalSecret,

  // Media + queue
  CLOUDINARY_CLOUD_NAME: optionalSecret,
  CLOUDINARY_API_KEY: optionalSecret,
  CLOUDINARY_API_SECRET: optionalSecret,
  REDIS_URL: optionalSecret,
})

type PublicEnv = z.infer<typeof PublicEnvSchema>
type ServerEnv = z.infer<typeof ServerEnvSchema>

let publicEnvCache: PublicEnv | null = null
let serverEnvCache: ServerEnv | null = null

function publicInput() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: resolvePublishableKey(),
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_TOSS_CLIENT_KEY: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
  }
}

export function publicEnv(): PublicEnv {
  if (publicEnvCache) return publicEnvCache
  const parsed = PublicEnvSchema.safeParse(publicInput())
  if (!parsed.success) {
    throw new Error(
      `Missing public env vars. Copy .env.example to .env.local and fill in:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
        .join('\n')}`,
    )
  }
  publicEnvCache = parsed.data
  return parsed.data
}

// Per-provider required-env guards. Call these lazily from an adapter or
// worker; they must NOT run at module import time because many providers
// are optional for local dev.
export function requireKlingEnv() {
  const e = serverEnv()
  if (!e.KLING_API_KEY || !e.KLING_API_SECRET) {
    throw new Error(
      'Kling 공식 API는 KLING_API_KEY + KLING_API_SECRET 두 개 모두 필요합니다. console.klingai.com에서 Access Key/Secret 발급받아 .env.local에 설정하세요.',
    )
  }
  return { apiKey: e.KLING_API_KEY, apiSecret: e.KLING_API_SECRET }
}

export function requireRunwayEnv() {
  const e = serverEnv()
  if (!e.RUNWAY_API_KEY) {
    throw new Error('RUNWAY_API_KEY가 설정되지 않았습니다. dev.runwayml.com에서 발급받아 .env.local에 추가하세요.')
  }
  return { apiKey: e.RUNWAY_API_KEY }
}

export function requireLumaEnv() {
  const e = serverEnv()
  if (!e.LUMA_API_KEY) {
    throw new Error('LUMA_API_KEY가 설정되지 않았습니다. lumalabs.ai/dream-machine/api에서 발급받아 .env.local에 추가하세요.')
  }
  return { apiKey: e.LUMA_API_KEY }
}

export function requireCloudinaryEnv() {
  const e = serverEnv()
  if (!e.CLOUDINARY_CLOUD_NAME || !e.CLOUDINARY_API_KEY || !e.CLOUDINARY_API_SECRET) {
    throw new Error(
      'Cloudinary 3종 세트(CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)가 모두 필요합니다.',
    )
  }
  return {
    cloudName: e.CLOUDINARY_CLOUD_NAME,
    apiKey: e.CLOUDINARY_API_KEY,
    apiSecret: e.CLOUDINARY_API_SECRET,
  }
}

export function hasCloudinaryEnv(): boolean {
  const e = serverEnv()
  return Boolean(e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET)
}

export function requireRedisUrl() {
  const e = serverEnv()
  if (!e.REDIS_URL) {
    throw new Error('REDIS_URL이 설정되지 않았습니다. Upstash 또는 로컬 Redis URL을 .env.local에 추가하세요.')
  }
  return e.REDIS_URL
}

export function serverEnv(): ServerEnv {
  if (serverEnvCache) return serverEnvCache
  const parsed = ServerEnvSchema.safeParse({
    ...publicInput(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    TOSS_SECRET_KEY: process.env.TOSS_SECRET_KEY,

    RUNWAY_API_KEY: process.env.RUNWAY_API_KEY,
    KLING_API_KEY: process.env.KLING_API_KEY,
    KLING_API_SECRET: process.env.KLING_API_SECRET,
    LUMA_API_KEY: process.env.LUMA_API_KEY,

    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    REDIS_URL: process.env.REDIS_URL,
  })
  if (!parsed.success) {
    throw new Error(
      `Missing server env vars:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
        .join('\n')}`,
    )
  }
  serverEnvCache = parsed.data
  return parsed.data
}
