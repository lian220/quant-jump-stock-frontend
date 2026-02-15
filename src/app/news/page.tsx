'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageSEO } from '@/components/seo';
import { Footer } from '@/components/layout/Footer';
import {
  getRecentNews,
  getNewsByTags,
  getNewsByTickers,
  getImportanceInfo,
  getSourceLabel,
  formatRelativeTime,
} from '@/lib/api/news';
import type { NewsArticle } from '@/lib/api/news';

const ITEMS_PER_PAGE = 12;

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터
  const [filterMode, setFilterMode] = useState<'recent' | 'tickers' | 'tags'>('recent');
  const [filterInput, setFilterInput] = useState('');
  const [activeFilter, setActiveFilter] = useState<string[]>([]);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);

  // 모바일 필터 토글
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 데이터 조회
  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let response;
        if (filterMode === 'tickers' && activeFilter.length > 0) {
          response = await getNewsByTickers(activeFilter, 50);
        } else if (filterMode === 'tags' && activeFilter.length > 0) {
          response = await getNewsByTags(activeFilter, 50);
        } else {
          response = await getRecentNews(50);
        }
        setArticles(response.news ?? []);
      } catch (err) {
        console.error('Failed to fetch news:', err);
        setError('뉴스를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [filterMode, activeFilter]);

  // 중요도 높은 뉴스 상단 + 나머지 시간순
  const sortedArticles = useMemo(() => {
    const sorted = [...articles];
    sorted.sort((a, b) => {
      // 중요도 0.4 이상은 상단 고정
      const aHighlight = a.importanceScore >= 0.4 ? 1 : 0;
      const bHighlight = b.importanceScore >= 0.4 ? 1 : 0;
      if (bHighlight !== aHighlight) return bHighlight - aHighlight;
      // 같은 그룹 내에서 시간 역순
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    return sorted;
  }, [articles]);

  // 페이지네이션
  const totalPages = Math.ceil(sortedArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedArticles.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedArticles, currentPage]);

  // 필터 변경 시 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMode, activeFilter]);

  // 필터 적용
  const handleFilterApply = () => {
    if (!filterInput.trim()) {
      setActiveFilter([]);
      setFilterMode('recent');
      return;
    }
    const items = filterInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setActiveFilter(items);
  };

  // 태그/티커 뱃지 클릭으로 필터
  const handleTagClick = (tag: string) => {
    setFilterMode('tags');
    setActiveFilter([tag]);
    setFilterInput(tag);
  };

  const handleTickerClick = (ticker: string) => {
    setFilterMode('tickers');
    setActiveFilter([ticker]);
    setFilterInput(ticker);
  };

  const handleReset = () => {
    setFilterMode('recent');
    setActiveFilter([]);
    setFilterInput('');
  };

  return (
    <>
      <PageSEO
        title="뉴스 - Alpha Foundry"
        description="AI가 분석한 주요 금융 뉴스를 확인하세요. 중요도 스코어링으로 핵심 뉴스만 빠르게 파악합니다."
        keywords="금융 뉴스, AI 뉴스 분석, 주식 뉴스, 시장 뉴스, Alpha Foundry"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-12">
          {/* Hero */}
          <section className="mb-6 md:mb-12">
            <div className="text-center mb-4 md:mb-8">
              <Badge className="mb-2 md:mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-sm md:text-lg px-3 md:px-4 py-0.5 md:py-1">
                📰 AI 뉴스
              </Badge>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-2 md:mb-4">
                금융 뉴스
              </h1>
              <p className="text-sm md:text-lg text-slate-400 max-w-2xl mx-auto">
                AI가 수집하고 중요도를 분석한 뉴스를 확인하세요
              </p>
            </div>

            {/* 필터 영역 */}
            {/* 모바일 컴팩트 바 */}
            <div className="sm:hidden mb-3">
              <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {!isLoading && (
                    <span className="text-sm text-slate-300 font-medium">
                      {sortedArticles.length}건
                    </span>
                  )}
                  {activeFilter.length > 0 && (
                    <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px]">
                      {filterMode === 'tickers' ? '티커' : '태그'}: {activeFilter.join(', ')}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  aria-label="필터 토글"
                  aria-expanded={isFilterOpen}
                  className="text-slate-400 hover:text-white text-xs px-2"
                >
                  {isFilterOpen ? '접기' : '필터'}
                </Button>
              </div>
            </div>

            {/* 모바일 필터 펼침 */}
            {isFilterOpen && (
              <Card className="sm:hidden bg-slate-800/50 border-slate-700 mb-3">
                <CardContent className="pt-3 pb-3 space-y-3">
                  <div className="flex gap-2">
                    <Button
                      variant={filterMode === 'recent' ? 'default' : 'outline'}
                      size="sm"
                      onClick={handleReset}
                      className={
                        filterMode === 'recent'
                          ? 'bg-cyan-600 hover:bg-cyan-700'
                          : 'border-slate-600 text-slate-300'
                      }
                    >
                      최신
                    </Button>
                    <Button
                      variant={filterMode === 'tickers' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterMode('tickers')}
                      className={
                        filterMode === 'tickers'
                          ? 'bg-cyan-600 hover:bg-cyan-700'
                          : 'border-slate-600 text-slate-300'
                      }
                    >
                      티커
                    </Button>
                    <Button
                      variant={filterMode === 'tags' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterMode('tags')}
                      className={
                        filterMode === 'tags'
                          ? 'bg-cyan-600 hover:bg-cyan-700'
                          : 'border-slate-600 text-slate-300'
                      }
                    >
                      태그
                    </Button>
                  </div>
                  {filterMode !== 'recent' && (
                    <div className="flex gap-2">
                      <Input
                        placeholder={filterMode === 'tickers' ? 'AAPL,MSFT' : '경제,연준'}
                        value={filterInput}
                        onChange={(e) => setFilterInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFilterApply()}
                        className="bg-slate-700/50 border-slate-600 text-white text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={handleFilterApply}
                        className="bg-cyan-600 hover:bg-cyan-700 whitespace-nowrap"
                      >
                        검색
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 데스크톱 필터 */}
            <div className="hidden sm:flex items-center gap-3 max-w-3xl mx-auto bg-slate-800/30 border border-slate-700 rounded-xl px-4 py-3">
              <div className="flex gap-2">
                <Button
                  variant={filterMode === 'recent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleReset}
                  className={
                    filterMode === 'recent'
                      ? 'bg-cyan-600 hover:bg-cyan-700'
                      : 'border-slate-600 text-slate-300'
                  }
                >
                  최신
                </Button>
                <Button
                  variant={filterMode === 'tickers' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterMode('tickers')}
                  className={
                    filterMode === 'tickers'
                      ? 'bg-cyan-600 hover:bg-cyan-700'
                      : 'border-slate-600 text-slate-300'
                  }
                >
                  티커별
                </Button>
                <Button
                  variant={filterMode === 'tags' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterMode('tags')}
                  className={
                    filterMode === 'tags'
                      ? 'bg-cyan-600 hover:bg-cyan-700'
                      : 'border-slate-600 text-slate-300'
                  }
                >
                  태그별
                </Button>
              </div>
              {filterMode !== 'recent' && (
                <div className="flex gap-2 flex-1">
                  <Input
                    placeholder={
                      filterMode === 'tickers'
                        ? '티커 입력 (예: AAPL,MSFT)'
                        : '태그 입력 (예: 경제,연준)'
                    }
                    value={filterInput}
                    onChange={(e) => setFilterInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFilterApply()}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                  <Button
                    size="sm"
                    onClick={handleFilterApply}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    검색
                  </Button>
                </div>
              )}
              {!isLoading && (
                <span className="text-sm text-slate-400 whitespace-nowrap">
                  {sortedArticles.length}건
                </span>
              )}
            </div>
          </section>

          {/* 뉴스 목록 */}
          <section>
            {isLoading ? (
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
            ) : error ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12 text-center">
                  <p className="text-red-400 mb-4">{error}</p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="border-slate-600 text-slate-300"
                  >
                    다시 시도
                  </Button>
                </CardContent>
              </Card>
            ) : sortedArticles.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-400 text-lg mb-2">뉴스가 없습니다</p>
                  <p className="text-slate-500 text-sm">
                    {activeFilter.length > 0
                      ? '다른 검색어로 시도해보세요'
                      : '아직 수집된 뉴스가 없습니다'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {paginatedArticles.map((article, idx) => {
                    const importance = getImportanceInfo(article.importanceScore);
                    const isHighlight = article.importanceScore >= 0.4;

                    return (
                      <Card
                        key={article.id || idx}
                        className={`bg-gradient-to-br from-slate-800/80 to-slate-800/50 transition-all hover:shadow-lg ${
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
                          <CardTitle className="text-base md:text-lg text-white leading-snug line-clamp-2">
                            {article.sourceUrl ? (
                              <a
                                href={article.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-cyan-400 transition-colors"
                              >
                                {article.title}
                              </a>
                            ) : (
                              article.title
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {article.summary && (
                            <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                              {article.summary}
                            </p>
                          )}

                          {/* 티커 뱃지 */}
                          {article.tickers.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {article.tickers.slice(0, 5).map((ticker) => (
                                <button
                                  key={ticker}
                                  onClick={() => handleTickerClick(ticker)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                                >
                                  ${ticker}
                                </button>
                              ))}
                              {article.tickers.length > 5 && (
                                <span className="text-[10px] text-slate-500">
                                  +{article.tickers.length - 5}
                                </span>
                              )}
                            </div>
                          )}

                          {/* 태그 뱃지 */}
                          {article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {article.tags.slice(0, 4).map((tag) => (
                                <button
                                  key={tag}
                                  onClick={() => handleTagClick(tag)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700 transition-colors"
                                >
                                  #{tag}
                                </button>
                              ))}
                              {article.tags.length > 4 && (
                                <span className="text-[10px] text-slate-500">
                                  +{article.tags.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="border-slate-600 text-slate-300 disabled:opacity-50"
                    >
                      다음
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
