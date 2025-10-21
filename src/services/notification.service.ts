import db from '@config/database';
import { NotificationType, Prisma } from '@prisma/client';
import { ApiError } from '../types/index';
import { NotificationTypeFilter, notificationTypeValues } from '../utils/validations/notification.validation';

const notificationSelect = {
    id: true,
    type: true,
    title: true,
    message: true,
    isRead: true,
    link: true,
    createdAt: true,
} satisfies Prisma.NotificationSelect;

type NotificationRecord = Prisma.NotificationGetPayload<{ select: typeof notificationSelect }>;

const notificationTypeToString: Record<NotificationType, NotificationTypeFilter> = {
    [NotificationType.MENTION]: 'mention',
    [NotificationType.ISSUE_ASSIGNED]: 'issue_assigned',
    [NotificationType.PR_ASSIGNED]: 'pr_assigned',
    [NotificationType.PR_REVIEW_REQUESTED]: 'pr_review_requested',
    [NotificationType.PR_MERGED]: 'pr_merged',
    [NotificationType.STAR]: 'star',
    [NotificationType.FOLLOW]: 'follow',
    [NotificationType.COMMENT]: 'comment',
};

const notificationStringToEnum: Record<NotificationTypeFilter, NotificationType> = Object.entries(
    notificationTypeToString
).reduce((accumulator, [enumKey, value]) => {
    accumulator[value] = enumKey as NotificationType;
    return accumulator;
}, {} as Record<NotificationTypeFilter, NotificationType>);

const mapNotificationTypeToEnum = (type?: NotificationTypeFilter | string): NotificationType | undefined => {
    if (!type) {
        return undefined;
    }

    const normalized = type.toLowerCase() as NotificationTypeFilter;
    if (notificationTypeValues.includes(normalized)) {
        return notificationStringToEnum[normalized];
    }

    return undefined;
};

const mapNotificationTypeFromEnum = (type: NotificationType): NotificationTypeFilter => notificationTypeToString[type];

const mapNotification = (notification: NotificationRecord) => ({
    id: notification.id,
    type: mapNotificationTypeFromEnum(notification.type),
    title: notification.title,
    message: notification.message,
    link: notification.link ?? undefined,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
});

export const listNotifications = async (
    userId: string,
    options?: {
        includeRead?: boolean;
        type?: NotificationTypeFilter;
        page?: number;
        limit?: number;
    }
) => {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
        userId,
    };

    if (!options?.includeRead) {
        where.isRead = false;
    }

    if (options?.type) {
        const enumType = mapNotificationTypeToEnum(options.type);
        if (!enumType) {
            throw new ApiError(400, 'Invalid notification type filter');
        }
        where.type = enumType;
    }

    const [notifications, total] = await Promise.all([
        db.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            select: notificationSelect,
        }),
        db.notification.count({ where }),
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
    };
};

export const markNotificationRead = async (userId: string, notificationId: string, isRead: boolean) => {
    const notification = await db.notification.findFirst({
        where: {
            id: notificationId,
            userId,
        },
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

export const markAllNotificationsRead = async (userId: string) => {
    const result = await db.notification.updateMany({
        where: {
            userId,
            isRead: false,
        },
        data: { isRead: true },
    });

    return {
        updatedCount: result.count,
    };
};

export const deleteNotification = async (userId: string, notificationId: string) => {
    const notification = await db.notification.findUnique({
        where: { id: notificationId },
        select: { userId: true },
    });

    if (!notification || notification.userId !== userId) {
        throw new ApiError(404, 'Notification not found');
    }

    await db.notification.delete({
        where: { id: notificationId },
    });

    return { message: 'Notification deleted successfully' };
};
