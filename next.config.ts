import type { NextConfig } from 'next';

// Next.js API Routes를 사용하므로 rewrite 설정 제거
const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
