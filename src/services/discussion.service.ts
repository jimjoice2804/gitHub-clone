import db from '@config/database';
import { DiscussionCategory, Prisma } from '@prisma/client';
import { ApiError } from '../types/index';

const userSelect = {
    id: true,
    username: true,
    name: true,
    avatarUrl: true,
} as const;

const discussionBaseInclude = {
    author: {
        select: userSelect,
    },
    _count: {
        select: {
            comments: true,
        },
    },
} satisfies Prisma.DiscussionInclude;

const discussionWithCommentsInclude = {
    ...discussionBaseInclude,
    comments: {
        orderBy: { createdAt: 'asc' },
        include: {
            author: {
                select: userSelect,
            },
        },
    },
} satisfies Prisma.DiscussionInclude;

type DiscussionWithBase = Prisma.DiscussionGetPayload<{ include: typeof discussionBaseInclude }>;
type DiscussionWithComments = Prisma.DiscussionGetPayload<{ include: typeof discussionWithCommentsInclude }>;
type DiscussionCommentWithAuthor = Prisma.DiscussionCommentGetPayload<{
    include: {
        author: {
            select: typeof userSelect;
        };
    };
}>;

const mapCategoryToEnum = (category?: string | null): DiscussionCategory | undefined => {
    if (!category) {
        return undefined;
    }

    switch (category.toLowerCase()) {
        case 'general':
            return DiscussionCategory.GENERAL;
        case 'qanda':
            return DiscussionCategory.QANDA;
        case 'show_and_tell':
            return DiscussionCategory.SHOW_AND_TELL;
        case 'ideas':
            return DiscussionCategory.IDEAS;
        default:
            return undefined;
    }
};

const mapCategoryFromEnum = (category: DiscussionCategory): 'general' | 'qanda' | 'show_and_tell' | 'ideas' => {
    switch (category) {
        case DiscussionCategory.QANDA:
            return 'qanda';
        case DiscussionCategory.SHOW_AND_TELL:
            return 'show_and_tell';
        case DiscussionCategory.IDEAS:
            return 'ideas';
        default:
            return 'general';
    }
};

const mapComment = (comment: DiscussionCommentWithAuthor) => ({
    id: comment.id,
    body: comment.body,
    author: comment.author,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
});

const mapDiscussionBase = (discussion: DiscussionWithBase) => ({
    id: discussion.id,
    number: discussion.number,
    title: discussion.title,
    body: discussion.body,
    category: mapCategoryFromEnum(discussion.category),
    repositoryId: discussion.repositoryId,
    author: discussion.author,
    createdAt: discussion.createdAt,
    updatedAt: discussion.updatedAt,
    commentsCount: discussion._count.comments,
});

const mapDiscussionWithComments = (discussion: DiscussionWithComments) => ({
    ...mapDiscussionBase(discussion),
    comments: discussion.comments.map(mapComment),
});

