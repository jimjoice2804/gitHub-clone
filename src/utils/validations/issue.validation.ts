import { z } from 'zod';
import { repoNameParamSchema } from './repository.validation';

/**
 * Issue creation schema
 */
export const createIssueSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
    body: z.string().max(5000, 'Body must be at most 5000 characters').optional(),
    assigneeIds: z.array(z.string().uuid('Invalid assignee id')).optional(),
    labelIds: z.array(z.string().uuid('Invalid label id')).optional(),
});

/**
 * Issue update schema
 */
export const updateIssueSchema = z
    .object({
        title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters').optional(),
        body: z.string().max(5000, 'Body must be at most 5000 characters').optional(),
    })
    .refine((data) => data.title !== undefined || data.body !== undefined, {
        message: 'No update fields provided',
        path: ['title'],
    });

/**
 * Issue state update schema
 */
export const updateIssueStateSchema = z.object({
    state: z.enum(['open', 'closed']),
});

/**
 * Issue assignee update schema
 */
export const updateIssueAssigneesSchema = z.object({
    assigneeIds: z.array(z.string().uuid('Invalid assignee id')).min(0),
});

/**
 * Issue label update schema
 */
export const updateIssueLabelsSchema = z.object({
    labelIds: z.array(z.string().uuid('Invalid label id')).min(0),
});

/**
 * Issue comment creation schema
 */
export const createIssueCommentSchema = z.object({
    body: z.string().min(1, 'Comment body is required').max(5000, 'Comment body must be at most 5000 characters'),
});

/**
 * Issue comment update schema
 */
export const updateIssueCommentSchema = z.object({
    body: z.string().min(1, 'Comment body is required').max(5000, 'Comment body must be at most 5000 characters'),
});

/**
 * Issue list query schema
 */
export const listIssuesQuerySchema = z.object({
    state: z.enum(['open', 'closed']).optional(),
    assignee: z.string().uuid('Invalid assignee id').optional(),
    labels: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int('Page must be an integer').min(1, 'Page must be at least 1').optional(),
    limit: z
        .coerce.number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit must be at most 100')
        .optional(),
});

/**
 * Params schema with issue number
 */
export const issueNumberParamSchema = repoNameParamSchema.extend({
    issueNumber: z.string().regex(/^\d+$/, 'Issue number must be numeric'),
});

/**
 * Params schema with comment id
 */
export const issueCommentParamSchema = issueNumberParamSchema.extend({
    commentId: z.string().uuid('Invalid comment id'),
});
