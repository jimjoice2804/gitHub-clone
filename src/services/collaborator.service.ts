import db from '@config/database';
import { PermissionLevel, Prisma } from '@prisma/client';
import { ApiError } from '../types/index';

const userSelect = {
    id: true,
    username: true,
    name: true,
    avatarUrl: true,
} as const;

const collaboratorInclude = {
    user: {
        select: userSelect,
    },
} satisfies Prisma.CollaboratorInclude;

type CollaboratorWithUser = Prisma.CollaboratorGetPayload<{ include: typeof collaboratorInclude }>;

const mapCollaborator = (collaborator: CollaboratorWithUser) => ({
    id: collaborator.id,
    permission: collaborator.permission,
    createdAt: collaborator.createdAt,
    user: collaborator.user,
});

type RepositorySummary = {
    id: string;
    ownerId: string;
    isPrivate: boolean;
};

const findRepositoryByOwnerAndName = async (owner: string, repoName: string): Promise<RepositorySummary> => {
    const ownerUser = await db.user.findUnique({
        where: { username: owner },
        select: { id: true },
    });

    if (!ownerUser) {
        throw new ApiError(404, 'Owner not found');
    }

    const repository = await db.repository.findFirst({
        where: {
            ownerId: ownerUser.id,
            name: repoName,
        },
        select: {
            id: true,
            ownerId: true,
            isPrivate: true,
        },
    });

    if (!repository) {
        throw new ApiError(404, 'Repository not found');
    }

    return repository;
};

const ensureRepositoryAdminAccess = (repository: RepositorySummary, userId: string) => {
    if (repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to manage collaborators');
    }
};

/**
 * Add a collaborator to a repository
 */
