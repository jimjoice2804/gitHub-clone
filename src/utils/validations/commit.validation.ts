import { z } from 'zod';
import { repoNameParamSchema } from './repository.validation';

const shaRegex = /^[a-f0-9]{7,40}$/i;

export const createCommitSchema = z.object({
    sha: z
        .string()
        .regex(shaRegex, 'SHA must be a hexadecimal string between 7 and 40 characters'),
    message: z.string().min(1, 'Commit message is required').max(1000, 'Commit message must be at most 1000 characters'),
    branch: z.string().min(1, 'Branch name is required').max(100, 'Branch name must be at most 100 characters'),
    parentSha: z
        .string()
        .regex(shaRegex, 'Parent SHA must be a hexadecimal string between 7 and 40 characters')
        .optional(),
});

export const listCommitsQuerySchema = z.object({
    author: z.string().uuid('Invalid author id').optional(),
    search: z.string().optional(),
    since: z.string().datetime({ message: 'Invalid since timestamp' }).optional(),
    until: z.string().datetime({ message: 'Invalid until timestamp' }).optional(),
    page: z.coerce.number().int('Page must be an integer').min(1, 'Page must be at least 1').optional(),
    limit: z
        .coerce.number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit must be at most 100')
        .optional(),
});

export const commitShaParamSchema = repoNameParamSchema.extend({
    sha: z
        .string()
        .regex(shaRegex, 'Commit SHA must be a hexadecimal string between 7 and 40 characters'),
});
