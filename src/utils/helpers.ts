/**
 * Common utility functions
 */

/**
 * Sleep/delay function
 */
export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Generate random string
 */
export const generateRandomString = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Sanitize username or repository name
 */
export const sanitizeName = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
};

/**
 * Check if string is valid email
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Format date to ISO string
 */
export const formatDate = (date: Date): string => {
    return date.toISOString();
};

/**
 * Parse pagination query parameters
 */
export const parsePaginationParams = (
    page?: string,
    limit?: string
): { page: number; limit: number; skip: number } => {
    const parsedPage = Math.max(1, parseInt(page || '1', 10));
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit || '10', 10)));
    const skip = (parsedPage - 1) * parsedLimit;

    return {
        page: parsedPage,
        limit: parsedLimit,
        skip,
    };
};
