import type { BackendStrategyListResponse, StrategyListParams, BackendStrategy } from '@/types/api';
import type { Strategy } from '@/types/strategy';

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
