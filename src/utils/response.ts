/**
 * Standardized API response helpers
 */

import { Response } from 'express';
import { ApiResponse, PaginatedResponse, PaginationMeta } from '../types';

/**
 * Send success response
 */
export const sendSuccess = <T>(
    res: Response,
    data?: T,
    message?: string,
    statusCode = 200
): Response => {
    const response: ApiResponse<T> = {
        success: true,
        message,
        data,
    };
    return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
    res: Response,
    message: string,
    statusCode = 400,
    errors?: Record<string, string[]>
): Response => {
    const response: ApiResponse = {
        success: false,
        error: message,
        errors,
    };
    return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 */
export const sendPaginatedResponse = <T>(
    res: Response,
    data: T[],
    meta: PaginationMeta,
    statusCode = 200
): Response => {
    const response: PaginatedResponse<T> = {
        success: true,
        data,
        meta,
    };
    return res.status(statusCode).json(response);
};

/**
 * Calculate pagination metadata
 */
export const calculatePaginationMeta = (
    page: number,
    limit: number,
    total: number
): PaginationMeta => {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
};
