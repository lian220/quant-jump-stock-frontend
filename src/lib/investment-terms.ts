// 투자 용어 사전

export interface InvestmentTerm {
  label: string;
  description: string;
}

export const INVESTMENT_TERMS: Record<string, InvestmentTerm> = {
  totalReturn: {
    label: '누적수익률',
    description:
      '투자 시작부터 끝까지 전체 기간 동안의 총 수익률입니다. 예: +156%면 100만원이 256만원이 된 것입니다.',
  },
  cagr: {
    label: 'CAGR',
    description:
      '연평균 복리 수익률(Compound Annual Growth Rate)입니다. 매년 꾸준히 이 비율로 성장했다고 가정한 수치입니다.',
  },
  mdd: {
    label: 'MDD',
    description:
      '최대 낙폭(Maximum Drawdown)으로, 투자 기간 중 최고점에서 최저점까지 가장 크게 떨어진 비율입니다. 값이 작을수록 안정적입니다.',
  },
  sharpeRatio: {
    label: '샤프비율',
    description:
      '위험 대비 수익을 나타내는 지표입니다. 1 이상이면 양호, 2 이상이면 우수합니다. 높을수록 효율적인 투자입니다.',
  },
  winRate: {
    label: '승률',
    description: '전체 매매 중 수익을 낸 거래의 비율입니다. 60% 이상이면 양호한 편입니다.',
  },
  minInvestment: {
    label: '최소투자금',
    description:
      '이 전략을 실행하기 위해 필요한 최소 금액입니다. 여러 종목에 분산 투자하기 위한 최소 단위입니다.',
  },
  benchmark: {
    label: '벤치마크',
    description:
      '전략의 성과를 비교하기 위한 기준 지표입니다. 보통 KOSPI(한국 주식시장 지수)를 사용합니다.',
  },
  equityCurve: {
    label: '수익곡선',
    description:
      '시간에 따른 투자금의 변화를 그래프로 나타낸 것입니다. 우상향할수록 좋은 전략입니다.',
  },
  backtest: {
    label: '백테스트',
    description:
      '과거 데이터를 사용해 전략의 성과를 시뮬레이션한 것입니다. 실제 투자 결과와 다를 수 있습니다.',
  },
  rebalancing: {
    label: '리밸런싱',
    description:
      '포트폴리오 내 자산 비중을 목표에 맞게 재조정하는 것입니다. 주기적으로 수행합니다.',
  },
  momentum: {
    label: '모멘텀',
    description: '최근 상승세가 강한 종목이 계속 오를 가능성이 높다는 투자 전략입니다.',
  },
  stopLoss: {
    label: '손절',
    description: '일정 수준 이상 손실이 발생하면 추가 손실을 막기 위해 자동으로 매도하는 것입니다.',
  },
  riskLevel: {
    label: '리스크레벨',
    description:
      '전략의 위험 수준을 나타냅니다. 낮음/중간/높음으로 구분되며, MDD(최대 낙폭) 기준으로 산정됩니다.',
  },
  cagrCompound: {
    label: 'CAGR(복리)',
    description:
      '복리 효과를 고려한 연평균 수익률입니다. 단리보다 실제 성장 속도를 더 정확히 반영합니다.',
  },
  excessReturn: {
    label: '초과수익',
    description: '벤치마크 대비 전략이 추가로 달성한 수익입니다. 양수면 시장을 이긴 것입니다.',
  },
};

export function getTerm(key: string): InvestmentTerm | undefined {
  return INVESTMENT_TERMS[key];
}
