import { z } from 'zod';

/**
 * Organization creation schema
 */
export const createOrganizationSchema = z.object({
    name: z
        .string()
        .min(3, 'Organization name must be at least 3 characters')
        .max(50, 'Organization name must be at most 50 characters')
        .regex(
            /^[a-zA-Z0-9_-]+$/,
            'Organization name can only contain letters, numbers, hyphens, and underscores'
        ),
    displayName: z
        .string()
        .min(1, 'Display name is required')
        .max(100, 'Display name must be at most 100 characters'),
    description: z.string().max(500, 'Description must be at most 500 characters').optional(),
    avatarUrl: z.string().url('Invalid avatar URL').optional(),
    website: z.string().url('Invalid website URL').optional(),
    location: z.string().max(100, 'Location must be at most 100 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
});

/**
 * Organization update schema
 */
export const updateOrganizationSchema = z
    .object({
        displayName: z
            .string()
            .min(1, 'Display name is required')
            .max(100, 'Display name must be at most 100 characters')
            .optional(),
        description: z.string().max(500, 'Description must be at most 500 characters').optional(),
        avatarUrl: z.string().url('Invalid avatar URL').optional(),
        website: z.string().url('Invalid website URL').optional(),
        location: z.string().max(100, 'Location must be at most 100 characters').optional(),
        email: z.string().email('Invalid email address').optional(),
    })
    .refine(
        (data) =>
            data.displayName !== undefined ||
            data.description !== undefined ||
            data.avatarUrl !== undefined ||
            data.website !== undefined ||
            data.location !== undefined ||
            data.email !== undefined,
        {
            message: 'No update fields provided',
            path: ['displayName'],
        }
    );

/**
 * Add organization member schema
 */
export const addOrganizationMemberSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).optional().default('MEMBER'),
});

/**
 * Update organization member role schema
 */
export const updateOrganizationMemberRoleSchema = z.object({
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

/**
 * Organization name param schema
 */
export const organizationNameParamSchema = z.object({
    org: z.string().min(3, 'Organization name must be at least 3 characters'),
});

/**
 * Organization member param schema
 */
export const organizationMemberParamSchema = organizationNameParamSchema.extend({
    username: z.string().min(3, 'Username must be at least 3 characters'),
});

/**
 * List organizations query schema
 */
export const listOrganizationsQuerySchema = z.object({
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
 * List organization members query schema
 */
export const listOrganizationMembersQuerySchema = z.object({
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).optional(),
    page: z.coerce.number().int('Page must be an integer').min(1, 'Page must be at least 1').optional(),
    limit: z
        .coerce.number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit must be at most 100')
        .optional(),
});

/**
 * List organization repositories query schema
 */
export const listOrganizationReposQuerySchema = z.object({
    type: z.enum(['all', 'public', 'private']).optional(),
    language: z.string().optional(),
    sort: z.enum(['created', 'updated', 'pushed', 'name']).optional(),
    direction: z.enum(['asc', 'desc']).optional(),
    page: z.coerce.number().int('Page must be an integer').min(1, 'Page must be at least 1').optional(),
    limit: z
        .coerce.number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit must be at most 100')
        .optional(),
});
