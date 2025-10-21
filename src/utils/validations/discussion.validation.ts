import { z } from 'zod';
import { repoNameParamSchema } from './repository.validation';

export const createDiscussionSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
    body: z.string().max(10000, 'Body must be at most 10000 characters').optional(),
});

export const updateDiscussionSchema = z
    .object({
        title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters').optional(),
        body: z.string().max(10000, 'Body must be at most 10000 characters').optional(),
    })
    .refine((data) => data.title !== undefined || data.body !== undefined, {
        message: 'No update fields provided',
        path: ['title'],
    });

export const updateDiscussionStateSchema = z.object({
    state: z.enum(['open', 'closed']),
});

export const createDiscussionCommentSchema = z.object({
    body: z.string().min(1, 'Comment body is required').max(5000, 'Comment body must be at most 5000 characters'),
    parentId: z.string().uuid('Invalid parent comment').optional(),
});

export const updateDiscussionCommentSchema = z.object({
    body: z.string().min(1, 'Comment body is required').max(5000, 'Comment body must be at most 5000 characters'),
});

export const createReactionSchema = z.object({
    emoji: z.string().min(1, 'Emoji is required').max(50, 'Emoji must be at most 50 characters'),
});

export const listDiscussionsQuerySchema = z.object({
    state: z.enum(['open', 'closed']).optional(),
    author: z.string().uuid('Invalid author id').optional(),
    search: z.string().optional(),
    page: z.coerce.number().int('Page must be an integer').min(1, 'Page must be at least 1').optional(),
    limit: z
        .coerce.number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit must be at most 100')
        .optional(),
});

export const discussionNumberParamSchema = repoNameParamSchema.extend({
    discussionNumber: z.string().regex(/^\d+$/, 'Discussion number must be numeric'),
});

export const discussionCommentParamSchema = discussionNumberParamSchema.extend({
    commentId: z.string().uuid('Invalid comment id'),
});

export const reactionParamSchema = discussionCommentParamSchema.extend({
    reactionId: z.string().uuid('Invalid reaction id'),
});
