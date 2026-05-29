'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getScoreGrade,
  TIER_THRESHOLDS,
  checkPredictionReliability,
  type BuySignal,
} from '@/lib/api/predictions';
import { formatRelativeTime } from '@/lib/utils';
import type { NewsArticle } from '@/lib/api/news';

interface Props {
  stock: BuySignal;
  relatedNews: NewsArticle[];
  isNavigating: boolean;
  onNavigate: (ticker: string) => void;
}

export function RecommendationsStockCard({ stock, relatedNews, isNavigating, onNavigate }: Props) {
  const scoreGrade = getScoreGrade(stock.compositeScore);
  const score = stock.compositeScore;
  const isStrong = score >= TIER_THRESHOLDS.STRONG;
  const isMedium = score >= TIER_THRESHOLDS.MEDIUM;
  const displayScore = stock.compositeScoreDisplay;
  const gaugePercent = displayScore;
  const gaugeColor = isStrong ? 'bg-emerald-400' : isMedium ? 'bg-cyan-400' : 'bg-slate-400';
  // 예측 신뢰도 검증 (P0-1: 모순 데이터 감지)
  const reliability = checkPredictionReliability(stock);
  const isUnreliable = reliability.status !== 'reliable';

  // 매매 방향: 예측 데이터가 모순인 경우 매도/매수 배지를 무시
  const priceRec = stock.priceRecommendation;
  const isSellSignal = !isUnreliable && priceRec === '매도';
  const isBuySignal = !isUnreliable && (priceRec === '강력매수' || priceRec === '매수');

  const subScoreColor = (val: number) =>
    val >= 80 ? 'text-emerald-400' : val >= 50 ? 'text-yellow-400' : 'text-red-400';

  return (
    <Card
      className={`flex flex-col bg-gradient-to-br from-slate-800/80 to-slate-800/50 transition-all hover:shadow-lg cursor-pointer ${
        isNavigating ? 'opacity-70 pointer-events-none' : ''
      } ${
        isUnreliable
          ? 'border-amber-500/30 hover:border-amber-400 hover:shadow-amber-500/10'
          : isSellSignal
            ? 'border-red-500/30 hover:border-red-400 hover:shadow-red-500/10'
            : isBuySignal && isStrong
              ? 'border-emerald-500/50 hover:border-emerald-400 hover:shadow-emerald-500/10'
              : isMedium
                ? 'border-cyan-500/30 hover:border-cyan-400 hover:shadow-cyan-500/10'
                : 'border-slate-700 hover:border-slate-600'
      }`}
      onClick={() => onNavigate(stock.ticker)}
    >
      <CardHeader className="px-4 sm:px-6">
        <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
          <div className="min-w-0">
            <CardTitle className="text-xl sm:text-2xl text-white mb-0.5 sm:mb-1 truncate">
              {stock.stockName}
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-400 font-mono">{stock.ticker}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* #3: compositeGrade 뱃지 */}
            <span
              className={`text-xl font-black tabular-nums ${
                stock.compositeGrade === 'A' ||
                stock.compositeGrade === 'B' ||
                stock.compositeGrade === 'EXCELLENT'
                  ? 'text-emerald-400'
                  : stock.compositeGrade === 'C' || stock.compositeGrade === 'GOOD'
                    ? 'text-cyan-400'
                    : stock.compositeGrade === 'FAIR'
                      ? 'text-yellow-400'
                      : stock.compositeGrade === 'D' || stock.compositeGrade === 'LOW'
                        ? 'text-red-400'
                        : 'text-slate-400'
              }`}
            >
              {stock.compositeGrade}
            </span>
            {isUnreliable ? (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-sm whitespace-nowrap">
                ⚠️ 예측 점검 중
              </Badge>
            ) : (
              <Badge
                className={
                  isBuySignal
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-sm'
                    : isSellSignal
                      ? 'bg-red-500/20 text-red-400 border-red-500/30 text-sm'
                      : priceRec === '보유'
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-sm'
                        : isStrong
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-sm'
                          : isMedium
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-sm'
                            : 'bg-slate-500/20 text-slate-400 border-slate-500/30 text-sm'
                }
              >
                {priceRec === '매도'
                  ? '주의'
                  : priceRec === '강력매수'
                    ? '강력 추천'
                    : priceRec === '매수'
                      ? '추천'
                      : priceRec === '보유'
                        ? '관망'
                        : isStrong
                          ? '추천'
                          : isMedium
                            ? '참고'
                            : '모니터링'}
              </Badge>
            )}
          </div>
        </div>

        {/* #2: 상승여력 시각화 - 현재가 → 목표가 */}
        {stock.currentPrice != null && stock.targetPrice != null && stock.upsidePercent != null && (
          <div
            className={`p-2.5 sm:p-3 rounded-lg mb-3 sm:mb-4 border ${
              isUnreliable
                ? 'bg-amber-500/5 border-amber-500/20'
                : stock.upsidePercent >= 5
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : stock.upsidePercent >= 0
                    ? 'bg-cyan-500/5 border-cyan-500/20'
                    : 'bg-red-500/5 border-red-500/20'
            }`}
          >
            {isUnreliable && (
              <p className="text-[10px] text-amber-400 mb-1.5">
                {reliability.message} - 실제 가격과 AI 예측 가격의 차이가 커서 참고만 하세요
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-slate-400 font-mono tabular-nums">
                  ${stock.currentPrice.toFixed(0)}
                </span>
                <span
                  className={`text-xs ${isUnreliable ? 'text-amber-400' : stock.upsidePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  →
                </span>
                <span className="text-sm font-semibold text-white font-mono tabular-nums">
                  ${stock.targetPrice.toFixed(0)}
                </span>
              </div>
              <span
                className={`text-xl font-bold tabular-nums ${
                  isUnreliable
                    ? 'text-amber-400'
                    : stock.upsidePercent >= 5
                      ? 'text-emerald-400'
                      : stock.upsidePercent >= 0
                        ? 'text-cyan-400'
                        : 'text-red-400'
                }`}
              >
                {stock.upsidePercent > 0 ? '+' : ''}
                {stock.upsidePercent.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* AI 분석 점수 게이지 바 (100점 만점) */}
        <div className="bg-slate-700/30 p-2.5 sm:p-3 rounded-lg mb-3 sm:mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400">AI 분석 점수</p>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-lg font-bold tabular-nums ${scoreGrade.color}`}>
                {displayScore}점
              </span>
              <span className="text-xs text-slate-500">/ 100</span>
              {scoreGrade.badge && (
                <span
                  className="relative group"
                  title="AI 분석 점수는 베타 단계로 지속 개선 중입니다"
                >
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 py-0 cursor-help">
                    {scoreGrade.badge}
                  </Badge>
                </span>
              )}
            </div>
          </div>
          <div className="w-full h-2 bg-slate-600/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${gaugeColor}`}
              style={{ width: `${gaugePercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-500">
              {scoreGrade.grade === '우수'
                ? '우수 - 매수 신호 강함'
                : scoreGrade.grade === '양호'
                  ? '양호 - 참고할 만함'
                  : scoreGrade.grade === '보통'
                    ? '보통 - 추가 확인 필요'
                    : '낮음 - 신중하게'}
            </p>
            <p className="text-[10px] text-slate-600">100점에 가까울수록 매수 신호가 강해요</p>
          </div>
        </div>

        {/* 점수 상세 (100점 만점) */}
        <div
          className={`grid ${stock.sentimentScore > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 sm:gap-2 mb-3 sm:mb-4`}
        >
          <div className="bg-slate-700/30 p-2 sm:p-2.5 rounded-lg">
            <p className="text-[10px] text-slate-400 mb-0.5 sm:mb-1">차트 분석</p>
            <p
              className={`text-sm sm:text-base font-bold tabular-nums ${subScoreColor(stock.techScoreDisplay)}`}
            >
              {stock.techScoreDisplay}점
            </p>
          </div>
          <div className="bg-slate-700/30 p-2 sm:p-2.5 rounded-lg">
            <p className="text-[10px] text-slate-400 mb-0.5 sm:mb-1">AI 예측</p>
            <p
              className={`text-sm sm:text-base font-bold tabular-nums ${subScoreColor(stock.aiScoreDisplay)}`}
            >
              {stock.aiScoreDisplay}점
            </p>
          </div>
          {stock.sentimentScore > 0 && (
            <div className="bg-slate-700/30 p-2 sm:p-2.5 rounded-lg">
              <p className="text-[10px] text-slate-400 mb-0.5 sm:mb-1">뉴스 분위기</p>
              <p
                className={`text-sm sm:text-base font-bold tabular-nums ${subScoreColor(stock.sentimentScoreDisplay)}`}
              >
                {stock.sentimentScoreDisplay}점
              </p>
            </div>
          )}
        </div>

        {/* 가격 정보 (상승여력 바 없을 때만 fallback) */}
        {stock.currentPrice == null && stock.targetPrice != null && (
          <div className="bg-slate-700/20 p-2.5 sm:p-3 rounded-lg mb-3 sm:mb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">AI 예상 목표가</p>
              <p className="text-base font-bold text-emerald-400 font-mono tabular-nums">
                ${stock.targetPrice.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col px-4 sm:px-6">
        {/* #4: 왜 이 종목을? 태그 */}
        {stock.recommendationReason && (
          <div className="mb-3 sm:mb-4">
            <p className="text-[11px] sm:text-xs text-slate-400 mb-1.5 sm:mb-2">왜 이 종목을?</p>
            <div className="flex flex-wrap gap-1.5">
              {stock.recommendationReason.split(',').map((reason, rIdx) => {
                const trimmed = reason.trim();
                const isAI = trimmed.includes('AI');
                const isTech = trimmed.includes('기술');
                const isSentiment = trimmed.includes('뉴스') || trimmed.includes('긍정');
                return (
                  <span
                    key={rIdx}
                    className={`inline-flex items-center text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border ${
                      isAI
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        : isSentiment
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : isTech
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}
                  >
                    {isAI ? '🤖 ' : isSentiment ? '📰 ' : isTech ? '📊 ' : ''}
                    {trimmed}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 관련 뉴스 */}
        {relatedNews && relatedNews.length > 0 && (
          <div
            className="mb-3 sm:mb-4 bg-slate-700/20 rounded-lg p-2.5 sm:p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-slate-400 mb-2">관련 뉴스</p>
            <div className="space-y-1.5">
              {relatedNews.map((news, nIdx) => (
                <div key={news.id || nIdx} className="flex items-start gap-1.5">
                  <span className="text-[10px] text-cyan-400 mt-0.5 shrink-0">&bull;</span>
                  <div className="min-w-0 flex-1">
                    {news.sourceUrl ? (
                      <a
                        href={news.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-300 hover:text-cyan-400 transition-colors line-clamp-1 block"
                      >
                        {news.title}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300 line-clamp-1 block">
                        {news.title}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {formatRelativeTime(news.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA 버튼 - Primary/Secondary 위계 */}
        <div className="flex gap-2 mt-auto pt-3 sm:pt-4" onClick={(e) => e.stopPropagation()}>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => onNavigate(stock.ticker)}
          >
            이 종목 자세히 보기
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="shrink-0 text-slate-400 hover:text-slate-200 text-xs h-10 px-3"
          >
            <Link href="/strategies">투자 전략 보기 →</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
