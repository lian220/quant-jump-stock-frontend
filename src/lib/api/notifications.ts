// 통합 알림 API 클라이언트

export interface UnifiedNotification {
  id: number;
  type: string;
  priority: string;
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

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function getNotifications(limit = 20): Promise<UnifiedNotificationListResponse> {
  const res = await fetch(`/api/notifications?limit=${limit}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('알림 조회 실패');
  return res.json();
}

export async function getUnreadCount(): Promise<number> {
  const res = await fetch('/api/notifications/unread-count', { headers: getAuthHeaders() });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.unreadCount ?? 0;
}

export async function markNotificationAsRead(id: number): Promise<void> {
  await fetch(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await fetch('/api/notifications/read-all', {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
}
