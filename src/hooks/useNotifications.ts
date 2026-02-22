'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getUnreadCount,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/api/notifications';
import type { UnifiedNotification } from '@/lib/api/notifications';
import { useAuth } from '@/hooks/useAuth';

const POLL_INTERVAL = 30_000; // 30초

export function useNotifications() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 미읽음 카운트 폴링
  const pollUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // 네트워크 오류 무시
    }
  }, [user]);

  // 알림 목록 조회
  const fetchNotifications = useCallback(
    async (limit = 20) => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await getNotifications(limit);
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch {
        // 무시
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  // 읽음 처리
  const markAsRead = useCallback(async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // 네트워크 오류 시 상태 변경 없이 무시
    }
  }, []);

  // 전체 읽음
  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // 네트워크 오류 시 상태 변경 없이 무시
    }
  }, []);

  // 폴링 시작/중지
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    // 즉시 1회 조회
    pollUnreadCount();

    // 30초 간격 폴링
    intervalRef.current = setInterval(pollUnreadCount, POLL_INTERVAL);

    // 탭 visibility 감지: 탭 복귀 시 즉시 폴링
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        pollUnreadCount();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, pollUnreadCount]);

  return {
    unreadCount,
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
