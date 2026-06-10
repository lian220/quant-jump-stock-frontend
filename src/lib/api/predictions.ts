/**
 * 예측/추천 API 클라이언트
 * ML 모델 예측 결과 및 매수 신호 조회
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

// === 타입 정의 ===

export type Signal = 'BUY' | 'SELL' | 'HOLD';

/**
 * 종합 등급 (백엔드 SSoT).
 * ADR 0006 §2.6: 0~100 percentile 기반으로 백엔드가 산출하며,
 * 프론트는 재계산하지 않고 표시만 한다.
 * 레거시 enum(EXCELLENT/GOOD/FAIR/LOW)이 섞여올 수 있어 입력 타입에는 포함하되,
 * 화면에서는 normalizeGrade로 S/A/B/C/D로 정규화한다.
 */
export type CompositeGrade = 'S' | 'A' | 'B' | 'C' | 'D';
export type CompositeGradeInput =
  | CompositeGrade
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'LOW'
  | string
  | null
  | undefined;
export type SignalTier = 'strong' | 'medium' | 'weak';

/** 축별 기여도 (0~100). ADR 0006 §2.9 XAI. */
export interface AxisContributions {
  tech?: number;
  ai?: number;
  sentiment?: number;
}

export interface BuySignal {
  ticker: string;
  stockName: string;
  analysisDate: string;
  // ADR 0006: 0~100 단일 스케일 (저장값). display는 하위호환 별칭.
  compositeScore: number; // 0~100
  compositeGrade: CompositeGradeInput; // 백엔드 SSoT (S|A|B|C|D, 레거시 enum 혼입 가능)
  aiScore: number; // 원점수 0~10 (강도 = aiScore/10×100)
  techScore: number; // 원점수 0~3.5
  sentimentScore: number; // 원점수 0~10
  /** @deprecated ADR 0006 — 0~100 단일 스케일 전환으로 별도 display 불필요. 전환기 하위호환 별칭, 추후 제거. compositeScore/axisContributions 사용. */
  techScoreDisplay: number;
  /** @deprecated compositeScore/axisContributions 사용 */
  aiScoreDisplay: number;
  /** @deprecated compositeScore/axisContributions 사용 */
  sentimentScoreDisplay: number;
  /** @deprecated = compositeScore. 하위호환 별칭, 추후 제거. */
  compositeScoreDisplay: number;
  // ADR 0006 §2.9 XAI / §5 커버리지 노출
  axisContributions?: AxisContributions; // 0~100 축별 기여도 (우선 사용)
  scoreCoverage?: number; // 0~1 점수 산출 커버리지
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

// === 등급 기반 Tier 분류 (점수 임계 재계산 금지, 백엔드 grade 사용) ===

/**
 * 종목을 Tier별로 분류.
 * ADR 0006 §2.8: 프론트는 점수 임계값을 재정의하지 않는다.
 * 백엔드 compositeGrade(S/A/B/C/D)로만 분류한다.
 * - strong: S, A (강한 매수)
 * - medium: B, C (보통~약한 매수)
 * - weak:   D (신호 없음)
 */
export function classifyByTier(signals: BuySignal[]): {
  strong: BuySignal[];
  medium: BuySignal[];
  weak: BuySignal[];
} {
  const strong: BuySignal[] = [];
  const medium: BuySignal[] = [];
  const weak: BuySignal[] = [];

  for (const signal of signals) {
    const grade = normalizeGrade(signal.compositeGrade);
    if (grade === 'S' || grade === 'A') {
      strong.push(signal);
    } else if (grade === 'B' || grade === 'C') {
      medium.push(signal);
    } else {
      weak.push(signal);
    }
  }

  // 각 Tier 내에서 점수 높은 순 정렬 (표시 순서용, 임계 판정 아님)
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
  compositeScore: number; // 0~100
  compositeGrade: CompositeGradeInput;
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
  compositeScore: number; // 0~100
  compositeGrade: CompositeGradeInput;
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
 * 레거시 등급 enum(EXCELLENT/GOOD/FAIR/LOW)을 S/A/B/C/D로 정규화한다.
 * ADR 0006 전환 과정에서 구 응답이 섞여올 가능성에 대한 방어 로직.
 * 알 수 없는 값은 'D'(신호 없음)로 안전하게 폴백한다.
 */
export function normalizeGrade(grade: CompositeGradeInput): CompositeGrade {
  switch (grade) {
    case 'S':
    case 'A':
    case 'B':
    case 'C':
    case 'D':
      return grade;
    // 레거시 enum 매핑 (4등급 → 5등급)
    case 'EXCELLENT':
      return 'A';
    case 'GOOD':
      return 'B';
    case 'FAIR':
      return 'C';
    case 'LOW':
      return 'D';
    default:
      return 'D';
  }
}

/** 등급 표시 정보 (라벨/색/뱃지). presentation mapping만 담당. */
export interface GradeDisplay {
  /** 정규화된 등급 (S/A/B/C/D) */
  grade: CompositeGrade;
  /** 사용자용 라벨 */
  label: string;
  /** Tailwind 텍스트 색 클래스 */
  color: string;
  /** 게이지/막대용 배경색 클래스 */
  bar: string;
  /** BETA 뱃지 (§5 시계열 단절 커뮤니케이션) */
  badge: 'BETA';
}

/**
 * 종합 등급을 표시 정보로 변환하는 순수 매핑 함수.
 *
 * ADR 0006 §2.8: 프론트는 점수 임계값을 재계산/재정의하지 않는다.
 * 백엔드 compositeGrade(S/A/B/C/D)를 그대로 입력받아 색/라벨만 매핑한다.
 * 색상은 scoring_spec.yaml grade 색과 정합:
 *   S → emerald(매우 강한 매수), A → cyan(강한 매수),
 *   B → yellow(보통 매수), C → orange(약한 매수), D → slate(신호 없음).
 *
 * @param grade - 백엔드 compositeGrade (레거시 enum도 normalizeGrade로 흡수)
 */
export function getScoreGrade(grade: CompositeGradeInput): GradeDisplay {
  const normalized = normalizeGrade(grade);
  switch (normalized) {
    case 'S':
      return {
        grade: 'S',
        label: '매우 강한 매수',
        color: 'text-emerald-400',
        bar: 'bg-emerald-400',
        badge: 'BETA',
      };
    case 'A':
      return {
        grade: 'A',
        label: '강한 매수',
        color: 'text-cyan-400',
        bar: 'bg-cyan-400',
        badge: 'BETA',
      };
    case 'B':
      return {
        grade: 'B',
        label: '보통 매수',
        color: 'text-yellow-400',
        bar: 'bg-yellow-400',
        badge: 'BETA',
      };
    case 'C':
      return {
        grade: 'C',
        label: '약한 매수',
        color: 'text-orange-400',
        bar: 'bg-orange-400',
        badge: 'BETA',
      };
    case 'D':
      return {
        grade: 'D',
        label: '신호 없음',
        color: 'text-slate-400',
        bar: 'bg-slate-400',
        badge: 'BETA',
      };
  }
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

/**
 * 등급 분포에서 상위 등급(S+A) 비율 계산.
 * ADR 0006: 등급 키는 S/A/B/C/D. 레거시 EXCELLENT/GOOD도 방어적으로 합산.
 */
export function computeAGradeRatio(dist: Record<string, number>): number | null {
  const total = Object.values(dist).reduce((sum, v) => sum + v, 0);
  const topGrades =
    (dist['S'] ?? 0) + (dist['A'] ?? 0) + (dist['EXCELLENT'] ?? 0) + (dist['GOOD'] ?? 0);
  return total > 0 ? Math.round((topGrades / total) * 100) : null;
}
