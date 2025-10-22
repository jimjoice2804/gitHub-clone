'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { notificationApi } from '@/lib/api/notification';
import { Notification } from '@/lib/types';
import { NotificationItem } from './NotificationItem';
import { toast } from 'sonner';
import { useDebounce } from '@/lib/hooks/useDebounce';

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationApi.getNotifications({
        read: filter === 'unread' ? false : undefined,
        search: debouncedSearch || undefined,
        page,
        limit: 20,
      });

      if (page === 1) {
        setNotifications(response.notifications);
      } else {
        setNotifications((prev) => [...prev, ...response.notifications]);
      }

      setTotal(response.total);
      setHasMore(response.notifications.length === 20);
    } catch (err) {
      toast.error('Failed to load notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch, page]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      try {
        await notificationApi.markAsRead(notification.id);
        setNotifications(
          notifications.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteNotification = async (notificationId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await notificationApi.deleteNotification(notificationId);
      setNotifications(notifications.filter((n) => n.id !== notificationId));
      setTotal((prev) => prev - 1);
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleFilterChange = (value: string) => {
    setFilter(value as 'all' | 'unread');
    setPage(1);
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {total} total notifications
            {unreadCount > 0 && ` • ${unreadCount} unread`}
          </p>
        </div>
        {unreadCount > 0 && <Button onClick={handleMarkAllAsRead}>Mark all as read</Button>}
      </div>

      <div className="flex items-center gap-4">
        <Input
          type="search"
          placeholder="Search notifications..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="max-w-md"
        />
      </div>

      <Tabs value={filter} onValueChange={handleFilterChange}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread {unreadCount > 0 && `(${unreadCount})`}</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          {loading && page === 1 ? (
            <Card className="p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </Card>
          ) : notifications.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </div>
            </Card>
          ) : (
            <>
              <Card className="overflow-hidden">
                {notifications.map((notification) => (
                  <div key={notification.id} className="relative group">
                    <NotificationItem
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteNotification(notification.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </Card>

              {hasMore && (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load more'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
