import db from '@config/database';
import { ApiError } from '../types/index';

/**
 * Create a new repository
 */
export const createRepository = async (
    userId: string,
    data: {
        name: string;
        description?: string;
        isPrivate?: boolean;
        language?: string;
    }
) => {
    // Check if user already has a repository with this name
    const existing = await db.repository.findFirst({
        where: {
            ownerId: userId,
            name: data.name,
        },
    });

    if (existing) {
        throw new ApiError(400, 'You already have a repository with this name');
    }

    // Get user for git URL
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { username: true },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Create repository
    const repository = await db.repository.create({
        data: {
            name: data.name,
            description: data.description || null,
            isPrivate: data.isPrivate || false,
            language: data.language || null,
            ownerId: userId,
            gitUrl: `/repos/${user.username}/${data.name}.git`,
        },
        include: {
            owner: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                    avatarUrl: true,
                },
            },
        },
    });

    // Create default main branch
    await db.branch.create({
        data: {
            name: 'main',
            sha: 'initial',
            repositoryId: repository.id,
            isProtected: true,
        },
    });

    return repository;
};

/**
 * Get repository by owner and name
 */
export const getRepository = async (owner: string, repoName: string, requesterId?: string) => {
    // Find owner
    const ownerUser = await db.user.findUnique({
        where: { username: owner },
        select: { id: true },
    });

    if (!ownerUser) {
        throw new ApiError(404, 'Owner not found');
    }

    // Find repository
    const repository = await db.repository.findFirst({
        where: {
            ownerId: ownerUser.id,
            name: repoName,
        },
        include: {
            owner: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                    avatarUrl: true,
                },
            },
            _count: {
                select: {
                    stars: true,
                    watchers: true,
                    forks: true,
                    issues: true,
                },
            },
        },
    });

    if (!repository) {
        throw new ApiError(404, 'Repository not found');
    }

    // Check if private and requester has access
    if (repository.isPrivate && repository.ownerId !== requesterId) {
        throw new ApiError(403, 'You do not have access to this repository');
    }

    // Check if requester has starred or is watching
    let hasStarred = false;
    let isWatching = false;

    if (requesterId) {
        const [star, watch] = await Promise.all([
            db.star.findUnique({
                where: {
                    userId_repositoryId: {
                        userId: requesterId,
                        repositoryId: repository.id,
                    },
                },
            }),
            db.watch.findUnique({
                where: {
                    userId_repositoryId: {
                        userId: requesterId,
                        repositoryId: repository.id,
                    },
                },
            }),
        ]);

        hasStarred = !!star;
        isWatching = !!watch;
    }

    return {
        ...repository,
        hasStarred,
        isWatching,
        stats: {
            stars: repository._count.stars,
            watchers: repository._count.watchers,
            forks: repository._count.forks,
            issues: repository._count.issues,
        },
    };
};

/**
 * Update repository
 */
export const updateRepository = async (
    owner: string,
    repoName: string,
    userId: string,
    data: {
        name?: string;
        description?: string;
        isPrivate?: boolean;
        language?: string;
    }
) => {
    // Find repository
    const ownerUser = await db.user.findUnique({
        where: { username: owner },
        select: { id: true, username: true },
    });

    if (!ownerUser) {
        throw new ApiError(404, 'Owner not found');
    }

    const repository = await db.repository.findFirst({
        where: {
            ownerId: ownerUser.id,
            name: repoName,
        },
    });

    if (!repository) {
        throw new ApiError(404, 'Repository not found');
    }

    // Check if user is owner
    if (repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to update this repository');
    }

    // If changing name, check for conflicts
    if (data.name && data.name !== repository.name) {
        const existing = await db.repository.findFirst({
            where: {
                ownerId: userId,
                name: data.name,
                NOT: { id: repository.id },
            },
        });

        if (existing) {
            throw new ApiError(400, 'You already have a repository with this name');
        }
    }

    // Update repository
    const updated = await db.repository.update({
        where: { id: repository.id },
        data: {
            name: data.name || repository.name,
            description: data.description !== undefined ? data.description : repository.description,
            isPrivate: data.isPrivate !== undefined ? data.isPrivate : repository.isPrivate,
            language: data.language !== undefined ? data.language : repository.language,
            gitUrl: data.name ? `/repos/${ownerUser.username}/${data.name}.git` : repository.gitUrl,
        },
        include: {
            owner: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                    avatarUrl: true,
                },
            },
        },
    });

    return updated;
};

/**
 * Delete repository
 */
export const deleteRepository = async (owner: string, repoName: string, userId: string) => {
    // Find repository
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
    });

    if (!repository) {
        throw new ApiError(404, 'Repository not found');
    }

    // Check if user is owner
    if (repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to delete this repository');
    }

    // Delete repository (cascade will handle related records)
    await db.repository.delete({
        where: { id: repository.id },
    });

    return { message: 'Repository deleted successfully' };
};

/**
 * Star a repository
 */
