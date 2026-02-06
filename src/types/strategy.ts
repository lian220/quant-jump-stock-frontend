// 전략 카테고리
export type StrategyCategory =
  | 'momentum' // 모멘텀
  | 'value' // 밸류
  | 'growth' // 성장주
  | 'dividend' // 배당주
  | 'factor' // 팩터
  | 'all'; // 전체

// 리스크 레벨
export type RiskLevel = 'low' | 'medium' | 'high';

// 정렬 옵션
export type SortOption =
  | 'popularity' // 인기순
  | 'return_high' // 수익률 높은순
  | 'return_low' // 수익률 낮은순
  | 'latest' // 최신순
  | 'risk_low'; // 리스크 낮은순

// 전략 인터페이스
export interface Strategy {
  id: string;
  name: string;
  description: string;
  category: StrategyCategory;
  author: string;
  authorAvatar?: string;

  // 성과 지표
  totalReturn: string; // 누적 수익률 (예: "+156.3%")
  annualReturn: string; // 연환산 수익률 (예: "+26.2%")
  maxDrawdown: string; // 최대 낙폭 (예: "-18.5%")
  winRate: string; // 승률 (예: "62%")
  sharpeRatio: string; // 샤프 비율 (예: "1.85")

  // 추가 정보
  riskLevel: RiskLevel;
  minInvestment: number; // 최소 투자금액
  subscribers: number; // 구독자 수
  rating: number; // 평점 (1-5)
  reviewCount: number; // 리뷰 수

  // 백테스트 정보
  backtestPeriod: string; // 백테스트 기간 (예: "2020-2024")
  updatedAt: string; // 마지막 업데이트
  isPremium: boolean; // 프리미엄 전략 여부

  // 태그
  tags: string[];
}

// 필터 상태
export interface StrategyFilter {
  category: StrategyCategory;
  riskLevel: RiskLevel | 'all';
  minReturn?: number; // 최소 수익률 필터
  isPremium?: boolean; // 프리미엄 전략만 보기
  search?: string; // 검색어
}

// 페이지네이션 정보
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

// API 응답 타입
export interface StrategyListResponse {
  strategies: Strategy[];
  pagination: PaginationInfo;
}

// 거래 내역
export interface BacktestTradeData {
  tradeDate: string;
  ticker: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  amount: number;
  pnl: number | null;
  pnlPercent: number | null;
  holdingDays: number | null;
  signalReason: string | null;
}

// 전략 상세 타입 (확장)
export interface StrategyDetail extends Strategy {
  // 전략 조건/룰
  rules: StrategyRuleItem[];
  // 수익 곡선 데이터
  equityCurve: EquityCurveData[];
  // 월별 수익률
  monthlyReturns: MonthlyReturnData[];
  // 거래 내역
  trades: BacktestTradeData[];
}

export interface StrategyRuleItem {
  id: number;
  name: string;
  description: string;
  type: 'entry' | 'exit' | 'filter' | 'rebalance';
  parameters: Record<string, string | number>;
}

export interface EquityCurveData {
  date: string;
  value: number;
  benchmark?: number;
}

export interface MonthlyReturnData {
  year: number;
  month: number;
  return: number;
}
