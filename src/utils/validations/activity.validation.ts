import { z } from 'zod';

export const activityTypes = [
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

export const listActivitiesQuerySchema = z.object({
    type: z.union([z.string(), z.array(z.string())]).optional(),
    page: z
        .coerce.number()
        .int('Page must be an integer')
        .min(1, 'Page must be at least 1')
        .optional(),
    limit: z
        .coerce.number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit must be at most 100')
        .optional(),
});

export type ActivityTypeFilter = (typeof activityTypes)[number];
