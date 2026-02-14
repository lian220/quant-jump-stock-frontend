// 백테스트 상태
export type BacktestStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

// 리밸런싱 주기
export type RebalancePeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';

// 벤치마크 종류 (동적으로 확장 가능)
export type BenchmarkType = 'SPY' | 'QQQ' | (string & {});

// 백테스트 실행 요청
export interface BacktestRunRequest {
  strategyId: string;
  startDate: string; // yyyy-MM-dd
  endDate: string;
  initialCapital: number;
  benchmark: BenchmarkType;
  rebalancePeriod: RebalancePeriod;
}

// 백테스트 실행 응답 (202 Accepted)
export interface BacktestRunResponse {
  backtestId: string;
  status: BacktestStatus;
  estimatedTime: number;
  message: string;
}

// 백테스트 성과 지표 (백엔드 응답에서 null 가능)
export interface BacktestMetrics {
  cagr: number | null;
  mdd: number | null;
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  winRate: number | null;
  totalReturn: number | null;
  volatility: number | null;
  totalTrades: number | null;
  winningTrades: number | null;
  losingTrades: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  benchmarkReturn: number | null;
  alpha: number | null;
  beta: number | null;
  totalCommission: number | null;
  totalSlippage: number | null;
  totalTax: number | null;
  netProfitAfterCosts: number | null;
  profitFactor: number | null;
  expectancy: number | null;
  kellyPercentage: number | null;
  totalTradesStoppedOut: number | null;
  totalTradesTakenProfit: number | null;
  avgHoldingPeriod: number | null;
  bestTrade: number | null;
  worstTrade: number | null;
  maxConsecutiveWins: number | null;
  maxConsecutiveLosses: number | null;
}

// 수익 곡선 데이터 포인트
export interface BacktestEquityPoint {
  date: string;
  value: number;
  benchmark: number | null;
}

// 거래 내역
export interface BacktestTradeResponse {
  tradeDate: string;
  ticker: string;
  side: 'BUY' | 'SELL';
  quantity: number | null;
  price: number | null;
  amount: number | null;
  pnl: number | null;
  pnlPercent: number | null;
}

// 등급별 지표
export interface GradedMetric {
  name: string;
  value: number | string | null;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  description: string;
}

// 용어 사전 항목
export interface GlossaryItem {
  term: string;
  definition: string;
  category: string;
}

// 강화 백테스트 결과
export interface EnhancedBacktestResult {
  backtestId: string;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  overallSummary: string;
  gradedMetrics: GradedMetric[];
  glossary: GlossaryItem[];
}

// 벤치마크 옵션
export interface BenchmarkOption {
  value: string;
  label: string;
  description?: string;
}

// 백테스트 결과 응답 (폴링 결과)
export interface BacktestResultResponse {
  id: string;
  strategyId: string | number;
  strategyName: string;
  status: BacktestStatus;
  metrics: BacktestMetrics | null;
  equityCurve: BacktestEquityPoint[];
  benchmarkCurve: BacktestEquityPoint[];
  trades: BacktestTradeResponse[];
  errorMessage?: string;
  createdAt?: string;
  completedAt?: string;
}
