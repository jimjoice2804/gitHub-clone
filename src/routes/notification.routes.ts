import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
    listNotificationsQuerySchema,
    notificationIdParamSchema,
    updateNotificationStatusSchema,
    bulkUpdateNotificationsSchema,
    markAllNotificationsSchema,
} from '../utils/validations/notification.validation';

const router = Router();

router.get(
    '/',
    authenticate,
    validateQuery(listNotificationsQuerySchema),
    notificationController.listNotifications
);

router.patch(
    '/mark-all',
    authenticate,
    validate(markAllNotificationsSchema),
    notificationController.markAllNotifications
);

router.patch(
    '/bulk',
    authenticate,
    validate(bulkUpdateNotificationsSchema),
    notificationController.bulkUpdateNotifications
);

router.patch(
    '/:notificationId',
    authenticate,
    validateParams(notificationIdParamSchema),
    validate(updateNotificationStatusSchema),
    notificationController.updateNotificationStatus
);

router.delete(
    '/:notificationId',
    authenticate,
    validateParams(notificationIdParamSchema),
    notificationController.deleteNotification
);

export default router;

