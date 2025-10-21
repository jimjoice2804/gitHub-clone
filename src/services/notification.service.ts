import db from '@config/database';
import { NotificationType, Prisma } from '@prisma/client';
import { ApiError } from '../types/index';

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

const isNotificationTypeValue = (value: string): value is (typeof notificationTypeValues)[number] =>
    (notificationTypeValues as readonly string[]).includes(value);

const apiToNotificationType: Record<(typeof notificationTypeValues)[number], NotificationType> = {
    mention: NotificationType.MENTION,
    issue_assigned: NotificationType.ISSUE_ASSIGNED,
    pr_assigned: NotificationType.PR_ASSIGNED,
    pr_review_requested: NotificationType.PR_REVIEW_REQUESTED,
    pr_merged: NotificationType.PR_MERGED,
    star: NotificationType.STAR,
    follow: NotificationType.FOLLOW,
    comment: NotificationType.COMMENT,
};

const notificationTypeToApi: Record<NotificationType, (typeof notificationTypeValues)[number]> = {
    [NotificationType.MENTION]: 'mention',
    [NotificationType.ISSUE_ASSIGNED]: 'issue_assigned',
    [NotificationType.PR_ASSIGNED]: 'pr_assigned',
    [NotificationType.PR_REVIEW_REQUESTED]: 'pr_review_requested',
    [NotificationType.PR_MERGED]: 'pr_merged',
    [NotificationType.STAR]: 'star',
    [NotificationType.FOLLOW]: 'follow',
    [NotificationType.COMMENT]: 'comment',
};

const mapNotificationType = (type: NotificationType) => notificationTypeToApi[type];

type NotificationRecord = Prisma.NotificationGetPayload<{
    select: {
        id: true;
        type: true;
        title: true;
        message: true;
        isRead: true;
        link: true;
        createdAt: true;
    };
}>;

const notificationSelect = {
    id: true,
    type: true,
    title: true,
    message: true,
    isRead: true,
    link: true,
    createdAt: true,
} as const;

const mapNotification = (notification: NotificationRecord) => ({
    id: notification.id,
    type: mapNotificationType(notification.type),
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    link: notification.link,
    createdAt: notification.createdAt,
});

const parseNotificationType = (type?: string) => {
    if (!type) {
        return undefined;
    }
    if (!isNotificationTypeValue(type)) {
        throw new ApiError(400, 'Invalid notification type');
    }
    return apiToNotificationType[type];
};

export const listNotifications = async (
    userId: string,
    options?: {
        type?: string;
        isRead?: boolean;
        page?: number;
        limit?: number;
    }
) => {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
        userId,
        ...(options?.isRead !== undefined && { isRead: options.isRead }),
    };

    const typeFilter = parseNotificationType(options?.type);
    if (typeFilter) {
        where.type = typeFilter;
    }

    const [notifications, total, unreadCount] = await Promise.all([
        db.notification.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: notificationSelect,
        }),
        db.notification.count({ where }),
        db.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
        notifications: notifications.map(mapNotification),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1,
        },
        unreadCount,
    };
};

export const markNotificationStatus = async (userId: string, notificationId: string, isRead: boolean) => {
    const notification = await db.notification.findFirst({
        where: { id: notificationId, userId },
        select: notificationSelect,
    });

    if (!notification) {
        throw new ApiError(404, 'Notification not found');
    }

    if (notification.isRead === isRead) {
        return mapNotification(notification);
    }

    const updated = await db.notification.update({
        where: { id: notificationId },
        data: { isRead },
        select: notificationSelect,
    });

    return mapNotification(updated);
};

export const bulkUpdateNotificationStatus = async (
    userId: string,
    notificationIds: string[],
    isRead: boolean
) => {
    if (notificationIds.length === 0) {
        throw new ApiError(400, 'No notification ids provided');
    }

    const result = await db.notification.updateMany({
        where: {
            id: { in: notificationIds },
            userId,
        },
        data: { isRead },
    });

    return { updatedCount: result.count };
};

export const markAllNotifications = async (userId: string, isRead: boolean) => {
    const result = await db.notification.updateMany({
        where: { userId },
        data: { isRead },
    });

    return { updatedCount: result.count };
};

export const deleteNotification = async (userId: string, notificationId: string) => {
    const notification = await db.notification.findFirst({
        where: { id: notificationId, userId },
        select: { id: true },
    });

    if (!notification) {
        throw new ApiError(404, 'Notification not found');
    }

    await db.notification.delete({ where: { id: notificationId } });

    return { message: 'Notification deleted successfully' };
};

export const createNotification = async (data: {
    userId: string;
    type: NotificationType | typeof notificationTypeValues[number];
    title: string;
    message: string;
    link?: string;
}) => {
    const type = typeof data.type === 'string' ? parseNotificationType(data.type) : data.type;

    if (!type) {
        throw new ApiError(400, 'Invalid notification type');
    }

    const notification = await db.notification.create({
        data: {
            userId: data.userId,
            type,
            title: data.title,
            message: data.message,
            link: data.link,
        },
        select: notificationSelect,
    });

    return mapNotification(notification);
};

