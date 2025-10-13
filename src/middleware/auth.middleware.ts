import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@utils/jwt';
import { sendError } from '@utils/response';

// Extend Express Request type
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        username: string;
    };
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            sendError(res, 'No token provided', 401);
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        try {
            // Verify token
            const decoded = verifyAccessToken(token);

            // Attach user to request
            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                username: decoded.username,
            };

            next();
        } catch (error) {
            if (error instanceof Error) {
                sendError(res, error.message, 401);
            } else {
                sendError(res, 'Invalid token', 401);
            }
            return;
        }
    } catch (error) {
        sendError(res, 'Authentication failed', 401);
        return;
    }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if no token
 */
export const optionalAuthenticate = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }

        const token = authHeader.substring(7);

        try {
            const decoded = verifyAccessToken(token);
            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                username: decoded.username,
            };
        } catch {
            // Token invalid, but we don't care for optional auth
        }

        next();
    } catch {
        next();
    }
};
