import { z } from 'zod';
import { repoNameParamSchema } from './repository.validation';

/**
 * Pull request creation schema
 */
export const createPullRequestSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
    body: z.string().max(10000, 'Body must be at most 10000 characters').optional(),
    headBranch: z.string().min(1, 'Head branch is required').max(100, 'Head branch must be at most 100 characters'),
    baseBranch: z.string().min(1, 'Base branch is required').max(100, 'Base branch must be at most 100 characters'),
    assigneeIds: z.array(z.string().uuid('Invalid assignee id')).optional(),
    labelIds: z.array(z.string().uuid('Invalid label id')).optional(),
});

/**
 * Pull request update schema
 */
export const updatePullRequestSchema = z
    .object({
        title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters').optional(),
        body: z.string().max(10000, 'Body must be at most 10000 characters').optional(),
    })
    .refine((data) => data.title !== undefined || data.body !== undefined, {
        message: 'No update fields provided',
        path: ['title'],
    });

/**
 * Pull request state update schema
 */
export const updatePullRequestStateSchema = z.object({
    state: z.enum(['open', 'closed', 'merged']),
});

/**
 * Pull request assignee update schema
 */
export const updatePullRequestAssigneesSchema = z.object({
    assigneeIds: z.array(z.string().uuid('Invalid assignee id')).min(0),
});

/**
 * Pull request label update schema
 */
export const updatePullRequestLabelsSchema = z.object({
    labelIds: z.array(z.string().uuid('Invalid label id')).min(0),
});

/**
 * Pull request review creation schema
 */
export const createPullRequestReviewSchema = z.object({
    state: z.enum(['approved', 'changes_requested', 'commented', 'dismissed']),
    body: z.string().max(10000, 'Body must be at most 10000 characters').optional(),
});

/**
 * Pull request comment creation schema
 */
export const createPullRequestCommentSchema = z.object({
    body: z.string().min(1, 'Comment body is required').max(5000, 'Comment body must be at most 5000 characters'),
});

/**
 * Pull request comment update schema
 */
export const updatePullRequestCommentSchema = z.object({
    body: z.string().min(1, 'Comment body is required').max(5000, 'Comment body must be at most 5000 characters'),
});

/**
 * Pull request list query schema
 */
export const listPullRequestsQuerySchema = z.object({
    state: z.enum(['open', 'closed', 'merged']).optional(),
    assignee: z.string().uuid('Invalid assignee id').optional(),
    labels: z.string().optional(),
    search: z.string().optional(),
    head: z.string().optional(),
    base: z.string().optional(),
    page: z.coerce.number().int('Page must be an integer').min(1, 'Page must be at least 1').optional(),
    limit: z
        .coerce.number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit must be at most 100')
        .optional(),
});

/**
 * Params schema with pull request number
 */
export const pullNumberParamSchema = repoNameParamSchema.extend({
    pullNumber: z.string().regex(/^\d+$/, 'Pull request number must be numeric'),
});

/**
 * Params schema with pull request comment id
 */
export const pullRequestCommentParamSchema = pullNumberParamSchema.extend({
    commentId: z.string().uuid('Invalid comment id'),
});

/**
 * Params schema with pull request review id
 */
export const pullRequestReviewParamSchema = pullNumberParamSchema.extend({
    reviewId: z.string().uuid('Invalid review id'),
});
