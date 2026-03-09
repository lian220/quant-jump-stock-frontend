/**
 * 예측/추천 API 클라이언트
 * ML 모델 예측 결과 및 매수 신호 조회
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

// === 타입 정의 ===

export type Signal = 'BUY' | 'SELL' | 'HOLD';
export type CompositeGrade = 'A' | 'B' | 'C' | 'D' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'LOW';
export type SignalTier = 'strong' | 'medium' | 'weak';

export interface BuySignal {
  ticker: string;
  stockName: string;
  analysisDate: string;
  compositeScore: number;
  compositeGrade: CompositeGrade;
  aiScore: number;
  techScore: number;
  sentimentScore: number;
  // 정규화 점수 (0-100): 백엔드에서 계산
  techScoreDisplay: number;
  aiScoreDisplay: number;
  sentimentScoreDisplay: number;
  compositeScoreDisplay: number;
  isRecommended: boolean;
  recommendationReason?: string;
  currentPrice?: number;
  targetPrice?: number;
  upsidePercent?: number;
  priceRecommendation?: string;
}

export interface BuySignalsResponse {
  data: BuySignal[];
  date: string | null; // 실제 조회된 날짜 (백엔드 fallback 적용 후)
}

// === Tier 분류 ===

/** Tier 기준 (AI/감정 점수 통합 반영, 현재 범위 ~0.6~3.5) */
export const TIER_THRESHOLDS = {
  STRONG: 2.5, // 상위 ~25% → "AI 추천"
  MEDIUM: 1.5, // 중간 ~50% → "분석 참고"
} as const;

/** 종목을 Tier별로 분류 */
export function classifyByTier(signals: BuySignal[]): {
  strong: BuySignal[];
  medium: BuySignal[];
  weak: BuySignal[];
} {
  const strong: BuySignal[] = [];
  const medium: BuySignal[] = [];
  const weak: BuySignal[] = [];

  for (const signal of signals) {
    const score = signal.compositeScore;
    if (score >= TIER_THRESHOLDS.STRONG) {
      strong.push(signal);
    } else if (score >= TIER_THRESHOLDS.MEDIUM) {
      medium.push(signal);
    } else {
      weak.push(signal);
    }
  }

  // 각 Tier 내에서 점수 높은 순 정렬
  const byScoreDesc = (a: BuySignal, b: BuySignal) => b.compositeScore - a.compositeScore;

  strong.sort(byScoreDesc);
  medium.sort(byScoreDesc);
  weak.sort(byScoreDesc);

  return { strong, medium, weak };
}

/** Tier 라벨 및 스타일 */
export function getTierInfo(tier: SignalTier) {
  switch (tier) {
    case 'strong':
      return {
        label: '🔥 AI 추천 종목',
        subtitle: '강한 매수 신호가 감지된 종목',
        badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        borderClass: 'border-emerald-500/50',
      };
    case 'medium':
      return {
        label: '📊 분석된 종목 (참고용)',
        subtitle: '기술적 신호가 일부 감지된 종목',
        badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        borderClass: 'border-cyan-500/30',
      };
    case 'weak':
      return {
        label: '📈 모니터링 종목',
        subtitle: '약한 신호 - 추가 확인 필요',
        badgeClass: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        borderClass: 'border-slate-700',
      };
  }
}

// === 예측 신뢰도 검증 ===

/**
 * 예측가와 현재가의 괴리율(%)을 계산.
 * 양수 = 예측가 > 현재가, 음수 = 예측가 < 현재가
 */
export function getPriceDivergence(
  signal: Pick<BuySignal, 'currentPrice' | 'targetPrice'>,
): number | null {
  if (signal.currentPrice == null || signal.targetPrice == null || signal.currentPrice === 0) {
    return null;
  }
  return ((signal.targetPrice - signal.currentPrice) / signal.currentPrice) * 100;
}

