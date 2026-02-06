// 백테스트 상태
export type BacktestStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

// 리밸런싱 주기
export type RebalancePeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';

// 벤치마크 종류
export type BenchmarkType = 'KOSPI' | 'KOSDAQ' | 'SPX';

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
  estimatedTime: number; // 예상 소요 시간(초)
  message: string;
}

// 백테스트 성과 지표
export interface BacktestMetrics {
  cagr: number; // 연환산 수익률 (%)
  mdd: number; // 최대 낙폭 (%)
  sharpeRatio: number;
  winRate: number; // 승률 (%)
  totalReturn: number; // 총 수익률 (%)
  totalTrades: number;
  profitFactor: number;
  avgReturn: number; // 평균 수익률 (%)
}

// 수익 곡선 데이터 포인트
export interface BacktestEquityPoint {
  date: string;
  value: number;
  benchmark: number;
}

// 거래 내역
export interface BacktestTradeResponse {
  tradeDate: string;
  ticker: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  amount: number;
  pnl: number;
  pnlPercent: number;
}

// 백테스트 결과 응답 (폴링 결과)
export interface BacktestResultResponse {
  id: string;
  strategyId: string;
  strategyName: string;
  status: BacktestStatus;
  metrics: BacktestMetrics | null;
  equityCurve: BacktestEquityPoint[];
  benchmarkCurve: BacktestEquityPoint[];
  trades: BacktestTradeResponse[];
  errorMessage?: string;
}
