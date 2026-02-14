import type {
  InvestmentCategory,
  MarketPreference,
  RiskTolerance,
  UserPreferences,
} from '@/types/onboarding';

// localStorage 키
const ONBOARDING_KEY = 'onboarding_completed';
const PREFERENCES_KEY = 'user_preferences';

// --- localStorage 헬퍼 ---

export function isOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function setOnboardingCompleted(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

export function getUserPreferences(): UserPreferences | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PREFERENCES_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserPreferences;
  } catch {
    return null;
  }
}

export function setUserPreferences(prefs: UserPreferences): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

/** 로그인 후 리다이렉트 경로 반환 */
export function getPostLoginRedirect(): string {
  return isOnboardingCompleted() ? '/' : '/onboarding';
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
  { value: 'quant_composite', label: '퀀트 복합', icon: '🧮', description: '다중 팩터 분석' },
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
