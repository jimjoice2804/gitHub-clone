import db from '@config/database';
import { Prisma } from '@prisma/client';
import { ApiError } from '../types/index';
import { recordActivity } from './activity.service';

const userSelect = {
    id: true,
    username: true,
    name: true,
    avatarUrl: true,
} as const;

const commitInclude = {
    author: {
        select: userSelect,
    },
} satisfies Prisma.CommitInclude;

type CommitWithAuthor = Prisma.CommitGetPayload<{ include: typeof commitInclude }>;

type RepositorySummary = {
    id: string;
    ownerId: string;
    isPrivate: boolean;
};

const mapCommit = (commit: CommitWithAuthor) => ({
    id: commit.id,
    sha: commit.sha,
    message: commit.message,
    parentSha: commit.parentSha,
    repositoryId: commit.repositoryId,
    author: commit.author,
    createdAt: commit.createdAt,
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

const findCommitBySha = async (sha: string) =>
    db.commit.findUnique({
        where: { sha },
        include: commitInclude,
    });

const ensureCommitBelongsToRepository = (commit: CommitWithAuthor, repositoryId: string) => {
    if (commit.repositoryId !== repositoryId) {
        throw new ApiError(400, 'Commit does not belong to this repository');
    }
};

export const createCommit = async (
    owner: string,
    repoName: string,
    userId: string,
    data: {
        sha: string;
        message: string;
        branch: string;
        parentSha?: string;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryWriteAccess(repository, userId);

    const existingCommit = await db.commit.findUnique({
        where: { sha: data.sha },
        select: { id: true },
    });

    if (existingCommit) {
        throw new ApiError(400, 'A commit with this SHA already exists');
    }

    const branch = await db.branch.findUnique({
        where: {
            repositoryId_name: {
                repositoryId: repository.id,
                name: data.branch,
            },
        },
        select: {
            id: true,
            sha: true,
        },
    });

    if (!branch) {
        throw new ApiError(404, 'Branch not found');
    }

    if (!branch.sha) {
        throw new ApiError(400, 'Branch does not have a base commit');
    }

    let parentCommit: CommitWithAuthor | null = null;

    if (data.parentSha) {
        parentCommit = await findCommitBySha(data.parentSha);
        if (!parentCommit) {
            throw new ApiError(400, 'Parent commit not found');
        }
        ensureCommitBelongsToRepository(parentCommit, repository.id);
    }

    if (!data.parentSha) {
        throw new ApiError(400, 'Parent SHA is required when creating a commit');
    }

    if (branch.sha !== data.parentSha) {
        throw new ApiError(400, 'Parent commit does not match the branch head');
    }

    const commit = await db.$transaction(async (tx) => {
        const created = await tx.commit.create({
            data: {
                sha: data.sha,
                message: data.message,
                parentSha: data.parentSha,
                repositoryId: repository.id,
                authorId: userId,
            },
            include: commitInclude,
        });

        await tx.branch.update({
            where: {
                repositoryId_name: {
                    repositoryId: repository.id,
                    name: data.branch,
                },
            },
            data: {
                sha: data.sha,
            },
        });

        return created;
    });

    await recordActivity({
        userId,
        type: 'pushed_commits',
        repositoryId: repository.id,
        metadata: {
            commitId: commit.id,
            sha: commit.sha,
            branch: data.branch,
        } as Prisma.JsonValue,
    });

    return mapCommit(commit);
};

export const listCommits = async (
    owner: string,
    repoName: string,
    requesterId: string | undefined,
    options?: {
        authorId?: string;
        search?: string;
        since?: Date;
        until?: Date;
        page?: number;
        limit?: number;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, requesterId);

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CommitWhereInput = {
        repositoryId: repository.id,
    };

    if (options?.authorId) {
        where.authorId = options.authorId;
    }

    if (options?.search) {
        where.message = {
            contains: options.search,
            mode: 'insensitive',
        };
    }

    if (options?.since || options?.until) {
        where.createdAt = {};
        if (options.since) {
            where.createdAt.gte = options.since;
        }
        if (options.until) {
            where.createdAt.lte = options.until;
        }
    }

    const [commits, total] = await Promise.all([
        db.commit.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: commitInclude,
        }),
        db.commit.count({ where }),
    ]);

    return {
        commits: commits.map(mapCommit),
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

export const getCommit = async (
    owner: string,
    repoName: string,
    sha: string,
    requesterId?: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, requesterId);

    const commit = await findCommitBySha(sha);

    if (!commit) {
        throw new ApiError(404, 'Commit not found');
    }

    ensureCommitBelongsToRepository(commit, repository.id);

    return mapCommit(commit);
};
