'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageSEO } from '@/components/seo';
import { useAuth } from '@/hooks/useAuth';
import { StateMessageCard } from '@/components/common/StateMessageCard';
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

  // 기사 상세 모달
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // 관심 종목 입력
  const [tickerInput, setTickerInput] = useState('');
  const [isAddingTicker, setIsAddingTicker] = useState(false);

  // 관심 카테고리 입력
  const [selectedCategoryToAdd, setSelectedCategoryToAdd] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // 구독된 카테고리 Set
  const subscribedCategories = useMemo(() => {
    return new Set(
      userSubscriptions.filter((s) => s.type === 'CATEGORY' && s.isActive).map((s) => s.value),
    );
  }, [userSubscriptions]);

  // 구독된 티커 Set
  const subscribedTickers = useMemo(() => {
    return new Set(
      userSubscriptions.filter((s) => s.type === 'TICKER' && s.isActive).map((s) => s.value),
    );
  }, [userSubscriptions]);

  // 아직 구독하지 않은 카테고리 목록
  const availableCategories = useMemo(() => {
    return categoryGroups
      .flatMap((g) => g.categories)
      .filter((cat) => !subscribedCategories.has(cat.name));
  }, [categoryGroups, subscribedCategories]);

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
      .catch((err) => {
        console.error('구독 목록 조회 실패:', err);
      });
    getUnreadCount()
      .then(setUnreadCount)
      .catch((err) => {
        console.error('읽지 않은 알림 수 조회 실패:', err);
      });
  }, [user]);

  // 데이터 조회
  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let response;
        if (filterMode === 'category' && activeFilter.length > 0 && !selectedCategory) {
          // 관심 카테고리 목록 필터 (복수 카테고리)
          const results = await Promise.all(activeFilter.map((cat) => getNewsByCategory(cat, 50)));
          const seen = new Set<string>();
          const merged = results
            .flatMap((r) => r.news ?? [])
            .filter((article) => {
              const key = article.id || article.title;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          setArticles(merged);
          setIsLoading(false);
          return;
        } else if (filterMode === 'category' && selectedCategory) {
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
        console.error('뉴스 로드 실패:', err);
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
      } catch (err) {
        console.error('알림 조회 실패:', err);
      }
    }
    setShowNotifications((prev) => !prev);
  }, [showNotifications]);

  // 알림 전체 읽음
  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('전체 읽음 처리 실패:', err);
    }
  }, []);

  // 관심 종목 추가
  const handleAddTicker = useCallback(
    async (ticker: string) => {
      const t = ticker.trim().toUpperCase();
      if (!t || !user) return;
      if (subscribedTickers.has(t)) return;
      setIsAddingTicker(true);
      try {
        const newSub = await subscribe('TICKER', t);
        setUserSubscriptions((prev) => [...prev, newSub]);
        setTickerInput('');
      } catch (err) {
        console.error('관심 종목 추가 실패:', err);
      } finally {
        setIsAddingTicker(false);
      }
    },
    [user, subscribedTickers],
  );

  // 관심 종목 삭제
  const handleRemoveTicker = useCallback(
    async (ticker: string) => {
      const sub = userSubscriptions.find(
        (s) => s.type === 'TICKER' && s.value === ticker && s.isActive,
      );
      if (!sub) return;
      try {
        await unsubscribe(sub.id);
        setUserSubscriptions((prev) => prev.filter((s) => s.id !== sub.id));
      } catch (err) {
        console.error('관심 종목 삭제 실패:', err);
      }
    },
    [userSubscriptions],
  );

  // 관심종목 뉴스 필터
  const handleWatchlistFilter = useCallback(() => {
    const tickers = Array.from(subscribedTickers);
    if (tickers.length === 0) return;
    setFilterMode('tickers');
    setActiveFilter(tickers);
    setFilterInput(tickers.join(','));
    setSelectedCategory(null);
  }, [subscribedTickers]);

  // 관심 카테고리 추가
  const handleAddCategory = useCallback(
    async (categoryName: string) => {
      if (!categoryName || !user || subscribedCategories.has(categoryName)) return;
      setIsAddingCategory(true);
      try {
        const newSub = await subscribe('CATEGORY', categoryName);
        setUserSubscriptions((prev) => [...prev, newSub]);
        setSelectedCategoryToAdd('');
      } catch (err) {
        console.error('관심 카테고리 추가 실패:', err);
      } finally {
        setIsAddingCategory(false);
      }
    },
    [user, subscribedCategories],
  );

  // 관심 카테고리 삭제
  const handleRemoveCategory = useCallback(
    async (categoryName: string) => {
      const sub = userSubscriptions.find(
        (s) => s.type === 'CATEGORY' && s.value === categoryName && s.isActive,
      );
      if (!sub) return;
      try {
        await unsubscribe(sub.id);
        setUserSubscriptions((prev) => prev.filter((s) => s.id !== sub.id));
      } catch (err) {
        console.error('관심 카테고리 삭제 실패:', err);
      }
    },
    [userSubscriptions],
  );

  // 관심 카테고리 뉴스 필터
  const handleCategoryWatchlistFilter = useCallback(() => {
    const cats = Array.from(subscribedCategories);
    if (cats.length === 0) return;
    setFilterMode('category');
    setActiveFilter(cats);
    setFilterInput(cats.join(','));
    setSelectedCategory(null);
  }, [subscribedCategories]);

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

  // ESC 키로 모달/알림 패널 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedArticle) setSelectedArticle(null);
        else if (showNotifications) setShowNotifications(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedArticle, showNotifications]);

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
                    <Link href="/auth?returnUrl=/news" className="text-cyan-400 hover:underline">
                      로그인
                    </Link>
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

            {/* 관심 목록 섹션 */}
            {user && (
              <div className="mb-4 md:mb-6 bg-slate-800/30 border border-slate-700 rounded-xl px-4 py-3 space-y-3">
                <span className="text-sm font-medium text-white">⭐ 내 관심 목록</span>

                {/* 관심 카테고리 서브섹션 */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-slate-400">📂 관심 카테고리</span>
                    {subscribedCategories.size > 0 && (
                      <Badge className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                        {subscribedCategories.size}개
                      </Badge>
                    )}
                  </div>

                  {subscribedCategories.size > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {Array.from(subscribedCategories).map((name) => (
                        <Badge
                          key={name}
                          className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/20 pl-2 pr-1 py-0.5 inline-flex items-center gap-1"
                        >
                          🔔 {name}
                          <button
                            onClick={() => handleRemoveCategory(name)}
                            className="ml-0.5 hover:text-red-400 transition-colors text-cyan-500/60"
                            aria-label={`${name} 삭제`}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-center">
                    <select
                      value={selectedCategoryToAdd}
                      onChange={(e) => setSelectedCategoryToAdd(e.target.value)}
                      className="bg-slate-700/50 border border-slate-600 text-white text-sm h-8 rounded-md px-2 max-w-[200px]"
                    >
                      <option value="">카테고리 선택</option>
                      {availableCategories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      onClick={() => handleAddCategory(selectedCategoryToAdd)}
                      disabled={isAddingCategory || !selectedCategoryToAdd}
                      className="bg-cyan-600 hover:bg-cyan-700 text-xs h-8 px-3"
                    >
                      {isAddingCategory ? '...' : '추가'}
                    </Button>
                    {subscribedCategories.size > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCategoryWatchlistFilter}
                        className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 text-xs h-8 px-3 ml-auto"
                      >
                        관심 카테고리 뉴스 보기
                      </Button>
                    )}
                  </div>
                </div>

                {/* 구분선 */}
                <div className="border-t border-slate-700/50" />

                {/* 관심 종목 서브섹션 */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-slate-400">📈 관심 종목</span>
                    {subscribedTickers.size > 0 && (
                      <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        {subscribedTickers.size}개
                      </Badge>
                    )}
                  </div>

                  {subscribedTickers.size > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {Array.from(subscribedTickers).map((ticker) => (
                        <Badge
                          key={ticker}
                          className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20 pl-2 pr-1 py-0.5 inline-flex items-center gap-1"
                        >
                          ${ticker}
                          <button
                            onClick={() => handleRemoveTicker(ticker)}
                            className="ml-0.5 hover:text-red-400 transition-colors text-emerald-500/60"
                            aria-label={`${ticker} 삭제`}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="티커 입력 (예: AAPL)"
                      value={tickerInput}
                      onChange={(e) => setTickerInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTicker(tickerInput)}
                      className="bg-slate-700/50 border-slate-600 text-white text-sm h-8 max-w-[180px]"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddTicker(tickerInput)}
                      disabled={isAddingTicker || !tickerInput.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8 px-3"
                    >
                      {isAddingTicker ? '...' : '추가'}
                    </Button>
                    {subscribedTickers.size > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleWatchlistFilter}
                        className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs h-8 px-3 ml-auto"
                      >
                        관심종목 뉴스 보기
                      </Button>
                    )}
                  </div>
                </div>
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
              <StateMessageCard
                tone="error"
                icon="⚠️"
                title={error}
                description="네트워크 상태를 확인한 뒤 다시 시도해주세요."
                primaryAction={{ label: '다시 시도', onClick: () => window.location.reload() }}
                secondaryAction={{ label: '필터 초기화', onClick: handleReset, variant: 'ghost' }}
              />
            ) : sortedArticles.length === 0 ? (
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
                primaryAction={{ label: '최신 뉴스 다시 보기', onClick: handleReset }}
                secondaryAction={{
                  label: user ? 'AI 분석 종목 보기' : '로그인하고 알림 받기',
                  href: user ? '/recommendations' : '/auth',
                  variant: 'ghost',
                }}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {paginatedArticles.map((article, idx) => {
                    const importance = getImportanceInfo(article.importanceScore);
                    const isHighlight = article.importanceScore >= 0.4;

                    return (
                      <Card
                        key={article.id || idx}
                        onClick={() => setSelectedArticle(article)}
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
                                    handleTickerClick(ticker);
                                  }}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                                >
                                  ${ticker}
                                </button>
                              ))}
                              {user && article.tickers.some((t) => !subscribedTickers.has(t)) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newTicker = article.tickers.find(
                                      (t) => !subscribedTickers.has(t),
                                    );
                                    if (newTicker) handleAddTicker(newTicker);
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
                                    handleTagClick(tag);
                                  }}
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
      </div>

      {/* 알림 패널 배경 클릭 닫기 */}
      {showNotifications && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
      )}

      {/* 기사 상세 모달 */}
      {selectedArticle && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="기사 상세"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-5 py-4 flex items-start justify-between gap-3 rounded-t-2xl">
              <h2 className="text-lg md:text-xl font-bold text-white leading-snug">
                {selectedArticle.title}
              </h2>
              <button
                onClick={() => setSelectedArticle(null)}
                className="shrink-0 p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 본문 */}
            <div className="px-5 py-4 space-y-4">
              {/* 메타 정보 */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={`text-xs ${getImportanceInfo(selectedArticle.importanceScore).badgeClass}`}
                >
                  {getImportanceInfo(selectedArticle.importanceScore).label}
                </Badge>
                <Badge className="bg-slate-700/50 text-slate-400 border-slate-600 text-xs">
                  {selectedArticle.originalSource || getSourceLabel(selectedArticle.source)}
                </Badge>
                <span className="text-xs text-slate-500">
                  {formatRelativeTime(selectedArticle.createdAt)}
                </span>
              </div>

              {/* 본문 / 요약 */}
              {selectedArticle.content || selectedArticle.summary ? (
                <div className="space-y-2">
                  <p className="text-sm md:text-base text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedArticle.content || selectedArticle.summary}
                  </p>
                  {selectedArticle.content && selectedArticle.summary && (
                    <p className="text-xs text-slate-500 italic">
                      {'요약: ' + selectedArticle.summary}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  상세 내용이 없습니다. 원문에서 확인하세요.
                </p>
              )}

              {/* 관련 티커 */}
              {selectedArticle.tickers.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">관련 종목</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedArticle.tickers.map((ticker) => (
                      <div key={ticker} className="inline-flex items-center gap-0.5">
                        <button
                          onClick={() => {
                            setSelectedArticle(null);
                            handleTickerClick(ticker);
                          }}
                          className="text-xs px-2 py-1 rounded-l bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                        >
                          ${ticker}
                        </button>
                        {user && !subscribedTickers.has(ticker) && (
                          <button
                            onClick={() => handleAddTicker(ticker)}
                            className="text-xs px-1.5 py-1 rounded-r bg-cyan-500/10 text-cyan-400 border border-l-0 border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                            title="관심 종목 추가"
                          >
                            +
                          </button>
                        )}
                        {user && subscribedTickers.has(ticker) && (
                          <span className="text-xs px-1.5 py-1 rounded-r bg-emerald-500/10 text-emerald-500/60 border border-l-0 border-emerald-500/20">
                            ⭐
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 관련 태그 */}
              {selectedArticle.tags.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">태그</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedArticle.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedArticle(null);
                          handleTagClick(tag);
                        }}
                        className="text-xs px-2 py-1 rounded bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700 transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 원문 보기 버튼 */}
              {selectedArticle.sourceUrl && (
                <div className="pt-2">
                  <a
                    href={selectedArticle.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors"
                  >
                    원문 보기
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
