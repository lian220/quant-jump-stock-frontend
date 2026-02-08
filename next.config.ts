import type { NextConfig } from "next";

// API URL은 환경 변수 NEXT_PUBLIC_API_URL에서 주입됩니다
const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://api.alphafoundry.app';

    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/api/:path*`,
      },
      {
        source: '/data-api/:path*',
        destination: `${apiBaseUrl}/data-api/:path*`,
      },
    ];
  },
};

export default nextConfig;
