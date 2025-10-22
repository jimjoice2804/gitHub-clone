import { api } from '@/lib/api/client';
import type {
    Organization,
    OrganizationMember,
    CreateOrganizationData,
    UpdateOrganizationData,
    OrgRole,
} from '@/lib/types';

export interface GetOrganizationsParams {
    search?: string;
    sort?: 'created' | 'updated' | 'name' | 'members';
    direction?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface OrganizationsResponse {
    organizations: Organization[];
    total: number;
    page: number;
    limit: number;
}

export const organizationApi = {
    // Get all organizations (user's orgs or search results)
    getOrganizations(params: GetOrganizationsParams = {}) {
        return api.get<OrganizationsResponse>('/organizations', { params });
    },

    // Get single organization by name/slug
    getOrganization(orgName: string) {
        return api.get<Organization>(`/organizations/${orgName}`);
    },

    // Create organization
    createOrganization(data: CreateOrganizationData) {
        return api.post<Organization>('/organizations', data);
    },

    // Update organization
    updateOrganization(orgName: string, data: UpdateOrganizationData) {
        return api.patch<Organization>(`/organizations/${orgName}`, data);
    },

    // Delete organization
    deleteOrganization(orgName: string) {
        return api.delete<{ success: boolean }>(`/organizations/${orgName}`);
    },

    // Members
    getMembers(orgName: string) {
        return api.get<OrganizationMember[]>(`/organizations/${orgName}/members`);
    },

    addMember(orgName: string, username: string, role: OrgRole = 'MEMBER') {
        return api.post<OrganizationMember>(`/organizations/${orgName}/members`, { username, role });
    },

    updateMemberRole(orgName: string, memberId: string, role: OrgRole) {
        return api.patch<OrganizationMember>(`/organizations/${orgName}/members/${memberId}`, { role });
    },

    removeMember(orgName: string, memberId: string) {
        return api.delete<{ success: boolean }>(`/organizations/${orgName}/members/${memberId}`);
    },

    // Repositories
    getRepositories(orgName: string) {
        return api.get(`/organizations/${orgName}/repositories`);
    },
};
