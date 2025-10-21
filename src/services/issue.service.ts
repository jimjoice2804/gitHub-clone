import db from '@config/database';
import { IssueState, Prisma } from '@prisma/client';
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

const issueBaseInclude = {
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
    _count: {
        select: {
            comments: true,
        },
    },
} satisfies Prisma.IssueInclude;

const issueWithCommentsInclude = {
    ...issueBaseInclude,
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
} satisfies Prisma.IssueInclude;

type IssueWithBase = Prisma.IssueGetPayload<{ include: typeof issueBaseInclude }>;
type IssueWithComments = Prisma.IssueGetPayload<{ include: typeof issueWithCommentsInclude }>;
type IssueCommentWithAuthor = Prisma.IssueCommentGetPayload<{
    include: {
        author: {
            select: typeof userSelect;
        };
    };
}>;

const mapIssue = (issue: IssueWithBase) => ({
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body: issue.body,
    state: issue.state === IssueState.OPEN ? 'open' : 'closed',
    repositoryId: issue.repositoryId,
    author: issue.author,
    assignees: issue.assignees.map((assignee) => assignee.user),
    labels: issue.labels.map((label) => label.label),
    closedAt: issue.closedAt,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    commentsCount: issue._count.comments,
});

const mapIssueWithComments = (issue: IssueWithComments) => ({
    ...mapIssue(issue),
    comments: issue.comments.map(mapComment),
});

const mapComment = (comment: IssueCommentWithAuthor) => ({
    id: comment.id,
    body: comment.body,
    author: comment.author,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
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

const getIssueEntity = async (repositoryId: string, issueNumber: number) => {
    const issue = await db.issue.findFirst({
        where: {
            repositoryId,
            number: issueNumber,
        },
    });

    if (!issue) {
        throw new ApiError(404, 'Issue not found');
    }

    return issue;
};

const loadIssueWithComments = async (issueId: string) => {
    const issue = await db.issue.findUnique({
        where: { id: issueId },
        include: issueWithCommentsInclude,
    });

    if (!issue) {
        throw new ApiError(404, 'Issue not found');
    }

    return mapIssueWithComments(issue);
};

const dedupeIds = (ids?: string[]) => {
    if (!ids) {
        return [];
    }
    return Array.from(new Set(ids));
};

export const createIssue = async (
    owner: string,
    repoName: string,
    userId: string,
    data: {
        title: string;
        body?: string;
        assigneeIds?: string[];
        labelIds?: string[];
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

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

    const issueId = await db.$transaction(async (tx) => {
        const lastIssue = await tx.issue.findFirst({
            where: { repositoryId: repository.id },
            orderBy: { number: 'desc' },
            select: { number: true },
        });

        const nextNumber = (lastIssue?.number ?? 0) + 1;

        const createdIssue = await tx.issue.create({
            data: {
                number: nextNumber,
                title: data.title,
                body: data.body,
                repositoryId: repository.id,
                authorId: userId,
            },
        });

        if (assigneeIds.length > 0) {
            await tx.issueAssignee.createMany({
                data: assigneeIds.map((assigneeId) => ({
                    issueId: createdIssue.id,
                    userId: assigneeId,
                })),
                skipDuplicates: true,
            });
        }

        if (labelIds.length > 0) {
            await tx.issueLabel.createMany({
                data: labelIds.map((labelId) => ({
                    issueId: createdIssue.id,
                    labelId,
                })),
                skipDuplicates: true,
            });
        }

        await tx.repository.update({
            where: { id: repository.id },
            data: {
                issuesCount: { increment: 1 },
            },
        });

        return createdIssue.id;
    });

    const issueData = await loadIssueWithComments(issueId);

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
            type: 'created_issue',
            repositoryId: repository.id,
            metadata: {
                issueId,
                issueNumber: issueData.number,
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
                    type: 'issue_assigned',
                    title: `Assigned to issue #${issueData.number}`,
                    message: `${actorName} assigned you to issue "${issueData.title}" in ${owner}/${repoName}`,
                    link: `/repos/${owner}/${repoName}/issues/${issueData.number}`,
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
                    title: `Mentioned in issue #${issueData.number}`,
                    message: `${actorName} mentioned you in issue "${issueData.title}" in ${owner}/${repoName}`,
                    link: `/repos/${owner}/${repoName}/issues/${issueData.number}`,
                })
            );

            sideEffects.push(Promise.all(notifications));
        }
    }

    await Promise.all(sideEffects);

    return issueData;
};

