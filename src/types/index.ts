/**
 * Custom API Error class for handling application errors
 */
export class ApiError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(statusCode: number, message: string, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    errors?: Record<string, string[]>;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    meta: PaginationMeta;
}

/**
 * JWT Token payload
 */
export interface TokenPayload {
    userId: string;
    email: string;
    username: string;
}

/**
 * Express Request with authenticated user
 */
export interface AuthRequest extends Request {
    user?: TokenPayload;
}
