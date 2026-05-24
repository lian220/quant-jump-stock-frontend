/**
 * 뉴스 키워드 구독 API 클라이언트
 *
 * 사용자가 카테고리(CATEGORY) 또는 티커(TICKER) 단위로 뉴스를 구독하고
 * 매칭되는 뉴스가 들어오면 알림으로 받아보는 도메인.
 *
 * - 전략 구독: `@/lib/api/subscriptions` (별도 도메인)
 * - 통합 알림(백테스트 완료, 거래 시그널 등): `@/lib/api/notifications` (별도 도메인)
 */

import { getAuthToken } from '@/lib/auth-store';

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// === 타입 ===

export interface NewsSubscription {
  id: number;
  type: string;
  value: string;
  displayName: string | null;
  channel: string;
  isActive: boolean;
}

export interface NewsSubscriptionListResponse {
  subscriptions: NewsSubscription[];
  total: number;
}

export interface NewsNotification {
  id: number;
  title: string;
  message: string | null;
  categoryName: string | null;
  importance: number;
  sourceUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NewsNotificationListResponse {
  notifications: NewsNotification[];
  unreadCount: number;
}

// === API 함수 ===

export async function subscribeNews(
  type: string,
  value: string,
  channel: string = 'IN_APP',
): Promise<NewsSubscription> {
  const response = await fetch('/api/news/subscriptions', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ type, value, channel }),
  });
  if (!response.ok) throw new Error(`구독 실패: ${response.status}`);
  return response.json();
}

export async function unsubscribeNews(subscriptionId: number): Promise<void> {
  const response = await fetch(`/api/news/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error(`구독 해제 실패: ${response.status}`);
}

export async function getNewsSubscriptions(): Promise<NewsSubscriptionListResponse> {
  const response = await fetch('/api/news/subscriptions', {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`구독 목록 조회 실패: ${response.status}`);
  return response.json();
}

export async function getNewsNotifications(
  limit: number = 30,
): Promise<NewsNotificationListResponse> {
  const response = await fetch(`/api/news/subscriptions/notifications?limit=${limit}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`알림 조회 실패: ${response.status}`);
  return response.json();
}

export async function getNewsUnreadCount(): Promise<number> {
  const response = await fetch('/api/news/subscriptions/notifications/unread-count', {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!response.ok) return 0;
  const data = await response.json();
  return data.unreadCount ?? 0;
}

export async function markNewsNotificationRead(notificationId: number): Promise<void> {
  const response = await fetch(`/api/news/subscriptions/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`알림 읽음 처리 실패: ${response.status}`);
  }
}

export async function markAllNewsNotificationsRead(): Promise<void> {
  const response = await fetch('/api/news/subscriptions/notifications/read-all', {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`전체 읽음 처리 실패: ${response.status}`);
  }
}
