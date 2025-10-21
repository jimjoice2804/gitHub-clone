import db from '@config/database';
import { ActivityType, Prisma } from '@prisma/client';
import { ApiError } from '../types/index';
import { ActivityTypeFilter, activityTypes } from '../utils/validations/activity.validation';

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
    ownerId: true,
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

type ActivityRecord = Prisma.ActivityGetPayload<{ include: typeof activityInclude }>;

type ActivityVisibilityOptions = {
    requesterId?: string;
    actorId: string;
};

const activityTypeToString: Record<ActivityType, ActivityTypeFilter> = {
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

const activityStringToEnum: Record<ActivityTypeFilter, ActivityType> = Object.entries(activityTypeToString).reduce(
    (accumulator, [enumKey, value]) => {
        accumulator[value] = enumKey as ActivityType;
        return accumulator;
    },
    {} as Record<ActivityTypeFilter, ActivityType>
);

const mapActivityTypeToEnum = (type: ActivityTypeFilter | string | undefined): ActivityType | undefined => {
    if (!type) {
        return undefined;
    }

    const normalized = type.toLowerCase() as ActivityTypeFilter;
    if (activityTypes.includes(normalized)) {
        return activityStringToEnum[normalized];
    }

    return undefined;
};

const mapActivityTypeFromEnum = (type: ActivityType): ActivityTypeFilter => activityTypeToString[type];

const canViewRepositoryActivity = (activity: ActivityRecord, options: ActivityVisibilityOptions): boolean => {
    const repository = activity.repository;

    if (!repository) {
        return true;
    }

    if (!repository.isPrivate) {
        return true;
    }

    if (!options.requesterId) {
        return false;
    }

    return options.requesterId === repository.ownerId || options.requesterId === options.actorId;
};

const mapActivity = (activity: ActivityRecord) => ({
    id: activity.id,
    type: mapActivityTypeFromEnum(activity.type),
    actor: activity.user,
    repository: activity.repository
        ? {
            id: activity.repository.id,
            name: activity.repository.name,
            isPrivate: activity.repository.isPrivate,
            owner: activity.repository.owner,
        }
        : undefined,
    metadata: activity.metadata ?? undefined,
    createdAt: activity.createdAt,
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
            name: true,
            owner: {
                select: userSelect,
            },
        },
    });

    if (!repository) {
        throw new ApiError(404, 'Repository not found');
    }

    return repository;
};

const ensureRepositoryAccess = (
    repository: { ownerId: string; isPrivate: boolean },
    requesterId?: string
) => {
    if (repository.isPrivate && repository.ownerId !== requesterId) {
        throw new ApiError(403, 'You do not have access to this repository');
    }
};

export const listUserActivity = async (
    username: string,
    requesterId: string | undefined,
    options?: {
        types?: ActivityTypeFilter[];
        page?: number;
        limit?: number;
    }
) => {
    const user = await db.user.findUnique({
        where: { username },
        select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
        },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const filters: Prisma.ActivityWhereInput[] = [
        { repositoryId: null },
        { repository: { is: { isPrivate: false } } },
    ];

    if (requesterId) {
        filters.push({ repository: { is: { ownerId: requesterId } } });

        if (requesterId === user.id) {
            filters.push({ repository: { is: { ownerId: user.id } } });
        }
    }

    const where: Prisma.ActivityWhereInput = {
        userId: user.id,
        AND: [
            {
                OR: filters,
            },
        ],
    };

    if (options?.types && options.types.length > 0) {
        const enumTypes = options.types
            .map((type) => mapActivityTypeToEnum(type))
            .filter((value): value is ActivityType => value !== undefined);

        if (enumTypes.length === 0) {
            throw new ApiError(400, 'Invalid activity type filters');
        }

        where.type = { in: enumTypes };
    }

    const [activities, total] = await Promise.all([
        db.activity.findMany({
            where,
            include: activityInclude,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        db.activity.count({ where }),
    ]);

    const mappedActivities = activities
        .filter((activity) => canViewRepositoryActivity(activity, { requesterId, actorId: user.id }))
        .map(mapActivity);

    return {
        user,
        activities: mappedActivities,
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

export const listRepositoryActivity = async (
    owner: string,
    repoName: string,
    requesterId: string | undefined,
    options?: {
        types?: ActivityTypeFilter[];
        page?: number;
        limit?: number;
    }
) => {
    const repository = await findRepositoryByOwnerAndName(owner, repoName);
    ensureRepositoryAccess(repository, requesterId);

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityWhereInput = {
        repositoryId: repository.id,
    };

    if (options?.types && options.types.length > 0) {
        const enumTypes = options.types
            .map((type) => mapActivityTypeToEnum(type))
            .filter((value): value is ActivityType => value !== undefined);

        if (enumTypes.length === 0) {
            throw new ApiError(400, 'Invalid activity type filters');
        }

        where.type = { in: enumTypes };
    }

    const [activities, total] = await Promise.all([
        db.activity.findMany({
            where,
            include: activityInclude,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        db.activity.count({ where }),
    ]);

    return {
        repository: {
            id: repository.id,
            name: repository.name,
            isPrivate: repository.isPrivate,
            owner: repository.owner,
        },
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
