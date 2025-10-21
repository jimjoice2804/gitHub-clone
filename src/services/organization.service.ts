import db from '@config/database';
import { OrgRole, Prisma } from '@prisma/client';
import { ApiError } from '../types/index';

const userSelect = {
    id: true,
    username: true,
    name: true,
    avatarUrl: true,
    bio: true,
} as const;

const organizationSelect = {
    id: true,
    name: true,
    displayName: true,
    description: true,
    avatarUrl: true,
    website: true,
    location: true,
    email: true,
    createdAt: true,
    updatedAt: true,
    owner: {
        select: userSelect,
    },
    _count: {
        select: {
            repositories: true,
            members: true,
        },
    },
} satisfies Prisma.OrganizationSelect;

type OrganizationWithDetails = Prisma.OrganizationGetPayload<{ select: typeof organizationSelect }>;

const mapOrganization = (org: OrganizationWithDetails) => ({
    id: org.id,
    name: org.name,
    displayName: org.displayName,
    description: org.description,
    avatarUrl: org.avatarUrl,
    website: org.website,
    location: org.location,
    email: org.email,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
    owner: org.owner,
    stats: {
        repositories: org._count.repositories,
        members: org._count.members,
    },
});

const memberInclude = {
    organization: {
        select: {
            id: true,
            name: true,
            displayName: true,
        },
    },
} satisfies Prisma.OrganizationMemberInclude;

type OrganizationMemberWithOrg = Prisma.OrganizationMemberGetPayload<{ include: typeof memberInclude }>;

const mapMember = (member: OrganizationMemberWithOrg & { user?: typeof userSelect }) => ({
    id: member.id,
    role: member.role,
    createdAt: member.createdAt,
    user: member.user,
    organization: member.organization,
});

/**
 * Check if user has admin access to organization (OWNER or ADMIN role)
 */
const ensureOrganizationAdminAccess = async (orgName: string, userId: string) => {
    const org = await db.organization.findUnique({
        where: { name: orgName },
        select: { id: true, ownerId: true },
    });

    if (!org) {
        throw new ApiError(404, 'Organization not found');
    }

    // Owner has full access
    if (org.ownerId === userId) {
        return org;
    }

    // Check if user is an admin
    const member = await db.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                organizationId: org.id,
                userId,
            },
        },
        select: { role: true },
    });

    if (!member || (member.role !== OrgRole.ADMIN && member.role !== OrgRole.OWNER)) {
        throw new ApiError(403, 'You do not have admin access to this organization');
    }

    return org;
};

/**
 * Create a new organization
 */
export const createOrganization = async (
    userId: string,
    data: {
        name: string;
        displayName: string;
        description?: string;
        avatarUrl?: string;
        website?: string;
        location?: string;
        email?: string;
    }
) => {
    // Check if organization name already exists
    const existing = await db.organization.findUnique({
        where: { name: data.name },
        select: { id: true },
    });

    if (existing) {
        throw new ApiError(400, 'An organization with this name already exists');
    }

    // Create organization with owner as first member
    const organization = await db.organization.create({
        data: {
            name: data.name,
            displayName: data.displayName,
            description: data.description || null,
            avatarUrl: data.avatarUrl || null,
            website: data.website || null,
            location: data.location || null,
            email: data.email || null,
            ownerId: userId,
            members: {
                create: {
                    userId,
                    role: OrgRole.OWNER,
                },
            },
        },
        select: organizationSelect,
    });

    return mapOrganization(organization);
};

/**
 * Get organization by name
 */
export const getOrganization = async (name: string) => {
    const organization = await db.organization.findUnique({
        where: { name },
        select: organizationSelect,
    });

    if (!organization) {
        throw new ApiError(404, 'Organization not found');
    }

    return mapOrganization(organization);
};

/**
 * Update organization
 */
