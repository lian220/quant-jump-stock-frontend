'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageSEO } from '@/components/seo';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import {
  getRecentNews,
  getNewsByTags,
  getNewsByTickers,
  getNewsByCategory,
  getCategories,
  getImportanceInfo,
  getSourceLabel,
  formatRelativeTime,
  subscribe,
  unsubscribe,
  getSubscriptions,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
} from '@/lib/api/news';
import type { NewsArticle, CategoryGroup, Subscription, Notification } from '@/lib/api/news';

const ITEMS_PER_PAGE = 12;

const ICON_MAP: Record<string, string> = {
  zap: '⚡',
  'bar-chart-2': '📊',
  landmark: '🏛️',
  'trending-up': '📈',
  search: '🔍',
  shield: '🛡️',
  'git-merge': '🤝',
  layers: '📋',
  gift: '🎁',
  flame: '🔥',
  bitcoin: '₿',
  'pie-chart': '🥧',
  globe: '🌍',
  target: '🎯',
  calendar: '📅',
};

export default function NewsPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 카테고리
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 필터
  const [filterMode, setFilterMode] = useState<'recent' | 'category' | 'tickers' | 'tags'>(
    'recent',
  );
  const [filterInput, setFilterInput] = useState('');
  const [activeFilter, setActiveFilter] = useState<string[]>([]);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);

  // 모바일 필터 토글
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 구독
  const [userSubscriptions, setUserSubscriptions] = useState<Subscription[]>([]);
  const [subscribingCategory, setSubscribingCategory] = useState<string | null>(null);

  // 알림
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 구독된 카테고리 Set
  const subscribedCategories = useMemo(() => {
    return new Set(
      userSubscriptions.filter((s) => s.type === 'CATEGORY' && s.isActive).map((s) => s.value),
    );
  }, [userSubscriptions]);

  // 카테고리 로드
  useEffect(() => {
    getCategories()
      .then((res) => setCategoryGroups(res.groups))
      .catch((err) => console.error('카테고리 로드 실패:', err));
  }, []);

  // 구독 + 알림 로드 (로그인 시)
  useEffect(() => {
    if (!user) {
      setUserSubscriptions([]);
      setUnreadCount(0);
      return;
    }
    getSubscriptions()
      .then((res) => setUserSubscriptions(res.subscriptions ?? []))
      .catch(() => {});
    getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, [user]);

  // 데이터 조회
  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let response;
        if (filterMode === 'category' && selectedCategory) {
          response = await getNewsByCategory(selectedCategory, 50);
        } else if (filterMode === 'tickers' && activeFilter.length > 0) {
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
  }, [filterMode, activeFilter, selectedCategory]);

  // 중요도 높은 뉴스 상단 + 나머지 시간순
  const sortedArticles = useMemo(() => {
    const sorted = [...articles];
    sorted.sort((a, b) => {
      const aHighlight = a.importanceScore >= 0.4 ? 1 : 0;
      const bHighlight = b.importanceScore >= 0.4 ? 1 : 0;
      if (bHighlight !== aHighlight) return bHighlight - aHighlight;
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

  useEffect(() => {
    setCurrentPage(1);
  }, [filterMode, activeFilter, selectedCategory]);

  // 필터 적용
  const handleFilterApply = () => {
    if (!filterInput.trim()) {
      setActiveFilter([]);
      setFilterMode('recent');
      setSelectedCategory(null);
      return;
    }
    const items = filterInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setActiveFilter(items);
  };

  // 카테고리 클릭
  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
      setFilterMode('recent');
    } else {
      setSelectedCategory(categoryName);
      setFilterMode('category');
      setFilterInput('');
      setActiveFilter([]);
    }
  };

  // 구독 토글
  const handleSubscribeToggle = useCallback(
    async (categoryName: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }
      setSubscribingCategory(categoryName);
      try {
        if (subscribedCategories.has(categoryName)) {
          const sub = userSubscriptions.find(
            (s) => s.type === 'CATEGORY' && s.value === categoryName && s.isActive,
          );
          if (sub) {
            await unsubscribe(sub.id);
            setUserSubscriptions((prev) => prev.filter((s) => s.id !== sub.id));
          }
        } else {
          const newSub = await subscribe('CATEGORY', categoryName);
          setUserSubscriptions((prev) => [...prev, newSub]);
        }
      } catch (err) {
        console.error('구독 실패:', err);
      } finally {
        setSubscribingCategory(null);
      }
    },
    [user, subscribedCategories, userSubscriptions],
  );

  // 알림 패널 토글
  const handleNotificationToggle = useCallback(async () => {
    if (!showNotifications) {
      try {
        const res = await getNotifications(20);
        setNotifications(res.notifications ?? []);
        setUnreadCount(res.unreadCount);
      } catch {}
    }
    setShowNotifications((prev) => !prev);
  }, [showNotifications]);

  // 알림 전체 읽음
  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  }, []);

  // 태그/티커 뱃지 클릭
  const handleTagClick = (tag: string) => {
    setFilterMode('tags');
    setActiveFilter([tag]);
    setFilterInput(tag);
    setSelectedCategory(null);
  };

  const handleTickerClick = (ticker: string) => {
    setFilterMode('tickers');
    setActiveFilter([ticker]);
    setFilterInput(ticker);
    setSelectedCategory(null);
  };

  const handleReset = () => {
    setFilterMode('recent');
    setActiveFilter([]);
    setFilterInput('');
    setSelectedCategory(null);
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
          <section className="mb-6 md:mb-8">
            <div className="text-center mb-4 md:mb-6">
              <div className="flex items-center justify-center gap-3 mb-2 md:mb-4">
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-sm md:text-lg px-3 md:px-4 py-0.5 md:py-1">
                  AI 뉴스
                </Badge>

                {/* 알림 벨 */}
                {user && (
                  <div className="relative">
                    <button
                      onClick={handleNotificationToggle}
                      className="relative p-1.5 rounded-full bg-slate-800/60 border border-slate-700 hover:bg-slate-700/60 transition-colors"
                      aria-label="알림"
                    >
                      <span className="text-lg">🔔</span>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* 알림 드롭다운 */}
                    {showNotifications && (
                      <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-[400px] overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                          <span className="text-sm font-medium text-white">알림</span>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-xs text-cyan-400 hover:text-cyan-300"
                            >
                              전체 읽음
                            </button>
                          )}
                        </div>
                        <div className="overflow-y-auto max-h-[340px]">
                          {notifications.length === 0 ? (
                            <div className="py-8 text-center text-slate-500 text-sm">
                              알림이 없습니다
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div
                                key={notif.id}
                                className={`px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                                  !notif.isRead ? 'bg-cyan-500/5' : ''
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  {!notif.isRead && (
                                    <span className="mt-1.5 w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    {notif.categoryName && (
                                      <Badge className="text-[9px] bg-slate-700/50 text-slate-400 border-slate-600 mb-1">
                                        {notif.categoryName}
                                      </Badge>
                                    )}
                                    <p className="text-sm text-white line-clamp-2">
                                      {notif.sourceUrl ? (
                                        <a
                                          href={notif.sourceUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="hover:text-cyan-400"
                                        >
                                          {notif.title}
                                        </a>
                                      ) : (
                                        notif.title
                                      )}
                                    </p>
                                    <span className="text-[10px] text-slate-500">
                                      {formatRelativeTime(notif.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-2 md:mb-4">
                금융 뉴스
              </h1>
              <p className="text-sm md:text-lg text-slate-400 max-w-2xl mx-auto">
                AI가 수집하고 중요도를 분석한 뉴스를 확인하세요
              </p>
            </div>

            {/* 카테고리 탭 */}
            {categoryGroups.length > 0 && (
              <div className="mb-4 md:mb-6">
                {/* 데스크톱: 그룹별 가로 배치 */}
                <div className="hidden md:block space-y-3">
                  {categoryGroups.map((group) => (
                    <div key={group.group} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-12 shrink-0 text-right">
                        {group.groupLabel}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {group.categories.map((cat) => {
                          const isSubscribed = subscribedCategories.has(cat.name);
                          const isSubscribing = subscribingCategory === cat.name;

                          return (
                            <div key={cat.id} className="group relative inline-flex items-center">
                              <button
                                onClick={() => handleCategoryClick(cat.name)}
                                title={cat.description ?? cat.nameEn}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-l-full text-xs font-medium transition-all ${
                                  selectedCategory === cat.name
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                                    : 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:bg-slate-700/60 hover:text-slate-300'
                                } ${user ? 'rounded-l-full border-r-0' : 'rounded-full'}`}
                              >
                                {cat.icon && (
                                  <span className="text-[11px]">{ICON_MAP[cat.icon] || ''}</span>
                                )}
                                {cat.name}
                              </button>
                              {user && (
                                <button
                                  onClick={(e) => handleSubscribeToggle(cat.name, e)}
                                  disabled={isSubscribing}
                                  title={isSubscribed ? '알림 해제' : '알림 받기'}
                                  className={`inline-flex items-center px-1.5 py-1 rounded-r-full text-[10px] transition-all border ${
                                    isSubscribed
                                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40'
                                      : selectedCategory === cat.name
                                        ? 'bg-cyan-500/10 text-slate-500 border-cyan-500/40 hover:text-cyan-400'
                                        : 'bg-slate-800/60 text-slate-600 border-slate-700 hover:text-cyan-400 hover:border-cyan-500/40'
                                  } ${isSubscribing ? 'opacity-50' : ''}`}
                                >
                                  {isSubscribing ? '...' : isSubscribed ? '🔔' : '🔕'}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 모바일: 단일 스크롤 */}
                <div className="md:hidden overflow-x-auto pb-2 -mx-4 px-4">
                  <div className="flex gap-1.5 w-max">
                    <button
                      onClick={handleReset}
                      className={`shrink-0 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        !selectedCategory && filterMode === 'recent'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800/60 text-slate-400 border border-slate-700'
                      }`}
                    >
                      전체
                    </button>
                    {categoryGroups.flatMap((g) =>
                      g.categories.map((cat) => {
                        const isSubscribed = subscribedCategories.has(cat.name);
                        return (
                          <div key={cat.id} className="shrink-0 inline-flex items-center">
                            <button
                              onClick={() => handleCategoryClick(cat.name)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-all ${
                                selectedCategory === cat.name
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : 'bg-slate-800/60 text-slate-400 border border-slate-700'
                              } ${user ? 'rounded-l-full border-r-0' : 'rounded-full'}`}
                            >
                              {cat.icon && (
                                <span className="text-[11px]">{ICON_MAP[cat.icon] || ''}</span>
                              )}
                              {cat.name}
                            </button>
                            {user && (
                              <button
                                onClick={(e) => handleSubscribeToggle(cat.name, e)}
                                className={`px-1 py-1.5 rounded-r-full text-[10px] border transition-all ${
                                  isSubscribed
                                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                                    : 'bg-slate-800/60 text-slate-600 border-slate-700'
                                }`}
                              >
                                {isSubscribed ? '🔔' : '🔕'}
                              </button>
                            )}
                          </div>
                        );
                      }),
                    )}
                  </div>
                </div>

                {/* 구독 안내 (비로그인) */}
                {!user && (
                  <p className="text-center text-xs text-slate-500 mt-2">
                    <a href="/auth" className="text-cyan-400 hover:underline">
                      로그인
                    </a>
                    하면 카테고리별 알림을 받을 수 있습니다
                  </p>
                )}

                {/* 구독 현황 */}
                {user && subscribedCategories.size > 0 && (
                  <div className="mt-2 flex items-center gap-2 justify-center flex-wrap">
                    <span className="text-xs text-slate-500">구독 중:</span>
                    {Array.from(subscribedCategories).map((name) => (
                      <Badge
                        key={name}
                        className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                      >
                        🔔 {name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 검색 필터 영역 */}
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
                  {isFilterOpen ? '접기' : '검색'}
                </Button>
              </div>
            </div>

            {/* 모바일 검색 펼침 */}
            {isFilterOpen && (
              <Card className="sm:hidden bg-slate-800/50 border-slate-700 mb-3">
                <CardContent className="pt-3 pb-3 space-y-3">
                  <div className="flex gap-2">
                    <Button
                      variant={filterMode === 'tickers' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setFilterMode('tickers');
                        setSelectedCategory(null);
                      }}
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
                      onClick={() => {
                        setFilterMode('tags');
                        setSelectedCategory(null);
                      }}
                      className={
                        filterMode === 'tags'
                          ? 'bg-cyan-600 hover:bg-cyan-700'
                          : 'border-slate-600 text-slate-300'
                      }
                    >
                      태그
                    </Button>
                  </div>
                  {(filterMode === 'tickers' || filterMode === 'tags') && (
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

            {/* 데스크톱 검색 */}
            <div className="hidden sm:flex items-center gap-3 max-w-3xl mx-auto bg-slate-800/30 border border-slate-700 rounded-xl px-4 py-3">
              <div className="flex gap-2">
                <Button
                  variant={filterMode === 'tickers' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterMode('tickers');
                    setSelectedCategory(null);
                  }}
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
                  onClick={() => {
                    setFilterMode('tags');
                    setSelectedCategory(null);
                  }}
                  className={
                    filterMode === 'tags'
                      ? 'bg-cyan-600 hover:bg-cyan-700'
                      : 'border-slate-600 text-slate-300'
                  }
                >
                  태그별
                </Button>
              </div>
              {(filterMode === 'tickers' || filterMode === 'tags') && (
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
                <span className="text-sm text-slate-400 whitespace-nowrap ml-auto">
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
                    {selectedCategory
                      ? `"${selectedCategory}" 카테고리에 해당하는 뉴스가 없습니다`
                      : activeFilter.length > 0
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

      {/* 알림 패널 배경 클릭 닫기 */}
      {showNotifications && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
      )}
    </>
  );
}
