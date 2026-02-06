// 백엔드 API 응답 타입

export interface BackendStrategy {
  id: number;
  name: string;
  description: string;
  category: string | { id: number; code: string; name: string };
  isPremium: boolean;
  subscriberCount: number;
  averageRating: number;
  rebalanceFrequency: string;
  backtestResult: BacktestResult | null;
  createdAt: string;
}

export interface BacktestResult {
  totalReturn: number;
  cagr: number;
  sharpeRatio: number;
  mdd: number;
  winRate: number;
  volatility?: number;
  startDate?: string;
  endDate?: string;
}

// 전략 상세 API의 performanceMetrics (backtestResult보다 상세)
export interface PerformanceMetrics {
  cagr: number;
  mdd: number;
  sharpeRatio: number;
  sortinoRatio: number;
  totalReturn: number;
  volatility: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  benchmarkReturn: number | null;
  alpha: number | null;
  beta: number | null;
  initialCapital: number;
  finalValue: number;
  startDate: string;
  endDate: string;
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

// 전략 상세 응답 타입 (performanceMetrics 사용, backtestResult 없음)
export interface BackendStrategyDetail extends Omit<BackendStrategy, 'backtestResult'> {
  performanceMetrics: PerformanceMetrics | null;
  equityCurve: EquityCurvePoint[];
  currentHoldings: CurrentHolding[];
}

export interface CurrentHolding {
  ticker: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface EquityCurvePoint {
  date: string;
  value: number;
  benchmark?: number;
}
