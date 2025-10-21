import db from '@config/database';
import { Prisma } from '@prisma/client';
import { ApiError } from '../types/index';
import { recordActivity } from './activity.service';

type RepositorySummary = {
    id: string;
    ownerId: string;
    isPrivate: boolean;
};

const tagInclude = {
    repository: {
        select: {
            id: true,
            name: true,
            owner: {
                select: {
                    username: true,
                },
            },
        },
    },
} satisfies Prisma.TagInclude;

type TagWithRepository = Prisma.TagGetPayload<{ include: typeof tagInclude }>;

const mapTag = (tag: TagWithRepository) => ({
    id: tag.id,
    name: tag.name,
    sha: tag.sha,
    message: tag.message,
    createdAt: tag.createdAt,
    repository: {
        id: tag.repository.id,
        name: tag.repository.name,
        owner: tag.repository.owner.username,
    },
});

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

const ensureRepositoryReadAccess = (repository: RepositorySummary, requesterId?: string) => {
    if (repository.isPrivate && repository.ownerId !== requesterId) {
        throw new ApiError(403, 'You do not have access to this repository');
    }
};

const ensureRepositoryWriteAccess = (repository: RepositorySummary, userId: string) => {
    if (repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to perform this action');
    }
};

const ensureCommitExistsInRepository = async (sha: string, repositoryId: string) => {
    const commit = await db.commit.findUnique({
        where: { sha },
        select: { repositoryId: true },
    });

    if (!commit) {
        throw new ApiError(404, 'Commit not found');
    }

    if (commit.repositoryId !== repositoryId) {
        throw new ApiError(400, 'Commit does not belong to this repository');
    }
};

export const createTag = async (
    owner: string,
    repoName: string,
    userId: string,
    data: {
        name: string;
        sha: string;
        message?: string;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryWriteAccess(repository, userId);

    const existingTag = await db.tag.findUnique({
        where: {
            repositoryId_name: {
                repositoryId: repository.id,
                name: data.name,
            },
        },
        select: { id: true },
    });

    if (existingTag) {
        throw new ApiError(400, 'A tag with this name already exists');
    }

    await ensureCommitExistsInRepository(data.sha, repository.id);

    const tag = await db.tag.create({
        data: {
            name: data.name,
            sha: data.sha,
            message: data.message,
            repositoryId: repository.id,
        },
        include: tagInclude,
    });

    await recordActivity({
        userId,
        type: 'created_tag',
        repositoryId: repository.id,
        metadata: {
            tagId: tag.id,
            tagName: tag.name,
            sha: tag.sha,
        } as Prisma.JsonValue,
    });

    return mapTag(tag);
};

export const listTags = async (
    owner: string,
    repoName: string,
    requesterId: string | undefined,
    options?: {
        search?: string;
        page?: number;
        limit?: number;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, requesterId);

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TagWhereInput = {
        repositoryId: repository.id,
    };

    if (options?.search) {
        where.name = {
            contains: options.search,
            mode: 'insensitive',
        };
    }

    const [tags, total] = await Promise.all([
        db.tag.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: tagInclude,
        }),
        db.tag.count({ where }),
    ]);

    return {
        tags: tags.map(mapTag),
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

export const getTag = async (
    owner: string,
    repoName: string,
    tagName: string,
    requesterId?: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, requesterId);

    const tag = await db.tag.findUnique({
        where: {
            repositoryId_name: {
                repositoryId: repository.id,
                name: tagName,
            },
        },
        include: tagInclude,
    });

    if (!tag) {
        throw new ApiError(404, 'Tag not found');
    }

    return mapTag(tag);
};

export const deleteTag = async (
    owner: string,
    repoName: string,
    tagName: string,
    userId: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryWriteAccess(repository, userId);

    const tag = await db.tag.findUnique({
        where: {
            repositoryId_name: {
                repositoryId: repository.id,
                name: tagName,
            },
        },
        select: { id: true },
    });

    if (!tag) {
        throw new ApiError(404, 'Tag not found');
    }

    await db.tag.delete({
        where: {
            repositoryId_name: {
                repositoryId: repository.id,
                name: tagName,
            },
        },
    });

    await recordActivity({
        userId,
        type: 'deleted_tag',
        repositoryId: repository.id,
        metadata: {
            tagId: tag.id,
            tagName,
        } as Prisma.JsonValue,
    });
};
