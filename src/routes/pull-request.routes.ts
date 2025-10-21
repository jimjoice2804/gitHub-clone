import { Router } from 'express';
import * as pullRequestController from '../controllers/pull-request.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
    createPullRequestSchema,
    updatePullRequestSchema,
    updatePullRequestStateSchema,
    updatePullRequestAssigneesSchema,
    updatePullRequestLabelsSchema,
    createPullRequestCommentSchema,
    updatePullRequestCommentSchema,
    createPullRequestReviewSchema,
    listPullRequestsQuerySchema,
    pullNumberParamSchema,
    pullRequestCommentParamSchema,
} from '../utils/validations/pull-request.validation';
import { repoNameParamSchema } from '../utils/validations/repository.validation';

const router = Router();

// Pull request core endpoints
router.post(
    '/:owner/:repo/pulls',
    authenticate,
    validateParams(repoNameParamSchema),
    validate(createPullRequestSchema),
    pullRequestController.createPullRequest
);

router.get(
    '/:owner/:repo/pulls',
    optionalAuthenticate,
    validateParams(repoNameParamSchema),
    validateQuery(listPullRequestsQuerySchema),
    pullRequestController.listPullRequests
);

router.get(
    '/:owner/:repo/pulls/:pullNumber',
    optionalAuthenticate,
    validateParams(pullNumberParamSchema),
    pullRequestController.getPullRequest
);

router.patch(
    '/:owner/:repo/pulls/:pullNumber',
    authenticate,
    validateParams(pullNumberParamSchema),
    validate(updatePullRequestSchema),
    pullRequestController.updatePullRequest
);

router.patch(
    '/:owner/:repo/pulls/:pullNumber/state',
    authenticate,
    validateParams(pullNumberParamSchema),
    validate(updatePullRequestStateSchema),
    pullRequestController.updatePullRequestState
);

router.put(
    '/:owner/:repo/pulls/:pullNumber/assignees',
    authenticate,
    validateParams(pullNumberParamSchema),
    validate(updatePullRequestAssigneesSchema),
    pullRequestController.setPullRequestAssignees
);

router.put(
    '/:owner/:repo/pulls/:pullNumber/labels',
    authenticate,
    validateParams(pullNumberParamSchema),
    validate(updatePullRequestLabelsSchema),
    pullRequestController.setPullRequestLabels
);

// Pull request comments
router.post(
    '/:owner/:repo/pulls/:pullNumber/comments',
    authenticate,
    validateParams(pullNumberParamSchema),
    validate(createPullRequestCommentSchema),
    pullRequestController.addPullRequestComment
);

router.get(
    '/:owner/:repo/pulls/:pullNumber/comments',
    optionalAuthenticate,
    validateParams(pullNumberParamSchema),
    pullRequestController.listPullRequestComments
);

router.patch(
    '/:owner/:repo/pulls/:pullNumber/comments/:commentId',
    authenticate,
    validateParams(pullRequestCommentParamSchema),
    validate(updatePullRequestCommentSchema),
    pullRequestController.updatePullRequestComment
);

router.delete(
    '/:owner/:repo/pulls/:pullNumber/comments/:commentId',
    authenticate,
    validateParams(pullRequestCommentParamSchema),
    pullRequestController.deletePullRequestComment
);

// Pull request reviews
router.post(
    '/:owner/:repo/pulls/:pullNumber/reviews',
    authenticate,
    validateParams(pullNumberParamSchema),
    validate(createPullRequestReviewSchema),
    pullRequestController.createPullRequestReview
);

router.get(
    '/:owner/:repo/pulls/:pullNumber/reviews',
    optionalAuthenticate,
    validateParams(pullNumberParamSchema),
    pullRequestController.listPullRequestReviews
);

export default router;
