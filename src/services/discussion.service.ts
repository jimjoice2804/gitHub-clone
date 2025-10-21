import db from '@config/database';
import { DiscussionState, Prisma } from '@prisma/client';
import { ApiError } from '../types/index';
import { fetchUserIdentity, resolveDisplayName } from '../utils/user.util';
import { extractMentions, resolveMentionRecipientIds } from '../utils/mention.util';
import { createNotification } from './notification.service';
import { recordActivity } from './activity.service';

const userSelect = {
    id: true,
    username: true,
    name: true,
    avatarUrl: true,
} as const;

const reactionInclude = {
    user: {
        select: userSelect,
    },
} satisfies Prisma.CommentReactionInclude;

const commentInclude = {
    author: {
        select: userSelect,
    },
    reactions: {
        include: reactionInclude,
    },
    replies: {
        select: {
            id: true,
        },
    },
} satisfies Prisma.DiscussionCommentInclude;

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
        orderBy: {
            createdAt: 'asc',
        },
        include: commentInclude,
    },
} satisfies Prisma.DiscussionInclude;

type DiscussionWithBase = Prisma.DiscussionGetPayload<{ include: typeof discussionBaseInclude }>;
type DiscussionWithComments = Prisma.DiscussionGetPayload<{ include: typeof discussionWithCommentsInclude }>;
type DiscussionCommentWithRelations = Prisma.DiscussionCommentGetPayload<{ include: typeof commentInclude }>;
type CommentReactionWithUser = Prisma.CommentReactionGetPayload<{ include: typeof reactionInclude }>;

const mapState = (state: DiscussionState): 'open' | 'closed' =>
    state === DiscussionState.CLOSED ? 'closed' : 'open';

const mapReaction = (reaction: CommentReactionWithUser) => ({
    id: reaction.id,
    emoji: reaction.emoji,
    user: reaction.user,
    createdAt: reaction.createdAt,
});

const mapComment = (comment: DiscussionCommentWithRelations) => ({
    id: comment.id,
    body: comment.body,
    parentId: comment.parentId,
    author: comment.author,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    reactions: comment.reactions.map(mapReaction),
    repliesCount: comment.replies.length,
});

const mapDiscussion = (discussion: DiscussionWithBase) => ({
    id: discussion.id,
    number: discussion.number,
    title: discussion.title,
    body: discussion.body,
    state: mapState(discussion.state),
    repositoryId: discussion.repositoryId,
    author: discussion.author,
    closedAt: discussion.closedAt,
    createdAt: discussion.createdAt,
    updatedAt: discussion.updatedAt,
    commentsCount: discussion._count.comments,
});