const findRepositoryByOwnerAndName = async (owner: string, repoName: string) => {
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

const ensureRepositoryAccess = (repository: { ownerId: string; isPrivate: boolean }, requesterId?: string) => {
    if (repository.isPrivate && repository.ownerId !== requesterId) {
        throw new ApiError(403, 'You do not have access to this repository');
    }
};

const getDiscussionEntity = async (repositoryId: string, discussionNumber: number) => {
    const discussion = await db.discussion.findFirst({
        where: {
            repositoryId,
            number: discussionNumber,
        },
    });

    if (!discussion) {
        throw new ApiError(404, 'Discussion not found');
    }

    return discussion;
};

export const createDiscussion = async (
    owner: string,
    repoName: string,
    userId: string,
    data: {
        title: string;
        body?: string;
        category?: 'general' | 'qanda' | 'show_and_tell' | 'ideas';
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryAccess(repository, userId);

    const discussionId = await db.$transaction(async (tx) => {
        const lastDiscussion = await tx.discussion.findFirst({
            where: { repositoryId: repository.id },
            orderBy: { number: 'desc' },
            select: { number: true },
        });

        const nextNumber = (lastDiscussion?.number ?? 0) + 1;

        const createdDiscussion = await tx.discussion.create({
            data: {
                number: nextNumber,
                title: data.title,
                body: data.body,
                category: mapCategoryToEnum(data.category) ?? DiscussionCategory.GENERAL,
                repositoryId: repository.id,
                authorId: userId,
            },
        });

        await tx.repository.update({
            where: { id: repository.id },
            data: {
                discussionsCount: { increment: 1 },
            },
        });

        return createdDiscussion.id;
    });

    const discussion = await db.discussion.findUnique({
        where: { id: discussionId },
        include: discussionWithCommentsInclude,
    });

    if (!discussion) {
        throw new ApiError(404, 'Discussion not found');
    }

    return mapDiscussionWithComments(discussion);
};

export const listDiscussions = async (
    owner: string,
    repoName: string,
    requesterId: string | undefined,
    options?: {
        category?: 'general' | 'qanda' | 'show_and_tell' | 'ideas';
        authorId?: string;
        search?: string;
        page?: number;
        limit?: number;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryAccess(repository, requesterId);

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.DiscussionWhereInput = {
        repositoryId: repository.id,
    };

    if (options?.category) {
        const categoryEnum = mapCategoryToEnum(options.category);
        if (categoryEnum) {
            where.category = categoryEnum;
        }
    }

    if (options?.authorId) {
        where.authorId = options.authorId;
    }

    if (options?.search) {
        where.OR = [
            { title: { contains: options.search, mode: 'insensitive' } },
            { body: { contains: options.search, mode: 'insensitive' } },
        ];
    }

    const [discussions, total] = await Promise.all([
        db.discussion.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: discussionBaseInclude,
        }),
        db.discussion.count({ where }),
    ]);

    return {
        discussions: discussions.map(mapDiscussionBase),
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

export const getDiscussion = async (
    owner: string,
    repoName: string,
    discussionNumber: number,
    requesterId?: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryAccess(repository, requesterId);

    const discussion = await db.discussion.findFirst({
        where: {
            repositoryId: repository.id,
            number: discussionNumber,
        },
        include: discussionWithCommentsInclude,
    });

    if (!discussion) {
        throw new ApiError(404, 'Discussion not found');
    }

    return mapDiscussionWithComments(discussion);
};

export const updateDiscussion = async (
    owner: string,
    repoName: string,
    discussionNumber: number,
    userId: string,
    data: {
        title?: string;
        body?: string;
        category?: 'general' | 'qanda' | 'show_and_tell' | 'ideas';
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryAccess(repository, userId);

    const discussion = await getDiscussionEntity(repository.id, discussionNumber);

    if (discussion.authorId !== userId && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to update this discussion');
    }

    const updated = await db.discussion.update({
        where: { id: discussion.id },
        data: {
            title: data.title ?? discussion.title,
            body: data.body ?? discussion.body,
            category: mapCategoryToEnum(data.category) ?? discussion.category,
        },
        include: discussionWithCommentsInclude,
    });

    return mapDiscussionWithComments(updated);
};

export const deleteDiscussion = async (
    owner: string,
    repoName: string,
    discussionNumber: number,
    userId: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryAccess(repository, userId);

    const discussion = await getDiscussionEntity(repository.id, discussionNumber);

    if (discussion.authorId !== userId && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to delete this discussion');
    }

    await db.$transaction(async (tx) => {
        await tx.discussion.delete({
            where: { id: discussion.id },
        });

        await tx.repository.update({
            where: { id: repository.id },
            data: {
                discussionsCount: { decrement: 1 },
            },
        });
    });

    return { message: 'Discussion deleted successfully' };
};

export const addDiscussionComment = async (
    owner: string,
    repoName: string,
    discussionNumber: number,
    userId: string,
    body: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryAccess(repository, userId);

    const discussion = await getDiscussionEntity(repository.id, discussionNumber);

    const comment = await db.discussionComment.create({
        data: {
            body,
            discussionId: discussion.id,
            authorId: userId,
        },
        include: {
            author: {
                select: userSelect,
            },
        },
    });

    return mapComment(comment);
};

export const listDiscussionComments = async (
    owner: string,
    repoName: string,
    discussionNumber: number,
    requesterId: string | undefined,
    options?: {
        page?: number;
        limit?: number;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryAccess(repository, requesterId);

    const discussion = await getDiscussionEntity(repository.id, discussionNumber);

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
        db.discussionComment.findMany({
            where: { discussionId: discussion.id },
            skip,
            take: limit,
            orderBy: { createdAt: 'asc' },
            include: {
                author: {
                    select: userSelect,
                },
            },
        }),
        db.discussionComment.count({ where: { discussionId: discussion.id } }),
    ]);

    return {
        comments: comments.map(mapComment),
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

export const updateDiscussionComment = async (
    owner: string,
    repoName: string,
    discussionNumber: number,
    commentId: string,
    userId: string,
    body: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryAccess(repository, userId);

    const discussion = await getDiscussionEntity(repository.id, discussionNumber);

    const comment = await db.discussionComment.findUnique({
        where: { id: commentId },
        include: {
            author: {
                select: userSelect,
            },
        },
    });

    if (!comment || comment.discussionId !== discussion.id) {
        throw new ApiError(404, 'Comment not found');
    }

    if (comment.authorId !== userId) {
        throw new ApiError(403, 'You do not have permission to update this comment');
    }

    const updated = await db.discussionComment.update({
        where: { id: commentId },
        data: { body },
        include: {
            author: {
                select: userSelect,
            },
        },
    });

    return mapComment(updated);
};

export const deleteDiscussionComment = async (
    owner: string,
    repoName: string,
    discussionNumber: number,
    commentId: string,
    userId: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryAccess(repository, userId);

    const discussion = await getDiscussionEntity(repository.id, discussionNumber);

    const comment = await db.discussionComment.findUnique({
        where: { id: commentId },
    });

    if (!comment || comment.discussionId !== discussion.id) {
        throw new ApiError(404, 'Comment not found');
    }

    if (comment.authorId !== userId && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to delete this comment');
    }

    await db.discussionComment.delete({
        where: { id: commentId },
    });

    return { message: 'Comment deleted successfully' };
};
