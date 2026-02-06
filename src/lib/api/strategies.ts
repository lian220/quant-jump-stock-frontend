import type {
  BackendStrategyListResponse,
  StrategyListParams,
  BackendStrategy,
  BackendStrategyDetail,
} from '@/types/api';
import type { Strategy, StrategyDetail, EquityCurveData } from '@/types/strategy';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

/**
 * 숫자를 % 문자열로 포맷
 */
function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'N/A';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * 숫자를 소수점 2자리 문자열로 포맷
 */
function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'N/A';
  return value.toFixed(2);
}

/**
 * 백엔드 Strategy를 프론트엔드 Strategy 타입으로 변환
 */
function mapBackendStrategyToFrontend(backend: BackendStrategy): Strategy {
  const br = backend.backtestResult;

  // 기간 계산
  let backtestPeriod = '2020-2024';
  if (br?.startDate && br?.endDate) {
    const startYear = br.startDate.substring(0, 4);
    const endYear = br.endDate.substring(0, 4);
    backtestPeriod = `${startYear}-${endYear}`;
  }

  return {
    id: backend.id.toString(),
    name: backend.name,
    description: backend.description,
    category: mapBackendCategoryToFrontend(backend.category.code),
    author: '퀀트점프',
    authorAvatar: '',

    // 성과 지표 (숫자 → 포맷 문자열)
    totalReturn: br ? formatPercent(br.totalReturn) : 'N/A',
    annualReturn: br ? formatPercent(br.cagr) : 'N/A',
    maxDrawdown: br ? formatPercent(br.mdd) : 'N/A',
    winRate: br ? formatPercent(br.winRate) : 'N/A',
    sharpeRatio: br ? formatNumber(br.sharpeRatio) : 'N/A',

    riskLevel: calculateRiskLevel(br?.mdd),

    minInvestment: 1000000,
    subscribers: backend.subscriberCount,
    rating: backend.averageRating,
    reviewCount: 0,

    backtestPeriod,
    updatedAt: backend.createdAt,
    isPremium: backend.isPremium,

    tags: generateTags(backend),
  };
}

/**
 * 백엔드 카테고리 코드를 프론트엔드 카테고리로 매핑
 */
function mapBackendCategoryToFrontend(
  categoryCode: string,
): 'momentum' | 'value' | 'growth' | 'dividend' | 'factor' | 'all' {
  const mapping: Record<string, 'momentum' | 'value' | 'growth' | 'dividend' | 'factor'> = {
    MOMENTUM: 'momentum',
    VALUE: 'value',
    ASSET_ALLOCATION: 'factor',
    QUANT_COMPOSITE: 'factor',
    SEASONAL: 'momentum',
    ML_PREDICTION: 'factor',
  };

  return mapping[categoryCode] || 'factor';
}

/**
 * MDD 기반 리스크 레벨 계산 (숫자 직접 사용)
 */
function calculateRiskLevel(mdd: number | undefined | null): 'low' | 'medium' | 'high' {
  if (mdd === undefined || mdd === null) return 'medium';

  const mddValue = Math.abs(mdd);

  if (mddValue < 15) return 'low';
  if (mddValue < 25) return 'medium';
  return 'high';
}

/**
 * 전략에 대한 태그 생성
 */
function generateTags(backend: BackendStrategy): string[] {
  const tags: string[] = [];
  const categoryCode = backend.category.code;

  if (categoryCode === 'ML_PREDICTION') {
    tags.push('AI', '머신러닝');
  }
  if (categoryCode === 'MOMENTUM') {
    tags.push('모멘텀', '추세추종');
  }
  if (categoryCode === 'VALUE') {
    tags.push('가치투자', '장기투자');
  }

  tags.push(backend.rebalanceFrequency.toLowerCase());

  if (backend.isPremium) {
    tags.push('프리미엄');
  }

  return tags.slice(0, 3);
}

/**
 * 전략 목록 조회
 */
