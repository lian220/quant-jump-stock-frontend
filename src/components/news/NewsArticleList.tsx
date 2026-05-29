'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StateMessageCard } from '@/components/common/StateMessageCard';
import { getImportanceInfo, getSourceLabel } from '@/lib/api/news';
import type { NewsArticle } from '@/lib/api/news';
import { formatRelativeTime } from '@/lib/utils';

interface Props {
  articles: NewsArticle[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  selectedCategory: string | null;
  activeFilter: string[];
  isLoggedIn: boolean;
  subscribedTickers: Set<string>;
  onArticleClick: (article: NewsArticle) => void;
  onTickerClick: (ticker: string) => void;
  onTagClick: (tag: string) => void;
  onAddTicker: (ticker: string) => void;
  onPageChange: (updater: (p: number) => number) => void;
  onReset: () => void;
}

export function NewsArticleList({
  articles,
  isLoading,
  error,
  currentPage,
  totalPages,
  selectedCategory,
  activeFilter,
  isLoggedIn,
  subscribedTickers,
  onArticleClick,
  onTickerClick,
  onTagClick,
  onAddTicker,
  onPageChange,
  onReset,
}: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-slate-800/50 border-slate-700 animate-pulse">
            <CardHeader>
              <div className="h-4 bg-slate-700 rounded w-16 mb-2" />
              <div className="h-5 bg-slate-700 rounded w-full mb-1" />
              <div className="h-5 bg-slate-700 rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-slate-700 rounded w-full mb-2" />
              <div className="h-3 bg-slate-700 rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <StateMessageCard
        tone="error"
        icon="⚠️"
        title={error}
        description="네트워크 상태를 확인한 뒤 다시 시도해주세요."
        primaryAction={{ label: '다시 시도', onClick: () => window.location.reload() }}
        secondaryAction={{ label: '필터 초기화', onClick: onReset, variant: 'ghost' }}
      />
    );
  }

  if (articles.length === 0) {
    return (
      <StateMessageCard
        icon="📰"
        title={
          selectedCategory
            ? `"${selectedCategory}" 뉴스가 아직 없습니다`
            : activeFilter.length > 0
              ? '검색 조건에 맞는 뉴스가 없습니다'
              : '뉴스가 아직 준비되지 않았습니다'
        }
        description={
          selectedCategory || activeFilter.length > 0
            ? '필터를 초기화하고 최신 뉴스 스트림을 확인해보세요.'
            : '곧 최신 뉴스가 업데이트됩니다. 로그인하면 카테고리 알림도 받을 수 있습니다.'
        }
        primaryAction={{ label: '최신 뉴스 다시 보기', onClick: onReset }}
        secondaryAction={{
          label: isLoggedIn ? 'AI 분석 종목 보기' : '로그인하고 알림 받기',
          href: isLoggedIn ? '/recommendations' : '/auth',
          variant: 'ghost',
        }}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {articles.map((article, idx) => {
          const importance = getImportanceInfo(article.importanceScore);
          const isHighlight = article.importanceScore >= 0.4;

          return (
            <Card
              key={article.id || idx}
              onClick={() => onArticleClick(article)}
              className={`cursor-pointer bg-gradient-to-br from-slate-800/80 to-slate-800/50 transition-all hover:shadow-lg ${
                isHighlight
                  ? 'border-cyan-500/40 hover:border-cyan-500/60'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge className={`text-[10px] ${importance.badgeClass}`}>
                      {importance.label}
                    </Badge>
                    <Badge className="bg-slate-700/50 text-slate-400 border-slate-600 text-[10px]">
                      {article.originalSource || getSourceLabel(article.source)}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                    {formatRelativeTime(article.createdAt)}
                  </span>
                </div>
                <CardTitle className="text-base md:text-lg text-white leading-snug line-clamp-2 hover:text-cyan-400 transition-colors">
                  {article.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(article.content || article.summary) && (
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                    {article.content || article.summary}
                  </p>
                )}

                {article.tickers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {article.tickers.slice(0, 5).map((ticker) => (
                      <button
                        key={ticker}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTickerClick(ticker);
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                      >
                        ${ticker}
                      </button>
                    ))}
                    {isLoggedIn && article.tickers.some((t) => !subscribedTickers.has(t)) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newTicker = article.tickers.find((t) => !subscribedTickers.has(t));
                          if (newTicker) onAddTicker(newTicker);
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                        title="관심 종목 추가"
                      >
                        + 관심
                      </button>
                    )}
                    {article.tickers.length > 5 && (
                      <span className="text-[10px] text-slate-500">
                        +{article.tickers.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 4).map((tag) => (
                      <button
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTagClick(tag);
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700 transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                    {article.tags.length > 4 && (
                      <span className="text-[10px] text-slate-500">+{article.tags.length - 4}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="border-slate-600 text-slate-300 disabled:opacity-50"
          >
            이전
          </Button>
          <span className="text-sm text-slate-400 px-3">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="border-slate-600 text-slate-300 disabled:opacity-50"
          >
            다음
          </Button>
        </div>
      )}
    </>
  );
}
