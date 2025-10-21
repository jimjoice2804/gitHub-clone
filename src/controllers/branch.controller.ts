import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as branchService from '../services/branch.service';
import { sendSuccess } from '../utils/response';

export const createBranch = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user!.userId;
        const { name, fromSha, isProtected } = req.body;

        const branch = await branchService.createBranch(owner!, repo!, userId, {
            name,
            fromSha,
            isProtected,
        });

        sendSuccess(res, branch, 'Branch created successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const listBranches = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const requesterId = req.user?.userId;
        const { search, page, limit } = req.query;

        const result = await branchService.listBranches(owner!, repo!, requesterId, {
            search: search as string | undefined,
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result, 'Branches retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const getBranch = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, branch } = req.params;
        const requesterId = req.user?.userId;

        const result = await branchService.getBranch(owner!, repo!, branch!, requesterId);

        sendSuccess(res, result, 'Branch retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const deleteBranch = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, branch } = req.params;
        const userId = req.user!.userId;

        await branchService.deleteBranch(owner!, repo!, branch!, userId);

        sendSuccess(res, null, 'Branch deleted successfully');
    } catch (error) {
        next(error);
    }
};