export const addCollaborator = async (
    owner: string,
    repoName: string,
    adminUserId: string,
    data: {
        username: string;
        permission: PermissionLevel;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryAdminAccess(repository, adminUserId);

    // Find user to add as collaborator
    const collaboratorUser = await db.user.findUnique({
        where: { username: data.username },
        select: { id: true },
    });

    if (!collaboratorUser) {
        throw new ApiError(404, 'User not found');
    }

    // Check if user is the repository owner
    if (collaboratorUser.id === repository.ownerId) {
        throw new ApiError(400, 'Repository owner is automatically a collaborator');
    }

    // Check if already a collaborator
    const existing = await db.collaborator.findUnique({
        where: {
            userId_repositoryId: {
                userId: collaboratorUser.id,
                repositoryId: repository.id,
            },
        },
    });

    if (existing) {
        throw new ApiError(400, 'User is already a collaborator');
    }

    // Add collaborator
    const collaborator = await db.collaborator.create({
        data: {
            userId: collaboratorUser.id,
            repositoryId: repository.id,
            permission: data.permission,
        },
        include: collaboratorInclude,
    });

    return mapCollaborator(collaborator);
};

/**
 * Remove a collaborator from a repository
 */
export const removeCollaborator = async (
    owner: string,
    repoName: string,
    adminUserId: string,
    username: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryAdminAccess(repository, adminUserId);

    // Find user to remove
    const collaboratorUser = await db.user.findUnique({
        where: { username },
        select: { id: true },
    });

    if (!collaboratorUser) {
        throw new ApiError(404, 'User not found');
    }

    // Check if user is a collaborator
    const collaborator = await db.collaborator.findUnique({
        where: {
            userId_repositoryId: {
                userId: collaboratorUser.id,
                repositoryId: repository.id,
            },
        },
    });

    if (!collaborator) {
        throw new ApiError(404, 'User is not a collaborator');
    }

    // Remove collaborator
    await db.collaborator.delete({
        where: {
            userId_repositoryId: {
                userId: collaboratorUser.id,
                repositoryId: repository.id,
            },
        },
    });
};

/**
 * Update collaborator permission
 */
export const updateCollaboratorPermission = async (
    owner: string,
    repoName: string,
    adminUserId: string,
    username: string,
    permission: PermissionLevel
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryAdminAccess(repository, adminUserId);

    // Find user to update
    const collaboratorUser = await db.user.findUnique({
        where: { username },
        select: { id: true },
    });

    if (!collaboratorUser) {
        throw new ApiError(404, 'User not found');
    }

    // Check if user is a collaborator
    const existing = await db.collaborator.findUnique({
        where: {
            userId_repositoryId: {
                userId: collaboratorUser.id,
                repositoryId: repository.id,
            },
        },
    });

    if (!existing) {
        throw new ApiError(404, 'User is not a collaborator');
    }

    // Update permission
    const collaborator = await db.collaborator.update({
        where: {
            userId_repositoryId: {
                userId: collaboratorUser.id,
                repositoryId: repository.id,
            },
        },
        data: {
            permission,
        },
        include: collaboratorInclude,
    });

    return mapCollaborator(collaborator);
};

/**
 * List repository collaborators
 */
export const listCollaborators = async (
    owner: string,
    repoName: string,
    requesterId: string | undefined,
    options?: {
        page?: number;
        limit?: number;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);

    // Check if private and user has access
    if (repository.isPrivate && repository.ownerId !== requesterId) {
        // Check if requester is a collaborator
        if (requesterId) {
            const isCollaborator = await db.collaborator.findUnique({
                where: {
                    userId_repositoryId: {
                        userId: requesterId,
                        repositoryId: repository.id,
                    },
                },
            });

            if (!isCollaborator) {
                throw new ApiError(403, 'You do not have access to this repository');
            }
        } else {
            throw new ApiError(403, 'You do not have access to this repository');
        }
    }

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [collaborators, total] = await Promise.all([
        db.collaborator.findMany({
            where: {
                repositoryId: repository.id,
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: collaboratorInclude,
        }),
        db.collaborator.count({
            where: {
                repositoryId: repository.id,
            },
        }),
    ]);

    return {
        collaborators: collaborators.map(mapCollaborator),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1,
        },
    };
};

/**
 * Check if user has specific permission level or higher
 */
export const checkCollaboratorPermission = async (
    repositoryId: string,
    userId: string,
    requiredPermission: PermissionLevel
): Promise<boolean> => {
    const repository = await db.repository.findUnique({
        where: { id: repositoryId },
        select: { ownerId: true },
    });

    if (!repository) {
        return false;
    }

    // Owner always has full access
    if (repository.ownerId === userId) {
        return true;
    }

    const collaborator = await db.collaborator.findUnique({
        where: {
            userId_repositoryId: {
                userId,
                repositoryId,
            },
        },
        select: { permission: true },
    });

    if (!collaborator) {
        return false;
    }

    // Permission hierarchy: ADMIN > WRITE > READ
    const permissionLevels: Record<PermissionLevel, number> = {
        READ: 1,
        WRITE: 2,
        ADMIN: 3,
    };

    return permissionLevels[collaborator.permission] >= permissionLevels[requiredPermission];
};

/**
 * Get collaborator info
 */
export const getCollaborator = async (
    owner: string,
    repoName: string,
    username: string,
    requesterId?: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);

    // Check if private and user has access
    if (repository.isPrivate && repository.ownerId !== requesterId) {
        if (requesterId) {
            const isCollaborator = await db.collaborator.findUnique({
                where: {
                    userId_repositoryId: {
                        userId: requesterId,
                        repositoryId: repository.id,
                    },
                },
            });

            if (!isCollaborator) {
                throw new ApiError(403, 'You do not have access to this repository');
            }
        } else {
            throw new ApiError(403, 'You do not have access to this repository');
        }
    }

    // Find user
    const collaboratorUser = await db.user.findUnique({
        where: { username },
        select: { id: true },
    });

    if (!collaboratorUser) {
        throw new ApiError(404, 'User not found');
    }

    // Get collaborator
    const collaborator = await db.collaborator.findUnique({
        where: {
            userId_repositoryId: {
                userId: collaboratorUser.id,
                repositoryId: repository.id,
            },
        },
        include: collaboratorInclude,
    });

    if (!collaborator) {
        throw new ApiError(404, 'User is not a collaborator');
    }

    return mapCollaborator(collaborator);
};
