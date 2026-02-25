import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '성과 시뮬레이션 - 전략 과거 성과 분석',
  description:
    '투자 전략의 과거 성과를 시뮬레이션하고 분석합니다. 수익률, 안정성 지수, 최대 손실폭 등 핵심 지표를 확인하세요.',
};

export default function BacktestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
