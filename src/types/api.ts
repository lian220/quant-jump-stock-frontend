// 백엔드 API 응답 타입

export interface BackendCategory {
  id: number;
  code: string;
  name: string;
}

export interface BackendStrategy {
  id: number;
  name: string;
  description: string;
  category: BackendCategory;
  isPremium: boolean;
  stockSelectionType: string;
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
  volatility: number;
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

// 전략 상세 응답 타입 (performanceMetrics 기반)
export interface BackendPerformanceMetrics {
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

export interface BackendStrategyRule {
  id: number;
  name: string;
  description: string;
  type: string;
  parameters: Record<string, unknown>;
}

export interface BackendMonthlyReturn {
  year: number;
  month: number;
  returnPct: number;
}

export interface BackendBacktestTrade {
  tradeDate: string;
  ticker: string;
  side: string;
  quantity: number;
  price: number;
  amount: number;
  pnl: number | null;
  pnlPercent: number | null;
  holdingDays: number | null;
  signalReason: string | null;
}

export interface BackendStrategyDetail {
  id: number;
  name: string;
  description: string;
  category: BackendCategory;
  isPremium: boolean;
  stockSelectionType: string;
  subscriberCount: number;
  averageRating: number;
  rebalanceFrequency: string;
  performanceMetrics: BackendPerformanceMetrics | null;
  equityCurve: EquityCurvePoint[];
  currentHoldings: unknown[];
  rules: BackendStrategyRule[];
  monthlyReturns: BackendMonthlyReturn[];
  trades: BackendBacktestTrade[];
  riskSettings?: string;
  positionSizing?: string;
  tradingCosts?: string;
  createdAt: string;
}

export interface EquityCurvePoint {
  date: string;
  value: number;
}

// 전략 기본 종목 타입
export interface DefaultStockResponse {
  id: number;
  strategyId: number;
  stockId: number;
  ticker: string;
  stockName: string;
  stockNameEn: string | null;
  market: string;
  targetWeight: number;
  memo: string | null;
  createdAt: string;
}

export interface DefaultStockListResponse {
  stocks: DefaultStockResponse[];
  totalWeight: number;
}

// 사용자 포트폴리오 타입
export interface PortfolioStockResponse {
  id: number;
  portfolioId: number;
  stockId: number;
  ticker: string;
  stockName: string;
  stockNameEn: string | null;
  market: string;
  targetWeight: number;
  isFromStrategy: boolean;
  memo: string | null;
  addedAt: string;
}

export interface PortfolioStockListResponse {
  stocks: PortfolioStockResponse[];
  totalWeight: number;
}
