/**
 * 예측/추천 API 클라이언트
 * ML 모델 예측 결과 및 매수 신호 조회
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

// === 타입 정의 ===

export type Signal = 'BUY' | 'SELL' | 'HOLD';
export type CompositeGrade = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'LOW';
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
  isRecommended: boolean;
  recommendationReason?: string;
  currentPrice?: number;
  targetPrice?: number;
  upsidePercent?: number;
  priceRecommendation?: string;
}

export interface BuySignalsResponse {
  data: BuySignal[];
}

// === Tier 분류 ===

/** Tier 기준 (현재 BETA: 기술적 지표만, max 1.4) */
export const TIER_THRESHOLDS = {
  STRONG: 0.8, // GOOD 이상 → "AI 추천"
  MEDIUM: 0.5, // FAIR 이상 → "분석 참고"
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
 * 현재 상태: AI/감정 분석 미통합 (기술적 지표만)
 * - 계산식: composite_score = 0.4 × tech_conditions_count (max 3.5)
 * - 현재 범위: 0 ~ 1.4
 *
 * 통합 후 예상:
 * - 계산식: 0.3 × rise_prob + 0.4 × tech + 0.3 × sentiment
 * - 예상 범위: 2.0 ~ 7.5
 *
 * TODO: Admin 페이지에서 동적 관리
 */
export const COMPOSITE_SCORE_GRADE_THRESHOLDS = {
  // 현재 기준 (AI/감정 미통합)
  CURRENT: {
    EXCELLENT: 1.2, // 85%ile (tech 조건 거의 모두 충족)
    GOOD: 0.8, // 57%ile (tech 조건 2개 이상)
    FAIR: 0.5, // 35%ile (tech 조건 1개 이상)
  },
  // 통합 후 기준 (참고용)
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
