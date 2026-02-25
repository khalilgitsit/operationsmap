'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from '@/server/actions/settings';

const RECORD_HREFS: Record<string, (id: string) => string> = {
  function: (id) => `/functions/${id}`,
  subfunction: (id) => `/subfunctions/${id}`,
  process: (id) => `/processes/${id}`,
  core_activity: (id) => `/core-activities/${id}`,
  person: (id) => `/people/${id}`,
  role: (id) => `/roles/${id}`,
  software: (id) => `/software/${id}`,
};

function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

export function NotificationBell() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    const result = await listNotifications(20);
    if (result.success) {
      setNotifications(result.data.items);
      setUnreadCount(result.data.unreadCount);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    // Poll every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  function handleClick(notification: NotificationItem) {
    startTransition(async () => {
      if (!notification.read) {
        await markNotificationRead(notification.id);
      }
      setIsOpen(false);
      const href = RECORD_HREFS[notification.recordType]?.(notification.recordId);
      if (href) router.push(href);
      loadNotifications();
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      loadNotifications();
    });
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 && (
            <button
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              onClick={handleMarkAllRead}
              disabled={isPending}
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                className={`w-full text-left px-3 py-2.5 hover:bg-accent transition-colors flex items-start gap-2 ${
                  !n.read ? 'bg-accent/50' : ''
                }`}
                onClick={() => handleClick(n)}
              >
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                )}
                <div className={`flex-1 min-w-0 ${n.read ? 'ml-4' : ''}`}>
                  <p className="text-sm truncate">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTimeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <button
                    className="mt-1 shrink-0 p-0.5 hover:bg-muted rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      startTransition(async () => {
                        await markNotificationRead(n.id);
                        loadNotifications();
                      });
                    }}
                  >
                    <Check className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
