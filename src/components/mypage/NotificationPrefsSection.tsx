'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
  type NotificationPreferenceUpdate,
} from '@/lib/api/notification-preferences';
import { getAuthToken } from '@/lib/auth-store';

const NOTIF_ITEMS: ReadonlyArray<{
  key: keyof NotificationPreferences;
  label: string;
  desc: string;
}> = [
  { key: 'newsEnabled', label: '뉴스 알림', desc: '주요 뉴스 알림을 받습니다' },
  { key: 'announcementEnabled', label: '공지사항', desc: '운영팀 공지를 받습니다' },
  { key: 'tradingSignalEnabled', label: '매매 신호', desc: '전략 매수/매도 신호 알림' },
  { key: 'backtestEnabled', label: '백테스트 완료', desc: '백테스트 완료 시 알림' },
  { key: 'priceAlertEnabled', label: '가격 알림', desc: '설정한 가격 도달 시 알림' },
  { key: 'weeklyDigestEnabled', label: '주간 리포트', desc: '주간 투자 요약 리포트' },
  {
    key: 'pushEnabled',
    label: 'Web Push 알림',
    desc: '브라우저 푸시 알림 (꺼도 인앱 알림은 유지)',
  },
];

export function NotificationPrefsSection() {
  const { user } = useAuth();

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null);
  const [notifPrefsLoading, setNotifPrefsLoading] = useState(true);
  const [notifToggling, setNotifToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const token = getAuthToken();
    if (!token) {
      setNotifPrefsLoading(false);
      return;
    }
    let mounted = true;
    getNotificationPreferences(token)
      .then((data) => {
        if (mounted) setNotifPrefs(data);
      })
      .catch(() => {
        // 설정 없으면 기본값 사용
        if (mounted)
          setNotifPrefs({
            newsEnabled: true,
            announcementEnabled: true,
            tradingSignalEnabled: true,
            backtestEnabled: true,
            priceAlertEnabled: true,
            weeklyDigestEnabled: true,
            pushEnabled: true,
          });
      })
      .finally(() => {
        if (mounted) setNotifPrefsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  async function handleToggleNotifPref(key: keyof NotificationPreferences) {
    const token = getAuthToken();
    if (!token || !notifPrefs) return;
    setNotifToggling(key);
    try {
      const update: NotificationPreferenceUpdate = { [key]: !notifPrefs[key] };
      const updated = await updateNotificationPreferences(token, update);
      setNotifPrefs(updated);
    } catch {
      // 실패 시 무시
    } finally {
      setNotifToggling(null);
    }
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg text-white">알림 설정</CardTitle>
      </CardHeader>
      <CardContent>
        {notifPrefsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-700/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : notifPrefs ? (
          <div className="space-y-1">
            {NOTIF_ITEMS.map(({ key, label, desc }) => (
              <div
                key={key}
                className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => handleToggleNotifPref(key)}
                  disabled={notifToggling === key}
                  className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifPrefs[key] ? 'bg-emerald-600' : 'bg-slate-600'
                  } ${notifToggling === key ? 'opacity-50' : ''}`}
                  role="switch"
                  aria-checked={notifPrefs[key]}
                  aria-label={`${label} ${notifPrefs[key] ? '끄기' : '켜기'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifPrefs[key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
