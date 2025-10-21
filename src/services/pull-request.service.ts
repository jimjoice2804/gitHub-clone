import db from '@config/database';
import { PullRequestState, ReviewState, Prisma } from '@prisma/client';
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

const pullRequestBaseInclude = {
    author: {
        select: userSelect,
    },
    assignees: {
        include: {
            user: {
                select: userSelect,
            },
        },
    },
    labels: {
        include: {
            label: true,
        },
    },
    head: {
        select: {
            name: true,
        },
    },
    _count: {
        select: {
            comments: true,
            reviews: true,
        },
    },
} satisfies Prisma.PullRequestInclude;

const pullRequestWithDetailsInclude = {
    ...pullRequestBaseInclude,
    comments: {
        orderBy: {
            createdAt: 'asc',
        },
        include: {
            author: {
                select: userSelect,
            },
        },
    },
    reviews: {
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            reviewer: {
                select: userSelect,
            },
        },
    },
} satisfies Prisma.PullRequestInclude;

type PullRequestWithBase = Prisma.PullRequestGetPayload<{ include: typeof pullRequestBaseInclude }>;
type PullRequestWithDetails = Prisma.PullRequestGetPayload<{ include: typeof pullRequestWithDetailsInclude }>;
type PullRequestCommentWithAuthor = Prisma.PullRequestCommentGetPayload<{
    include: {
        author: {
            select: typeof userSelect;
        };
    };
}>;
type PullRequestReviewWithReviewer = Prisma.PullRequestReviewGetPayload<{
    include: {
        reviewer: {
            select: typeof userSelect;
        };
    };
}>;

const mapPullRequestState = (state: PullRequestState): 'open' | 'closed' | 'merged' => {
    switch (state) {
        case PullRequestState.CLOSED:
            return 'closed';
        case PullRequestState.MERGED:
            return 'merged';
        default:
            return 'open';
    }
};

const mapReviewState = (
    state: ReviewState
): 'approved' | 'changes_requested' | 'commented' | 'dismissed' => {
    switch (state) {
        case ReviewState.APPROVED:
            return 'approved';
        case ReviewState.CHANGES_REQUESTED:
            return 'changes_requested';
        case ReviewState.DISMISSED:
            return 'dismissed';
        default:
            return 'commented';
    }
};

const mapPullRequest = (pullRequest: PullRequestWithBase) => ({
    id: pullRequest.id,
    number: pullRequest.number,
    title: pullRequest.title,
    body: pullRequest.body,
    state: mapPullRequestState(pullRequest.state),
    repositoryId: pullRequest.repositoryId,
    headBranch: pullRequest.headBranch,
    baseBranch: pullRequest.baseBranch,
    author: pullRequest.author,
    assignees: pullRequest.assignees.map((assignee) => assignee.user),
    labels: pullRequest.labels.map((label) => label.label),
    mergedAt: pullRequest.mergedAt,
    closedAt: pullRequest.closedAt,
    createdAt: pullRequest.createdAt,
    updatedAt: pullRequest.updatedAt,
    commentsCount: pullRequest._count.comments,
    reviewsCount: pullRequest._count.reviews,
});

const mapComment = (comment: PullRequestCommentWithAuthor) => ({
    id: comment.id,
    body: comment.body,
    author: comment.author,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
});

const mapReview = (review: PullRequestReviewWithReviewer) => ({
    id: review.id,
    body: review.body,
    state: mapReviewState(review.state),
    reviewer: review.reviewer,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
});

