import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as commitService from '../services/commit.service';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../types/index';

export const createCommit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user!.userId;
        const { sha, message, branch, parentSha } = req.body;

        const commit = await commitService.createCommit(owner!, repo!, userId, {
            sha,
            message,
            branch,
            parentSha,
        });

        sendSuccess(res, commit, 'Commit created successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const listCommits = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const requesterId = req.user?.userId;
        const { author, search, since, until, page, limit } = req.query;

        const sinceDate = since ? new Date(since as string) : undefined;
        const untilDate = until ? new Date(until as string) : undefined;

        if (sinceDate && Number.isNaN(sinceDate.getTime())) {
            throw new ApiError(400, 'Invalid since timestamp');
        }

        if (untilDate && Number.isNaN(untilDate.getTime())) {
            throw new ApiError(400, 'Invalid until timestamp');
        }

        const result = await commitService.listCommits(owner!, repo!, requesterId, {
            authorId: author as string | undefined,
            search: search as string | undefined,
            since: sinceDate,
            until: untilDate,
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result, 'Commits retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const getCommit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, sha } = req.params;
        const requesterId = req.user?.userId;

        const commit = await commitService.getCommit(owner!, repo!, sha!, requesterId);

        sendSuccess(res, commit, 'Commit retrieved successfully');
    } catch (error) {
        next(error);
    }
};