/**
 * 예측 데이터의 신뢰도 상태를 반환.
 * aiScore가 높은데 upsidePercent가 크게 마이너스인 경우 → 예측 갱신 필요
 */
export type PredictionReliability = 'reliable' | 'stale' | 'conflict';

export function checkPredictionReliability(
  signal: Pick<BuySignal, 'aiScore' | 'upsidePercent' | 'currentPrice' | 'targetPrice'>,
): { status: PredictionReliability; message: string | null } {
  const divergence = getPriceDivergence(signal);

  // 데이터 부족
  if (divergence == null || signal.upsidePercent == null) {
    return { status: 'reliable', message: null };
  }

  // aiScore 높은데(≥7) upsidePercent가 크게 마이너스(≤-30%) → 모순
  if (signal.aiScore >= 7 && signal.upsidePercent <= -30) {
    return { status: 'conflict', message: '예측이 오래되어 부정확할 수 있어요' };
  }

  // 괴리율이 -50% 이상 → 예측 자체가 오래됨
  if (divergence <= -50) {
    return { status: 'stale', message: '예측 데이터가 오래됐어요' };
  }

  return { status: 'reliable', message: null };
}

// === 추가 타입 정의 ===

export interface PredictionStatsResponse {
  totalPredictions: number;
  uniqueTickers: number;
  avgCompositeScore: number;
  gradeDistribution: Record<string, number>;
  dateRange: { from: string; to: string };
}

export interface LatestPrediction {
  ticker: string;
  stockName: string;
  analysisDate: string;
  compositeScore: number;
  compositeGrade: CompositeGrade;
  isRecommended: boolean;
}

export interface LatestPredictionsResponse {
  predictions: LatestPrediction[];
  count: number;
  analysisDate: string;
}

export interface PredictionHistory {
  ticker: string;
  stockName: string;
  analysisDate: string;
  compositeScore: number;
  compositeGrade: CompositeGrade;
  techScore: number;
  aiScore: number;
  sentimentScore: number;
  isRecommended: boolean;
  recommendationReason?: string;
  currentPrice?: number | null;
  targetPrice?: number | null;
  upsidePercent?: number | null;
  priceRecommendation?: string | null;
}

export interface PredictionsBySymbolResponse {
  predictions: PredictionHistory[];
  ticker: string;
  totalCount: number;
}

export interface PredictionsByDateResponse {
  predictions: BuySignal[];
  date: string;
  count: number;
}

export interface GetBuySignalsParams {
  date?: string; // 조회 날짜 (YYYY-MM-DD, 기본값: 어제)
  minConfidence?: number; // 최소 신뢰도 (기본값: 0.7)
}

// === API 함수 ===

/**
 * 매수 신호 종목 조회
 * @param params - 필터링 옵션
 * @returns 매수 추천 종목 리스트
 */
