import { Router } from 'express';
import * as repositoryController from '../controllers/repository.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validate, validateQuery, validateParams } from '../middleware/validate.middleware';
import {
    createRepositorySchema,
    updateRepositorySchema,
    repoNameParamSchema,
    searchRepositoriesSchema,
    forkRepositorySchema,
} from '../utils/validations/repository.validation';

const router = Router();

/**
 * POST /api/repos
 * Create a new repository
 */
router.post('/', authenticate, validate(createRepositorySchema), repositoryController.createRepository);

/**
 * GET /api/repos/search
 * Search repositories
 */
router.get('/search', validateQuery(searchRepositoriesSchema), repositoryController.searchRepositories);

/**
 * GET /api/repos/:owner/:repo
 * Get a repository
 */
router.get('/:owner/:repo', optionalAuthenticate, validateParams(repoNameParamSchema), repositoryController.getRepository);

/**
 * PATCH /api/repos/:owner/:repo
 * Update a repository
 */
router.patch(
    '/:owner/:repo',
    authenticate,
    validateParams(repoNameParamSchema),
    validate(updateRepositorySchema),
    repositoryController.updateRepository
);

/**
 * DELETE /api/repos/:owner/:repo
 * Delete a repository
 */
router.delete(
    '/:owner/:repo',
    authenticate,
    validateParams(repoNameParamSchema),
    repositoryController.deleteRepository
);

/**
 * PUT /api/repos/:owner/:repo/star
 * Star a repository
 */
router.put('/:owner/:repo/star', authenticate, validateParams(repoNameParamSchema), repositoryController.starRepository);

/**
 * DELETE /api/repos/:owner/:repo/star
 * Unstar a repository
 */
router.delete('/:owner/:repo/star', authenticate, validateParams(repoNameParamSchema), repositoryController.unstarRepository);

/**
 * PUT /api/repos/:owner/:repo/subscription
 * Watch a repository
 */
router.put('/:owner/:repo/subscription', authenticate, validateParams(repoNameParamSchema), repositoryController.watchRepository);

/**
 * DELETE /api/repos/:owner/:repo/subscription
 * Unwatch a repository
 */
router.delete(
    '/:owner/:repo/subscription',
    authenticate,
    validateParams(repoNameParamSchema),
    repositoryController.unwatchRepository
);

/**
 * GET /api/repos/users/:username/repos
 * Get user repositories
 */
router.get('/users/:username/repos', optionalAuthenticate, repositoryController.getUserRepositories);

/**
 * POST /api/repos/:owner/:repo/forks
 * Fork a repository
 */
router.post(
    '/:owner/:repo/forks',
    authenticate,
    validateParams(repoNameParamSchema),
    validate(forkRepositorySchema),
    repositoryController.forkRepository
);

/**
 * GET /api/repos/:owner/:repo/forks
 * Get repository forks
 */
router.get(
    '/:owner/:repo/forks',
    optionalAuthenticate,
    validateParams(repoNameParamSchema),
    repositoryController.getRepositoryForks
);

export default router;
