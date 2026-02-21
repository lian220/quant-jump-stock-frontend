'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationPanel } from './NotificationPanel';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { unreadCount, notifications, loading, fetchNotifications, markAsRead, markAllAsRead } =
    useNotifications();

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchNotifications();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 text-slate-300 hover:text-emerald-400 rounded-lg transition-colors"
          aria-label={`알림 ${unreadCount > 0 ? `${unreadCount}개 미읽음` : ''}`}
        >
          <Bell size={20} className={cn(unreadCount > 0 && 'animate-[wiggle_0.5s_ease-in-out]')} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 bg-slate-800 border-slate-700 shadow-xl"
        align="end"
        sideOffset={8}
      >
        <NotificationPanel
          notifications={notifications}
          loading={loading}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
