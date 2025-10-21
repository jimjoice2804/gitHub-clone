import { z } from 'zod';

/**
 * Label creation schema
 */
export const createLabelSchema = z.object({
    name: z
        .string()
        .min(1, 'Label name is required')
        .max(50, 'Label name must be at most 50 characters')
        .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Label name can only contain letters, numbers, spaces, hyphens, and underscores'),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #ff0000)'),
    description: z
        .string()
        .max(200, 'Description must be at most 200 characters')
        .optional(),
});

/**
 * Label update schema
 */
export const updateLabelSchema = z.object({
    name: z
        .string()
        .min(1, 'Label name is required')
        .max(50, 'Label name must be at most 50 characters')
        .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Label name can only contain letters, numbers, spaces, hyphens, and underscores')
        .optional(),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #ff0000)')
        .optional(),
    description: z
        .string()
        .max(200, 'Description must be at most 200 characters')
        .optional(),
}).refine((data) => data.name !== undefined || data.color !== undefined || data.description !== undefined, {
    message: 'At least one field must be provided for update',
    path: ['name'],
});

/**
 * List labels query schema
 */
export const listLabelsQuerySchema = z.object({
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
 * Label name param schema
 */
export const labelNameParamSchema = z.object({
    name: z.string().min(1, 'Label name is required'),
});
