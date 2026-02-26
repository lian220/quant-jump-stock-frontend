import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { structuredDataTemplates } from '@/lib/seo/config';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt';
import { IosInstallGuide } from '@/components/pwa/IosInstallGuide';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';

import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { CopyProtection } from '@/components/CopyProtection';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SWRProvider } from '@/lib/swr-provider';

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
    'AI가 매일 종목을 분석하고, 검증된 투자 전략을 제공합니다. 주식 초보도 쉽게 시작할 수 있는 데이터 기반 투자 플랫폼.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Alpha Foundry',
  },
  formatDetection: {
    telephone: false,
  },
  keywords: [
    'AI주식분석',
    '주식투자',
    'AI투자',
    '주식초보',
    '종목추천',
    '투자전략',
    '주식분석',
    '주식데이터',
    '모멘텀투자',
    '투자플랫폼',
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
      'AI가 매일 종목을 분석하고, 검증된 투자 전략을 제공합니다. 주식 초보도 쉽게 시작할 수 있는 데이터 기반 투자 플랫폼.',
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased select-none`}>
        <CopyProtection />
        <ServiceWorkerRegister />
        <OfflineBanner />
        <InstallPrompt />
        <IosInstallGuide />
        <UpdatePrompt />

        <Toaster position="top-center" richColors />
        <SWRProvider>
          <AuthProvider>
            <TooltipProvider>
              <Header />
              <div className="pb-16 md:pb-0">
                {children}
                <Footer />
              </div>
              <BottomNav />
            </TooltipProvider>
          </AuthProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
