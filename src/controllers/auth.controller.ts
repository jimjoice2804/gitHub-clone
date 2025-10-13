import { Request, Response } from 'express';
import * as authService from '@services/auth.service';
import { sendSuccess, sendError } from '@utils/response';
import { verifyRefreshToken, generateAccessToken } from '@utils/jwt';
import type { AuthRequest } from '@middleware/auth.middleware';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await authService.registerUser(req.body);

        sendSuccess(
            res,
            {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            },
            'User registered successfully',
            201
        );
    } catch (error) {
        if (error instanceof Error) {
            sendError(res, error.message, 400);
        } else {
            sendError(res, 'Registration failed', 500);
        }
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await authService.loginUser(req.body);

        sendSuccess(res, {
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        });
    } catch (error) {
        if (error instanceof Error) {
            sendError(res, error.message, 401);
        } else {
            sendError(res, 'Login failed', 500);
        }
    }
};

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            sendError(res, 'Not authenticated', 401);
            return;
        }

        const user = await authService.getUserById(req.user.userId);
        sendSuccess(res, user);
    } catch (error) {
        if (error instanceof Error) {
            sendError(res, error.message, 404);
        } else {
            sendError(res, 'Failed to fetch user', 500);
        }
    }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            sendError(res, 'Refresh token required', 400);
            return;
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Generate new access token
        const newAccessToken = generateAccessToken({
            userId: decoded.userId,
            email: decoded.email,
            username: decoded.username,
        });

        sendSuccess(res, {
            accessToken: newAccessToken,
        });
    } catch (error) {
        if (error instanceof Error) {
            sendError(res, error.message, 401);
        } else {
            sendError(res, 'Token refresh failed', 401);
        }
    }
};

/**
 * Logout user (client-side token deletion)
 * POST /api/auth/logout
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
    // In a stateless JWT setup, logout is handled client-side by deleting the token
    // If you want server-side token blacklisting, implement a Redis-based solution
    sendSuccess(res, null, 'Logged out successfully');
};
