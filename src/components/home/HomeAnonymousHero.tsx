'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getScoreGrade, checkPredictionReliability, type BuySignal } from '@/lib/api/predictions';
import { trackEvent } from '@/lib/analytics';
import type { PredictionStatsResponse } from '@/lib/api/predictions';

interface Props {
  lastUpdated: string | null;
  predictionStats: PredictionStatsResponse | undefined;
  totalStrategies: number | undefined;
  displayStocks: BuySignal[];
  isFallback: boolean;
}

export function HomeAnonymousHero({
  lastUpdated,
  predictionStats,
  totalStrategies,
  displayStocks,
  isFallback,
}: Props) {
  const buyCount = displayStocks.filter((s) => (s.compositeScoreDisplay ?? 0) >= 65).length;

  return (
    <div className="mb-6 md:mb-8 lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:items-center text-center lg:text-left">
      {/* ── 좌측: 텍스트 + CTA ── */}
      <div>
        {/* Eyebrow */}
        <span className="inline-flex items-center gap-2 mb-2.5 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/25 text-cyan-300 text-[11px] font-semibold tracking-wide">
          <span
            aria-hidden="true"
            className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse motion-reduce:animate-none"
          ></span>
          {lastUpdated
            ? `${new Date(lastUpdated).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 분석 완료`
            : '오늘 분석 완료'}
          {predictionStats?.uniqueTickers ? ` · ${predictionStats.uniqueTickers}개 종목` : ''}
        </span>
        <h1
          className="font-extrabold text-white mb-2.5 break-keep tracking-tight leading-[1.1]"
          style={{ fontSize: 'clamp(28px, 3.8vw, 52px)' }}
        >
          {/* fallback: emerald-300 solid (WCAG AA 4.5:1 on slate-900). 그라데이션 미지원 환경 + a11y 보강 */}
          <span className="text-emerald-300 supports-[background-clip:text]:bg-gradient-to-r supports-[background-clip:text]:from-emerald-300 supports-[background-clip:text]:to-cyan-300 supports-[background-clip:text]:bg-clip-text supports-[background-clip:text]:text-transparent">
            AI
          </span>
          가 골라준 미국 주식,{' '}
          <span className="text-emerald-300 supports-[background-clip:text]:bg-gradient-to-r supports-[background-clip:text]:from-emerald-300 supports-[background-clip:text]:to-cyan-300 supports-[background-clip:text]:bg-clip-text supports-[background-clip:text]:text-transparent">
            KIS
          </span>
          로 매수까지.
        </h1>
        <p
          className="text-slate-400 mb-4 max-w-[560px] mx-auto lg:mx-0 leading-relaxed"
          style={{ fontSize: 'clamp(13px, 1.05vw, 16px)' }}
        >
          주식이 처음이어도 괜찮아요. AI가 매일{' '}
          <strong className="text-slate-200">
            {predictionStats?.uniqueTickers ? `${predictionStats.uniqueTickers}개` : '수십 개'}
          </strong>{' '}
          미국 주식을 <strong className="text-slate-200">1~100점</strong>으로 채점, 높은 점수만
          추천합니다.
        </p>

        {/* Proof line — 한 줄 압축 */}
        <div className="mb-4 flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1.5 text-[12px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            🏦 <strong className="text-slate-200 font-semibold">KIS</strong> 계좌 연동
          </span>
          <span className="text-slate-700">·</span>
          <span className="inline-flex items-center gap-1.5">🇰🇷 한국어 분석</span>
          {totalStrategies ? (
            <>
              <span className="text-slate-700">·</span>
              <span className="inline-flex items-center gap-1.5">
                📊 검증된 전략{' '}
                <strong className="text-slate-200 font-semibold">{totalStrategies}개</strong>
              </span>
            </>
          ) : null}
        </div>

        {/* CTA 행 — Button asChild 패턴: a > button 중첩 방지 (a11y) */}
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center lg:justify-start items-stretch sm:items-center">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto min-w-[200px] bg-emerald-600 hover:bg-emerald-700 h-11 text-base"
          >
            <Link
              href="/recommendations"
              onClick={() =>
                trackEvent('landing_cta_click', {
                  cta: 'hero_primary_recommendations',
                  location: 'hero',
                })
              }
            >
              오늘의 AI 추천 보기 →
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto min-w-[200px] border-slate-600 text-slate-200 hover:bg-slate-800 h-11 text-base"
          >
            <Link
              href="/mypage?tab=kis"
              onClick={() =>
                trackEvent('landing_cta_click', {
                  cta: 'hero_secondary_kis',
                  location: 'hero',
                })
              }
            >
              KIS 계좌 연결로 시작
            </Link>
          </Button>
        </div>
        <p className="mt-2 text-[12px] text-slate-500">가입 없이 미리보기 가능 · 신용카드 불필요</p>
      </div>

      {/* ── 우측: AI 점수 띠 카드 ── */}
      <div className="mt-5 lg:mt-0 mx-auto lg:mx-0 max-w-[680px] bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 text-left">
        <div className="flex items-center gap-2 mb-2.5 text-[12px] font-semibold text-slate-300">
          <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-bold">
            ?
          </span>
          <span>AI 점수란?</span>
          <span className="ml-auto hidden sm:inline text-[11px] font-normal text-slate-500">
            AI·기술·감정 분석을 100점 만점으로 종합
          </span>
        </div>
        <div
          className="relative h-[10px] rounded-full"
          style={{
            background:
              'linear-gradient(90deg, #5b6a92 0%, #5b6a92 50%, #fbbf24 50%, #fbbf24 65%, #10b981 65%, #10b981 80%, #22d3ee 80%, #22d3ee 100%)',
          }}
        >
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[18px] h-[18px] rounded-full bg-white border-[3px] border-emerald-500"
            style={{ left: '65%', boxShadow: '0 0 12px rgba(16,185,129,0.6)' }}
          >
            {/* 마커 라벨: "65 · 매수 추천" 한 묶음으로 — 점수 의미를 1초에 전달 */}
            <span className="absolute -top-[24px] left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-300 bg-slate-900 border border-emerald-500 px-1.5 py-[1px] rounded whitespace-nowrap">
              65 · 매수 추천
            </span>
          </div>
        </div>
        {/* 4-구간 라벨 — 모바일 강제 2×2 grid (디자인 컨펌 권고) */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-1.5 text-[11px] text-center whitespace-nowrap">
          <span className="text-slate-400">0–49 · 보류</span>
          <span className="text-amber-400">50–64 · 관찰</span>
          <span className="text-emerald-400 font-bold">65–79 · 매수 추천</span>
          <span className="text-cyan-300 font-bold">80–100 · 강력 추천</span>
        </div>
        {displayStocks.length > 0 && (
          <p className="mt-2.5 text-center text-[11.5px] text-slate-400">
            오늘 65점 이상 종목 <strong className="text-white">{buyCount}개</strong> · KIS 계좌로
            1초 매수 가능
          </p>
        )}
      </div>

      {/* 모바일: TOP 종목 카드 (fold 위) */}
      {displayStocks.length > 0 && (
        <div className="sm:hidden mt-4">
          {(() => {
            const topStock = displayStocks[0];
            const topGrade = getScoreGrade(topStock.compositeScore);
            const topReliability = checkPredictionReliability(topStock);
            const topIsUnreliable = topReliability.status !== 'reliable';
            const topPriceRec = topStock.priceRecommendation;
            const topIsBuy =
              !topIsUnreliable && (topPriceRec === '강력매수' || topPriceRec === '매수');
            return (
              <Link href="/recommendations">
                <div
                  className={`bg-slate-800/60 border rounded-xl p-3.5 text-left transition-all active:scale-[0.98] ${
                    topIsUnreliable ? 'border-amber-500/30' : 'border-emerald-500/40'
                  }`}
                >
                  <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">
                    {isFallback ? '오늘의 분석' : '오늘의 TOP'}
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[15px] font-bold text-white truncate">
                          {topStock.stockName}
                        </span>
                        <span className="text-[10px] text-slate-500">{topStock.ticker}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {topStock.currentPrice != null && (
                          <span className="text-[13px] font-semibold text-slate-200 font-mono tabular-nums">
                            ${topStock.currentPrice.toFixed(2)}
                          </span>
                        )}
                        {topStock.targetPrice != null && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            → 목표 ${topStock.targetPrice.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-xl font-bold ${topGrade.color}`}>
                        {topStock.compositeScoreDisplay}
                        <span className="text-[10px] text-slate-500 font-normal">/100</span>
                      </div>
                      {topIsUnreliable ? (
                        <span className="text-[10px] text-amber-400">점검 중</span>
                      ) : topIsBuy ? (
                        <span className="text-[10px] text-emerald-400">매수 신호</span>
                      ) : null}
                    </div>
                  </div>
                  {topStock.recommendationReason && (
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">
                      💡 {topStock.recommendationReason}
                    </p>
                  )}
                </div>
              </Link>
            );
          })()}
        </div>
      )}

      {/* PC: 업데이트 시각 (면책은 푸터에서) */}
      {lastUpdated && (
        <p className="hidden sm:block mt-3 text-[11px] text-slate-600">
          {new Date(lastUpdated).toLocaleDateString('ko-KR')} 업데이트
        </p>
      )}
    </div>
  );
}
