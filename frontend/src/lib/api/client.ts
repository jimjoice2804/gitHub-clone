import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Axios instance with default configuration
 */
const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor to add auth token
 */
apiClient.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor for error handling
 */
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: AxiosError<ApiError>) => {
        // Handle specific error cases
        if (error.response) {
            const { status, data } = error.response;

            // Handle 401 - Unauthorized
            if (status === 401) {
                // Clear token and redirect to login
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            }

            // Handle 403 - Forbidden
            if (status === 403) {
                console.error('Access forbidden:', data.message);
            }

            // Handle 404 - Not Found
            if (status === 404) {
                console.error('Resource not found:', data.message);
            }

            // Handle 500 - Server Error
            if (status >= 500) {
                console.error('Server error:', data.message);
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Generic request wrapper with type safety
 */
async function request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
        const response = await apiClient.request<T>(config);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const apiError: ApiError = {
                message: error.response.data?.message || 'An error occurred',
                statusCode: error.response.status,
                errors: error.response.data?.errors,
            };
            throw apiError;
        }
        throw error;
    }
}

/**
 * HTTP Methods
 */
export const api = {
    /**
     * GET request
     */
    get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
        return request<T>({ ...config, method: 'GET', url });
    },

    /**
     * POST request
     */
    post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
        return request<T>({ ...config, method: 'POST', url, data });
    },

    /**
     * PUT request
     */
    put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
        return request<T>({ ...config, method: 'PUT', url, data });
    },

    /**
     * PATCH request
     */
    patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
        return request<T>({ ...config, method: 'PATCH', url, data });
    },

    /**
     * DELETE request
     */
    delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
        return request<T>({ ...config, method: 'DELETE', url });
    },
};

/**
 * Token management
 */
export const tokenManager = {
    getToken: (): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('auth_token');
    },

    setToken: (token: string): void => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('auth_token', token);
    },

    removeToken: (): void => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    },
};

export default apiClient;
