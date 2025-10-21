import { z } from 'zod';

const activityTypeValues = [
    'created_repo',
    'forked_repo',
    'starred_repo',
    'created_issue',
    'closed_issue',
    'created_pr',
    'merged_pr',
    'pushed_commits',
    'created_branch',
    'created_tag',
    'followed_user',
] as const;

const isoDateString = z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid ISO date string');

export const listActivitiesQuerySchema = z.object({
    type: z.enum(activityTypeValues).optional(),
    repositoryId: z.string().uuid('Invalid repository id').optional(),
    since: isoDateString.optional(),
    until: isoDateString.optional(),
    page: z.coerce.number().int('Page must be an integer').min(1, 'Page must be at least 1').optional(),
    limit: z
        .coerce.number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit must be at most 100')
        .optional(),
});

export const activityFeedParamSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
});

