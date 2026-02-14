import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '투자 성향 설정 | Quant Jump Stock',
  description: '투자 성향, 관심 시장, 리스크 허용도를 설정하고 맞춤 전략을 추천받으세요.',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
