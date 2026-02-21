import type { NextConfig } from 'next';

// Next.js API Routes를 사용하므로 rewrite 설정 제거
const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        // 빌드 해시 포함된 정적 자산 → 영구 캐시
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // public/images → 1일 캐시
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=43200' },
        ],
      },
      {
        // 폰트 → 1년 캐시
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // favicon, manifest 등 루트 정적 파일 → 1일 캐시
        source: '/:path(favicon.ico|site.webmanifest|robots.txt|sitemap.xml)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },
};

export default nextConfig;
