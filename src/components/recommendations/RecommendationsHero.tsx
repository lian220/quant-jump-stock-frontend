'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface HeroStats {
  totalCount: number;
  maxUpsideTicker: string | null;
  maxUpsidePercent: number;
  avgUpside: number;
  strongCount: number;
}

interface Props {
  displayDate: string;
  isLoading: boolean;
  heroStats: HeroStats | null;
}

export function RecommendationsHero({ displayDate, isLoading, heroStats }: Props) {
  // 가이드 토글 (첫 방문 시 자동 표시)
  const [showGuide, setShowGuide] = useState(false);
  useEffect(() => {
    if (localStorage.getItem('recommendations-guide-seen') !== 'true') {
      setShowGuide(true);
    }
  }, []);

  return (
    <div className="mb-4 md:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-0.5">
            🤖 AI 분석
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            오늘의 주목 종목
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          {displayDate
            ? `${new Date(displayDate + 'T00:00:00').toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })} 마감 가격 기준`
            : '최신 데이터 로딩 중...'}
          <span className="hidden sm:inline text-slate-600 ml-2">· 매일 23:05 업데이트</span>
        </p>
      </div>

      {/* 핵심 통계 인라인 */}
      {heroStats && !isLoading && (
        <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-400 mb-3">
          <span>
            <span className="text-base sm:text-lg font-bold text-white tabular-nums">
              {heroStats.totalCount}
            </span>
            개 분석
          </span>
          <span className="text-slate-700">|</span>
          <span>
            <span className="text-base sm:text-lg font-bold text-emerald-400 tabular-nums">
              {heroStats.strongCount}
            </span>
            개 AI 추천
          </span>
          {heroStats.maxUpsidePercent > 0 && (
            <>
              <span className="text-slate-700">|</span>
              <span>
                최대 예상 수익률{' '}
                <span className="font-semibold text-emerald-400">
                  +{heroStats.maxUpsidePercent.toFixed(1)}%
                </span>
                {heroStats.maxUpsideTicker && (
                  <span className="text-slate-500 ml-1">· {heroStats.maxUpsideTicker}</span>
                )}
              </span>
            </>
          )}
          {heroStats.avgUpside > 0 && (
            <>
              <span className="text-slate-700">|</span>
              <span>
                평균 예상 수익률{' '}
                <span className="font-semibold text-cyan-400">+{heroStats.avgUpside}%</span>
              </span>
            </>
          )}
        </div>
      )}

      {/* 가이드 토글 */}
      {heroStats && !isLoading && (
        <>
          <button
            onClick={() => {
              setShowGuide((prev) => {
                if (prev) {
                  localStorage.setItem('recommendations-guide-seen', 'true');
                }
                return !prev;
              });
            }}
            className="text-xs text-slate-500 hover:text-slate-400 transition-colors flex items-center gap-1"
          >
            <span>💡 처음이라면? 보는 법 안내</span>
            <svg
              className={`w-3 h-3 transition-transform ${showGuide ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {showGuide && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mt-3">
              <div className="flex items-start gap-2.5 bg-slate-800/40 rounded-lg p-3">
                <span className="text-lg leading-none mt-0.5">📊</span>
                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-0.5">
                    종합 점수 (100점 만점)
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    AI 예측, 차트 패턴, 뉴스 분위기를 합산한 점수예요. 점수가 높을수록 AI가
                    긍정적으로 본 종목이에요.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-slate-800/40 rounded-lg p-3">
                <span className="text-lg leading-none mt-0.5">🎯</span>
                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-0.5">예상 수익률</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    지금 가격에서 AI가 예측한 목표 가격까지 얼마나 오를 수 있는지 보여줘요. 예:
                    +15%면 15% 상승 가능성이에요.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-slate-800/40 rounded-lg p-3">
                <span className="text-lg leading-none mt-0.5">🤖</span>
                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-0.5">왜 이 종목을?</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    AI가 이 종목을 선택한 이유를 태그로 요약해줘요. 예: &quot;AI 예측 강세&quot;,
                    &quot;뉴스 긍정적&quot; 등
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