export const updateOrganization = async (
    name: string,
    userId: string,
    data: {
        displayName?: string;
        description?: string;
        avatarUrl?: string;
        website?: string;
        location?: string;
        email?: string;
    }
) => {
    await ensureOrganizationAdminAccess(name, userId);

    const organization = await db.organization.update({
        where: { name },
        data: {
            displayName: data.displayName,
            description: data.description !== undefined ? data.description : undefined,
            avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : undefined,
            website: data.website !== undefined ? data.website : undefined,
            location: data.location !== undefined ? data.location : undefined,
            email: data.email !== undefined ? data.email : undefined,
        },
        select: organizationSelect,
    });

    return mapOrganization(organization);
};

/**
 * Delete organization
 */
export const deleteOrganization = async (name: string, userId: string) => {
    const org = await db.organization.findUnique({
        where: { name },
        select: { id: true, ownerId: true },
    });

    if (!org) {
        throw new ApiError(404, 'Organization not found');
    }

    // Only owner can delete organization
    if (org.ownerId !== userId) {
        throw new ApiError(403, 'Only the organization owner can delete the organization');
    }

    await db.organization.delete({
        where: { name },
    });
};

/**
 * List all organizations
 */
export const listOrganizations = async (options?: {
    search?: string;
    page?: number;
    limit?: number;
}) => {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrganizationWhereInput = {};

    if (options?.search) {
        where.OR = [
            {
                name: {
                    contains: options.search,
                    mode: 'insensitive',
                },
            },
            {
                displayName: {
                    contains: options.search,
                    mode: 'insensitive',
                },
            },
        ];
    }

    const [organizations, total] = await Promise.all([
        db.organization.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: organizationSelect,
        }),
        db.organization.count({ where }),
    ]);

    return {
        organizations: organizations.map(mapOrganization),
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

/**
 * List user's organizations
 */
export const listUserOrganizations = async (username: string) => {
    const user = await db.user.findUnique({
        where: { username },
        select: { id: true },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Get organizations where user is owner or member
    const [ownedOrgs, memberOrgs] = await Promise.all([
        db.organization.findMany({
            where: { ownerId: user.id },
            select: organizationSelect,
        }),
        db.organizationMember.findMany({
            where: { userId: user.id },
            include: {
                organization: {
                    select: organizationSelect,
                },
            },
        }),
    ]);

    const memberOrgsList = memberOrgs
        .filter((m) => m.organization.owner.id !== user.id) // Exclude owned orgs
        .map((m) => m.organization);

    return {
        organizations: [...ownedOrgs.map(mapOrganization), ...memberOrgsList.map(mapOrganization)],
    };
};

/**
 * Add member to organization
 */
export const addOrganizationMember = async (
    orgName: string,
    adminUserId: string,
    username: string,
    role: OrgRole = OrgRole.MEMBER
) => {
    const org = await ensureOrganizationAdminAccess(orgName, adminUserId);

    // Find user to add
    const user = await db.user.findUnique({
        where: { username },
        select: userSelect,
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Check if already a member
    const existing = await db.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                organizationId: org.id,
                userId: user.id,
            },
        },
        select: { id: true },
    });

    if (existing) {
        throw new ApiError(400, 'User is already a member of this organization');
    }

    // Add member
    const member = await db.organizationMember.create({
        data: {
            organizationId: org.id,
            userId: user.id,
            role,
        },
        include: memberInclude,
    });

    return { ...mapMember(member), user };
};

/**
 * Remove member from organization
 */
export const removeOrganizationMember = async (
    orgName: string,
    adminUserId: string,
    username: string
) => {
    const org = await ensureOrganizationAdminAccess(orgName, adminUserId);

    // Find user to remove
    const user = await db.user.findUnique({
        where: { username },
        select: { id: true },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Cannot remove owner
    if (org.ownerId === user.id) {
        throw new ApiError(400, 'Cannot remove the organization owner');
    }

    // Remove member
    const deleted = await db.organizationMember.deleteMany({
        where: {
            organizationId: org.id,
            userId: user.id,
        },
    });

    if (deleted.count === 0) {
        throw new ApiError(404, 'User is not a member of this organization');
    }
};

/**
 * Update member role
 */
export const updateOrganizationMemberRole = async (
    orgName: string,
    adminUserId: string,
    username: string,
    role: OrgRole
) => {
    const org = await ensureOrganizationAdminAccess(orgName, adminUserId);

    // Find user
    const user = await db.user.findUnique({
        where: { username },
        select: { ...userSelect },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Cannot change owner's role
    if (org.ownerId === user.id) {
        throw new ApiError(400, 'Cannot change the organization owner\'s role');
    }

    // Update role
    const member = await db.organizationMember.update({
        where: {
            organizationId_userId: {
                organizationId: org.id,
                userId: user.id,
            },
        },
        data: { role },
        include: memberInclude,
    });

    return { ...mapMember(member), user };
};

/**
 * List organization members
 */
export const listOrganizationMembers = async (
    orgName: string,
    options?: {
        role?: OrgRole;
        page?: number;
        limit?: number;
    }
) => {
    const org = await db.organization.findUnique({
        where: { name: orgName },
        select: { id: true },
    });

    if (!org) {
        throw new ApiError(404, 'Organization not found');
    }

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrganizationMemberWhereInput = {
        organizationId: org.id,
    };

    if (options?.role) {
        where.role = options.role;
    }

    const [members, total] = await Promise.all([
        db.organizationMember.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'asc' },
            include: {
                ...memberInclude,
                // Get user info via raw query or separate lookup
            },
        }),
        db.organizationMember.count({ where }),
    ]);

    // Fetch user details for each member
    const memberIds = members.map((m) => m.userId);
    const users = await db.user.findMany({
        where: { id: { in: memberIds } },
        select: userSelect,
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
        members: members.map((m) => ({
            ...mapMember(m),
            user: userMap.get(m.userId),
        })),
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

/**
 * Get organization member
 */
export const getOrganizationMember = async (orgName: string, username: string) => {
    const org = await db.organization.findUnique({
        where: { name: orgName },
        select: { id: true },
    });

    if (!org) {
        throw new ApiError(404, 'Organization not found');
    }

    const user = await db.user.findUnique({
        where: { username },
        select: userSelect,
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const member = await db.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                organizationId: org.id,
                userId: user.id,
            },
        },
        include: memberInclude,
    });

    if (!member) {
        throw new ApiError(404, 'User is not a member of this organization');
    }

    return { ...mapMember(member), user };
};

/**
 * List organization repositories
 */
export const listOrganizationRepositories = async (
    orgName: string,
    requesterId: string | undefined,
    options?: {
        type?: 'all' | 'public' | 'private';
        language?: string;
        sort?: 'created' | 'updated' | 'pushed' | 'name';
        direction?: 'asc' | 'desc';
        page?: number;
        limit?: number;
    }
) => {
    const org = await db.organization.findUnique({
        where: { name: orgName },
        select: { id: true, ownerId: true },
    });

    if (!org) {
        throw new ApiError(404, 'Organization not found');
    }

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    // Check if requester is a member
    const isMember =
        requesterId === org.ownerId ||
        (requesterId &&
            (await db.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId: org.id,
                        userId: requesterId,
                    },
                },
                select: { id: true },
            })));

    const where: Prisma.RepositoryWhereInput = {
        organizationId: org.id,
    };

    // Filter by type
    if (options?.type === 'public') {
        where.isPrivate = false;
    } else if (options?.type === 'private') {
        where.isPrivate = true;
    }

    // Only show private repos to members
    if (!isMember) {
        where.isPrivate = false;
    }

    // Filter by language
    if (options?.language) {
        where.language = { equals: options.language, mode: 'insensitive' };
    }

    // Sort field
    let orderBy: Prisma.RepositoryOrderByWithRelationInput = {};
    const sortField = options?.sort || 'updated';
    const direction = options?.direction || 'desc';

    if (sortField === 'created') {
        orderBy = { createdAt: direction };
    } else if (sortField === 'updated') {
        orderBy = { updatedAt: direction };
    } else if (sortField === 'pushed') {
        orderBy = { updatedAt: direction }; // Use updatedAt as proxy for pushed
    } else if (sortField === 'name') {
        orderBy = { name: direction };
    }

    const [repositories, total] = await Promise.all([
        db.repository.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                owner: {
                    select: userSelect,
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
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1,
        },
    };
};
