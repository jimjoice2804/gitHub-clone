import { z } from 'zod';
import { repoNameParamSchema } from './repository.validation';

const shaRegex = /^[a-f0-9]{7,40}$/i;

export const createTagSchema = z.object({
    name: z
        .string()
        .min(1, 'Tag name is required')
        .max(100, 'Tag name must be at most 100 characters')
        .regex(/^[A-Za-z0-9._\-\/]+$/, 'Tag name contains invalid characters'),
    sha: z
        .string()
        .regex(shaRegex, 'SHA must be a hexadecimal string between 7 and 40 characters'),
    message: z
        .string()
        .max(1000, 'Tag message must be at most 1000 characters')
        .optional(),
});

export const listTagsQuerySchema = z.object({
    search: z.string().optional(),
    page: z.coerce.number().int('Page must be an integer').min(1, 'Page must be at least 1').optional(),
    limit: z
        .coerce.number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit must be at most 100')
        .optional(),
});

export const tagNameParamSchema = repoNameParamSchema.extend({
    tag: z
        .string()
        .min(1, 'Tag name is required')
        .regex(/^[A-Za-z0-9._\-\/]+$/, 'Tag name contains invalid characters'),
});
