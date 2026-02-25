'use client';

import type { UserPreferences } from '@/types/onboarding';
import { CATEGORY_OPTIONS, MARKET_OPTIONS, RISK_OPTIONS } from '@/lib/onboarding';
import { Badge } from '@/components/ui/badge';

interface StepCompleteProps {
  preferences: UserPreferences;
  onGoStrategies: () => void;
  onGoRecommendations: () => void;
}

interface GuideStep {
  step: string;
  title: string;
  description: string;
  color: string;
  bg: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    step: '1',
    title: '맞춤 전략 찾기',
    description: '내 투자 성향에 맞는 검증된 투자 전략을 탐색하세요.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    step: '2',
    title: '전략 구독 & 성과 검증',
    description: '마음에 드는 전략을 구독하고 과거 수익률을 직접 검증하세요.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    step: '3',
    title: 'AI 추천으로 종목 발굴',
    description: 'AI가 매일 분석한 매수 신호 종목을 관심 목록에 추가하세요.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
];

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
      <div className="animate-in zoom-in-50 duration-500 mb-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
          <span className="text-3xl">🎉</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">설정 완료!</h2>
        <p className="text-slate-400 text-sm">맞춤 투자 여정을 시작할 준비가 됐어요.</p>
      </div>

      {/* 가입 축하 혜택 배너 */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 mb-4 text-left">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">🎁</span>
          <p className="text-sm font-semibold text-emerald-400">가입 축하 혜택</p>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <span className="font-medium text-white">무료 시뮬레이션 1회</span>가 제공됩니다. 전략을
          구독한 뒤 시뮬레이션 화면에서 사용하세요.
        </p>
      </div>

      {/* 내 투자 프로필 */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 mb-4 text-left">
        <h3 className="text-xs font-semibold text-slate-400 mb-3">내 투자 프로필</h3>
        <div className="space-y-3">
          <div>
            <p className="text-[11px] text-slate-500 mb-1.5">관심 전략</p>
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
          <div>
            <p className="text-[11px] text-slate-500 mb-1.5">관심 시장</p>
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
          <div>
            <p className="text-[11px] text-slate-500 mb-1.5">위험 성향</p>
            <Badge
              variant="secondary"
              className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs"
            >
              {riskLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* 3단계 시작 가이드 */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 mb-5 text-left">
        <h3 className="text-xs font-semibold text-slate-400 mb-3">🗺️ 시작 가이드</h3>
        <div className="space-y-2.5">
          {GUIDE_STEPS.map(({ step, title, description, color, bg }) => (
            <div key={step} className={`flex gap-3 rounded-lg border p-2.5 ${bg}`}>
              <div
                className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${color} bg-slate-800`}
              >
                {step}
              </div>
              <div>
                <p className={`text-xs font-semibold ${color} mb-0.5`}>{title}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA 버튼 */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={onGoStrategies}
          className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          맞춤 전략 둘러보기 →
        </button>
        <button
          type="button"
          onClick={onGoRecommendations}
          className="w-full rounded-xl border border-slate-600 px-6 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:border-slate-500"
        >
          AI 종목 추천으로 관심 종목 발굴
        </button>
      </div>
    </div>
  );
}