export async function getStrategies(
  params: StrategyListParams = {},
): Promise<{ strategies: Strategy[]; totalPages: number; totalItems: number }> {
  const queryParams = new URLSearchParams();

  if (params.category && params.category !== 'all') {
    queryParams.append('category', mapFrontendCategoryToBackend(params.category));
  }
  if (params.minCagr !== undefined) {
    queryParams.append('minCagr', params.minCagr.toString());
  }
  if (params.maxMdd !== undefined) {
    queryParams.append('maxMdd', params.maxMdd.toString());
  }
  if (params.sortBy) {
    queryParams.append('sortBy', params.sortBy);
  }
  if (params.page !== undefined) {
    queryParams.append('page', params.page.toString());
  }
  if (params.size !== undefined) {
    queryParams.append('size', params.size.toString());
  }

  const url = `${API_URL}/api/v1/marketplace/strategies?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch strategies: ${response.statusText}`);
  }

  const data: BackendStrategyListResponse = await response.json();

  return {
    strategies: data.strategies.map(mapBackendStrategyToFrontend),
    totalPages: data.pagination.totalPages,
    totalItems: data.pagination.totalElements,
  };
}

/**
 * 프론트엔드 카테고리를 백엔드 카테고리로 매핑
 */
function mapFrontendCategoryToBackend(category: string): string {
  const mapping: Record<string, string> = {
    momentum: 'MOMENTUM',
    value: 'VALUE',
    growth: 'VALUE',
    dividend: 'VALUE',
    factor: 'QUANT_COMPOSITE',
  };

  return mapping[category] || category.toUpperCase();
}

/**
 * 전략 상세 조회
 * 브라우저에서는 Next.js API Route 프록시를 통해 호출 (CORS 우회)
 */