const mapDiscussionWithComments = (discussion: DiscussionWithComments) => ({
    ...mapDiscussion(discussion),
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

const ensureRepositoryReadAccess = (repository: { ownerId: string; isPrivate: boolean }, requesterId?: string) => {
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

const ensureDiscussionWritable = (discussion: { authorId: string }, repository: { ownerId: string }, userId: string) => {
    if (discussion.authorId !== userId && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to modify this discussion');
    }
};

const ensureCommentWritable = (
    comment: { authorId: string },
    repository: { ownerId: string },
    userId: string
) => {
    if (comment.authorId !== userId && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to modify this comment');
    }
};

const loadDiscussionWithComments = async (discussionId: string) => {
    const discussion = await db.discussion.findUnique({
        where: { id: discussionId },
        include: discussionWithCommentsInclude,
    });

    if (!discussion) {
        throw new ApiError(404, 'Discussion not found');
    }

    return mapDiscussionWithComments(discussion);
};

export const createDiscussion = async (
    owner: string,
    repoName: string,
    userId: string,
    data: {
        title: string;
        body?: string;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const discussionId = await db.$transaction(async (tx) => {
        const lastDiscussion = await tx.discussion.findFirst({
            where: { repositoryId: repository.id },
            orderBy: { number: 'desc' },
            select: { number: true },
        });

        const nextNumber = (lastDiscussion?.number ?? 0) + 1;

        const created = await tx.discussion.create({
            data: {
                number: nextNumber,
                title: data.title,
                body: data.body,
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

        return created.id;
    });

    const discussionData = await loadDiscussionWithComments(discussionId);

    const sideEffects: Promise<unknown>[] = [];
    let cachedActorIdentity: Awaited<ReturnType<typeof fetchUserIdentity>> | undefined;
    const ensureActorName = async () => {
        if (!cachedActorIdentity) {
            cachedActorIdentity = await fetchUserIdentity(userId);
        }
        return resolveDisplayName(cachedActorIdentity);
    };

    sideEffects.push(
        recordActivity({
            userId,
            type: 'created_discussion',
            repositoryId: repository.id,
            metadata: {
                discussionId,
                discussionNumber: discussionData.number,
                repositoryId: repository.id,
            } as Prisma.JsonValue,
        })
    );

    const notifiedRecipients = new Set<string>();

    if (repository.ownerId !== userId) {
        const actorName = await ensureActorName();
        notifiedRecipients.add(repository.ownerId);
        sideEffects.push(
            createNotification({
                userId: repository.ownerId,
                type: 'comment',
                title: `New discussion #${discussionData.number}`,
                message: `${actorName} started the discussion "${discussionData.title}" in ${owner}/${repoName}`,
                link: `/repos/${owner}/${repoName}/discussions/${discussionData.number}`,
            })
        );
    }

    const mentionUsernames = extractMentions(data.body);
    if (mentionUsernames.length > 0) {
        const mentionRecipientIds = await resolveMentionRecipientIds(mentionUsernames, repository);
        const mentionTargets = mentionRecipientIds.filter(
            (recipientId) => recipientId !== userId && !notifiedRecipients.has(recipientId)
        );

        if (mentionTargets.length > 0) {
            const actorName = await ensureActorName();
            sideEffects.push(
                Promise.all(
                    mentionTargets.map((recipientId) =>
                        createNotification({
                            userId: recipientId,
                            type: 'mention',
                            title: `Mentioned in discussion #${discussionData.number}`,
                            message: `${actorName} mentioned you in discussion "${discussionData.title}" in ${owner}/${repoName}`,
                            link: `/repos/${owner}/${repoName}/discussions/${discussionData.number}`,
                        })
                    )
                )
            );
            mentionTargets.forEach((recipientId) => notifiedRecipients.add(recipientId));
        }
    }

    if (sideEffects.length > 0) {
        await Promise.all(sideEffects);
    }

    return discussionData;
};

export const listDiscussions = async (
    owner: string,
    repoName: string,
    requesterId: string | undefined,
    options?: {
        state?: 'open' | 'closed';
        authorId?: string;
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

    const where: Prisma.DiscussionWhereInput = {
        repositoryId: repository.id,
    };

    if (options?.state) {
        where.state = options.state === 'closed' ? DiscussionState.CLOSED : DiscussionState.OPEN;
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
        discussions: discussions.map(mapDiscussion),
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
    ensureRepositoryReadAccess(repository, requesterId);

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
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const discussion = await getDiscussionEntity(repository.id, discussionNumber);
    ensureDiscussionWritable(discussion, repository, userId);

    const updated = await db.discussion.update({
        where: { id: discussion.id },
        data: {
            title: data.title ?? discussion.title,
            body: data.body ?? discussion.body,
        },
        include: discussionWithCommentsInclude,
    });

    return mapDiscussionWithComments(updated);
};

export const updateDiscussionState = async (
    owner: string,
    repoName: string,
    discussionNumber: number,
    userId: string,
    state: 'open' | 'closed'
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const discussion = await getDiscussionEntity(repository.id, discussionNumber);
    ensureDiscussionWritable(discussion, repository, userId);

    const updated = await db.discussion.update({
        where: { id: discussion.id },
        data: {
            state: state === 'closed' ? DiscussionState.CLOSED : DiscussionState.OPEN,
            closedAt: state === 'closed' ? new Date() : null,
        },
        include: discussionWithCommentsInclude,
    });

    const mapped = mapDiscussionWithComments(updated);

    const sideEffects: Promise<unknown>[] = [];

    if (state === 'closed') {
        sideEffects.push(
            recordActivity({
                userId,
                type: 'closed_discussion',
                repositoryId: repository.id,
                metadata: {
                    discussionId: discussion.id,
                    discussionNumber: mapped.number,
                    repositoryId: repository.id,
                } as Prisma.JsonValue,
            })
        );
    }

    if (discussion.authorId !== userId) {
        const actorIdentity = await fetchUserIdentity(userId);
        const actorName = resolveDisplayName(actorIdentity);
        const actionVerb = state === 'closed' ? 'closed' : 'reopened';
        sideEffects.push(
            createNotification({
                userId: discussion.authorId,
                type: 'comment',
                title: `Discussion #${mapped.number} ${actionVerb}`,
                message: `${actorName} ${actionVerb} discussion "${discussion.title}" in ${owner}/${repoName}`,
                link: `/repos/${owner}/${repoName}/discussions/${mapped.number}`,
            })
        );
    }

    if (sideEffects.length > 0) {
        await Promise.all(sideEffects);
    }

    return mapped;
};

export const addDiscussionComment = async (
    owner: string,
    repoName: string,
    discussionNumber: number,
    userId: string,
    data: {
        body: string;
        parentId?: string;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const discussion = await getDiscussionEntity(repository.id, discussionNumber);

    let parentAuthorId: string | undefined;

    if (data.parentId) {
        const parent = await db.discussionComment.findUnique({
            where: { id: data.parentId },
            select: { id: true, discussionId: true, authorId: true },
        });

        if (!parent || parent.discussionId !== discussion.id) {
            throw new ApiError(400, 'Parent comment does not belong to this discussion');
        }

        parentAuthorId = parent.authorId;
    }

    const comment = await db.discussionComment.create({
        data: {
            body: data.body,
            discussionId: discussion.id,
            authorId: userId,
            parentId: data.parentId,
        },
        include: commentInclude,
    });

    const recipients = new Set<string>();
    recipients.add(discussion.authorId);
    recipients.add(repository.ownerId);

    if (parentAuthorId) {
        recipients.add(parentAuthorId);
    }

    recipients.delete(userId);

    const mentionUsernames = extractMentions(data.body);
    const mentionRecipientIds = await resolveMentionRecipientIds(mentionUsernames, repository);
    const mentionTargets = mentionRecipientIds.filter((recipientId) => recipientId !== userId);

    const commentRecipientIds = Array.from(recipients);
    const mentionOnlyRecipientIds = mentionTargets.filter((recipientId) => !recipients.has(recipientId));

    if (commentRecipientIds.length > 0 || mentionOnlyRecipientIds.length > 0) {
        const actorIdentity = await fetchUserIdentity(userId);
        const actorName = resolveDisplayName(actorIdentity);
        const tasks: Promise<unknown>[] = [];

        if (commentRecipientIds.length > 0) {
            tasks.push(
                Promise.all(
                    commentRecipientIds.map((recipientId) =>
                        createNotification({
                            userId: recipientId,
                            type: 'comment',
                            title: `New comment on discussion #${discussion.number}`,
                            message: `${actorName} commented on discussion "${discussion.title}" in ${owner}/${repoName}`,
                            link: `/repos/${owner}/${repoName}/discussions/${discussion.number}`,
                        })
                    )
                )
            );
        }

        if (mentionOnlyRecipientIds.length > 0) {
            tasks.push(
                Promise.all(
                    mentionOnlyRecipientIds.map((recipientId) =>
                        createNotification({
                            userId: recipientId,
                            type: 'mention',
                            title: `Mentioned in discussion #${discussion.number}`,
                            message: `${actorName} mentioned you in discussion "${discussion.title}" in ${owner}/${repoName}`,
                            link: `/repos/${owner}/${repoName}/discussions/${discussion.number}`,
                        })
                    )
                )
            );
        }

        if (tasks.length > 0) {
            await Promise.all(tasks);
        }
    }

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
    ensureRepositoryReadAccess(repository, requesterId);

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
            include: commentInclude,
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
    ensureRepositoryReadAccess(repository, userId);

    const discussion = await getDiscussionEntity(repository.id, discussionNumber);

    const comment = await db.discussionComment.findUnique({
        where: { id: commentId },
        include: commentInclude,
    });

    if (!comment || comment.discussionId !== discussion.id) {
        throw new ApiError(404, 'Comment not found');
    }

    ensureCommentWritable(comment, repository, userId);

    const updated = await db.discussionComment.update({
        where: { id: commentId },
        data: { body },
        include: commentInclude,
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
    ensureRepositoryReadAccess(repository, userId);

    const discussion = await getDiscussionEntity(repository.id, discussionNumber);

    const comment = await db.discussionComment.findUnique({
        where: { id: commentId },
        select: {
            id: true,
            discussionId: true,
            authorId: true,
        },
    });

    if (!comment || comment.discussionId !== discussion.id) {
        throw new ApiError(404, 'Comment not found');
    }

    ensureCommentWritable(comment, repository, userId);

    await db.discussionComment.delete({
        where: { id: commentId },
    });

    return { message: 'Comment deleted successfully' };
};

export const listCommentReactions = async (
    owner: string,
    repoName: string,
    discussionNumber: number,
    commentId: string,
    requesterId?: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, requesterId);

    const discussion = await getDiscussionEntity(repository.id, discussionNumber);

    const comment = await db.discussionComment.findUnique({
        where: { id: commentId },
        select: {
            id: true,
            discussionId: true,
            authorId: true,
        },
    });

    if (!comment || comment.discussionId !== discussion.id) {
        throw new ApiError(404, 'Comment not found');
    }

    const reactions = await db.commentReaction.findMany({
        where: { commentId },
        orderBy: { createdAt: 'asc' },
        include: reactionInclude,
    });

    return reactions.map(mapReaction);
};

export const addCommentReaction = async (
    owner: string,
    repoName: string,
    discussionNumber: number,
    commentId: string,
    userId: string,
    emoji: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const discussion = await getDiscussionEntity(repository.id, discussionNumber);

    const comment = await db.discussionComment.findUnique({
        where: { id: commentId },
        select: {
            id: true,
            discussionId: true,
            authorId: true,
        },
    });

    if (!comment || comment.discussionId !== discussion.id) {
        throw new ApiError(404, 'Comment not found');
    }

    const existing = await db.commentReaction.findUnique({
        where: {
            commentId_userId_emoji: {
                commentId,
                userId,
                emoji,
            },
        },
    });

    if (existing) {
        throw new ApiError(400, 'You have already added this reaction');
    }

    const reaction = await db.commentReaction.create({
        data: {
            commentId,
            userId,
            emoji,
        },
        include: reactionInclude,
    });

    if (comment.authorId && comment.authorId !== userId) {
        const actorIdentity = await fetchUserIdentity(userId);
        const actorName = resolveDisplayName(actorIdentity);
        await createNotification({
            userId: comment.authorId,
            type: 'comment',
            title: 'New reaction on your comment',
            message: `${actorName} reacted to your comment in discussion "${discussion.title}" in ${owner}/${repoName}`,
            link: `/repos/${owner}/${repoName}/discussions/${discussion.number}`,
        });
    }

    return mapReaction(reaction);
};

export const removeCommentReaction = async (
    owner: string,
    repoName: string,
    discussionNumber: number,
    commentId: string,
    reactionId: string,
    userId: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const discussion = await getDiscussionEntity(repository.id, discussionNumber);

    const comment = await db.discussionComment.findUnique({
        where: { id: commentId },
        select: {
            id: true,
            discussionId: true,
        },
    });

    if (!comment || comment.discussionId !== discussion.id) {
        throw new ApiError(404, 'Comment not found');
    }

    const reaction = await db.commentReaction.findUnique({
        where: { id: reactionId },
        select: {
            id: true,
            commentId: true,
            userId: true,
        },
    });

    if (!reaction || reaction.commentId !== commentId) {
        throw new ApiError(404, 'Reaction not found');
    }

    if (reaction.userId !== userId && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to remove this reaction');
    }

    await db.commentReaction.delete({
        where: { id: reactionId },
    });

    return { message: 'Reaction removed successfully' };
};
