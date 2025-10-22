/**
 * Organization related types
 */
export type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Organization {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    avatarUrl: string | null;
    website: string | null;
    location: string | null;
    email: string | null;
    createdAt: string;
    updatedAt: string;
    owner: {
        id: string;
        username: string;
        name: string | null;
        avatarUrl: string | null;
    };
    stats: {
        repositories: number;
        members: number;
    };
}

export interface CreateOrganizationData {
    name: string;
    displayName: string;
    description?: string;
    avatarUrl?: string;
    website?: string;
    location?: string;
    email?: string;
}

export interface UpdateOrganizationData {
    displayName?: string;
    description?: string;
    avatarUrl?: string;
    website?: string;
    location?: string;
    email?: string;
}

export interface OrganizationMember {
    id: string;
    role: OrgRole;
    createdAt: string;
    user: {
        id: string;
        username: string;
        name: string | null;
        avatarUrl: string | null;
        bio: string | null;
    };
    organization: {
        id: string;
        name: string;
        displayName: string;
    };
}
