import type {
  InvestmentCategory,
  MarketPreference,
  RiskTolerance,
  UserPreferences,
} from '@/types/onboarding';
import { getPreferences } from '@/lib/api/preferences';

// 백엔드 → 프론트엔드 risk tolerance 역매핑
const BACKEND_TO_RISK: Record<string, RiskTolerance> = {
  CONSERVATIVE: 'low',
  MODERATE: 'medium',
  AGGRESSIVE: 'high',
};

// localStorage 키
const ONBOARDING_KEY = 'onboarding_completed';
const PREFERENCES_KEY = 'user_preferences';
const AUTH_RETURN_URL_KEY = 'auth_return_url';

// --- localStorage 헬퍼 ---

export function isOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

/**
 * 온보딩 완료 여부를 비동기로 확인합니다.
 * localStorage를 우선 확인하고, 없으면 백엔드 API를 확인합니다.
 */
export async function isOnboardingCompletedAsync(): Promise<boolean> {
  // localStorage 우선 확인
  if (isOnboardingCompleted()) return true;

  // 백엔드에서 확인
  try {
    const prefs = await getPreferences();
    if (prefs?.onboardingCompleted) {
      // localStorage에도 동기화
      setOnboardingCompleted();
      if (prefs.riskTolerance) {
        const validCategories: InvestmentCategory[] = [
          'value',
          'momentum',
          'asset_allocation',
          'quant_composite',
          'seasonal',
          'ml_prediction',
        ];
        const validMarkets: MarketPreference[] = ['KR', 'US', 'CRYPTO'];
        const validRisks: RiskTolerance[] = ['low', 'medium', 'high'];

        const filteredCategories = (prefs.investmentCategories ?? []).filter(
          (c): c is InvestmentCategory => validCategories.includes(c as InvestmentCategory),
        );
        const filteredMarkets = (prefs.markets ?? []).filter((m): m is MarketPreference =>
          validMarkets.includes(m as MarketPreference),
        );
        const mappedRisk = BACKEND_TO_RISK[prefs.riskTolerance] ?? prefs.riskTolerance;
        const validatedRisk = validRisks.includes(mappedRisk as RiskTolerance)
          ? (mappedRisk as RiskTolerance)
          : 'medium';

        setUserPreferences({
          investmentCategories: filteredCategories,
          markets: filteredMarkets,
          riskTolerance: validatedRisk,
        });
      }
      return true;
    }
  } catch {
    // 백엔드 실패 시 localStorage 결과만 사용
  }
  return false;
}

export function setOnboardingCompleted(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

/** 로그아웃 또는 신규 가입 시 온보딩 상태를 초기화합니다. */
export function clearOnboardingState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ONBOARDING_KEY);
  localStorage.removeItem(PREFERENCES_KEY);
}

export function getUserPreferences(): UserPreferences | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PREFERENCES_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      !Array.isArray(parsed.investmentCategories) ||
      !Array.isArray(parsed.markets) ||
      typeof parsed.riskTolerance !== 'string'
    ) {
      return null;
    }
    return parsed as UserPreferences;
  } catch {
    return null;
  }
}

export function setUserPreferences(prefs: UserPreferences): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

/**
 * 로그인 후 돌아갈 URL을 저장합니다.
 * /auth로 시작하는 URL은 저장하지 않습니다.
 */
export function saveAuthReturnUrl(url: string): void {
  if (typeof window === 'undefined') return;
  // 절대 URL이면 pathname만 추출
  const path = url.startsWith('http') ? new URL(url).pathname + new URL(url).search : url;
  if (path && !path.startsWith('/auth') && path !== '/') {
    localStorage.setItem(AUTH_RETURN_URL_KEY, path);
  }
}

/** 저장된 returnUrl을 읽고 삭제합니다. */
export function getAndClearAuthReturnUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const url = localStorage.getItem(AUTH_RETURN_URL_KEY);
  if (url) localStorage.removeItem(AUTH_RETURN_URL_KEY);
  return url;
}

/** 로그인 후 리다이렉트 경로 반환 — returnUrl 우선, 없으면 onboarding 여부로 결정 (비동기: 백엔드 확인 포함) */
export async function getPostLoginRedirect(): Promise<string> {
  const returnUrl = getAndClearAuthReturnUrl();
  if (returnUrl) return returnUrl;
  const completed = await isOnboardingCompletedAsync();
  return completed ? '/' : '/onboarding';
}

// --- 표시용 상수 ---

export const CATEGORY_OPTIONS: {
  value: InvestmentCategory;
  label: string;
  icon: string;
  description: string;
}[] = [
  { value: 'value', label: '가치투자', icon: '💎', description: '저평가 종목 발굴' },
  { value: 'momentum', label: '모멘텀', icon: '🚀', description: '상승 추세 추종' },
  { value: 'asset_allocation', label: '자산배분', icon: '⚖️', description: '분산 투자 전략' },
  { value: 'quant_composite', label: 'AI 복합', icon: '🧮', description: '다중 팩터 분석' },
  { value: 'seasonal', label: '시즌널', icon: '📅', description: '계절/이벤트 패턴' },
  { value: 'ml_prediction', label: 'AI 예측', icon: '🤖', description: 'AI 기반 매매 신호' },
];

export const MARKET_OPTIONS: {
  value: MarketPreference;
  label: string;
  icon: string;
  description: string;
}[] = [
  { value: 'KR', label: '한국 주식', icon: '🇰🇷', description: 'KOSPI · KOSDAQ' },
  { value: 'US', label: '미국 주식', icon: '🇺🇸', description: 'NYSE · NASDAQ' },
  { value: 'CRYPTO', label: '암호화폐', icon: '₿', description: 'BTC · ETH 등' },
];

export const RISK_OPTIONS: {
  value: RiskTolerance;
  label: string;
  icon: string;
  description: string;
}[] = [
  { value: 'low', label: '안정형', icon: '🛡️', description: '원금 보전 우선, 낮은 변동성 선호' },
  { value: 'medium', label: '균형형', icon: '⚖️', description: '적정 수익과 안정성의 균형' },
  { value: 'high', label: '공격형', icon: '🔥', description: '높은 수익 추구, 변동성 감수' },
];
