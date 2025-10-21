import { z } from 'zod';
import { repoNameParamSchema } from './repository.validation';

export const createBranchSchema = z.object({
    name: z
        .string()
        .min(1, 'Branch name is required')
        .max(100, 'Branch name must be at most 100 characters')
        .regex(/^[A-Za-z0-9._\-\/]+$/, 'Branch name contains invalid characters'),
    fromSha: z
        .string()
        .regex(/^[a-f0-9]{7,40}$/i, 'Source SHA must be a hexadecimal string between 7 and 40 characters')
        .optional(),
    isProtected: z.boolean().optional(),
});

export const listBranchesQuerySchema = z.object({
    search: z.string().optional(),
    page: z.coerce.number().int('Page must be an integer').min(1, 'Page must be at least 1').optional(),
    limit: z
        .coerce.number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit must be at most 100')
        .optional(),
});

export const branchNameParamSchema = repoNameParamSchema.extend({
    branch: z
        .string()
        .min(1, 'Branch name is required')
        .regex(/^[A-Za-z0-9._\-\/]+$/, 'Branch name contains invalid characters'),
});