export async function getBuySignals(params: GetBuySignalsParams = {}): Promise<BuySignalsResponse> {
  const searchParams = new URLSearchParams();

  if (params.date !== undefined) {
    searchParams.append('date', params.date);
  }

  if (params.minConfidence !== undefined) {
    searchParams.append('minConfidence', String(params.minConfidence));
  }

  const isBrowser = typeof window !== 'undefined';
  const baseUrl = isBrowser
    ? `/api/predictions/buy-signals`
    : `${API_URL}/api/v1/predictions/buy-signals`;
  const url = `${baseUrl}?${searchParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    cache: 'no-store', // 실시간 데이터이므로 캐시 안 함
  });

  if (!response.ok) {
    throw new Error(`매수 신호 조회 실패: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * 예측 통계 조회
 */
export async function getPredictionStats(days?: number): Promise<PredictionStatsResponse> {
  const searchParams = new URLSearchParams();
  if (days !== undefined) {
    searchParams.append('days', String(days));
  }

  const isBrowser = typeof window !== 'undefined';
  const baseUrl = isBrowser ? `/api/predictions/stats` : `${API_URL}/api/v1/predictions/stats`;
  const qs = searchParams.toString();
  const url = qs ? `${baseUrl}?${qs}` : baseUrl;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`예측 통계 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 최신 예측 결과 조회
 */
export async function getLatestPredictions(): Promise<LatestPredictionsResponse> {
  const isBrowser = typeof window !== 'undefined';
  const baseUrl = isBrowser ? `/api/predictions/latest` : `${API_URL}/api/v1/predictions/latest`;

  const response = await fetch(baseUrl, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`최신 예측 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 종목별 예측 이력 조회
 */
export async function getPredictionsBySymbol(
  symbol: string,
  limit?: number,
): Promise<PredictionsBySymbolResponse> {
  if (!symbol || !symbol.trim()) {
    throw new Error('종목 심볼이 필요합니다.');
  }

  const searchParams = new URLSearchParams();
  if (limit !== undefined) {
    searchParams.append('limit', String(limit));
  }

  const isBrowser = typeof window !== 'undefined';
  const baseUrl = isBrowser
    ? `/api/predictions/${encodeURIComponent(symbol)}`
    : `${API_URL}/api/v1/predictions/${encodeURIComponent(symbol)}`;
  const qs = searchParams.toString();
  const url = qs ? `${baseUrl}?${qs}` : baseUrl;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`종목 예측 이력 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 날짜별 예측 결과 조회
 */
export async function getPredictionsByDate(date: string): Promise<PredictionsByDateResponse> {
  const isBrowser = typeof window !== 'undefined';
  const baseUrl = isBrowser
    ? `/api/predictions/by-date/${encodeURIComponent(date)}`
    : `${API_URL}/api/v1/predictions/by-date/${encodeURIComponent(date)}`;

  const response = await fetch(baseUrl, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`날짜별 예측 조회 실패: ${response.status}`);
  }

  return response.json();
}

// === 점수 기준 설정 (향후 Admin에서 관리 예정) ===

/**
 * 신뢰도 점수 등급 기준
 * TODO: Admin 페이지에서 동적 관리
 */
export const CONFIDENCE_GRADE_THRESHOLDS = {
  VERY_HIGH: 0.9,
  HIGH: 0.8,
  MEDIUM: 0.7,
} as const;

/**
 * 종합 점수 등급 기준
 *
 * 현재 상태: AI 통합 완료, 감정 분석 미반영 (sentimentScore = 0)
 * - 계산식: 0.3 × aiScore + 0.4 × techScore + 0.3 × sentimentScore
 * - 현재 범위: ~0.4 ~ 4.0 (감성 반영 시 최대 7.0)
 * - 프론트 표시: 100점 만점 변환 (score / 4.0 × 100)
 *
 * TODO: Admin 페이지에서 동적 관리
 */
export const COMPOSITE_SCORE_GRADE_THRESHOLDS = {
  CURRENT: {
    EXCELLENT: 3.0, // 상위 ~10% (거의 모든 지표 우수)
    GOOD: 2.0, // 상위 ~40% (대부분 지표 양호)
    FAIR: 1.2, // 상위 ~70% (일부 지표 충족)
  },
  // 향후 점수 범위 확장 시 기준
  FUTURE: {
    EXCELLENT: 6.0,
    GOOD: 4.0,
    FAIR: 2.0,
  },
} as const;

/**
 * 현재 사용 중인 점수 기준 모드
 * TODO: Admin에서 전환 가능하도록 개발
 */
export const CURRENT_SCORE_MODE: 'CURRENT' | 'FUTURE' = 'CURRENT';

/**
 * 신뢰도 점수를 등급으로 변환
 */
export function getConfidenceGrade(confidence: number): {
  grade: string;
  color: string;
} {
  const thresholds = CONFIDENCE_GRADE_THRESHOLDS;

  if (confidence >= thresholds.VERY_HIGH) {
    return { grade: '매우 높음', color: 'text-emerald-400' };
  }
  if (confidence >= thresholds.HIGH) {
    return { grade: '높음', color: 'text-cyan-400' };
  }
  if (confidence >= thresholds.MEDIUM) {
    return { grade: '중간', color: 'text-yellow-400' };
  }
  return { grade: '낮음', color: 'text-slate-400' };
}

/**
 * 종합 점수를 등급으로 변환
 *
 * @param score - 종합 점수 (현재: 0~1.4, 통합 후: 0~7.5)
 * @returns 등급 정보 (grade, color, badge)
 */
export function getScoreGrade(score: number): {
  grade: string;
  color: string;
  badge: string;
} {
  const thresholds = COMPOSITE_SCORE_GRADE_THRESHOLDS[CURRENT_SCORE_MODE];

  if (score >= thresholds.EXCELLENT) {
    return {
      grade: '우수',
      color: 'text-emerald-400',
      badge: CURRENT_SCORE_MODE === 'CURRENT' ? 'BETA' : '',
    };
  }
  if (score >= thresholds.GOOD) {
    return {
      grade: '양호',
      color: 'text-cyan-400',
      badge: CURRENT_SCORE_MODE === 'CURRENT' ? 'BETA' : '',
    };
  }
  if (score >= thresholds.FAIR) {
    return {
      grade: '보통',
      color: 'text-yellow-400',
      badge: CURRENT_SCORE_MODE === 'CURRENT' ? 'BETA' : '',
    };
  }
  return {
    grade: '낮음',
    color: 'text-red-400',
    badge: CURRENT_SCORE_MODE === 'CURRENT' ? 'BETA' : '',
  };
}

/** priceRecommendation을 사용자 친화적 라벨로 변환 */
export function getPriceRecLabel(priceRec: string | undefined, fallback: string): string {
  switch (priceRec) {
    case '매도':
      return '주의';
    case '강력매수':
      return '강력 추천';
    case '매수':
      return '추천';
    case '보유':
      return '관망';
    default:
      return priceRec ?? fallback;
  }
}

/** recommendationReason에서 기술 지표 키워드를 파싱하여 배지 라벨 배열 반환 */
export function parseIndicatorBadges(reason?: string): string[] {
  if (!reason) return [];
  const badges: string[] = [];
  const lower = reason.toLowerCase();
  if (
    lower.includes('골든크로스') ||
    lower.includes('golden_cross') ||
    lower.includes('golden cross')
  ) {
    badges.push('골든크로스');
  }
  if (lower.includes('rsi')) {
    if (lower.includes('과매수') || lower.includes('overbought')) {
      badges.push('RSI 과열');
    } else if (lower.includes('과매도') || lower.includes('oversold') || lower.includes('저점')) {
      badges.push('RSI 저점');
    }
  }
  if (lower.includes('macd')) {
    if (
      lower.includes('매도') ||
      lower.includes('sell') ||
      lower.includes('bearish') ||
      lower.includes('하락')
    ) {
      badges.push('MACD 하락');
    } else if (
      lower.includes('매수') ||
      lower.includes('buy') ||
      lower.includes('bullish') ||
      lower.includes('상승')
    ) {
      badges.push('MACD 상승');
    }
  }
  if (lower.includes('볼린저') || lower.includes('bollinger')) {
    if (lower.includes('하단') || lower.includes('lower') || lower.includes('below')) {
      badges.push('볼린저 하단');
    } else if (lower.includes('상단') || lower.includes('upper') || lower.includes('above')) {
      badges.push('볼린저 상단');
    }
  }
  return badges;
}

/** 등급 분포에서 우수+양호 비율 계산 */
export function computeAGradeRatio(dist: Record<string, number>): number | null {
  const total = Object.values(dist).reduce((sum, v) => sum + v, 0);
  const excellent = (dist['EXCELLENT'] ?? 0) + (dist['GOOD'] ?? 0);
  return total > 0 ? Math.round((excellent / total) * 100) : null;
}