export const starRepository = async (owner: string, repoName: string, userId: string) => {
    // Find repository
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
    });

    if (!repository) {
        throw new ApiError(404, 'Repository not found');
    }

    // Check if private and user has access
    if (repository.isPrivate && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have access to this repository');
    }

    // Check if already starred
    const existing = await db.star.findUnique({
        where: {
            userId_repositoryId: {
                userId,
                repositoryId: repository.id,
            },
        },
    });

    if (existing) {
        throw new ApiError(400, 'You have already starred this repository');
    }

    // Create star
    await db.star.create({
        data: {
            userId,
            repositoryId: repository.id,
        },
    });

    // Update star count
    await db.repository.update({
        where: { id: repository.id },
        data: { starsCount: { increment: 1 } },
    });

    return { message: 'Repository starred successfully' };
};

/**
 * Unstar a repository
 */
export const unstarRepository = async (owner: string, repoName: string, userId: string) => {
    // Find repository
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
    });

    if (!repository) {
        throw new ApiError(404, 'Repository not found');
    }

    // Check if starred
    const existing = await db.star.findUnique({
        where: {
            userId_repositoryId: {
                userId,
                repositoryId: repository.id,
            },
        },
    });

    if (!existing) {
        throw new ApiError(400, 'You have not starred this repository');
    }

    // Delete star
    await db.star.delete({
        where: {
            userId_repositoryId: {
                userId,
                repositoryId: repository.id,
            },
        },
    });

    // Update star count
    await db.repository.update({
        where: { id: repository.id },
        data: { starsCount: { decrement: 1 } },
    });

    return { message: 'Repository unstarred successfully' };
};

/**
 * Watch a repository
 */
export const watchRepository = async (owner: string, repoName: string, userId: string) => {
    // Find repository
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
    });

    if (!repository) {
        throw new ApiError(404, 'Repository not found');
    }

    // Check if private and user has access
    if (repository.isPrivate && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have access to this repository');
    }

    // Check if already watching
    const existing = await db.watch.findUnique({
        where: {
            userId_repositoryId: {
                userId,
                repositoryId: repository.id,
            },
        },
    });

    if (existing) {
        throw new ApiError(400, 'You are already watching this repository');
    }

    // Create watch
    await db.watch.create({
        data: {
            userId,
            repositoryId: repository.id,
        },
    });

    // Update watch count
    await db.repository.update({
        where: { id: repository.id },
        data: { watchersCount: { increment: 1 } },
    });

    return { message: 'Repository watched successfully' };
};

/**
 * Unwatch a repository
 */
export const unwatchRepository = async (owner: string, repoName: string, userId: string) => {
    // Find repository
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
    });

    if (!repository) {
        throw new ApiError(404, 'Repository not found');
    }

    // Check if watching
    const existing = await db.watch.findUnique({
        where: {
            userId_repositoryId: {
                userId,
                repositoryId: repository.id,
            },
        },
    });

    if (!existing) {
        throw new ApiError(400, 'You are not watching this repository');
    }

    // Delete watch
    await db.watch.delete({
        where: {
            userId_repositoryId: {
                userId,
                repositoryId: repository.id,
            },
        },
    });

    // Update watch count
    await db.repository.update({
        where: { id: repository.id },
        data: { watchersCount: { decrement: 1 } },
    });

    return { message: 'Repository unwatched successfully' };
};

/**
 * Get user repositories
 */
export const getUserRepositories = async (
    username: string,
    requesterId?: string,
    options?: {
        page?: number;
        limit?: number;
        sort?: 'created' | 'updated' | 'pushed' | 'name';
        direction?: 'asc' | 'desc';
    }
) => {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    // Find user
    const user = await db.user.findUnique({
        where: { username },
        select: { id: true },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Determine sort field
    let orderBy: any = {};
    const sortField = options?.sort || 'created';
    const direction = options?.direction || 'desc';

    if (sortField === 'created') {
        orderBy = { createdAt: direction };
    } else if (sortField === 'updated') {
        orderBy = { updatedAt: direction };
    } else if (sortField === 'pushed') {
        orderBy = { pushedAt: direction };
    } else if (sortField === 'name') {
        orderBy = { name: direction };
    }

    // Query conditions
    const where: any = {
        ownerId: user.id,
    };

    // Only show private repos if requester is owner
    if (requesterId !== user.id) {
        where.isPrivate = false;
    }

    const [repositories, total] = await Promise.all([
        db.repository.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                owner: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                _count: {
                    select: {
                        stars: true,
                        watchers: true,
                        forks: true,
                    },
                },
            },
        }),
        db.repository.count({ where }),
    ]);

    return {
        repositories: repositories.map((repo) => ({
            ...repo,
            stats: {
                stars: repo._count.stars,
                watchers: repo._count.watchers,
                forks: repo._count.forks,
            },
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Search repositories
 */
export const searchRepositories = async (
    query: string,
    options?: {
        language?: string;
        page?: number;
        limit?: number;
    }
) => {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
        isPrivate: false,
        OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
        ],
    };

    if (options?.language) {
        where.language = { equals: options.language, mode: 'insensitive' };
    }

    const [repositories, total] = await Promise.all([
        db.repository.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                starsCount: 'desc',
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                _count: {
                    select: {
                        stars: true,
                        watchers: true,
                        forks: true,
                    },
                },
            },
        }),
        db.repository.count({ where }),
    ]);

    return {
        repositories: repositories.map((repo) => ({
            ...repo,
            stats: {
                stars: repo._count.stars,
                watchers: repo._count.watchers,
                forks: repo._count.forks,
            },
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};
