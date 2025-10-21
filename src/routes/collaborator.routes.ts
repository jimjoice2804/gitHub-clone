import { Router } from 'express';
import * as collaboratorController from '../controllers/collaborator.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
    addCollaboratorSchema,
    updateCollaboratorPermissionSchema,
    collaboratorParamSchema,
    listCollaboratorsQuerySchema,
} from '../utils/validations/collaborator.validation';
import { repoNameParamSchema } from '../utils/validations/repository.validation';

const router = Router();

/**
 * PUT /api/repos/:owner/:repo/collaborators
 * Add a collaborator
 */
router.put(
    '/:owner/:repo/collaborators',
    authenticate,
    validateParams(repoNameParamSchema),
    validate(addCollaboratorSchema),
    collaboratorController.addCollaborator
);

/**
 * GET /api/repos/:owner/:repo/collaborators
 * List collaborators
 */
router.get(
    '/:owner/:repo/collaborators',
    optionalAuthenticate,
    validateParams(repoNameParamSchema),
    validateQuery(listCollaboratorsQuerySchema),
    collaboratorController.listCollaborators
);

/**
 * GET /api/repos/:owner/:repo/collaborators/:username
 * Get collaborator info
 */
router.get(
    '/:owner/:repo/collaborators/:username',
    optionalAuthenticate,
    validateParams(collaboratorParamSchema),
    collaboratorController.getCollaborator
);

/**
 * PATCH /api/repos/:owner/:repo/collaborators/:username
 * Update collaborator permission
 */
router.patch(
    '/:owner/:repo/collaborators/:username',
    authenticate,
    validateParams(collaboratorParamSchema),
    validate(updateCollaboratorPermissionSchema),
    collaboratorController.updateCollaboratorPermission
);

/**
 * DELETE /api/repos/:owner/:repo/collaborators/:username
 * Remove a collaborator
 */
router.delete(
    '/:owner/:repo/collaborators/:username',
    authenticate,
    validateParams(collaboratorParamSchema),
    collaboratorController.removeCollaborator
);

export default router;