const mapPullRequestWithDetails = (pullRequest: PullRequestWithDetails) => ({
    ...mapPullRequest(pullRequest),
    comments: pullRequest.comments.map(mapComment),
    reviews: pullRequest.reviews.map(mapReview),
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

const ensureRepositoryWriteAccess = (repository: { ownerId: string }, userId: string) => {
    if (repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to perform this action');
    }
};

const getPullRequestEntity = async (repositoryId: string, pullNumber: number) => {
    const pullRequest = await db.pullRequest.findFirst({
        where: {
            repositoryId,
            number: pullNumber,
        },
    });

    if (!pullRequest) {
        throw new ApiError(404, 'Pull request not found');
    }

    return pullRequest;
};

const ensureBranchExists = async (repositoryId: string, branchName: string) => {
    const branch = await db.branch.findUnique({
        where: {
            repositoryId_name: {
                repositoryId,
                name: branchName,
            },
        },
        select: { id: true },
    });

    if (!branch) {
        throw new ApiError(400, `Branch "${branchName}" does not exist`);
    }
};

const dedupeIds = (ids?: string[]) => {
    if (!ids) {
        return [];
    }

    return Array.from(new Set(ids));
};

export const createPullRequest = async (
    owner: string,
    repoName: string,
    userId: string,
    data: {
        title: string;
        body?: string;
        headBranch: string;
        baseBranch: string;
        assigneeIds?: string[];
        labelIds?: string[];
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);
    ensureRepositoryWriteAccess(repository, userId);

    if (data.headBranch === data.baseBranch) {
        throw new ApiError(400, 'Head and base branches must be different');
    }

    await Promise.all([
        ensureBranchExists(repository.id, data.headBranch),
        ensureBranchExists(repository.id, data.baseBranch),
    ]);

    const assigneeIds = dedupeIds(data.assigneeIds);
    const labelIds = dedupeIds(data.labelIds);

    if (assigneeIds.length > 0) {
        const assignees = await db.user.findMany({
            where: { id: { in: assigneeIds } },
            select: { id: true },
        });

        if (assignees.length !== assigneeIds.length) {
            throw new ApiError(400, 'One or more assignees do not exist');
        }
    }

    if (labelIds.length > 0) {
        const labels = await db.label.findMany({
            where: { id: { in: labelIds } },
            select: { id: true },
        });

        if (labels.length !== labelIds.length) {
            throw new ApiError(400, 'One or more labels do not exist');
        }
    }

    const pullRequestId = await db.$transaction(async (tx) => {
        const lastPullRequest = await tx.pullRequest.findFirst({
            where: { repositoryId: repository.id },
            orderBy: { number: 'desc' },
            select: { number: true },
        });

        const nextNumber = (lastPullRequest?.number ?? 0) + 1;

        const createdPullRequest = await tx.pullRequest.create({
            data: {
                number: nextNumber,
                title: data.title,
                body: data.body,
                repositoryId: repository.id,
                authorId: userId,
                headBranch: data.headBranch,
                baseBranch: data.baseBranch,
            },
        });

        if (assigneeIds.length > 0) {
            await tx.pullRequestAssignee.createMany({
                data: assigneeIds.map((assigneeId) => ({
                    pullRequestId: createdPullRequest.id,
                    userId: assigneeId,
                })),
                skipDuplicates: true,
            });
        }

        if (labelIds.length > 0) {
            await tx.pullRequestLabel.createMany({
                data: labelIds.map((labelId) => ({
                    pullRequestId: createdPullRequest.id,
                    labelId,
                })),
                skipDuplicates: true,
            });
        }

        await tx.repository.update({
            where: { id: repository.id },
            data: {
                pullRequestsCount: { increment: 1 },
            },
        });

        return createdPullRequest.id;
    });

    const pullRequest = await db.pullRequest.findUnique({
        where: { id: pullRequestId },
        include: pullRequestWithDetailsInclude,
    });

    if (!pullRequest) {
        throw new ApiError(404, 'Pull request not found');
    }

    const mapped = mapPullRequestWithDetails(pullRequest);

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
            type: 'created_pr',
            repositoryId: repository.id,
            metadata: {
                pullRequestId: pullRequest.id,
                pullNumber: mapped.number,
                repositoryId: repository.id,
            } as Prisma.JsonValue,
        })
    );

    if (assigneeIds.length > 0) {
        const actorName = await ensureActorName();
        const notifications = assigneeIds
            .filter((assigneeId) => assigneeId !== userId)
            .map((assigneeId) =>
                createNotification({
                    userId: assigneeId,
                    type: 'pr_assigned',
                    title: `Assigned to pull request #${mapped.number}`,
                    message: `${actorName} assigned you to pull request "${mapped.title}" in ${owner}/${repoName}`,
                    link: `/repos/${owner}/${repoName}/pulls/${mapped.number}`,
                })
            );

        if (notifications.length > 0) {
            sideEffects.push(Promise.all(notifications));
        }
    }

    const mentionUsernames = extractMentions(data.body);
    if (mentionUsernames.length > 0) {
        const mentionRecipientIds = await resolveMentionRecipientIds(mentionUsernames, repository);
        const mentionTargets = mentionRecipientIds.filter((recipientId) => recipientId !== userId);

        if (mentionTargets.length > 0) {
            const actorName = await ensureActorName();
            const notifications = mentionTargets.map((recipientId) =>
                createNotification({
                    userId: recipientId,
                    type: 'mention',
                    title: `Mentioned in pull request #${mapped.number}`,
                    message: `${actorName} mentioned you in pull request "${mapped.title}" in ${owner}/${repoName}`,
                    link: `/repos/${owner}/${repoName}/pulls/${mapped.number}`,
                })
            );

            sideEffects.push(Promise.all(notifications));
        }
    }

    await Promise.all(sideEffects);

    return mapped;
};

