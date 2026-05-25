// 통합 알림 API 클라이언트

import { getAuthToken } from '@/lib/auth-store';
import { fetchWithAutoRefresh } from '@/lib/api-client';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export type NotificationType =
  | 'BACKTEST_COMPLETE'
  | 'AI_ANALYSIS_COMPLETE'
  | 'NEWS'
  | 'TRADING_SIGNAL'
  | 'ANNOUNCEMENT'
  | 'PRICE_ALERT'
  | 'SUBSCRIPTION_EXPIRING'
  | 'USAGE_LIMIT_REACHED'
  | 'STRATEGY_PERFORMANCE'
  | 'WEEKLY_DIGEST';

export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export interface UnifiedNotification {
  id: number;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string | null;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnifiedNotificationListResponse {
  notifications: UnifiedNotification[];
  unreadCount: number;
}

export async function getNotifications(limit = 20): Promise<UnifiedNotificationListResponse> {
  const res = await fetchWithAutoRefresh(`/api/notifications?limit=${limit}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('알림 조회 실패');
  return res.json();
}

export async function getUnreadCount(): Promise<number> {
  const res = await fetchWithAutoRefresh('/api/notifications/unread-count', {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.unreadCount ?? 0;
}

export async function markNotificationAsRead(id: number): Promise<void> {
  const res = await fetchWithAutoRefresh(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`알림 읽음 처리 실패: ${res.status}`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const res = await fetchWithAutoRefresh('/api/notifications/read-all', {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`전체 읽음 처리 실패: ${res.status}`);
}
