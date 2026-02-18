import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { structuredDataTemplates } from '@/lib/seo/config';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { CopyProtection } from '@/components/CopyProtection';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://alphafoundry.co.kr'),
  title: {
    default: 'Alpha Foundry - AI 기반 스마트 투자 플랫폼',
    template: '%s | Alpha Foundry',
  },
  description:
    'AI와 빅데이터 분석으로 최적의 매매 타이밍을 포착하세요. 실시간 시세, 퀀트 전략, 백테스팅까지 데이터 기반 체계적인 주식 투자 플랫폼.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Alpha Foundry',
  },
  formatDetection: {
    telephone: false,
  },
  keywords: [
    '퀀트투자',
    '주식투자',
    'AI투자',
    '알고리즘트레이딩',
    '백테스팅',
    '실시간시세',
    '주식분석',
    '퀀트전략',
    '모멘텀투자',
    '자동매매',
  ],
  authors: [{ name: 'Alpha Foundry' }],
  creator: 'Alpha Foundry',
  publisher: 'Alpha Foundry',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://alphafoundry.co.kr',
    siteName: 'Alpha Foundry',
    title: 'Alpha Foundry - AI 기반 스마트 투자 플랫폼',
    description:
      'AI와 빅데이터 분석으로 최적의 매매 타이밍을 포착하세요. 실시간 시세, 퀀트 전략, 백테스팅까지 데이터 기반 체계적인 주식 투자 플랫폼.',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://alphafoundry.co.kr'}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Alpha Foundry - AI 기반 스마트 투자 플랫폼',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@alphafoundry',
    creator: '@alphafoundry',
    title: 'Alpha Foundry - AI 기반 스마트 투자 플랫폼',
    description: 'AI와 빅데이터 분석으로 최적의 매매 타이밍을 포착하세요.',
    images: [`${process.env.NEXT_PUBLIC_SITE_URL || 'https://alphafoundry.co.kr'}/og-image.png`],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || '',
    },
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <head>
        {/* 전역 구조화된 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredDataTemplates.organization),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredDataTemplates.website),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900 select-none`}
      >
        <CopyProtection />
        <ServiceWorkerRegister />
        <InstallPrompt />

        <Toaster position="top-center" richColors />
        <AuthProvider>
          <TooltipProvider>
            <Header />
            <div className="pb-16 md:pb-0">{children}</div>
            <Footer />
            <BottomNav />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
