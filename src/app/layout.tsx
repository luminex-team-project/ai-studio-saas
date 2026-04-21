import type { Metadata, Viewport } from 'next'
import { Orbitron, Outfit } from 'next/font/google'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import './globals.css'

const outfit = Outfit({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
})

const orbitron = Orbitron({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Premium AI Studio — 당신의 사진을 바이럴 영상으로',
    template: '%s · Premium AI Studio',
  },
  description:
    '전신 사진 한 장으로 트렌디한 숏폼 영상을 60초 만에 생성하세요. AI 모델과 함께하는 제품 홍보 영상도 가능합니다.',
  applicationName: 'Premium AI Studio',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${outfit.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
