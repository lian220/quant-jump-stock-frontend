import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인 처리 중',
  description: '소셜 로그인 인증을 처리하고 있습니다. 잠시만 기다려 주세요.',
  robots: { index: false },
};

export default function AuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
