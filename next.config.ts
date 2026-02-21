import type { NextConfig } from 'next';

// Next.js API Routes를 사용하므로 rewrite 설정 제거
const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      // ── 정적 자산 (빌드 해시 포함) → 영구 캐시 ──
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // ── 이미지 → 1일 캐시 + SWR 12시간 ──
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=43200' },
        ],
      },
      // ── 폰트 → 1년 캐시 ──
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // ── 아이콘 (PWA 아이콘 포함) → 7일 캐시 ──
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
      // ── favicon, manifest, robots, sitemap → 1일 캐시 ──
      {
        source: '/:path(favicon.ico|site.webmanifest|robots.txt|sitemap.xml)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      // ── Service Worker → 항상 최신 (PWA 업데이트 보장) ──
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, no-cache, must-revalidate' },
        ],
      },
      // ── API 라우트 → 캐시 금지 ──
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      // ── Next.js RSC/Data → 짧은 캐시 + SWR ──
      {
        source: '/_next/data/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
