import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as tagService from '../services/tag.service';
import { sendSuccess } from '../utils/response';

export const createTag = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user!.userId;
        const { name, sha, message } = req.body;

        const tag = await tagService.createTag(owner!, repo!, userId, {
            name,
            sha,
            message,
        });

        sendSuccess(res, tag, 'Tag created successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const listTags = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const requesterId = req.user?.userId;
        const { search, page, limit } = req.query;

        const result = await tagService.listTags(owner!, repo!, requesterId, {
            search: search as string | undefined,
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result, 'Tags retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const getTag = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, tag } = req.params;
        const requesterId = req.user?.userId;

        const result = await tagService.getTag(owner!, repo!, tag!, requesterId);

        sendSuccess(res, result, 'Tag retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const deleteTag = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, tag } = req.params;
        const userId = req.user!.userId;

        await tagService.deleteTag(owner!, repo!, tag!, userId);

        sendSuccess(res, null, 'Tag deleted successfully');
    } catch (error) {
        next(error);
    }
};