export const listIssues = async (
    owner: string,
    repoName: string,
    requesterId: string | undefined,
    options?: {
        state?: 'open' | 'closed';
        assigneeId?: string;
        labelIds?: string[];
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

    const where: Prisma.IssueWhereInput = {
        repositoryId: repository.id,
    };

    if (options?.state) {
        where.state = options.state === 'open' ? IssueState.OPEN : IssueState.CLOSED;
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

    const [issues, total] = await Promise.all([
        db.issue.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: issueBaseInclude,
        }),
        db.issue.count({ where }),
    ]);

    return {
        issues: issues.map(mapIssue),
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

export const getIssue = async (
    owner: string,
    repoName: string,
    issueNumber: number,
    requesterId?: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, requesterId);

    const issue = await db.issue.findFirst({
        where: {
            repositoryId: repository.id,
            number: issueNumber,
        },
        include: issueWithCommentsInclude,
    });

    if (!issue) {
        throw new ApiError(404, 'Issue not found');
    }

    return mapIssueWithComments(issue);
};

export const updateIssue = async (
    owner: string,
    repoName: string,
    issueNumber: number,
    userId: string,
    data: {
        title?: string;
        body?: string;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const issue = await getIssueEntity(repository.id, issueNumber);

    if (issue.authorId !== userId && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to update this issue');
    }

    const updated = await db.issue.update({
        where: { id: issue.id },
        data: {
            title: data.title ?? issue.title,
            body: data.body ?? issue.body,
        },
        include: issueWithCommentsInclude,
    });

    return mapIssueWithComments(updated);
};

export const updateIssueState = async (
    owner: string,
    repoName: string,
    issueNumber: number,
    userId: string,
    state: 'open' | 'closed'
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const issue = await getIssueEntity(repository.id, issueNumber);

    if (issue.authorId !== userId && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to update this issue');
    }

    const updated = await db.issue.update({
        where: { id: issue.id },
        data: {
            state: state === 'open' ? IssueState.OPEN : IssueState.CLOSED,
            closedAt: state === 'closed' ? new Date() : null,
        },
        include: issueWithCommentsInclude,
    });

    const mapped = mapIssueWithComments(updated);

    if (state === 'closed') {
        await recordActivity({
            userId,
            type: 'closed_issue',
            repositoryId: repository.id,
            metadata: {
                issueId: issue.id,
                issueNumber: mapped.number,
                repositoryId: repository.id,
            } as Prisma.JsonValue,
        });
    }

    return mapped;
};

export const setIssueAssignees = async (
    owner: string,
    repoName: string,
    issueNumber: number,
    userId: string,
    assigneeIds: string[]
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const issue = await getIssueEntity(repository.id, issueNumber);

    if (issue.authorId !== userId && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to update this issue');
    }

    const existingAssignees = await db.issueAssignee.findMany({
        where: { issueId: issue.id },
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
        await tx.issueAssignee.deleteMany({
            where: { issueId: issue.id },
        });

        if (ids.length > 0) {
            await tx.issueAssignee.createMany({
                data: ids.map((assigneeId) => ({
                    issueId: issue.id,
                    userId: assigneeId,
                })),
                skipDuplicates: true,
            });
        }
    });

    const updatedIssue = await loadIssueWithComments(issue.id);

    const newAssigneeIds = ids.filter((assigneeId) => !previousAssigneeIds.has(assigneeId));

    if (newAssigneeIds.length > 0) {
        const actorIdentity = await fetchUserIdentity(userId);
        const actorName = resolveDisplayName(actorIdentity);
        const notifications = newAssigneeIds
            .filter((assigneeId) => assigneeId !== userId)
            .map((assigneeId) =>
                createNotification({
                    userId: assigneeId,
                    type: 'issue_assigned',
                    title: `Assigned to issue #${issue.number}`,
                    message: `${actorName} assigned you to issue "${issue.title}" in ${owner}/${repoName}`,
                    link: `/repos/${owner}/${repoName}/issues/${issue.number}`,
                })
            );

        if (notifications.length > 0) {
            await Promise.all(notifications);
        }
    }

    return updatedIssue;
};

export const setIssueLabels = async (
    owner: string,
    repoName: string,
    issueNumber: number,
    userId: string,
    labelIds: string[]
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const issue = await getIssueEntity(repository.id, issueNumber);

    if (issue.authorId !== userId && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to update this issue');
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
        await tx.issueLabel.deleteMany({
            where: { issueId: issue.id },
        });

        if (ids.length > 0) {
            await tx.issueLabel.createMany({
                data: ids.map((labelId) => ({
                    issueId: issue.id,
                    labelId,
                })),
                skipDuplicates: true,
            });
        }
    });

    return loadIssueWithComments(issue.id);
};

export const addIssueComment = async (
    owner: string,
    repoName: string,
    issueNumber: number,
    userId: string,
    body: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const issue = await getIssueEntity(repository.id, issueNumber);

    const comment = await db.issueComment.create({
        data: {
            body,
            issueId: issue.id,
            authorId: userId,
        },
        include: {
            author: {
                select: userSelect,
            },
        },
    });

    const recipients = new Set<string>();
    recipients.add(issue.authorId);

    const assignees = await db.issueAssignee.findMany({
        where: { issueId: issue.id },
        select: { userId: true },
    });

    assignees.forEach((assignee) => recipients.add(assignee.userId));
    recipients.delete(userId);

    const mentionUsernames = extractMentions(body);
    const mentionRecipientIds = await resolveMentionRecipientIds(mentionUsernames, repository);
    const mentionTargets = mentionRecipientIds.filter((recipientId) => recipientId !== userId);

    const commentRecipientIds = Array.from(recipients);
    const mentionOnlyRecipientIds = mentionTargets.filter((recipientId) => !recipients.has(recipientId));

    if (commentRecipientIds.length === 0 && mentionOnlyRecipientIds.length === 0) {
        return mapComment(comment);
    }

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
                        title: `New comment on issue #${issue.number}`,
                        message: `${actorName} commented on issue "${issue.title}" in ${owner}/${repoName}`,
                        link: `/repos/${owner}/${repoName}/issues/${issue.number}`,
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
                        title: `Mentioned in issue #${issue.number}`,
                        message: `${actorName} mentioned you in issue "${issue.title}" in ${owner}/${repoName}`,
                        link: `/repos/${owner}/${repoName}/issues/${issue.number}`,
                    })
                )
            )
        );
    }

    await Promise.all(tasks);

    return mapComment(comment);
};

