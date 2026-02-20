'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  isOnboardingCompletedAsync,
  setOnboardingCompleted,
  setUserPreferences,
} from '@/lib/onboarding';
import { savePreferences } from '@/lib/api/preferences';
import type {
  InvestmentCategory,
  MarketPreference,
  RiskTolerance,
  OnboardingStep,
  UserPreferences,
} from '@/types/onboarding';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { StepInvestmentStyle } from '@/components/onboarding/StepInvestmentStyle';
import { StepMarketRisk } from '@/components/onboarding/StepMarketRisk';
import { StepComplete } from '@/components/onboarding/StepComplete';
import { ChevronLeft } from 'lucide-react';

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [step, setStep] = useState<OnboardingStep>(1);

  // 선호도 상태
  const [categories, setCategories] = useState<InvestmentCategory[]>([]);
  const [markets, setMarkets] = useState<MarketPreference[]>([]);
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance | null>(null);

  const [saving, setSaving] = useState(false);

  // 미로그인 → /auth, 이미 완료 → /
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/auth');
      return;
    }
    // 비동기로 온보딩 완료 여부 확인 (localStorage + 백엔드)
    isOnboardingCompletedAsync().then((completed) => {
      if (completed) {
        router.replace('/');
      }
    });
  }, [user, loading, router]);

  // 건너뛰기
  const handleSkip = async () => {
    setOnboardingCompleted();
    // 백엔드에도 빈 성향으로 완료 표시 (실패해도 무시)
    savePreferences({ investmentCategories: [], markets: [], riskTolerance: null }).catch(() => {});
    router.push('/');
  };

  // 다음 스텝
  const handleNext = async () => {
    if (step === 1 && categories.length === 0) return;

    if (step === 2) {
      if (markets.length === 0 || !riskTolerance) return;

      setSaving(true);
      try {
        // Step 2 → 3: 선호도 저장
        const prefs: UserPreferences = {
          investmentCategories: categories,
          markets,
          riskTolerance,
        };

        // localStorage 저장 (오프라인 폴백)
        setUserPreferences(prefs);
        setOnboardingCompleted();

        // 백엔드 API 호출 (실패해도 진행)
        await savePreferences({
          investmentCategories: categories,
          markets,
          riskTolerance,
        }).catch(() => {});
      } finally {
        setSaving(false);
      }
    }

    if (step < TOTAL_STEPS) {
      setStep((s) => (s + 1) as OnboardingStep);
    }
  };

  // 이전 스텝
  const handleBack = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as OnboardingStep);
    }
  };

  // Step 3 CTA
  const handleGoStrategies = () => {
    const params = new URLSearchParams();
    if (categories[0]) params.set('category', categories[0]);
    if (riskTolerance) params.set('risk', riskTolerance);
    const qs = params.toString();
    router.push(qs ? `/strategies?${qs}` : '/strategies');
  };

  const handleGoRecommendations = () => {
    router.push('/recommendations');
  };

  // 유효성 체크
  const isStepValid = () => {
    if (step === 1) return categories.length > 0;
    if (step === 2) return markets.length > 0 && riskTolerance !== null;
    return true;
  };

  // 로딩/가드
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        {/* 뒤로가기 (step 1에서는 비활성) */}
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1}
          className="p-2 text-slate-400 hover:text-white disabled:opacity-0 transition-all"
          aria-label="이전"
        >
          <ChevronLeft size={20} />
        </button>

        {/* 프로그레스 */}
        <OnboardingProgress currentStep={step} totalSteps={TOTAL_STEPS} />

        {/* 건너뛰기 */}
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1"
          >
            건너뛰기
          </button>
        ) : (
          <div className="w-14" /> // 정렬용 빈 공간
        )}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-8 max-w-lg mx-auto w-full">
        {step === 1 && <StepInvestmentStyle selected={categories} onChange={setCategories} />}
        {step === 2 && (
          <StepMarketRisk
            markets={markets}
            riskTolerance={riskTolerance}
            onMarketsChange={setMarkets}
            onRiskChange={setRiskTolerance}
          />
        )}
        {step === 3 && riskTolerance && (
          <StepComplete
            preferences={{
              investmentCategories: categories,
              markets,
              riskTolerance,
            }}
            onGoStrategies={handleGoStrategies}
            onGoRecommendations={handleGoRecommendations}
          />
        )}
      </div>

      {/* 하단 네비게이션 (Step 3에서는 CTA가 StepComplete 안에 있으므로 숨김) */}
      {step < TOTAL_STEPS && (
        <div className="px-6 pb-8 max-w-lg mx-auto w-full">
          <button
            type="button"
            onClick={handleNext}
            disabled={!isStepValid() || saving}
            className="w-full rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? '저장 중...' : '다음'}
          </button>
        </div>
      )}
    </div>
  );
}
