import { Router } from 'express';
import * as activityController from '../controllers/activity.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';
import { validateParams, validateQuery } from '../middleware/validate.middleware';
import { listActivitiesQuerySchema, activityFeedParamSchema } from '../utils/validations/activity.validation';
import { repoNameParamSchema } from '../utils/validations/repository.validation';

const router = Router();

router.get(
    '/users/:username',
    optionalAuthenticate,
    validateParams(activityFeedParamSchema),
    validateQuery(listActivitiesQuerySchema),
    activityController.listUserActivities
);

router.get(
    '/repositories/:owner/:repo',
    optionalAuthenticate,
    validateParams(repoNameParamSchema),
    validateQuery(listActivitiesQuerySchema),
    activityController.listRepositoryActivities
);

export default router;

