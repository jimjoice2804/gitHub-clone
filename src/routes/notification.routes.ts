import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
    listNotificationsQuerySchema,
    notificationIdParamSchema,
    updateNotificationReadSchema,
} from '../utils/validations/notification.validation';

const router = Router();

router.get('/', authenticate, validateQuery(listNotificationsQuerySchema), notificationController.listNotifications);

router.patch(
    '/:notificationId/read',
    authenticate,
    validateParams(notificationIdParamSchema),
    validate(updateNotificationReadSchema),
    notificationController.markNotificationRead
);

router.post('/read-all', authenticate, notificationController.markAllNotificationsRead);

router.delete(
    '/:notificationId',
    authenticate,
    validateParams(notificationIdParamSchema),
    notificationController.deleteNotification
);

export default router;
