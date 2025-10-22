import { api } from '@/lib/api/client';
import { Notification, NotificationFilters, NotificationsResponse } from '@/lib/types';

export const notificationApi = {
    getNotifications: (filters?: NotificationFilters) =>
        api.get<NotificationsResponse>('/notifications', { params: filters }),

    getUnreadCount: () =>
        api.get<{ count: number }>('/notifications/unread-count'),

    markAsRead: (notificationId: number) =>
        api.put<Notification>(`/notifications/${notificationId}/read`),

    markAllAsRead: () =>
        api.put<{ success: boolean }>('/notifications/read-all'),

    deleteNotification: (notificationId: number) =>
        api.delete<{ success: boolean }>(`/notifications/${notificationId}`),
};
