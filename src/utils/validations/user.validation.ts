import { z } from 'zod';

/**
 * Update user profile schema
 */
export const updateProfileSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters').optional(),
    bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
    avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
    location: z.string().max(100, 'Location must be at most 100 characters').optional(),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
    company: z.string().max(100, 'Company must be at most 100 characters').optional(),
});

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

/**
 * Search users query schema
 */
export const searchUsersSchema = z.object({
    q: z.string().min(1, 'Search query is required'),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

/**
 * Get user by username param schema
 */
export const usernameParamSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
});

/**
 * Pagination query schema
 */
export const paginationSchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});
