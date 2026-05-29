'use client';

import { Badge } from '@/components/ui/badge';
import type { NewsNotification } from '@/lib/api/news-subscriptions';
import { formatRelativeTime } from '@/lib/utils';

interface Props {
  unreadCount: number;
  showNotifications: boolean;
  notifications: NewsNotification[];
  onToggle: () => void;
  onMarkAllRead: () => void;
}

export function NewsNotificationBell({
  unreadCount,
  showNotifications,
  notifications,
  onToggle,
  onMarkAllRead,
}: Props) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
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
              <button onClick={onMarkAllRead} className="text-xs text-cyan-400 hover:text-cyan-300">
                전체 읽음
              </button>
            )}
          </div>
          <div className="overflow-y-auto max-h-[340px]">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">알림이 없습니다</div>
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
  );
}
