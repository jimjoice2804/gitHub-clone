import db from '@config/database';
import { ActivityType, Prisma } from '@prisma/client';
import { ApiError } from '../types/index';

const activityTypeValues = [
    'created_repo',
    'forked_repo',
    'starred_repo',
    'created_issue',
    'closed_issue',
    'created_pr',
    'merged_pr',
    'pushed_commits',
    'created_branch',
    'created_tag',
    'followed_user',
] as const;

const isActivityTypeValue = (value: string): value is (typeof activityTypeValues)[number] =>
    (activityTypeValues as readonly string[]).includes(value);

const apiToActivityType: Record<(typeof activityTypeValues)[number], ActivityType> = {
    created_repo: ActivityType.CREATED_REPO,
    forked_repo: ActivityType.FORKED_REPO,
    starred_repo: ActivityType.STARRED_REPO,
    created_issue: ActivityType.CREATED_ISSUE,
    closed_issue: ActivityType.CLOSED_ISSUE,
    created_pr: ActivityType.CREATED_PR,
    merged_pr: ActivityType.MERGED_PR,
    pushed_commits: ActivityType.PUSHED_COMMITS,
    created_branch: ActivityType.CREATED_BRANCH,
    created_tag: ActivityType.CREATED_TAG,
    followed_user: ActivityType.FOLLOWED_USER,
};

const activityTypeToApi: Record<ActivityType, (typeof activityTypeValues)[number]> = {
    [ActivityType.CREATED_REPO]: 'created_repo',
    [ActivityType.FORKED_REPO]: 'forked_repo',
    [ActivityType.STARRED_REPO]: 'starred_repo',
    [ActivityType.CREATED_ISSUE]: 'created_issue',
    [ActivityType.CLOSED_ISSUE]: 'closed_issue',
    [ActivityType.CREATED_PR]: 'created_pr',
    [ActivityType.MERGED_PR]: 'merged_pr',
    [ActivityType.PUSHED_COMMITS]: 'pushed_commits',
    [ActivityType.CREATED_BRANCH]: 'created_branch',
    [ActivityType.CREATED_TAG]: 'created_tag',
    [ActivityType.FOLLOWED_USER]: 'followed_user',
};

const userSelect = {
    id: true,
    username: true,
    name: true,
    avatarUrl: true,
} as const;

const repositorySelect = {
    id: true,
    name: true,
    isPrivate: true,
    owner: {
        select: userSelect,
    },
} as const;

const activityInclude = {
    user: {
        select: userSelect,
    },
    repository: {
        select: repositorySelect,
    },
} satisfies Prisma.ActivityInclude;

type ActivityWithRelations = Prisma.ActivityGetPayload<{ include: typeof activityInclude }>;

const mapActivityType = (type: ActivityType) => activityTypeToApi[type];

const mapActivity = (activity: ActivityWithRelations) => ({
    id: activity.id,
    type: mapActivityType(activity.type),
    user: activity.user,
    repository: activity.repository
        ? {
            id: activity.repository.id,
            name: activity.repository.name,
            owner: activity.repository.owner,
        }
        : undefined,
    metadata: activity.metadata,
    createdAt: activity.createdAt,
});

const parseActivityType = (type?: string) => {
    if (!type) {
        return undefined;
    }
    if (!isActivityTypeValue(type)) {
        throw new ApiError(400, 'Invalid activity type');
    }
    return apiToActivityType[type];
};

const parseDate = (value?: string) => {
    if (!value) {
        return undefined;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new ApiError(400, 'Invalid date');
    }
    return parsed;
};

const buildVisibilityFilter = (requesterId: string | undefined, targetUserId: string) => {
    if (!requesterId || requesterId !== targetUserId) {
        const orConditions: Prisma.ActivityWhereInput[] = [
            { repositoryId: null },
            { repository: { isPrivate: false } },
        ];

        if (requesterId) {
            orConditions.push({ repository: { ownerId: requesterId } });
        }

        return {
            OR: orConditions,
        } satisfies Prisma.ActivityWhereInput;
    }

    return undefined;
};

const buildWhereClause = (
    base: Prisma.ActivityWhereInput,
    filters: Array<Prisma.ActivityWhereInput | undefined>
): Prisma.ActivityWhereInput => {
    const activeFilters = filters.filter(Boolean) as Prisma.ActivityWhereInput[];
    if (activeFilters.length === 0) {
        return base;
    }
    return {
        AND: [base, ...activeFilters],
    };
};

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

export const listUserActivities = async (
    username: string,
    requesterId: string | undefined,
    options?: {
        type?: string;
        repositoryId?: string;
        since?: string;
        until?: string;
        page?: number;
        limit?: number;
    }
) => {
    const user = await db.user.findUnique({
        where: { username },
        select: { id: true },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const typeFilter = parseActivityType(options?.type);
    const sinceDate = parseDate(options?.since);
    const untilDate = parseDate(options?.until);
    const visibilityFilter = buildVisibilityFilter(requesterId, user.id);

    const where = buildWhereClause(
        { userId: user.id },
        [
            typeFilter ? { type: typeFilter } : undefined,
            options?.repositoryId ? { repositoryId: options.repositoryId } : undefined,
            sinceDate ? { createdAt: { gte: sinceDate } } : undefined,
            untilDate ? { createdAt: { lte: untilDate } } : undefined,
            visibilityFilter,
        ]
    );

    const [activities, total] = await Promise.all([
        db.activity.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: activityInclude,
        }),
        db.activity.count({ where }),
    ]);

    return {
        activities: activities.map(mapActivity),
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

export const listRepositoryActivities = async (
    owner: string,
    repoName: string,
    requesterId: string | undefined,
    options?: {
        type?: string;
        since?: string;
        until?: string;
        page?: number;
        limit?: number;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryReadAccess(repository, requesterId);

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const typeFilter = parseActivityType(options?.type);
    const sinceDate = parseDate(options?.since);
    const untilDate = parseDate(options?.until);

    const where = buildWhereClause(
        { repositoryId: repository.id },
        [
            typeFilter ? { type: typeFilter } : undefined,
            sinceDate ? { createdAt: { gte: sinceDate } } : undefined,
            untilDate ? { createdAt: { lte: untilDate } } : undefined,
        ]
    );

    const [activities, total] = await Promise.all([
        db.activity.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: activityInclude,
        }),
        db.activity.count({ where }),
    ]);

    return {
        activities: activities.map(mapActivity),
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

export const recordActivity = async (data: {
    userId: string;
    type: ActivityType | (typeof activityTypeValues)[number];
    repositoryId?: string | null;
    metadata?: Prisma.JsonValue;
}) => {
    const type = typeof data.type === 'string' ? parseActivityType(data.type) : data.type;

    if (!type) {
        throw new ApiError(400, 'Invalid activity type');
    }

    const activity = (await db.activity.create({
        data: {
            userId: data.userId,
            type,
            repositoryId: data.repositoryId ?? null,
            metadata: (data.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        },
        include: activityInclude,
    })) as ActivityWithRelations;

    return mapActivity(activity);
};

