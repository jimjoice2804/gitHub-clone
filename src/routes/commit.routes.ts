import { Router } from 'express';
import * as commitController from '../controllers/commit.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
    createCommitSchema,
    listCommitsQuerySchema,
    commitShaParamSchema,
} from '../utils/validations/commit.validation';
import { repoNameParamSchema } from '../utils/validations/repository.validation';

const router = Router();

router.post(
    '/:owner/:repo/commits',
    authenticate,
    validateParams(repoNameParamSchema),
    validate(createCommitSchema),
    commitController.createCommit
);

router.get(
    '/:owner/:repo/commits',
    optionalAuthenticate,
    validateParams(repoNameParamSchema),
    validateQuery(listCommitsQuerySchema),
    commitController.listCommits
);

router.get(
    '/:owner/:repo/commits/:sha',
    optionalAuthenticate,
    validateParams(commitShaParamSchema),
    commitController.getCommit
);

export default router;
