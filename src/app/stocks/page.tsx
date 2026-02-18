'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { searchStocks, marketLabels, designationLabels } from '@/lib/api/stocks';
import { PageSEO } from '@/components/seo';
import { StateMessageCard } from '@/components/common/StateMessageCard';
import type { StockSummary, Market, StockSearchResponse } from '@/lib/api/stocks';

const marketOptions: { value: '' | Market; label: string }[] = [
  { value: '', label: '전체 시장' },
  { value: 'KR', label: '한국' },
  { value: 'US', label: '미국' },
  { value: 'CRYPTO', label: '암호화폐' },
];

const designationColors: Record<string, string> = {
  NORMAL: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  CAUTION: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  WARNING: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  DANGER: 'bg-red-500/20 text-red-400 border-red-500/30',
  DELISTED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function StocksPage() {
  const [stocks, setStocks] = useState<StockSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<'' | Market>('');

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  const fetchStocks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response: StockSearchResponse = await searchStocks({
        query: query || undefined,
        market: selectedMarket || undefined,
        page: currentPage,
        size: pageSize,
      });

      setStocks(response.stocks);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('종목 검색 실패:', err);
      setError('종목 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedMarket, currentPage]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  // 검색 제출
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
    setCurrentPage(0);
  };

  // 시장 필터 변경
  const handleMarketChange = (market: '' | Market) => {
    setSelectedMarket(market);
    setCurrentPage(0);
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PageSEO
        title="종목 탐색 - Alpha Foundry"
        description="국내외 주식과 암호화폐 종목을 검색하고 정보를 확인하세요."
      />

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">종목 탐색</h1>
          <p className="text-lg text-slate-400">
            국내외 주식과 암호화폐 종목을 검색하고 정보를 확인하세요.
          </p>
        </div>

        {/* 검색 + 필터 */}
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="종목명 또는 티커를 검색하세요..."
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 flex-1"
            />
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 px-8">
              검색
            </Button>
          </form>

          {/* 시장 필터 */}
          <div className="flex flex-wrap gap-2">
            {marketOptions.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                onClick={() => handleMarketChange(option.value)}
                className={
                  selectedMarket === option.value
                    ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                    : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 결과 수 */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-400">
            총{' '}
            <span className="text-white font-semibold">
              {isLoading ? '집계중' : totalElements.toLocaleString()}
            </span>
            개의 종목
          </p>
          {totalPages > 0 && (
            <Badge className="bg-slate-700/50 text-slate-300 border-slate-600">
              {currentPage + 1} / {totalPages} 페이지
            </Badge>
          )}
        </div>

        {/* 에러 */}
        {error && (
          <div className="mb-6">
            <StateMessageCard
              tone="error"
              icon="⚠️"
              title={error}
              description="네트워크 상태를 확인한 뒤 다시 시도해주세요."
              primaryAction={{ label: '다시 시도', onClick: fetchStocks }}
            />
          </div>
        )}

        {/* 로딩 */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="animate-pulse">
                    <div className="h-5 bg-slate-700 rounded mb-3 w-2/3"></div>
                    <div className="h-4 bg-slate-700 rounded mb-2 w-1/2"></div>
                    <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 종목 카드 그리드 */}
        {!isLoading && !error && stocks.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stocks.map((stock) => {
              const price = stock.currentPrice;
              const change = stock.changePercent;
              return (
                <Link key={stock.id} href={`/stocks/${stock.id}`}>
                  <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-all h-full cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold text-lg">{stock.stockName}</p>
                          <p className="text-slate-400 text-sm font-mono">{stock.ticker}</p>
                        </div>
                        <div className="text-right">
                          {price != null ? (
                            <>
                              <p className="text-white font-semibold font-mono">
                                $
                                {price.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                              {change != null && (
                                <p
                                  className={`text-xs font-medium ${change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-slate-400'}`}
                                >
                                  {change > 0 ? '+' : ''}
                                  {change.toFixed(2)}%
                                </p>
                              )}
                            </>
                          ) : (
                            <Badge className={designationColors[stock.designationStatus] || ''}>
                              {designationLabels[stock.designationStatus]}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {stock.volume != null && (
                        <p className="text-xs text-slate-500 mb-2">
                          거래량 {stock.volume.toLocaleString()}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge
                          variant="secondary"
                          className="bg-slate-700/50 text-slate-300 border-slate-600"
                        >
                          {marketLabels[stock.market]}
                        </Badge>
                        {stock.sector && (
                          <Badge
                            variant="secondary"
                            className="bg-slate-700/50 text-slate-300 border-slate-600"
                          >
                            {stock.sector}
                          </Badge>
                        )}
                        {stock.isEtf && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            ETF
                          </Badge>
                        )}
                        {stock.designationStatus !== 'NORMAL' && (
                          <Badge className={designationColors[stock.designationStatus] || ''}>
                            {designationLabels[stock.designationStatus]}
                          </Badge>
                        )}
                      </div>

                      {stock.stockNameEn && (
                        <p className="text-xs text-slate-500 mt-2">{stock.stockNameEn}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* 결과 없음 */}
        {!isLoading && !error && stocks.length === 0 && (
          <StateMessageCard
            icon="🔎"
            title="조건에 맞는 종목이 없습니다"
            description="검색어를 변경하거나 인기 종목(AAPL, TSLA, 삼성전자)으로 다시 시도해보세요."
            primaryAction={{
              label: '전체 시장 다시 보기',
              onClick: () => {
                setSearchInput('');
                setQuery('');
                setSelectedMarket('');
                setCurrentPage(0);
              },
            }}
            secondaryAction={{
              label: 'AI 분석 종목 보기',
              href: '/recommendations',
              variant: 'ghost',
            }}
          />
        )}

        {/* 페이지네이션 */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
            >
              이전
            </Button>

            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i;
              } else if (currentPage < 3) {
                page = i;
              } else if (currentPage > totalPages - 4) {
                page = totalPages - 5 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <Button
                  key={page}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className={
                    currentPage === page
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                  }
                >
                  {page + 1}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
            >
              다음
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
