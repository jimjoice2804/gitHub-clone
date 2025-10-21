import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as collaboratorService from '../services/collaborator.service';
import { sendSuccess } from '../utils/response';
import { PermissionLevel } from '@prisma/client';

export const addCollaborator = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user!.userId;
        const { username, permission } = req.body;

        const collaborator = await collaboratorService.addCollaborator(owner!, repo!, userId, {
            username,
            permission: permission as PermissionLevel,
        });

        sendSuccess(res, collaborator, 'Collaborator added successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const removeCollaborator = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, username } = req.params;
        const userId = req.user!.userId;

        await collaboratorService.removeCollaborator(owner!, repo!, userId, username!);

        sendSuccess(res, null, 'Collaborator removed successfully');
    } catch (error) {
        next(error);
    }
};

export const updateCollaboratorPermission = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, username } = req.params;
        const userId = req.user!.userId;
        const { permission } = req.body;

        const collaborator = await collaboratorService.updateCollaboratorPermission(
            owner!,
            repo!,
            userId,
            username!,
            permission as PermissionLevel
        );

        sendSuccess(res, collaborator, 'Collaborator permission updated successfully');
    } catch (error) {
        next(error);
    }
};

export const listCollaborators = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const requesterId = req.user?.userId;
        const { page, limit } = req.query;

        const result = await collaboratorService.listCollaborators(owner!, repo!, requesterId, {
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result, 'Collaborators retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const getCollaborator = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, username } = req.params;
        const requesterId = req.user?.userId;

        const collaborator = await collaboratorService.getCollaborator(owner!, repo!, username!, requesterId);

        sendSuccess(res, collaborator, 'Collaborator retrieved successfully');
    } catch (error) {
        next(error);
    }
};
