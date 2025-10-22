import { api, tokenManager } from './client';
import { AuthResponse, LoginCredentials, RegisterData, User } from '@/lib/types';

/**
 * Authentication API endpoints
 */
export const authApi = {
    /**
     * Login with email and password
     */
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', credentials);

        // Store token and user data
        if (response.token) {
            tokenManager.setToken(response.token);
            if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(response.user));
            }
        }

        return response;
    },

    /**
     * Register a new user
     */
    register: async (data: RegisterData): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', data);

        // Store token and user data
        if (response.token) {
            tokenManager.setToken(response.token);
            if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(response.user));
            }
        }

        return response;
    },

    /**
     * Logout user
     */
    logout: (): void => {
        tokenManager.removeToken();
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    },

    /**
     * Get current user profile
     */
    getCurrentUser: async (): Promise<User> => {
        return api.get<User>('/auth/me');
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: (): boolean => {
        return !!tokenManager.getToken();
    },

    /**
     * Get stored user from localStorage
     */
    getStoredUser: (): User | null => {
        if (typeof window === 'undefined') return null;

        const userStr = localStorage.getItem('user');
        if (!userStr) return null;

        try {
            return JSON.parse(userStr) as User;
        } catch {
            return null;
        }
    },
};
