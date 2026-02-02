import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { structuredDataTemplates } from '@/lib/seo/config';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: '퀀트점프 - AI 기반 스마트 투자 플랫폼',
    template: '%s | 퀀트점프',
  },
  description:
    'AI와 빅데이터 분석으로 최적의 매매 타이밍을 포착하세요. 실시간 시세, 퀀트 전략, 백테스팅까지 데이터 기반 체계적인 주식 투자 플랫폼.',
  keywords: ['퀀트투자', '주식투자', 'AI투자', '알고리즘트레이딩', '백테스팅', '실시간시세'],
  authors: [{ name: '퀀트점프' }],
  creator: '퀀트점프',
  publisher: '퀀트점프',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '퀀트점프',
    title: '퀀트점프 - AI 기반 스마트 투자 플랫폼',
    description: 'AI와 빅데이터 분석으로 최적의 매매 타이밍을 포착하세요.',
  },
  twitter: {
    card: 'summary_large_image',
    title: '퀀트점프 - AI 기반 스마트 투자 플랫폼',
    description: 'AI와 빅데이터 분석으로 최적의 매매 타이밍을 포착하세요.',
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
