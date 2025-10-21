import { Router } from 'express';
import * as activityController from '../controllers/activity.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';
import { validateParams, validateQuery } from '../middleware/validate.middleware';
import { usernameParamSchema } from '../utils/validations/user.validation';
import { repoNameParamSchema } from '../utils/validations/repository.validation';
import { listActivitiesQuerySchema } from '../utils/validations/activity.validation';

const router = Router();

router.get(
    '/users/:username/activity',
    optionalAuthenticate,
    validateParams(usernameParamSchema),
    validateQuery(listActivitiesQuerySchema),
    activityController.getUserActivity
);

router.get(
    '/repos/:owner/:repo/activity',
    optionalAuthenticate,
    validateParams(repoNameParamSchema),
    validateQuery(listActivitiesQuerySchema),
    activityController.getRepositoryActivity
);

export default router;
