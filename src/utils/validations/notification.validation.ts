import { z } from 'zod';

const notificationTypes = [
    'mention',
    'issue_assigned',
    'pr_assigned',
    'pr_review_requested',
    'pr_merged',
    'star',
    'follow',
    'comment',
] as const;

export const listNotificationsQuerySchema = z.object({
    includeRead: z.coerce.boolean().optional(),
    type: z.enum(notificationTypes).optional(),
    page: z
        .coerce.number()
        .int('Page must be an integer')
        .min(1, 'Page must be at least 1')
        .optional(),
    limit: z
        .coerce.number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit must be at most 100')
        .optional(),
});

export const notificationIdParamSchema = z.object({
    notificationId: z.string().uuid('Invalid notification id'),
});

export const updateNotificationReadSchema = z.object({
    isRead: z.boolean(),
});

export type NotificationTypeFilter = (typeof notificationTypes)[number];
export const notificationTypeValues = notificationTypes;
