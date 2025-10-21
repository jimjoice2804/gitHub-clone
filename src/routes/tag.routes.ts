import { Router } from 'express';
import * as tagController from '../controllers/tag.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
    createTagSchema,
    listTagsQuerySchema,
    tagNameParamSchema,
} from '../utils/validations/tag.validation';
import { repoNameParamSchema } from '../utils/validations/repository.validation';

const router = Router();

router.post(
    '/:owner/:repo/tags',
    authenticate,
    validateParams(repoNameParamSchema),
    validate(createTagSchema),
    tagController.createTag
);

router.get(
    '/:owner/:repo/tags',
    optionalAuthenticate,
    validateParams(repoNameParamSchema),
    validateQuery(listTagsQuerySchema),
    tagController.listTags
);

router.get(
    '/:owner/:repo/tags/:tag',
    optionalAuthenticate,
    validateParams(tagNameParamSchema),
    tagController.getTag
);

router.delete(
    '/:owner/:repo/tags/:tag',
    authenticate,
    validateParams(tagNameParamSchema),
    tagController.deleteTag
);

export default router;
