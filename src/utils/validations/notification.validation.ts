import { z } from 'zod';

const notificationTypeValues = [
    'mention',
    'issue_assigned',
    'pr_assigned',
    'pr_review_requested',
    'pr_merged',
    'star',
    'follow',
    'comment',
] as const;

const stringBoolean = z.union([z.literal('true'), z.literal('false')]);

export const listNotificationsQuerySchema = z.object({
    type: z.enum(notificationTypeValues).optional(),
    isRead: stringBoolean.optional(),
    page: z.coerce.number().int('Page must be an integer').min(1, 'Page must be at least 1').optional(),
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

export const updateNotificationStatusSchema = z.object({
    isRead: z.boolean(),
});

export const bulkUpdateNotificationsSchema = z.object({
    notificationIds: z
        .array(z.string().uuid('Invalid notification id'))
        .min(1, 'At least one notification id is required'),
    isRead: z.boolean(),
});

export const markAllNotificationsSchema = z.object({
    isRead: z.boolean(),
});