export const listPullRequests = async (
    owner: string,
    repoName: string,
    requesterId: string | undefined,
    options?: {
        state?: 'open' | 'closed' | 'merged';
        assigneeId?: string;
        labelIds?: string[];
        search?: string;
        head?: string;
        base?: string;
        page?: number;
        limit?: number;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, requesterId);

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PullRequestWhereInput = {
        repositoryId: repository.id,
    };

    if (options?.state) {
        if (options.state === 'open') {
            where.state = PullRequestState.OPEN;
        } else if (options.state === 'closed') {
            where.state = PullRequestState.CLOSED;
        } else {
            where.state = PullRequestState.MERGED;
        }
    }

    if (options?.assigneeId) {
        where.assignees = {
            some: {
                userId: options.assigneeId,
            },
        };
    }

    if (options?.labelIds && options.labelIds.length > 0) {
        where.labels = {
            some: {
                labelId: {
                    in: options.labelIds,
                },
            },
        };
    }

    if (options?.search) {
        where.OR = [
            { title: { contains: options.search, mode: 'insensitive' } },
            { body: { contains: options.search, mode: 'insensitive' } },
        ];
    }

    if (options?.head) {
        where.headBranch = options.head;
    }

    if (options?.base) {
        where.baseBranch = options.base;
    }

    const [pullRequests, total] = await Promise.all([
        db.pullRequest.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: pullRequestBaseInclude,
        }),
        db.pullRequest.count({ where }),
    ]);

    return {
        pullRequests: pullRequests.map(mapPullRequest),
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

export const getPullRequest = async (
    owner: string,
    repoName: string,
    pullNumber: number,
    requesterId?: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, requesterId);

    const pullRequest = await db.pullRequest.findFirst({
        where: {
            repositoryId: repository.id,
            number: pullNumber,
        },
        include: pullRequestWithDetailsInclude,
    });

    if (!pullRequest) {
        throw new ApiError(404, 'Pull request not found');
    }

    return mapPullRequestWithDetails(pullRequest);
};

