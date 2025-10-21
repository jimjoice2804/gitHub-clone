import { Router } from 'express';
import * as discussionController from '../controllers/discussion.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
    createDiscussionSchema,
    updateDiscussionSchema,
    updateDiscussionStateSchema,
    createDiscussionCommentSchema,
    updateDiscussionCommentSchema,
    createReactionSchema,
    listDiscussionsQuerySchema,
    discussionNumberParamSchema,
    discussionCommentParamSchema,
    reactionParamSchema,
} from '../utils/validations/discussion.validation';
import { repoNameParamSchema } from '../utils/validations/repository.validation';

const router = Router();

// Discussion CRUD
router.post(
    '/:owner/:repo/discussions',
    authenticate,
    validateParams(repoNameParamSchema),
    validate(createDiscussionSchema),
    discussionController.createDiscussion
);

router.get(
    '/:owner/:repo/discussions',
    optionalAuthenticate,
    validateParams(repoNameParamSchema),
    validateQuery(listDiscussionsQuerySchema),
    discussionController.listDiscussions
);

router.get(
    '/:owner/:repo/discussions/:discussionNumber',
    optionalAuthenticate,
    validateParams(discussionNumberParamSchema),
    discussionController.getDiscussion
);

router.patch(
    '/:owner/:repo/discussions/:discussionNumber',
    authenticate,
    validateParams(discussionNumberParamSchema),
    validate(updateDiscussionSchema),
    discussionController.updateDiscussion
);

router.patch(
    '/:owner/:repo/discussions/:discussionNumber/state',
    authenticate,
    validateParams(discussionNumberParamSchema),
    validate(updateDiscussionStateSchema),
    discussionController.updateDiscussionState
);

// Discussion comments
router.post(
    '/:owner/:repo/discussions/:discussionNumber/comments',
    authenticate,
    validateParams(discussionNumberParamSchema),
    validate(createDiscussionCommentSchema),
    discussionController.addDiscussionComment
);

router.get(
    '/:owner/:repo/discussions/:discussionNumber/comments',
    optionalAuthenticate,
    validateParams(discussionNumberParamSchema),
    discussionController.listDiscussionComments
);

router.patch(
    '/:owner/:repo/discussions/:discussionNumber/comments/:commentId',
    authenticate,
    validateParams(discussionCommentParamSchema),
    validate(updateDiscussionCommentSchema),
    discussionController.updateDiscussionComment
);

router.delete(
    '/:owner/:repo/discussions/:discussionNumber/comments/:commentId',
    authenticate,
    validateParams(discussionCommentParamSchema),
    discussionController.deleteDiscussionComment
);

// Comment reactions
router.get(
    '/:owner/:repo/discussions/:discussionNumber/comments/:commentId/reactions',
    optionalAuthenticate,
    validateParams(discussionCommentParamSchema),
    discussionController.listCommentReactions
);

router.post(
    '/:owner/:repo/discussions/:discussionNumber/comments/:commentId/reactions',
    authenticate,
    validateParams(discussionCommentParamSchema),
    validate(createReactionSchema),
    discussionController.addCommentReaction
);

router.delete(
    '/:owner/:repo/discussions/:discussionNumber/comments/:commentId/reactions/:reactionId',
    authenticate,
    validateParams(reactionParamSchema),
    discussionController.removeCommentReaction
);

export default router;

