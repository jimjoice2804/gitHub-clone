import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as activityService from '../services/activity.service';
import { sendSuccess } from '../utils/response';

export const listUserActivities = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username } = req.params;
        const requesterId = req.user?.userId;
        const { type, repositoryId, since, until, page, limit } = req.query;

        const result = await activityService.listUserActivities(username!, requesterId, {
            type: type as string | undefined,
            repositoryId: repositoryId as string | undefined,
            since: since as string | undefined,
            until: until as string | undefined,
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result, 'Activities retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const listRepositoryActivities = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const requesterId = req.user?.userId;
        const { type, since, until, page, limit } = req.query;

        const result = await activityService.listRepositoryActivities(owner!, repo!, requesterId, {
            type: type as string | undefined,
            since: since as string | undefined,
            until: until as string | undefined,
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result, 'Repository activities retrieved successfully');
    } catch (error) {
        next(error);
    }
};