export const updatePullRequest = async (
    owner: string,
    repoName: string,
    pullNumber: number,
    userId: string,
    data: {
        title?: string;
        body?: string;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const pullRequest = await getPullRequestEntity(repository.id, pullNumber);

    if (pullRequest.authorId !== userId && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to update this pull request');
    }

    const updated = await db.pullRequest.update({
        where: { id: pullRequest.id },
        data: {
            title: data.title ?? pullRequest.title,
            body: data.body ?? pullRequest.body,
        },
        include: pullRequestWithDetailsInclude,
    });

    return mapPullRequestWithDetails(updated);
};

export const updatePullRequestState = async (
    owner: string,
    repoName: string,
    pullNumber: number,
    userId: string,
    state: 'open' | 'closed' | 'merged'
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const pullRequest = await getPullRequestEntity(repository.id, pullNumber);

    if (pullRequest.authorId !== userId && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to update this pull request');
    }

    const data: Prisma.PullRequestUpdateInput = {};

    if (state === 'open') {
        data.state = PullRequestState.OPEN;
        data.closedAt = null;
        data.mergedAt = null;
    } else if (state === 'closed') {
        data.state = PullRequestState.CLOSED;
        data.closedAt = new Date();
        data.mergedAt = null;
    } else {
        data.state = PullRequestState.MERGED;
        const now = new Date();
        data.mergedAt = now;
        data.closedAt = now;
    }

    const updated = await db.pullRequest.update({
        where: { id: pullRequest.id },
        data,
        include: pullRequestWithDetailsInclude,
    });

    const mapped = mapPullRequestWithDetails(updated);

    if (state === 'merged') {
        const sideEffects: Promise<unknown>[] = [];

        sideEffects.push(
            recordActivity({
                userId,
                type: 'merged_pr',
                repositoryId: repository.id,
                metadata: {
                    pullRequestId: pullRequest.id,
                    pullNumber: mapped.number,
                    repositoryId: repository.id,
                } as Prisma.JsonValue,
            })
        );

        const recipients = new Set<string>();
        recipients.add(pullRequest.authorId);

        const assignees = await db.pullRequestAssignee.findMany({
            where: { pullRequestId: pullRequest.id },
            select: { userId: true },
        });

        assignees.forEach((assignee) => recipients.add(assignee.userId));
        recipients.delete(userId);

        if (recipients.size > 0) {
            const actorIdentity = await fetchUserIdentity(userId);
            const actorName = resolveDisplayName(actorIdentity);
            const notifications = Array.from(recipients).map((recipientId) =>
                createNotification({
                    userId: recipientId,
                    type: 'pr_merged',
                    title: `Pull request #${mapped.number} merged`,
                    message: `${actorName} merged pull request "${mapped.title}" in ${owner}/${repoName}`,
                    link: `/repos/${owner}/${repoName}/pulls/${mapped.number}`,
                })
            );

            sideEffects.push(Promise.all(notifications));
        }

        await Promise.all(sideEffects);
    }

    return mapped;
};

export const setPullRequestAssignees = async (
    owner: string,
    repoName: string,
    pullNumber: number,
    userId: string,
    assigneeIds: string[]
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const pullRequest = await getPullRequestEntity(repository.id, pullNumber);

    if (pullRequest.authorId !== userId && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to update this pull request');
    }

    const existingAssignees = await db.pullRequestAssignee.findMany({
        where: { pullRequestId: pullRequest.id },
        select: { userId: true },
    });

    const previousAssigneeIds = new Set(existingAssignees.map((assignment) => assignment.userId));

    const ids = dedupeIds(assigneeIds);

    if (ids.length > 0) {
        const assignees = await db.user.findMany({
            where: { id: { in: ids } },
            select: { id: true },
        });

        if (assignees.length !== ids.length) {
            throw new ApiError(400, 'One or more assignees do not exist');
        }
    }

    await db.$transaction(async (tx) => {
        await tx.pullRequestAssignee.deleteMany({
            where: { pullRequestId: pullRequest.id },
        });

        if (ids.length > 0) {
            await tx.pullRequestAssignee.createMany({
                data: ids.map((assigneeId) => ({
                    pullRequestId: pullRequest.id,
                    userId: assigneeId,
                })),
                skipDuplicates: true,
            });
        }
    });

    const updated = await db.pullRequest.findUnique({
        where: { id: pullRequest.id },
        include: pullRequestWithDetailsInclude,
    });

    if (!updated) {
        throw new ApiError(404, 'Pull request not found');
    }

    const mapped = mapPullRequestWithDetails(updated);

    const newAssigneeIds = ids.filter((assigneeId) => !previousAssigneeIds.has(assigneeId));

    if (newAssigneeIds.length > 0) {
        const actorIdentity = await fetchUserIdentity(userId);
        const actorName = resolveDisplayName(actorIdentity);
        const notifications = newAssigneeIds
            .filter((assigneeId) => assigneeId !== userId)
            .map((assigneeId) =>
                createNotification({
                    userId: assigneeId,
                    type: 'pr_assigned',
                    title: `Assigned to pull request #${pullRequest.number}`,
                    message: `${actorName} assigned you to pull request "${pullRequest.title}" in ${owner}/${repoName}`,
                    link: `/repos/${owner}/${repoName}/pulls/${pullRequest.number}`,
                })
            );

        if (notifications.length > 0) {
            await Promise.all(notifications);
        }
    }

    return mapped;
};

export const setPullRequestLabels = async (
    owner: string,
    repoName: string,
    pullNumber: number,
    userId: string,
    labelIds: string[]
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const pullRequest = await getPullRequestEntity(repository.id, pullNumber);

    if (pullRequest.authorId !== userId && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to update this pull request');
    }

    const ids = dedupeIds(labelIds);

    if (ids.length > 0) {
        const labels = await db.label.findMany({
            where: { id: { in: ids } },
            select: { id: true },
        });

        if (labels.length !== ids.length) {
            throw new ApiError(400, 'One or more labels do not exist');
        }
    }

    await db.$transaction(async (tx) => {
        await tx.pullRequestLabel.deleteMany({
            where: { pullRequestId: pullRequest.id },
        });

        if (ids.length > 0) {
            await tx.pullRequestLabel.createMany({
                data: ids.map((labelId) => ({
                    pullRequestId: pullRequest.id,
                    labelId,
                })),
                skipDuplicates: true,
            });
        }
    });

    const updated = await db.pullRequest.findUnique({
        where: { id: pullRequest.id },
        include: pullRequestWithDetailsInclude,
    });

    if (!updated) {
        throw new ApiError(404, 'Pull request not found');
    }

    return mapPullRequestWithDetails(updated);
};

export const addPullRequestComment = async (
    owner: string,
    repoName: string,
    pullNumber: number,
    userId: string,
    body: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const pullRequest = await getPullRequestEntity(repository.id, pullNumber);

    const comment = await db.pullRequestComment.create({
        data: {
            body,
            pullRequestId: pullRequest.id,
            authorId: userId,
        },
        include: {
            author: {
                select: userSelect,
            },
        },
    });

    const recipients = new Set<string>();
    recipients.add(pullRequest.authorId);
    recipients.add(repository.ownerId);

    const assignees = await db.pullRequestAssignee.findMany({
        where: { pullRequestId: pullRequest.id },
        select: { userId: true },
    });

    assignees.forEach((assignee) => recipients.add(assignee.userId));
    recipients.delete(userId);

    const mentionUsernames = extractMentions(body);
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
                            title: `New comment on pull request #${pullRequest.number}`,
                            message: `${actorName} commented on pull request "${pullRequest.title}" in ${owner}/${repoName}`,
                            link: `/repos/${owner}/${repoName}/pulls/${pullRequest.number}`,
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
                            title: `Mentioned in pull request #${pullRequest.number}`,
                            message: `${actorName} mentioned you in pull request "${pullRequest.title}" in ${owner}/${repoName}`,
                            link: `/repos/${owner}/${repoName}/pulls/${pullRequest.number}`,
                        })
                    )
                )
            );
        }

        await Promise.all(tasks);
    }

    return mapComment(comment);
};

