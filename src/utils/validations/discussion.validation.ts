import { z } from 'zod';
import { repoNameParamSchema } from './repository.validation';

/**
 * Discussion creation schema
 */
export const createDiscussionSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
    body: z.string().max(10000, 'Body must be at most 10000 characters').optional(),
    category: z.enum(['general', 'qanda', 'show_and_tell', 'ideas']).optional(),
});

/**
 * Discussion update schema
 */
export const updateDiscussionSchema = z
    .object({
        title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters').optional(),
        body: z.string().max(10000, 'Body must be at most 10000 characters').optional(),
        category: z.enum(['general', 'qanda', 'show_and_tell', 'ideas']).optional(),
    })
    .refine((data) => data.title !== undefined || data.body !== undefined || data.category !== undefined, {
        message: 'No update fields provided',
        path: ['title'],
    });

/**
 * Discussion list query schema
 */
export const listDiscussionsQuerySchema = z.object({
    category: z.enum(['general', 'qanda', 'show_and_tell', 'ideas']).optional(),
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

/**
 * Discussion params schema
 */
export const discussionNumberParamSchema = repoNameParamSchema.extend({
    discussionNumber: z.string().regex(/^\d+$/, 'Discussion number must be numeric'),
});

/**
 * Discussion comment params schema
 */
export const discussionCommentParamSchema = discussionNumberParamSchema.extend({
    commentId: z.string().uuid('Invalid comment id'),
});

/**
 * Discussion comment creation schema
 */
export const createDiscussionCommentSchema = z.object({
    body: z.string().min(1, 'Comment body is required').max(5000, 'Comment body must be at most 5000 characters'),
});

/**
 * Discussion comment update schema
 */
export const updateDiscussionCommentSchema = z.object({
    body: z.string().min(1, 'Comment body is required').max(5000, 'Comment body must be at most 5000 characters'),
});
