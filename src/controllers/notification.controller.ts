import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as notificationService from '../services/notification.service';
import { sendSuccess } from '../utils/response';
import { NotificationTypeFilter, notificationTypeValues } from '../utils/validations/notification.validation';

const isNotificationType = (value: unknown): value is NotificationTypeFilter =>
    typeof value === 'string' && notificationTypeValues.includes(value as NotificationTypeFilter);

const parseBooleanQuery = (value: unknown): boolean | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') {
            return true;
        }
        if (value.toLowerCase() === 'false') {
            return false;
        }
    }

    return undefined;
};

export const listNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { includeRead, type, page, limit } = req.query;

        const parsedType = isNotificationType(type) ? type : undefined;

        const result = await notificationService.listNotifications(userId, {
            includeRead: parseBooleanQuery(includeRead),
            type: parsedType,
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result, 'Notifications retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const markNotificationRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { notificationId } = req.params;
        const { isRead } = req.body as { isRead: boolean };

        const notification = await notificationService.markNotificationRead(userId, notificationId!, isRead);

        sendSuccess(res, notification, 'Notification updated successfully');
    } catch (error) {
        next(error);
    }
};

export const markAllNotificationsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;

        const result = await notificationService.markAllNotificationsRead(userId);

        sendSuccess(res, result, 'All notifications marked as read');
    } catch (error) {
        next(error);
    }
};

export const deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { notificationId } = req.params;

        const result = await notificationService.deleteNotification(userId, notificationId!);

        sendSuccess(res, result, 'Notification deleted successfully');
    } catch (error) {
        next(error);
    }
};
