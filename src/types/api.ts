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
