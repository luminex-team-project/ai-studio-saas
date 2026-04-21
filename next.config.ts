import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

// CSP: allow Supabase (auth + realtime + storage), Cloudinary (image/video
// delivery), Toss payments widget, and Kling/Runway/Luma download hosts for
// provider output previews. Dev adds 'unsafe-eval' for Turbopack HMR.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').host
  } catch {
    return ''
  }
})()

const scriptSrc = [
  "'self'",
  "'unsafe-inline'", // Next.js + Tailwind require inline styles/scripts for runtime
  ...(isProd ? [] : ["'unsafe-eval'"]),
  'https://js.tosspayments.com',
  'https://*.tosspayments.com',
].join(' ')

const connectSrc = [
  "'self'",
  supabaseHost ? `https://${supabaseHost}` : '',
  supabaseHost ? `wss://${supabaseHost}` : '',
  'https://*.supabase.co',
  'wss://*.supabase.co',
  'https://api.cloudinary.com',
  'https://res.cloudinary.com',
  'https://api-singapore.klingai.com',
  'https://api.runwayml.com',
  'https://api.lumalabs.ai',
  ...(isProd ? [] : ['ws://localhost:*', 'http://localhost:*']),
]
  .filter(Boolean)
  .join(' ')

const imgSrc = [
  "'self'",
  'data:',
  'blob:',
  'https://*.supabase.co',
  'https://res.cloudinary.com',
  'https://*.googleusercontent.com', // Google OAuth profile photos (lh3-6.*)
  'https://*.kakaocdn.net',          // Kakao OAuth profile photos
].join(' ')

const mediaSrc = [
  "'self'",
  'blob:',
  'https://*.supabase.co',
  'https://res.cloudinary.com',
].join(' ')

const cspDirectives = [
  `default-src 'self'`,
  `script-src ${scriptSrc}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com data:`,
  `img-src ${imgSrc}`,
  `media-src ${mediaSrc}`,
  `connect-src ${connectSrc}`,
  `frame-src 'self' https://*.tosspayments.com`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  ...(isProd ? ['upgrade-insecure-requests'] : []),
]

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
