import { api } from '@/lib/api/client';
import { User, UserProfile, PaginatedResponse } from '@/lib/types';

export interface UpdateProfileData {
    name?: string | null;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    company?: string | null;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

export const userApi = {
    getCurrentUser: () => api.get<User>('/users/me'),

    getUserProfile: (username: string) => api.get<UserProfile>(`/users/${username}`),

    updateProfile: (data: UpdateProfileData) =>
        api.put<User>('/users/me', data),

    uploadAvatar: (file: File) => {
        const formData = new FormData();
        formData.append('avatar', file);
        return api.put<User>('/users/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    changePassword: (data: ChangePasswordData) =>
        api.post<{ success: boolean }>('/users/me/password', data),

    followUser: (username: string) => api.post<{ success: boolean }>(`/users/${username}/follow`),

    unfollowUser: (username: string) => api.delete<{ success: boolean }>(`/users/${username}/follow`),

    getFollowers: (username: string, params?: { page?: number; limit?: number }) =>
        api.get<PaginatedResponse<User>>(`/users/${username}/followers`, { params }),

    getFollowing: (username: string, params?: { page?: number; limit?: number }) =>
        api.get<PaginatedResponse<User>>(`/users/${username}/following`, { params }),

    isFollowing: (username: string) => api.get<{ following: boolean }>(`/users/${username}/is-following`),
};
