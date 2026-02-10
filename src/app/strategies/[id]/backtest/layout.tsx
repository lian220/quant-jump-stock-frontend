import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '백테스트 실행 - 전략 성과 시뮬레이션',
  description:
    '퀀트 전략의 과거 성과를 시뮬레이션하고 분석합니다. 수익률, 샤프비율, MDD 등 핵심 지표를 확인하세요.',
};

export default function BacktestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
