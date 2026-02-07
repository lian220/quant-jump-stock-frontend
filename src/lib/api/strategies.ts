import type {
  BackendStrategyListResponse,
  StrategyListParams,
  BackendStrategy,
  BackendStrategyDetail,
  DefaultStockListResponse,
} from '@/types/api';
import type {
  Strategy,
  StrategyDetail,
  EquityCurveData,
  BenchmarkResponse,
} from '@/types/strategy';

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
    stockSelectionType: backend.stockSelectionType as 'SCREENING' | 'PORTFOLIO',

    tags: generateTags(backend),
  };
}

/**
 * 백엔드 카테고리 코드를 프론트엔드 카테고리로 매핑 (1:1)
 */
function mapBackendCategoryToFrontend(
  categoryCode: string,
):
  | 'value'
  | 'momentum'
  | 'asset_allocation'
  | 'quant_composite'
  | 'seasonal'
  | 'ml_prediction'
  | 'all' {
  const mapping: Record<
    string,
    'value' | 'momentum' | 'asset_allocation' | 'quant_composite' | 'seasonal' | 'ml_prediction'
  > = {
    VALUE: 'value',
    MOMENTUM: 'momentum',
    ASSET_ALLOCATION: 'asset_allocation',
    QUANT_COMPOSITE: 'quant_composite',
    SEASONAL: 'seasonal',
    ML_PREDICTION: 'ml_prediction',
  };

  return mapping[categoryCode] || 'quant_composite';
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

  if (categoryCode === 'VALUE') {
    tags.push('가치투자', '장기투자');
  }
  if (categoryCode === 'MOMENTUM') {
    tags.push('모멘텀', '추세추종');
  }
  if (categoryCode === 'ASSET_ALLOCATION') {
    tags.push('자산배분', '분산투자');
  }
  if (categoryCode === 'QUANT_COMPOSITE') {
    tags.push('퀀트', '복합전략');
  }
  if (categoryCode === 'SEASONAL') {
    tags.push('시즌널', '계절성');
  }
  if (categoryCode === 'ML_PREDICTION') {
    tags.push('AI', '머신러닝');
  }

  tags.push(backend.rebalanceFrequency.toLowerCase());

  if (backend.stockSelectionType === 'PORTFOLIO') {
    tags.push('포트폴리오');
  }

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
    queryParams.append('categoryCode', mapFrontendCategoryToBackend(params.category));
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

  // 브라우저에서는 프록시 API 사용, 서버에서는 직접 호출
  const isBrowser = typeof window !== 'undefined';
  const baseUrl = isBrowser ? `/api/strategies` : `${API_URL}/api/v1/marketplace/strategies`;
  const url = `${baseUrl}?${queryParams.toString()}`;

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
 * 프론트엔드 카테고리를 백엔드 카테고리로 매핑 (1:1)
 */
function mapFrontendCategoryToBackend(category: string): string {
  const mapping: Record<string, string> = {
    value: 'VALUE',
    momentum: 'MOMENTUM',
    asset_allocation: 'ASSET_ALLOCATION',
    quant_composite: 'QUANT_COMPOSITE',
    seasonal: 'SEASONAL',
    ml_prediction: 'ML_PREDICTION',
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
 * 상세 API는 backtestResult 대신 performanceMetrics를 반환
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
    stockSelectionType: backend.stockSelectionType as 'SCREENING' | 'PORTFOLIO',

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
 * 전략 기본 종목(포트폴리오 구성) 조회
 */
export async function getStrategyDefaultStocks(
  strategyId: string,
): Promise<DefaultStockListResponse> {
  const url = `${API_URL}/api/v1/strategies/${strategyId}/default-stocks`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`기본 종목 조회 실패: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 벤치마크 시계열 조회
 */
export async function getBenchmarkSeries(params: {
  tickers: string[];
  startDate: string;
  endDate: string;
  initialCapital?: number;
}): Promise<BenchmarkResponse> {
  const queryParams = new URLSearchParams({
    tickers: params.tickers.join(','),
    startDate: params.startDate,
    endDate: params.endDate,
  });
  if (params.initialCapital !== undefined) {
    queryParams.append('initialCapital', params.initialCapital.toString());
  }

  const isBrowser = typeof window !== 'undefined';
  const baseUrl = isBrowser ? `/api/benchmarks/series` : `${API_URL}/api/v1/benchmarks/series`;
  const url = `${baseUrl}?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    console.error('벤치마크 데이터 조회 실패:', response.statusText);
    return { benchmarks: [] };
  }

  return response.json();
}

/**
 * Mock 데이터 생성 (백엔드 API 미구현 시 사용)
 */
export function generateMockStrategyDetail(id: string): StrategyDetail {
  // 수익 곡선 mock 데이터 생성 (2020-2024)
  const equityCurve: EquityCurveData[] = [];
  let strategyValue = 10000;

  const startDate = new Date('2020-01-01');
  const endDate = new Date('2024-12-31');

  for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
    const strategyReturn = 1 + (Math.random() * 0.03 + 0.005);

    if (Math.random() < 0.2) {
      strategyValue *= 1 - Math.random() * 0.08;
    } else {
      strategyValue *= strategyReturn;
    }

    equityCurve.push({
      date: d.toISOString().split('T')[0],
      value: Math.round(strategyValue),
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
