import type { NextConfig } from "next";

// API URL은 환경 변수 NEXT_PUBLIC_API_URL에서 주입됩니다
const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
