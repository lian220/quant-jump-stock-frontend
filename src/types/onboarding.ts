import type { StrategyCategory, RiskLevel } from './strategy';

// 'all' 제외한 투자 카테고리
export type InvestmentCategory = Exclude<StrategyCategory, 'all'>;

// 관심 시장
export type MarketPreference = 'KR' | 'US' | 'CRYPTO';

// 리스크 성향 (RiskLevel 재사용)
export type RiskTolerance = RiskLevel;

// 사용자 선호도
export interface UserPreferences {
  investmentCategories: InvestmentCategory[];
  markets: MarketPreference[];
  riskTolerance: RiskTolerance;
}

// 온보딩 스텝
export type OnboardingStep = 1 | 2 | 3;
