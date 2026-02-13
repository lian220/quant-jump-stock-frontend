import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '마이페이지 | Alpha Foundry',
  description: '내 계정 정보를 확인하고 관리하세요.',
};

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
