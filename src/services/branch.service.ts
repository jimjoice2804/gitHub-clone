import db from '@config/database';
import { Prisma, PullRequestState } from '@prisma/client';
import { ApiError } from '../types/index';
import { recordActivity } from './activity.service';

const branchSelect = {
    id: true,
    name: true,
    sha: true,
    isProtected: true,
    repositoryId: true,
    createdAt: true,
    updatedAt: true,
} as const;

type BranchRecord = Prisma.BranchGetPayload<{ select: typeof branchSelect }>;

type RepositorySummary = {
    id: string;
    ownerId: string;
    isPrivate: boolean;
    defaultBranch: string;
};

const mapBranch = (branch: BranchRecord) => ({
    id: branch.id,
    name: branch.name,
    sha: branch.sha,
    isProtected: branch.isProtected,
    repositoryId: branch.repositoryId,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
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
            defaultBranch: true,
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

const ensureCommitExistsInRepository = async (repositoryId: string, sha: string) => {
    const commit = await db.commit.findUnique({
        where: { sha },
        select: { repositoryId: true },
    });

    if (!commit || commit.repositoryId !== repositoryId) {
        throw new ApiError(400, 'Referenced commit does not belong to this repository');
    }
};

const loadBranch = async (repositoryId: string, branchName: string) => {
    const branch = await db.branch.findUnique({
        where: {
            repositoryId_name: {
                repositoryId,
                name: branchName,
            },
        },
        select: branchSelect,
    });

    if (!branch) {
        throw new ApiError(404, 'Branch not found');
    }

    return branch;
};

export const createBranch = async (
    owner: string,
    repoName: string,
    userId: string,
    data: {
        name: string;
        fromSha?: string;
        isProtected?: boolean;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryWriteAccess(repository, userId);

    const existing = await db.branch.findUnique({
        where: {
            repositoryId_name: {
                repositoryId: repository.id,
                name: data.name,
            },
        },
        select: { id: true },
    });

    if (existing) {
        throw new ApiError(400, 'A branch with this name already exists');
    }

    let baseSha = data.fromSha;

    if (baseSha) {
        await ensureCommitExistsInRepository(repository.id, baseSha);
    } else {
        const defaultBranch = await db.branch.findUnique({
            where: {
                repositoryId_name: {
                    repositoryId: repository.id,
                    name: repository.defaultBranch,
                },
            },
            select: { sha: true },
        });

        if (!defaultBranch || !defaultBranch.sha) {
            throw new ApiError(400, 'Default branch does not have a valid head commit');
        }

        baseSha = defaultBranch.sha;
    }

    await ensureCommitExistsInRepository(repository.id, baseSha);

    const created = await db.branch.create({
        data: {
            name: data.name,
            sha: baseSha,
            repositoryId: repository.id,
            isProtected: data.isProtected ?? false,
        },
        select: branchSelect,
    });

    await recordActivity({
        userId,
        type: 'created_branch',
        repositoryId: repository.id,
        metadata: {
            branch: created.name,
            sha: created.sha,
        } as Prisma.JsonValue,
    });

    return mapBranch(created);
};

export const listBranches = async (
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

    const where: Prisma.BranchWhereInput = {
        repositoryId: repository.id,
    };

    if (options?.search) {
        where.name = {
            contains: options.search,
            mode: 'insensitive',
        };
    }

    const [branches, total] = await Promise.all([
        db.branch.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
            select: branchSelect,
        }),
        db.branch.count({ where }),
    ]);

    return {
        branches: branches.map(mapBranch),
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

export const getBranch = async (
    owner: string,
    repoName: string,
    branchName: string,
    requesterId?: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, requesterId);

    const branch = await loadBranch(repository.id, branchName);

    return mapBranch(branch);
};

export const deleteBranch = async (
    owner: string,
    repoName: string,
    branchName: string,
    userId: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryWriteAccess(repository, userId);

    const branch = await loadBranch(repository.id, branchName);

    if (branch.name === repository.defaultBranch) {
        throw new ApiError(400, 'Cannot delete the default branch');
    }

    if (branch.isProtected) {
        throw new ApiError(400, 'Cannot delete a protected branch');
    }

    const openPullRequests = await db.pullRequest.count({
        where: {
            repositoryId: repository.id,
            headBranch: branch.name,
            state: PullRequestState.OPEN,
        },
    });

    if (openPullRequests > 0) {
        throw new ApiError(400, 'Cannot delete a branch with open pull requests');
    }

    await db.branch.delete({
        where: {
            repositoryId_name: {
                repositoryId: repository.id,
                name: branch.name,
            },
        },
    });

    return { message: 'Branch deleted successfully' };
};
