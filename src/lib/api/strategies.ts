import type {
  BackendStrategyListResponse,
  StrategyListParams,
  BackendStrategy,
  BackendStrategyDetail,
} from '@/types/api';
import type { Strategy, StrategyDetail, StrategyRuleItem, EquityCurveData } from '@/types/strategy';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

/**
 * 백엔드 Strategy를 프론트엔드 Strategy 타입으로 변환
 */
function mapBackendStrategyToFrontend(backend: BackendStrategy): Strategy {
  const backtestResult = backend.backtestResult;

  return {
    id: backend.id.toString(),
    name: backend.name,
    description: backend.description,
    category: mapBackendCategoryToFrontend(backend.category),
    author: '퀀트점프', // 기본값
    authorAvatar: '',

    // 성과 지표 (백테스트 결과가 있으면 사용, 없으면 기본값)
    totalReturn: backtestResult?.totalReturn || 'N/A',
    annualReturn: backtestResult?.cagr || 'N/A',
    maxDrawdown: backtestResult?.mdd || 'N/A',
    winRate: backtestResult?.winRate || 'N/A',
    sharpeRatio: backtestResult?.sharpeRatio || 'N/A',

    // 리스크 레벨 계산 (MDD 기반)
    riskLevel: calculateRiskLevel(backtestResult?.mdd),

    minInvestment: 1000000, // 기본값
    subscribers: backend.subscriberCount,
    rating: backend.averageRating,
    reviewCount: 0, // 백엔드에서 제공하지 않음

    backtestPeriod: backtestResult?.period || '2020-2024',
    updatedAt: backend.createdAt,
    isPremium: backend.isPremium,

    tags: generateTags(backend),
  };
}

/**
 * 백엔드 카테고리를 프론트엔드 카테고리로 매핑
 */
function mapBackendCategoryToFrontend(
  category: string,
): 'momentum' | 'value' | 'growth' | 'dividend' | 'factor' | 'all' {
  const mapping: Record<string, 'momentum' | 'value' | 'growth' | 'dividend' | 'factor'> = {
    MOMENTUM: 'momentum',
    VALUE: 'value',
    ASSET_ALLOCATION: 'factor',
    QUANT_COMPOSITE: 'factor',
    SEASONAL: 'momentum',
    ML_PREDICTION: 'factor',
  };

  return mapping[category] || 'factor';
}

/**
 * MDD 기반 리스크 레벨 계산
 */
function calculateRiskLevel(mdd: string | undefined): 'low' | 'medium' | 'high' {
  if (!mdd || mdd === 'N/A') return 'medium';

  const mddValue = Math.abs(parseFloat(mdd.replace('%', '')));

  if (mddValue < 15) return 'low';
  if (mddValue < 25) return 'medium';
  return 'high';
}

/**
 * 전략에 대한 태그 생성
 */
function generateTags(backend: BackendStrategy): string[] {
  const tags: string[] = [];

  // 카테고리 기반 태그
  if (backend.category === 'ML_PREDICTION') {
    tags.push('AI', '머신러닝');
  }
  if (backend.category === 'MOMENTUM') {
    tags.push('모멘텀', '추세추종');
  }
  if (backend.category === 'VALUE') {
    tags.push('가치투자', '장기투자');
  }

  // 리밸런싱 빈도
  tags.push(backend.rebalanceFrequency.toLowerCase());

  // 프리미엄 여부
  if (backend.isPremium) {
    tags.push('프리미엄');
  }

  return tags.slice(0, 3); // 최대 3개
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
    growth: 'VALUE', // 성장주는 밸류로 매핑
    dividend: 'VALUE', // 배당주는 밸류로 매핑
    factor: 'QUANT_COMPOSITE',
  };

  return mapping[category] || category.toUpperCase();
}

/**
 * 전략 상세 조회
 * 브라우저에서는 Next.js API Route 프록시를 통해 호출 (CORS 우회)
 */
export async function getStrategyById(id: string): Promise<StrategyDetail> {
  // 브라우저에서는 프록시 API 사용, 서버에서는 직접 호출
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
  const baseStrategy = mapBackendStrategyToFrontend(backend);

  return {
    ...baseStrategy,
    rules: (backend.rules || []).map(
      (rule): StrategyRuleItem => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        type: rule.type.toLowerCase() as 'entry' | 'exit' | 'filter' | 'rebalance',
        parameters: rule.parameters,
      }),
    ),
    equityCurve: (backend.equityCurve || []).map(
      (point): EquityCurveData => ({
        date: point.date,
        value: point.value,
        benchmark: point.benchmark,
      }),
    ),
    monthlyReturns: backend.monthlyReturns || [],
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
    // 전략은 월평균 +1.5% ~ +3% 수익
    const strategyReturn = 1 + (Math.random() * 0.03 + 0.005);
    // 벤치마크는 월평균 +0.5% ~ +1.5% 수익
    const benchmarkReturn = 1 + (Math.random() * 0.015 + 0.003);

    // 가끔 하락
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
        return: Math.round((Math.random() * 20 - 5) * 10) / 10, // -5% ~ +15%
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
  };
}
