'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { PageSEO } from '@/components/seo';
import { useAuth } from '@/contexts/AuthContext';
import { getRecentNews, getNewsByTags, getNewsByTickers, getNewsByCategory } from '@/lib/api/news';
import type { NewsArticle } from '@/lib/api/news';
import {
  subscribeNews,
  unsubscribeNews,
  getNewsSubscriptions,
  getNewsNotifications,
  getNewsUnreadCount,
  markAllNewsNotificationsRead,
} from '@/lib/api/news-subscriptions';
import type { NewsSubscription, NewsNotification } from '@/lib/api/news-subscriptions';
import { useNewsCategories } from '@/hooks/useData';
import { NewsArticleList } from '@/components/news/NewsArticleList';
import { NewsArticleModal } from '@/components/news/NewsArticleModal';
import { NewsCategoryTabs } from '@/components/news/NewsCategoryTabs';
import { NewsFilterBar } from '@/components/news/NewsFilterBar';
import { NewsNotificationBell } from '@/components/news/NewsNotificationBell';
import { NewsWatchlistSection } from '@/components/news/NewsWatchlistSection';

const ITEMS_PER_PAGE = 12;

type FilterMode = 'recent' | 'category' | 'tickers' | 'tags';

export default function NewsPage() {
  const { user } = useAuth();

  // 뉴스 데이터
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 카테고리 (SWR 캐싱)
  const { data: categoriesData } = useNewsCategories();
  const categoryGroups = useMemo(() => categoriesData?.groups ?? [], [categoriesData]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 필터
  const [filterMode, setFilterMode] = useState<FilterMode>('recent');
  const [filterInput, setFilterInput] = useState('');
  const [activeFilter, setActiveFilter] = useState<string[]>([]);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);

  // 구독
  const [userSubscriptions, setUserSubscriptions] = useState<NewsSubscription[]>([]);
  const [subscribingCategory, setSubscribingCategory] = useState<string | null>(null);

  // 알림
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NewsNotification[]>([]);

  // 기사 상세 모달
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // 관심 종목/카테고리 추가 진행 플래그 (입력값은 자식 컴포넌트 내부)
  const [isAddingTicker, setIsAddingTicker] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // 구독된 카테고리/티커 Set
  const subscribedCategories = useMemo(() => {
    return new Set(
      userSubscriptions.filter((s) => s.type === 'CATEGORY' && s.isActive).map((s) => s.value),
    );
  }, [userSubscriptions]);

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

  // 구독 + 알림 로드 (로그인 시)
  useEffect(() => {
    if (!user) {
      setUserSubscriptions([]);
      setUnreadCount(0);
      return;
    }
    getNewsSubscriptions()
      .then((res) => setUserSubscriptions(res.subscriptions ?? []))
      .catch((err) => {
        console.error('구독 목록 조회 실패:', err);
      });
    getNewsUnreadCount()
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
            await unsubscribeNews(sub.id);
            setUserSubscriptions((prev) => prev.filter((s) => s.id !== sub.id));
          }
        } else {
          const newSub = await subscribeNews('CATEGORY', categoryName);
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
        const res = await getNewsNotifications(20);
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
      await markAllNewsNotificationsRead();
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
        const newSub = await subscribeNews('TICKER', t);
        setUserSubscriptions((prev) => [...prev, newSub]);
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
        await unsubscribeNews(sub.id);
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
        const newSub = await subscribeNews('CATEGORY', categoryName);
        setUserSubscriptions((prev) => [...prev, newSub]);
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
        await unsubscribeNews(sub.id);
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

  const handleFilterModeChange = (mode: FilterMode) => {
    setFilterMode(mode);
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
                {user && (
                  <NewsNotificationBell
                    unreadCount={unreadCount}
                    showNotifications={showNotifications}
                    notifications={notifications}
                    onToggle={handleNotificationToggle}
                    onMarkAllRead={handleMarkAllRead}
                  />
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-2 md:mb-4">
                금융 뉴스
              </h1>
              <p className="text-sm md:text-lg text-slate-400 max-w-2xl mx-auto">
                AI가 수집하고 중요도를 분석한 뉴스를 확인하세요
              </p>
            </div>

            <NewsCategoryTabs
              categoryGroups={categoryGroups}
              subscribedCategories={subscribedCategories}
              selectedCategory={selectedCategory}
              subscribingCategory={subscribingCategory}
              filterMode={filterMode}
              isLoggedIn={!!user}
              onCategoryClick={handleCategoryClick}
              onSubscribeToggle={handleSubscribeToggle}
              onReset={handleReset}
            />

            {user && (
              <NewsWatchlistSection
                subscribedCategories={subscribedCategories}
                subscribedTickers={subscribedTickers}
                availableCategories={availableCategories}
                onAddCategory={handleAddCategory}
                onRemoveCategory={handleRemoveCategory}
                onCategoryWatchlistFilter={handleCategoryWatchlistFilter}
                onAddTicker={handleAddTicker}
                onRemoveTicker={handleRemoveTicker}
                onWatchlistFilter={handleWatchlistFilter}
                isAddingCategory={isAddingCategory}
                isAddingTicker={isAddingTicker}
              />
            )}

            <NewsFilterBar
              filterMode={filterMode}
              filterInput={filterInput}
              activeFilter={activeFilter}
              resultCount={sortedArticles.length}
              isLoading={isLoading}
              onFilterModeChange={handleFilterModeChange}
              onFilterInputChange={setFilterInput}
              onFilterApply={handleFilterApply}
            />
          </section>

          <section>
            <NewsArticleList
              articles={paginatedArticles}
              isLoading={isLoading}
              error={error}
              currentPage={currentPage}
              totalPages={totalPages}
              selectedCategory={selectedCategory}
              activeFilter={activeFilter}
              isLoggedIn={!!user}
              subscribedTickers={subscribedTickers}
              onArticleClick={setSelectedArticle}
              onTickerClick={handleTickerClick}
              onTagClick={handleTagClick}
              onAddTicker={handleAddTicker}
              onPageChange={setCurrentPage}
              onReset={handleReset}
            />
          </section>
        </main>
      </div>

      {/* 알림 패널 배경 클릭 닫기 */}
      {showNotifications && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
      )}

      {/* 기사 상세 모달 */}
      {selectedArticle && (
        <NewsArticleModal
          article={selectedArticle}
          isLoggedIn={!!user}
          subscribedTickers={subscribedTickers}
          onClose={() => setSelectedArticle(null)}
          onTickerClick={handleTickerClick}
          onTagClick={handleTagClick}
          onAddTicker={handleAddTicker}
        />
      )}
    </>
  );
}
