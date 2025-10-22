import { create } from 'zustand';
import { User } from '@/lib/types';
import { authApi } from '@/lib/api/auth';
import { userApi } from '@/lib/api/user';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string, name?: string) => Promise<void>;
    logout: () => void;
    initialize: () => void;
    refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    setUser: (user) => set({ user, isAuthenticated: !!user }),

    login: async (email, password) => {
        try {
            const response = await authApi.login({ email, password });
            set({ user: response.user, isAuthenticated: true });
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    register: async (username, email, password, name) => {
        try {
            const response = await authApi.register({ username, email, password, name });
            set({ user: response.user, isAuthenticated: true });
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },

    logout: () => {
        authApi.logout();
        set({ user: null, isAuthenticated: false });
    },

    initialize: () => {
        const storedUser = authApi.getStoredUser();
        set({
            user: storedUser,
            isAuthenticated: !!storedUser,
            isLoading: false
        });
    },

    refreshUser: async () => {
        try {
            const u = await userApi.getCurrentUser();
            set({ user: u, isAuthenticated: true });
        } catch (e) {
            console.error('Failed to refresh user', e);
        }
    },
}));
