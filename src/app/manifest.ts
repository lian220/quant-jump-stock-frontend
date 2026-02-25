import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Alpha Foundry - AI 기반 스마트 투자 플랫폼',
    short_name: 'Alpha Foundry',
    description: '실시간 시세, AI 분석, 투자 전략까지 데이터 기반 체계적인 주식 투자 플랫폼.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['finance', 'business', 'productivity'],
    shortcuts: [
      {
        name: '전략 마켓플레이스',
        short_name: '전략',
        description: '투자 전략 둘러보기',
        url: '/strategies',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: '주식 정보',
        short_name: '주식',
        description: '실시간 주식 정보 확인',
        url: '/stocks',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
