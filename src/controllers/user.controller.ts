import { Response } from 'express';
import { AuthRequest } from '@middleware/auth.middleware';
import * as userService from '@services/user.service';
import { sendSuccess, sendError } from '@utils/response';
import { ApiError } from '../types/index';

/**
 * @route   GET /api/users/:username
 * @desc    Get user profile by username
 * @access  Public (but shows more info if authenticated)
 */
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { username } = req.params;
        const requesterId = req.user?.userId;

        if (!username) {
            sendError(res, 'Username is required', 400);
            return;
        }

        const user = await userService.getUserByUsername(username, requesterId);
        sendSuccess(res, user);
    } catch (error) {
        if (error instanceof ApiError) {
            sendError(res, error.message, error.statusCode);
        } else {
            sendError(res, 'Failed to get user profile', 500);
        }
    }
};

/**
 * @route   PUT /api/users/profile
 * @desc    Update own profile
 * @access  Private
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const profileData = req.body;

        const user = await userService.updateUserProfile(userId, profileData);
        sendSuccess(res, user, 'Profile updated successfully');
    } catch (error) {
        if (error instanceof ApiError) {
            sendError(res, error.message, error.statusCode);
        } else {
            sendError(res, 'Failed to update profile', 500);
        }
    }
};

/**
 * @route   PUT /api/users/password
 * @desc    Change password
 * @access  Private
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { currentPassword, newPassword } = req.body;

        const result = await userService.changeUserPassword(userId, currentPassword, newPassword);
        sendSuccess(res, result);
    } catch (error) {
        if (error instanceof ApiError) {
            sendError(res, error.message, error.statusCode);
        } else {
            sendError(res, 'Failed to change password', 500);
        }
    }
};

/**
 * @route   POST /api/users/:username/follow
 * @desc    Follow a user
 * @access  Private
 */
export const followUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const followerId = req.user!.userId;
        const { username } = req.params;

        if (!username) {
            sendError(res, 'Username is required', 400);
            return;
        }

        const result = await userService.followUser(followerId, username);
        sendSuccess(res, result);
    } catch (error) {
        if (error instanceof ApiError) {
            sendError(res, error.message, error.statusCode);
        } else {
            sendError(res, 'Failed to follow user', 500);
        }
    }
};

/**
 * @route   DELETE /api/users/:username/follow
 * @desc    Unfollow a user
 * @access  Private
 */
export const unfollowUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const followerId = req.user!.userId;
        const { username } = req.params;

        if (!username) {
            sendError(res, 'Username is required', 400);
            return;
        }

        const result = await userService.unfollowUser(followerId, username);
        sendSuccess(res, result);
    } catch (error) {
        if (error instanceof ApiError) {
            sendError(res, error.message, error.statusCode);
        } else {
            sendError(res, 'Failed to unfollow user', 500);
        }
    }
};

/**
 * @route   GET /api/users/:username/followers
 * @desc    Get user's followers
 * @access  Public
 */
export const getFollowers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { username } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        if (!username) {
            sendError(res, 'Username is required', 400);
            return;
        }

        const result = await userService.getUserFollowers(username, page, limit);
        sendSuccess(res, result);
    } catch (error) {
        if (error instanceof ApiError) {
            sendError(res, error.message, error.statusCode);
        } else {
            sendError(res, 'Failed to get followers', 500);
        }
    }
};

/**
 * @route   GET /api/users/:username/following
 * @desc    Get users that this user is following
 * @access  Public
 */
export const getFollowing = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { username } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        if (!username) {
            sendError(res, 'Username is required', 400);
            return;
        }

        const result = await userService.getUserFollowing(username, page, limit);
        sendSuccess(res, result);
    } catch (error) {
        if (error instanceof ApiError) {
            sendError(res, error.message, error.statusCode);
        } else {
            sendError(res, 'Failed to get following', 500);
        }
    }
};

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Public
 */
export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { q } = req.query;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await userService.searchUsers(q as string, page, limit);
        sendSuccess(res, result);
    } catch (error) {
        if (error instanceof ApiError) {
            sendError(res, error.message, error.statusCode);
        } else {
            sendError(res, 'Failed to search users', 500);
        }
    }
};
