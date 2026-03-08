const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

export interface NotificationPreferences {
  newsEnabled: boolean;
  announcementEnabled: boolean;
  tradingSignalEnabled: boolean;
  backtestEnabled: boolean;
  priceAlertEnabled: boolean;
  weeklyDigestEnabled: boolean;
  pushEnabled: boolean;
}

export type NotificationPreferenceUpdate = Partial<NotificationPreferences>;

export async function getNotificationPreferences(token: string): Promise<NotificationPreferences> {
  const res = await fetch(`${API_BASE}/api/v1/user/notification-preferences`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('알림 설정을 불러올 수 없습니다');
  return res.json();
}

export async function updateNotificationPreferences(
  token: string,
  update: NotificationPreferenceUpdate,
): Promise<NotificationPreferences> {
  const res = await fetch(`${API_BASE}/api/v1/user/notification-preferences`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error('알림 설정 변경에 실패했습니다');
  return res.json();
}
