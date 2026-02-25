import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '전략 마켓플레이스 | Alpha Foundry',
  description:
    '검증된 투자 전략을 탐색하고 나에게 맞는 전략을 선택하세요. 가치투자, 모멘텀, 자산배분 등 다양한 AI 전략을 제공합니다.',
};

export default function StrategiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
