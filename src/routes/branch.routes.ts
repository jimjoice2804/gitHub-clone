import { Router } from 'express';
import * as branchController from '../controllers/branch.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
    createBranchSchema,
    listBranchesQuerySchema,
    branchNameParamSchema,
} from '../utils/validations/branch.validation';
import { repoNameParamSchema } from '../utils/validations/repository.validation';

const router = Router();

router.post(
    '/:owner/:repo/branches',
    authenticate,
    validateParams(repoNameParamSchema),
    validate(createBranchSchema),
    branchController.createBranch
);

router.get(
    '/:owner/:repo/branches',
    optionalAuthenticate,
    validateParams(repoNameParamSchema),
    validateQuery(listBranchesQuerySchema),
    branchController.listBranches
);

router.get(
    '/:owner/:repo/branches/:branch',
    optionalAuthenticate,
    validateParams(branchNameParamSchema),
    branchController.getBranch
);

router.delete(
    '/:owner/:repo/branches/:branch',
    authenticate,
    validateParams(branchNameParamSchema),
    branchController.deleteBranch
);

export default router;
