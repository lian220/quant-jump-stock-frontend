import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { structuredDataTemplates } from '@/lib/seo/config';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt';
import { Header } from '@/components/layout/Header';
import { CopyProtection } from '@/components/CopyProtection';

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
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://alphafoundry.co.kr'}/main_logo.png`,
        width: 512,
        height: 512,
        alt: 'Alpha Foundry 로고',
      },
    ],
  },
  twitter: {
    card: 'summary',
    site: '@alphafoundry',
    creator: '@alphafoundry',
    title: 'Alpha Foundry - AI 기반 스마트 투자 플랫폼',
    description: 'AI와 빅데이터 분석으로 최적의 매매 타이밍을 포착하세요.',
    images: [`${process.env.NEXT_PUBLIC_SITE_URL || 'https://alphafoundry.co.kr'}/main_logo.png`],
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
        {/* 카카오톡 공유용 메타 태그 */}
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={process.env.NEXT_PUBLIC_SITE_URL || 'https://alphafoundry.co.kr'}
        />
        <meta property="og:title" content="Alpha Foundry - AI 기반 스마트 투자 플랫폼" />
        <meta
          property="og:description"
          content="AI와 빅데이터 분석으로 최적의 매매 타이밍을 포착하세요. 실시간 시세, 퀀트 전략, 백테스팅까지 데이터 기반 체계적인 주식 투자 플랫폼."
        />
        <meta
          property="og:image"
          content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://alphafoundry.co.kr'}/main_logo.png`}
        />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:site_name" content="Alpha Foundry" />

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
        <UpdatePrompt />
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
