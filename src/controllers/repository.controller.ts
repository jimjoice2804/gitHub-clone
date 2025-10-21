import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as repositoryService from '../services/repository.service';
import { sendSuccess } from '../utils/response';

/**
 * Create a new repository
 */
export const createRepository = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { name, description, isPrivate, language } = req.body;

        const repository = await repositoryService.createRepository(userId, {
            name,
            description,
            isPrivate,
            language,
        });

        sendSuccess(res, repository, 'Repository created successfully', 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Get a repository by owner and name
 */
export const getRepository = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user?.userId;

        const repository = await repositoryService.getRepository(owner!, repo!, userId);

        sendSuccess(res, repository, 'Repository retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Update a repository
 */
export const updateRepository = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user!.userId;
        const { name, description, isPrivate, language } = req.body;

        const repository = await repositoryService.updateRepository(owner!, repo!, userId, {
            name,
            description,
            isPrivate,
            language,
        });

        sendSuccess(res, repository, 'Repository updated successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a repository
 */
export const deleteRepository = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user!.userId;

        await repositoryService.deleteRepository(owner!, repo!, userId);

        sendSuccess(res, null, 'Repository deleted successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Star a repository
 */
export const starRepository = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user!.userId;

        await repositoryService.starRepository(owner!, repo!, userId);

        sendSuccess(res, null, 'Repository starred successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Unstar a repository
 */
export const unstarRepository = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user!.userId;

        await repositoryService.unstarRepository(owner!, repo!, userId);

        sendSuccess(res, null, 'Repository unstarred successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Watch a repository
 */
export const watchRepository = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user!.userId;

        await repositoryService.watchRepository(owner!, repo!, userId);

        sendSuccess(res, null, 'Repository watched successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Unwatch a repository
 */
export const unwatchRepository = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user!.userId;

        await repositoryService.unwatchRepository(owner!, repo!, userId);

        sendSuccess(res, null, 'Repository unwatched successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get user repositories
 */
export const getUserRepositories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username } = req.params;
        const userId = req.user?.userId;
        const { sort, direction, page, limit } = req.query;

        const result = await repositoryService.getUserRepositories(username!, userId, {
            sort: sort as 'created' | 'updated' | 'pushed' | 'name' | undefined,
            direction: direction as 'asc' | 'desc' | undefined,
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
        });

        sendSuccess(res, result, 'Repositories retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Search repositories
 */
export const searchRepositories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { query, language, page, limit } = req.query;

        const result = await repositoryService.searchRepositories(query as string, {
            language: language as string | undefined,
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
        });

        sendSuccess(res, result, 'Repositories retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Fork a repository
 */
export const forkRepository = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user!.userId;
        const { name, isPrivate } = req.body;

        const fork = await repositoryService.forkRepository(owner!, repo!, userId, {
            name,
            isPrivate,
        });

        sendSuccess(res, fork, 'Repository forked successfully', 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Get repository forks
 */
export const getRepositoryForks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const requesterId = req.user?.userId;
        const { page, limit } = req.query;

        const result = await repositoryService.getRepositoryForks(owner!, repo!, requesterId, {
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result, 'Forks retrieved successfully');
    } catch (error) {
        next(error);
    }
};
