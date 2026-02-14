'use client';

import type { UserPreferences } from '@/types/onboarding';
import { CATEGORY_OPTIONS, MARKET_OPTIONS, RISK_OPTIONS } from '@/lib/onboarding';
import { Badge } from '@/components/ui/badge';

interface StepCompleteProps {
  preferences: UserPreferences;
  onGoStrategies: () => void;
  onGoRecommendations: () => void;
}

export function StepComplete({
  preferences,
  onGoStrategies,
  onGoRecommendations,
}: StepCompleteProps) {
  const categoryLabels = preferences.investmentCategories.map(
    (cat) => CATEGORY_OPTIONS.find((o) => o.value === cat)?.label ?? cat,
  );
  const marketLabels = preferences.markets.map(
    (m) => MARKET_OPTIONS.find((o) => o.value === m)?.label ?? m,
  );
  const riskLabel =
    RISK_OPTIONS.find((o) => o.value === preferences.riskTolerance)?.label ??
    preferences.riskTolerance;

  return (
    <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300 text-center">
      {/* 축하 아이콘 */}
      <div className="animate-in zoom-in-50 duration-500 mb-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
          <span className="text-4xl">🎉</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">설정 완료!</h2>
        <p className="text-slate-400 text-sm">맞춤 투자 여정을 시작할 준비가 됐어요.</p>
      </div>

      {/* 선택 요약 */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 mb-8 text-left">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">내 투자 프로필</h3>

        <div className="space-y-4">
          {/* 투자 전략 */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">관심 전략</p>
            <div className="flex flex-wrap gap-1.5">
              {categoryLabels.map((label) => (
                <Badge
                  key={label}
                  variant="secondary"
                  className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs"
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          {/* 관심 시장 */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">관심 시장</p>
            <div className="flex flex-wrap gap-1.5">
              {marketLabels.map((label) => (
                <Badge
                  key={label}
                  variant="secondary"
                  className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs"
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          {/* 리스크 성향 */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">리스크 성향</p>
            <Badge
              variant="secondary"
              className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs"
            >
              {riskLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* CTA 버튼 */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={onGoStrategies}
          className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          맞춤 전략 둘러보기
        </button>
        <button
          type="button"
          onClick={onGoRecommendations}
          className="w-full rounded-xl border border-slate-600 px-6 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:border-slate-500"
        >
          AI 종목 추천 보기
        </button>
      </div>
    </div>
  );
}
