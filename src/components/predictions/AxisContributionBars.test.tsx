import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AxisContributionBars } from './AxisContributionBars';
import type { BuySignal } from '@/lib/api/predictions';

function makeSignal(overrides: Partial<BuySignal>): BuySignal {
  return {
    ticker: 'TEST',
    stockName: '테스트',
    analysisDate: '2026-06-07',
    compositeScore: 50,
    compositeGrade: 'B',
    aiScore: 0,
    techScore: 0,
    sentimentScore: 0,
    techScoreDisplay: 0,
    aiScoreDisplay: 0,
    sentimentScoreDisplay: 0,
    compositeScoreDisplay: 50,
    isRecommended: false,
    ...overrides,
  };
}

describe('AxisContributionBars (XAI 축별 강도)', () => {
  it('각 축을 "원점수/최대×100" 강도(0~100)로 표시한다 (기여도 아님)', () => {
    render(
      <AxisContributionBars
        stock={makeSignal({
          // CLS 실측: 종합 90.78 인데 각 신호 강도는 차트 100 / AI 72 / 뉴스 96
          axisContributions: { tech: 50, ai: 21.6, sentiment: 19.18 },
          techScore: 3.5, // 3.5/3.5 → 100
          aiScore: 7.2, // 7.2/10 → 72
          sentimentScore: 9.59, // 9.59/10 → 96(반올림)
        })}
      />,
    );
    expect(screen.getByText('차트')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('뉴스')).toBeInTheDocument();
    // 가중 기여도(21.6/19.18)가 아니라 강도(72/96)로 표시
    expect(screen.getByText('100점')).toBeInTheDocument();
    expect(screen.getByText('72점')).toBeInTheDocument();
    expect(screen.getByText('96점')).toBeInTheDocument();
    expect(screen.queryByText('21점')).not.toBeInTheDocument();
  });

  it('axisContributions가 없으면 *Display>0로 present 판정 후 강도를 계산한다', () => {
    render(
      <AxisContributionBars
        stock={makeSignal({
          techScoreDisplay: 50,
          aiScoreDisplay: 21,
          sentimentScoreDisplay: 19,
          techScore: 3.5, // → 100
          aiScore: 7, // → 70
          sentimentScore: 9, // → 90
        })}
      />,
    );
    expect(screen.getByText('100점')).toBeInTheDocument();
    expect(screen.getByText('70점')).toBeInTheDocument();
    expect(screen.getByText('90점')).toBeInTheDocument();
  });

  it('기여도 dict에 없는 결측 축은 "–"로 표시한다', () => {
    render(
      <AxisContributionBars
        stock={makeSignal({
          axisContributions: { tech: 62.5, ai: 28.13 }, // sentiment 결측
          techScore: 3.5,
          aiScore: 7.5,
          sentimentScore: 0,
        })}
      />,
    );
    expect(screen.getByText('100점')).toBeInTheDocument(); // 차트
    expect(screen.getByText('75점')).toBeInTheDocument(); // AI 7.5/10
    expect(screen.getByText('–')).toBeInTheDocument(); // 뉴스 결측
  });

  it('scoreCoverage<1.0이면 커버리지 보조 표기를 1줄 노출한다 (§5)', () => {
    render(
      <AxisContributionBars
        stock={makeSignal({
          axisContributions: { tech: 50, ai: 25 },
          techScore: 3.5,
          aiScore: 8,
          scoreCoverage: 0.8,
        })}
      />,
    );
    expect(screen.getByText('데이터 커버리지 80%')).toBeInTheDocument();
  });

  it('showReason=true면 한 줄 사유를 표시한다', () => {
    render(
      <AxisContributionBars
        stock={makeSignal({
          axisContributions: { tech: 50 },
          techScore: 3.5,
          recommendationReason: '골든크로스 발생',
        })}
        showReason
      />,
    );
    expect(screen.getByText(/골든크로스 발생/)).toBeInTheDocument();
  });

  it('표시할 축이 하나도 없으면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<AxisContributionBars stock={makeSignal({})} />);
    expect(container).toBeEmptyDOMElement();
  });
});
