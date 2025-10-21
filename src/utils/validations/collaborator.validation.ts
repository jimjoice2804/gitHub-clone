import { z } from 'zod';
import { repoNameParamSchema } from './repository.validation';

/**
 * Permission level enum validation
 */
const permissionLevelEnum = z.enum(['READ', 'WRITE', 'ADMIN']);

/**
 * Add collaborator schema
 */
export const addCollaboratorSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be at most 50 characters'),
    permission: permissionLevelEnum.optional().default('WRITE'),
});

/**
 * Update collaborator permission schema
 */
export const updateCollaboratorPermissionSchema = z.object({
    permission: permissionLevelEnum,
});

/**
 * Collaborator param schema
 */
export const collaboratorParamSchema = repoNameParamSchema.extend({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters'),
});

/**
 * List collaborators query schema
 */
export const listCollaboratorsQuerySchema = z.object({
    page: z.coerce.number().int('Page must be an integer').min(1, 'Page must be at least 1').optional(),
    limit: z
        .coerce.number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit must be at most 100')
        .optional(),
});
