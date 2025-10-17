import { z } from 'zod';

/**
 * Create repository schema
 */
export const createRepositorySchema = z.object({
    name: z
        .string()
        .min(1, 'Repository name is required')
        .max(100, 'Repository name must be at most 100 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Repository name can only contain letters, numbers, hyphens, and underscores'),
    description: z.string().max(500, 'Description must be at most 500 characters').optional(),
    isPrivate: z.boolean().optional(),
    language: z.string().max(50, 'Language must be at most 50 characters').optional(),
});

/**
 * Update repository schema
 */
export const updateRepositorySchema = z.object({
    name: z
        .string()
        .min(1, 'Repository name is required')
        .max(100, 'Repository name must be at most 100 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Repository name can only contain letters, numbers, hyphens, and underscores')
        .optional(),
    description: z.string().max(500, 'Description must be at most 500 characters').optional(),
    isPrivate: z.boolean().optional(),
    language: z.string().max(50, 'Language must be at most 50 characters').optional(),
});

/**
 * Repository name param schema
 */
export const repoNameParamSchema = z.object({
    owner: z.string().min(3, 'Owner username must be at least 3 characters'),
    repo: z.string().min(1, 'Repository name is required'),
});

/**
 * Search repositories schema
 */
export const searchRepositoriesSchema = z.object({
    q: z.string().min(1, 'Search query is required'),
    language: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

/**
 * Get user repositories schema
 */
export const getUserReposSchema = z.object({
    type: z.enum(['all', 'owner', 'member']).optional(),
    sort: z.enum(['created', 'updated', 'pushed', 'name']).optional(),
    direction: z.enum(['asc', 'desc']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});