export const listIssueComments = async (
    owner: string,
    repoName: string,
    issueNumber: number,
    requesterId: string | undefined,
    options?: {
        page?: number;
        limit?: number;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, requesterId);

    const issue = await getIssueEntity(repository.id, issueNumber);

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
        db.issueComment.findMany({
            where: { issueId: issue.id },
            skip,
            take: limit,
            orderBy: { createdAt: 'asc' },
            include: {
                author: {
                    select: userSelect,
                },
            },
        }),
        db.issueComment.count({ where: { issueId: issue.id } }),
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

export const updateIssueComment = async (
    owner: string,
    repoName: string,
    issueNumber: number,
    commentId: string,
    userId: string,
    body: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const issue = await getIssueEntity(repository.id, issueNumber);

    const comment = await db.issueComment.findUnique({
        where: { id: commentId },
        include: {
            author: {
                select: userSelect,
            },
        },
    });

    if (!comment || comment.issueId !== issue.id) {
        throw new ApiError(404, 'Comment not found');
    }

    if (comment.authorId !== userId) {
        throw new ApiError(403, 'You do not have permission to update this comment');
    }

    const updated = await db.issueComment.update({
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

export const deleteIssueComment = async (
    owner: string,
    repoName: string,
    issueNumber: number,
    commentId: string,
    userId: string
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, userId);

    const issue = await getIssueEntity(repository.id, issueNumber);

    const comment = await db.issueComment.findUnique({
        where: { id: commentId },
    });

    if (!comment || comment.issueId !== issue.id) {
        throw new ApiError(404, 'Comment not found');
    }

    if (comment.authorId !== userId && repository.ownerId !== userId) {
        throw new ApiError(403, 'You do not have permission to delete this comment');
    }

    await db.issueComment.delete({
        where: { id: commentId },
    });

    return { message: 'Comment deleted successfully' };
};
