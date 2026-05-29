'use client';

import type { PredictionStatsResponse } from '@/lib/api/predictions';

interface Props {
  predictionStats: PredictionStatsResponse | undefined;
  strongCount: number;
  aGradeRatio: number | null;
  lastUpdated: string | null;
  isLoadingRecommendations: boolean;
}

export function HomeMiniDashboard({
  predictionStats,
  strongCount,
  aGradeRatio,
  lastUpdated,
  isLoadingRecommendations,
}: Props) {
  if (!predictionStats && isLoadingRecommendations) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-40 mx-auto mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center">
                  <div className="h-8 bg-slate-700 rounded w-16 mx-auto mb-2" />
                  <div className="h-3 bg-slate-700 rounded w-12 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl lg:max-w-none mx-auto text-left">
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6">
        <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4 text-center leading-relaxed">
          오늘 AI가{' '}
          <span className="text-white font-semibold">
            {predictionStats?.uniqueTickers ?? '...'}개
          </span>{' '}
          종목을 분석해서 <span className="text-emerald-400 font-semibold">{strongCount}개</span>를
          골랐어요
        </p>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="bg-slate-700/30 rounded-lg p-3 text-center">
            <p className="text-lg sm:text-2xl font-bold text-cyan-400 tabular-nums">
              {aGradeRatio !== null ? `${aGradeRatio}%` : '...'}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400">
              좋은 평가 비율 <span className="text-slate-500">(30일)</span>
            </p>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-3 text-center">
            <p className="text-lg sm:text-2xl font-bold text-purple-400 tabular-nums">
              {predictionStats?.avgCompositeScore != null
                ? `${Math.min(Math.round((predictionStats.avgCompositeScore / 4.0) * 100), 100)}점`
                : '...'}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400">
              평균 AI 점수 <span className="text-slate-500">(100점 만점)</span>
            </p>
          </div>
        </div>
        {lastUpdated && (
          <p className="text-[10px] text-slate-500 text-center">
            마지막 업데이트: {new Date(lastUpdated).toLocaleDateString('ko-KR')}
          </p>
        )}
      </div>
    </div>
  );
}