export const listPullRequestComments = async (
    owner: string,
    repoName: string,
    pullNumber: number,
    requesterId: string | undefined,
    options?: {
        page?: number;
        limit?: number;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, requesterId);

    const pullRequest = await getPullRequestEntity(repository.id, pullNumber);

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
        db.pullRequestComment.findMany({
            where: { pullRequestId: pullRequest.id },
            skip,
            take: limit,
            orderBy: { createdAt: 'asc' },
            include: {
                author: {
                    select: userSelect,
                },
            },
        }),
        db.pullRequestComment.count({ where: { pullRequestId: pullRequest.id } }),
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

export const updatePullRequestComment = async (
    owner: string,
    repoName: string,
    pullNumber: number,
    commentId: string,
    userId: string,
    body: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const pullRequest = await getPullRequestEntity(repository.id, pullNumber);

    const comment = await db.pullRequestComment.findUnique({
        where: { id: commentId },
        include: {
            author: {
                select: userSelect,
            },
        },
    });

    if (!comment || comment.pullRequestId !== pullRequest.id) {
        throw new ApiError(404, 'Comment not found');
    }

    if (comment.authorId !== userId) {
        throw new ApiError(403, 'You do not have permission to update this comment');
    }

    const updated = await db.pullRequestComment.update({
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

export const deletePullRequestComment = async (
    owner: string,
    repoName: string,
    pullNumber: number,
    commentId: string,
    userId: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const pullRequest = await getPullRequestEntity(repository.id, pullNumber);

    const comment = await db.pullRequestComment.findUnique({
        where: { id: commentId },
    });

    if (!comment || comment.pullRequestId !== pullRequest.id) {
        throw new ApiError(404, 'Comment not found');
    }

    if (comment.authorId !== userId && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to delete this comment');
    }

    await db.pullRequestComment.delete({
        where: { id: commentId },
    });

    return { message: 'Comment deleted successfully' };
};

export const createPullRequestReview = async (
    owner: string,
    repoName: string,
    pullNumber: number,
    userId: string,
    data: {
        state: 'approved' | 'changes_requested' | 'commented' | 'dismissed';
        body?: string;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const pullRequest = await getPullRequestEntity(repository.id, pullNumber);

    const review = await db.pullRequestReview.create({
        data: {
            pullRequestId: pullRequest.id,
            reviewerId: userId,
            state:
                data.state === 'approved'
                    ? ReviewState.APPROVED
                    : data.state === 'changes_requested'
                        ? ReviewState.CHANGES_REQUESTED
                        : data.state === 'dismissed'
                            ? ReviewState.DISMISSED
                            : ReviewState.COMMENTED,
            body: data.body,
        },
        include: {
            reviewer: {
                select: userSelect,
            },
        },
    });

    const recipients = new Set<string>();
    recipients.add(pullRequest.authorId);
    recipients.add(repository.ownerId);

    const assignees = await db.pullRequestAssignee.findMany({
        where: { pullRequestId: pullRequest.id },
        select: { userId: true },
    });

    assignees.forEach((assignee) => recipients.add(assignee.userId));
    recipients.delete(userId);

    const mentionUsernames = extractMentions(data.body);
    const mentionRecipientIds = await resolveMentionRecipientIds(mentionUsernames, repository);
    const mentionTargets = mentionRecipientIds.filter((recipientId) => recipientId !== userId);

    const reviewRecipientIds = Array.from(recipients);
    const mentionOnlyRecipientIds = mentionTargets.filter((recipientId) => !recipients.has(recipientId));

    if (reviewRecipientIds.length > 0 || mentionOnlyRecipientIds.length > 0) {
        const actorIdentity = await fetchUserIdentity(userId);
        const actorName = resolveDisplayName(actorIdentity);

        const tasks: Promise<unknown>[] = [];

        if (reviewRecipientIds.length > 0) {
            tasks.push(
                Promise.all(
                    reviewRecipientIds.map((recipientId) =>
                        createNotification({
                            userId: recipientId,
                            type: 'comment',
                            title: `New review on pull request #${pullRequest.number}`,
                            message: `${actorName} submitted a review on pull request "${pullRequest.title}" in ${owner}/${repoName}`,
                            link: `/repos/${owner}/${repoName}/pulls/${pullRequest.number}`,
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
                            title: `Mentioned in pull request #${pullRequest.number}`,
                            message: `${actorName} mentioned you in a review on pull request "${pullRequest.title}" in ${owner}/${repoName}`,
                            link: `/repos/${owner}/${repoName}/pulls/${pullRequest.number}`,
                        })
                    )
                )
            );
        }

        await Promise.all(tasks);
    }

    return mapReview(review);
};

export const listPullRequestReviews = async (
    owner: string,
    repoName: string,
    pullNumber: number,
    requesterId?: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, requesterId);

    const pullRequest = await getPullRequestEntity(repository.id, pullNumber);

    const reviews = await db.pullRequestReview.findMany({
        where: { pullRequestId: pullRequest.id },
        orderBy: { createdAt: 'desc' },
        include: {
            reviewer: {
                select: userSelect,
            },
        },
    });

    return reviews.map(mapReview);
};
