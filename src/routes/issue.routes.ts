import { Router } from 'express';
import * as issueController from '../controllers/issue.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
    createIssueSchema,
    updateIssueSchema,
    updateIssueStateSchema,
    updateIssueAssigneesSchema,
    updateIssueLabelsSchema,
    createIssueCommentSchema,
    updateIssueCommentSchema,
    listIssuesQuerySchema,
    issueNumberParamSchema,
    issueCommentParamSchema,
} from '../utils/validations/issue.validation';
import { repoNameParamSchema } from '../utils/validations/repository.validation';

const router = Router();

// Issue CRUD
router.post(
    '/:owner/:repo/issues',
    authenticate,
    validateParams(repoNameParamSchema),
    validate(createIssueSchema),
    issueController.createIssue
);

router.get(
    '/:owner/:repo/issues',
    optionalAuthenticate,
    validateParams(repoNameParamSchema),
    validateQuery(listIssuesQuerySchema),
    issueController.listIssues
);

router.get(
    '/:owner/:repo/issues/:issueNumber',
    optionalAuthenticate,
    validateParams(issueNumberParamSchema),
    issueController.getIssue
);

router.patch(
    '/:owner/:repo/issues/:issueNumber',
    authenticate,
    validateParams(issueNumberParamSchema),
    validate(updateIssueSchema),
    issueController.updateIssue
);

router.patch(
    '/:owner/:repo/issues/:issueNumber/state',
    authenticate,
    validateParams(issueNumberParamSchema),
    validate(updateIssueStateSchema),
    issueController.updateIssueState
);

router.put(
    '/:owner/:repo/issues/:issueNumber/assignees',
    authenticate,
    validateParams(issueNumberParamSchema),
    validate(updateIssueAssigneesSchema),
    issueController.setIssueAssignees
);

router.put(
    '/:owner/:repo/issues/:issueNumber/labels',
    authenticate,
    validateParams(issueNumberParamSchema),
    validate(updateIssueLabelsSchema),
    issueController.setIssueLabels
);

// Issue comments
router.post(
    '/:owner/:repo/issues/:issueNumber/comments',
    authenticate,
    validateParams(issueNumberParamSchema),
    validate(createIssueCommentSchema),
    issueController.addIssueComment
);

router.get(
    '/:owner/:repo/issues/:issueNumber/comments',
    optionalAuthenticate,
    validateParams(issueNumberParamSchema),
    issueController.listIssueComments
);

router.patch(
    '/:owner/:repo/issues/:issueNumber/comments/:commentId',
    authenticate,
    validateParams(issueCommentParamSchema),
    validate(updateIssueCommentSchema),
    issueController.updateIssueComment
);

router.delete(
    '/:owner/:repo/issues/:issueNumber/comments/:commentId',
    authenticate,
    validateParams(issueCommentParamSchema),
    issueController.deleteIssueComment
);

export default router;
