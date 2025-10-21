import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as notificationService from '../services/notification.service';
import { sendSuccess } from '../utils/response';

export const listNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { type, isRead, page, limit } = req.query;

        const result = await notificationService.listNotifications(userId, {
            type: type as string | undefined,
            isRead: typeof isRead === 'string' ? isRead === 'true' : undefined,
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result, 'Notifications retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const updateNotificationStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { notificationId } = req.params;
        const { isRead } = req.body as { isRead: boolean };

        const notification = await notificationService.markNotificationStatus(userId, notificationId!, isRead);

        sendSuccess(res, notification, 'Notification status updated successfully');
    } catch (error) {
        next(error);
    }
};

export const bulkUpdateNotifications = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { notificationIds, isRead } = req.body as { notificationIds: string[]; isRead: boolean };

        const result = await notificationService.bulkUpdateNotificationStatus(userId, notificationIds, isRead);

        sendSuccess(res, result, 'Notifications updated successfully');
    } catch (error) {
        next(error);
    }
};

export const markAllNotifications = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { isRead } = req.body as { isRead: boolean };

        const result = await notificationService.markAllNotifications(userId, isRead);

        sendSuccess(res, result, 'All notifications updated successfully');
    } catch (error) {
        next(error);
    }
};

export const deleteNotification = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { notificationId } = req.params;

        const result = await notificationService.deleteNotification(userId, notificationId!);

        sendSuccess(res, result, 'Notification deleted successfully');
    } catch (error) {
        next(error);
    }
};

