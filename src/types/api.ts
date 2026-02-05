// 백엔드 API 응답 타입

export interface BackendStrategy {
  id: number;
  name: string;
  description: string;
  category: string;
  isPremium: boolean;
  subscriberCount: number;
  averageRating: number;
  rebalanceFrequency: string;
  backtestResult: BacktestResult | null;
  createdAt: string;
}

export interface BacktestResult {
  totalReturn: string;
  cagr: string;
  sharpeRatio: string;
  mdd: string;
  winRate: string;
  period: string;
}

export interface BackendPagination {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface BackendStrategyListResponse {
  strategies: BackendStrategy[];
  pagination: BackendPagination;
}

// API 요청 파라미터
export interface StrategyListParams {
  category?: string;
  minCagr?: number;
  maxMdd?: number;
  sortBy?: 'subscribers' | 'cagr' | 'sharpe' | 'recent';
  page?: number;
  size?: number;
}

// 전략 상세 응답 타입
export interface BackendStrategyDetail extends BackendStrategy {
  // 전략 조건 (룰)
  rules: StrategyRule[];
  // 수익 곡선 데이터
  equityCurve: EquityCurvePoint[];
  // 월별 수익률
  monthlyReturns: MonthlyReturn[];
}

export interface StrategyRule {
  id: number;
  name: string;
  description: string;
  type: 'ENTRY' | 'EXIT' | 'FILTER' | 'REBALANCE';
  parameters: Record<string, string | number>;
}

export interface EquityCurvePoint {
  date: string;
  value: number;
  benchmark?: number;
}

export interface MonthlyReturn {
  year: number;
  month: number;
  return: number;
}
