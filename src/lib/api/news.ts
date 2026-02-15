/**
 * 뉴스 API 클라이언트
 * MongoDB에 저장된 뉴스 데이터 조회
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

// === 타입 정의 ===

export interface NewsArticle {
  id: string | null;
  title: string;
  titleEn: string | null;
  summary: string | null;
  content: string | null;
  source: string;
  originalSource: string | null;
  tags: string[];
  tickers: string[];
  importanceScore: number;
  sourceUrl: string | null;
  createdAt: string | null;
}

export interface NewsListResponse {
  news: NewsArticle[];
  total: number;
}

export interface NewsCategory {
  id: number;
  name: string;
  nameEn: string;
  group: string;
  description: string | null;
  icon: string | null;
  weight: number;
}

export interface CategoryGroup {
  group: string;
  groupLabel: string;
  categories: NewsCategory[];
}

export interface CategoryListResponse {
  groups: CategoryGroup[];
  total: number;
}

// === API 함수 ===

/**
 * 최신 뉴스 조회
 */
export async function getRecentNews(limit: number = 20): Promise<NewsListResponse> {
  const isBrowser = typeof window !== 'undefined';
  const baseUrl = isBrowser ? `/api/news/recent` : `${API_URL}/api/v1/news/recent`;
  const url = `${baseUrl}?limit=${limit}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`최신 뉴스 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 티커별 뉴스 조회
 */
export async function getNewsByTickers(
  tickers: string[],
  limit: number = 20,
): Promise<NewsListResponse> {
  const params = new URLSearchParams();
  tickers.forEach((t) => params.append('tickers', t));
  params.append('limit', String(limit));

  const isBrowser = typeof window !== 'undefined';
  const base = isBrowser ? `/api/news/by-tickers` : `${API_URL}/api/v1/news/by-tickers`;
  const url = `${base}?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`티커별 뉴스 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 태그별 뉴스 조회
 */
export async function getNewsByTags(tags: string[], limit: number = 20): Promise<NewsListResponse> {
  const params = new URLSearchParams();
  tags.forEach((t) => params.append('tags', t));
  params.append('limit', String(limit));

  const isBrowser = typeof window !== 'undefined';
  const base = isBrowser ? `/api/news/by-tags` : `${API_URL}/api/v1/news/by-tags`;
  const url = `${base}?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`태그별 뉴스 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 카테고리 목록 조회
 */
export async function getCategories(): Promise<CategoryListResponse> {
  const isBrowser = typeof window !== 'undefined';
  const baseUrl = isBrowser ? `/api/news/categories` : `${API_URL}/api/v1/news/categories`;

  const response = await fetch(baseUrl, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`카테고리 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 카테고리별 뉴스 조회
 */
export async function getNewsByCategory(
  categoryName: string,
  limit: number = 20,
): Promise<NewsListResponse> {
  const isBrowser = typeof window !== 'undefined';
  const base = isBrowser
    ? `/api/news/categories/${encodeURIComponent(categoryName)}`
    : `${API_URL}/api/v1/news/categories/${encodeURIComponent(categoryName)}`;
  const url = `${base}?limit=${limit}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`카테고리별 뉴스 조회 실패: ${response.status}`);
  }

  return response.json();
}

// === 구독/알림 타입 ===

export interface Subscription {
  id: number;
  type: string;
  value: string;
  displayName: string | null;
  channel: string;
  isActive: boolean;
}

export interface SubscriptionListResponse {
  subscriptions: Subscription[];
  total: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string | null;
  categoryName: string | null;
  importance: number;
  sourceUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
}

// === 구독/알림 API ===

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function subscribe(
  type: string,
  value: string,
  channel: string = 'IN_APP',
): Promise<Subscription> {
  const response = await fetch('/api/news/subscriptions', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ type, value, channel }),
  });
  if (!response.ok) throw new Error(`구독 실패: ${response.status}`);
  return response.json();
}

export async function unsubscribe(subscriptionId: number): Promise<void> {
  const response = await fetch(`/api/news/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error(`구독 해제 실패: ${response.status}`);
}

export async function getSubscriptions(): Promise<SubscriptionListResponse> {
  const response = await fetch('/api/news/subscriptions', {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`구독 목록 조회 실패: ${response.status}`);
  return response.json();
}

export async function getNotifications(limit: number = 30): Promise<NotificationListResponse> {
  const response = await fetch(`/api/news/subscriptions/notifications?limit=${limit}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`알림 조회 실패: ${response.status}`);
  return response.json();
}

export async function getUnreadCount(): Promise<number> {
  const response = await fetch('/api/news/subscriptions/notifications/unread-count', {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!response.ok) return 0;
  const data = await response.json();
  return data.unreadCount ?? 0;
}

export async function markNotificationRead(notificationId: number): Promise<void> {
  await fetch(`/api/news/subscriptions/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetch('/api/news/subscriptions/notifications/read-all', {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
}

// === 유틸리티 ===

/** 중요도 점수에 따른 레이블과 스타일 */
export function getImportanceInfo(score: number): {
  label: string;
  badgeClass: string;
} {
  if (score >= 0.7) {
    return {
      label: '중요',
      badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
  }
  if (score >= 0.4) {
    return {
      label: '주목',
      badgeClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
  }
  return {
    label: '일반',
    badgeClass: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
}

/** 뉴스 소스 한글명 */
export function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    SAVETICKER: 'SaveTicker',
    FINNHUB: 'Finnhub',
    ALPHA_VANTAGE: 'Alpha Vantage',
    NAVER: '네이버',
    YOUTUBE: 'YouTube',
    TELEGRAM: '텔레그램',
    DART: 'DART',
  };
  return labels[source] || source;
}

/** 시간 포맷 (상대 시간) */
export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}