export async function getStrategyById(id: string): Promise<StrategyDetail> {
  const isBrowser = typeof window !== 'undefined';
  const url = isBrowser
    ? `/api/strategies/${id}`
    : `${API_URL}/api/v1/marketplace/strategies/${id}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('전략을 찾을 수 없습니다.');
    }
    throw new Error(`Failed to fetch strategy: ${response.statusText}`);
  }

  const data: BackendStrategyDetail = await response.json();
  return mapBackendStrategyDetailToFrontend(data);
}

/**
 * 백엔드 전략 상세를 프론트엔드 타입으로 변환
 */
function mapBackendStrategyDetailToFrontend(backend: BackendStrategyDetail): StrategyDetail {
  const pm = backend.performanceMetrics;

  // 기간 계산
  let backtestPeriod = '2020-2024';
  if (pm?.startDate && pm?.endDate) {
    const startYear = pm.startDate.substring(0, 4);
    const endYear = pm.endDate.substring(0, 4);
    backtestPeriod = `${startYear}-${endYear}`;
  }

  return {
    id: backend.id.toString(),
    name: backend.name,
    description: backend.description,
    category: mapBackendCategoryToFrontend(backend.category.code),
    author: '퀀트점프',
    authorAvatar: '',

    totalReturn: pm ? formatPercent(pm.totalReturn) : 'N/A',
    annualReturn: pm ? formatPercent(pm.cagr) : 'N/A',
    maxDrawdown: pm ? formatPercent(pm.mdd) : 'N/A',
    winRate: pm ? formatPercent(pm.winRate) : 'N/A',
    sharpeRatio: pm ? formatNumber(pm.sharpeRatio) : 'N/A',

    riskLevel: calculateRiskLevel(pm?.mdd),

    minInvestment: pm?.initialCapital ?? 1000000,
    subscribers: backend.subscriberCount,
    rating: backend.averageRating,
    reviewCount: 0,

    backtestPeriod,
    updatedAt: backend.createdAt,
    isPremium: backend.isPremium,

    tags: generateTags({
      ...backend,
      backtestResult: pm
        ? {
            totalReturn: pm.totalReturn,
            cagr: pm.cagr,
            sharpeRatio: pm.sharpeRatio,
            mdd: pm.mdd,
            winRate: pm.winRate,
            volatility: pm.volatility,
            startDate: pm.startDate,
            endDate: pm.endDate,
          }
        : null,
    }),

    rules: (backend.rules || []).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      type: r.type as 'entry' | 'exit' | 'filter' | 'rebalance',
      parameters: r.parameters as Record<string, string | number>,
    })),
    equityCurve: (backend.equityCurve || []).map(
      (point): EquityCurveData => ({
        date: point.date,
        value: point.value,
        benchmark: point.benchmark,
      }),
    ),
    monthlyReturns: (backend.monthlyReturns || []).map((m) => ({
      year: m.year,
      month: m.month,
      return: m.returnPct,
    })),
    trades: (backend.trades || []).map((t) => ({
      tradeDate: t.tradeDate,
      ticker: t.ticker,
      side: t.side as 'BUY' | 'SELL',
      quantity: t.quantity,
      price: t.price,
      amount: t.amount,
      pnl: t.pnl,
      pnlPercent: t.pnlPercent,
      holdingDays: t.holdingDays,
      signalReason: t.signalReason,
    })),
  };
}

/**
 * Mock 데이터 생성 (백엔드 API 미구현 시 사용)
 */
export function generateMockStrategyDetail(id: string): StrategyDetail {
  // 수익 곡선 mock 데이터 생성 (2020-2024)
  const equityCurve: EquityCurveData[] = [];
  let strategyValue = 10000;
  let benchmarkValue = 10000;

  const startDate = new Date('2020-01-01');
  const endDate = new Date('2024-12-31');

  for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
    const strategyReturn = 1 + (Math.random() * 0.03 + 0.005);
    const benchmarkReturn = 1 + (Math.random() * 0.015 + 0.003);

    if (Math.random() < 0.2) {
      strategyValue *= 1 - Math.random() * 0.08;
      benchmarkValue *= 1 - Math.random() * 0.1;
    } else {
      strategyValue *= strategyReturn;
      benchmarkValue *= benchmarkReturn;
    }

    equityCurve.push({
      date: d.toISOString().split('T')[0],
      value: Math.round(strategyValue),
      benchmark: Math.round(benchmarkValue),
    });
  }

  // 월별 수익률 mock 데이터
  const monthlyReturns = [];
  for (let year = 2020; year <= 2024; year++) {
    for (let month = 1; month <= 12; month++) {
      if (year === 2024 && month > 12) break;
      monthlyReturns.push({
        year,
        month,
        return: Math.round((Math.random() * 20 - 5) * 10) / 10,
      });
    }
  }

  return {
    id,
    name: '모멘텀 듀얼 전략',
    description:
      '상대 모멘텀과 절대 모멘텀을 결합한 듀얼 모멘텀 전략입니다. 시장 상황에 따라 자동으로 주식과 채권 비중을 조절합니다.',
    category: 'momentum',
    author: '퀀트점프',
    authorAvatar: '',

    totalReturn: '+156.3%',
    annualReturn: '+26.2%',
    maxDrawdown: '-18.5%',
    winRate: '62%',
    sharpeRatio: '1.85',

    riskLevel: 'medium',
    minInvestment: 1000000,
    subscribers: 1234,
    rating: 4.5,
    reviewCount: 89,

    backtestPeriod: '2020-2024',
    updatedAt: '2024-12-15',
    isPremium: true,

    tags: ['모멘텀', '듀얼모멘텀', 'AI'],

    rules: [
      {
        id: 1,
        name: '상대 모멘텀 필터',
        description: '최근 12개월 수익률 상위 30% 종목만 편입',
        type: 'filter',
        parameters: { lookbackPeriod: 12, percentile: 30 },
      },
      {
        id: 2,
        name: '절대 모멘텀 체크',
        description: '12개월 수익률이 무위험 이자율보다 높은 경우만 투자',
        type: 'entry',
        parameters: { lookbackPeriod: 12, riskFreeRate: 3.5 },
      },
      {
        id: 3,
        name: '월간 리밸런싱',
        description: '매월 말 포트폴리오 재조정',
        type: 'rebalance',
        parameters: { frequency: 'monthly' },
      },
      {
        id: 4,
        name: '손절 조건',
        description: '개별 종목 -15% 하락 시 매도',
        type: 'exit',
        parameters: { stopLoss: -15 },
      },
    ],

    equityCurve,
    monthlyReturns,
    trades: [],
  };
}
