import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as activityService from '../services/activity.service';
import { sendSuccess } from '../utils/response';
import { ActivityTypeFilter, activityTypes } from '../utils/validations/activity.validation';

const parseTypeFilters = (value: unknown): ActivityTypeFilter[] | undefined => {
    if (!value) {
        return undefined;
    }

    const toArray = Array.isArray(value) ? value : String(value).split(',');

    const normalized = toArray
        .map((item) => item.trim().toLowerCase())
        .filter((item): item is ActivityTypeFilter => activityTypes.includes(item as ActivityTypeFilter));

    return normalized.length > 0 ? normalized : undefined;
};

export const getUserActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username } = req.params;
        const requesterId = req.user?.userId;
        const { type, page, limit } = req.query;

        const types = parseTypeFilters(type);

        const result = await activityService.listUserActivity(username!, requesterId, {
            types,
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result, 'Activity retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const getRepositoryActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const requesterId = req.user?.userId;
        const { type, page, limit } = req.query;

        const types = parseTypeFilters(type);

        const result = await activityService.listRepositoryActivity(owner!, repo!, requesterId, {
            types,
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result, 'Repository activity retrieved successfully');
    } catch (error) {
        next(error);
    }
};
