'use client';

import { useRouter } from 'next/navigation';
import type {
  UnifiedNotification,
  NotificationType,
  NotificationPriority,
} from '@/lib/api/notifications';
import { cn, formatRelativeTime } from '@/lib/utils';

const TYPE_ICONS: Partial<Record<NotificationType, string>> = {
  BACKTEST_COMPLETE: '🔬',
  AI_ANALYSIS_COMPLETE: '🤖',
  NEWS: '📰',
  TRADING_SIGNAL: '🚨',
  ANNOUNCEMENT: '📢',
  PRICE_ALERT: '💹',
  SUBSCRIPTION_EXPIRING: '💳',
  USAGE_LIMIT_REACHED: '⚠️',
  STRATEGY_PERFORMANCE: '📊',
  WEEKLY_DIGEST: '📋',
};

const PRIORITY_STYLES: Record<NotificationPriority, string> = {
  CRITICAL: 'border-l-red-500 bg-red-500/5',
  HIGH: 'border-l-orange-500',
  NORMAL: 'border-l-transparent',
  LOW: 'border-l-transparent opacity-70',
};

interface NotificationPanelProps {
  notifications: UnifiedNotification[];
  loading: boolean;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export function NotificationPanel({
  notifications,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: NotificationPanelProps) {
  const router = useRouter();

  const handleClick = (notification: UnifiedNotification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      onClose();
      if (notification.actionUrl.startsWith('http')) {
        window.open(notification.actionUrl, '_blank', 'noopener,noreferrer');
      } else {
        router.push(notification.actionUrl);
      }
    }
  };

  return (
    <div className="w-[340px] sm:w-[380px] max-h-[480px] flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-white">알림</h3>
        <button
          onClick={onMarkAllAsRead}
          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          전체 읽음
        </button>
      </div>

      {/* 알림 목록 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <span className="text-2xl mb-2">🔔</span>
            <span className="text-sm">알림이 없습니다</span>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleClick(notification)}
              className={cn(
                'w-full text-left px-4 py-3 border-l-2 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors',
                PRIORITY_STYLES[notification.priority] || 'border-l-transparent',
                !notification.isRead && 'bg-slate-800/50',
              )}
            >
              <div className="flex gap-2.5">
                <span className="text-base mt-0.5 shrink-0">
                  {TYPE_ICONS[notification.type] || '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        'text-sm leading-snug truncate',
                        notification.isRead ? 'text-slate-400' : 'text-white font-medium',
                      )}
                    >
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span className="shrink-0 mt-1.5 h-2 w-2 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  {notification.message && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{notification.message}</p>
                  )}
                  <p className="text-[11px] text-slate-600 mt-1">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
