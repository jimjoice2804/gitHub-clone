import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as discussionService from '../services/discussion.service';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../types/index';

const parseDiscussionNumber = (discussionNumber: string): number => {
    const parsed = parseInt(discussionNumber, 10);
    if (Number.isNaN(parsed)) {
        throw new ApiError(400, 'Invalid discussion number');
    }
    return parsed;
};

export const createDiscussion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user!.userId;
        const { title, body, category } = req.body;

        const discussion = await discussionService.createDiscussion(owner!, repo!, userId, {
            title,
            body,
            category,
        });

        sendSuccess(res, discussion, 'Discussion created successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const listDiscussions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const requesterId = req.user?.userId;
        const { category, author, search, page, limit } = req.query;

        const result = await discussionService.listDiscussions(owner!, repo!, requesterId, {
            category: category as 'general' | 'qanda' | 'show_and_tell' | 'ideas' | undefined,
            authorId: author as string | undefined,
            search: search as string | undefined,
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result, 'Discussions retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const getDiscussion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, discussionNumber } = req.params;
        const requesterId = req.user?.userId;
        const parsedDiscussionNumber = parseDiscussionNumber(discussionNumber!);

        const discussion = await discussionService.getDiscussion(owner!, repo!, parsedDiscussionNumber, requesterId);

        sendSuccess(res, discussion, 'Discussion retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const updateDiscussion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, discussionNumber } = req.params;
        const userId = req.user!.userId;
        const parsedDiscussionNumber = parseDiscussionNumber(discussionNumber!);
        const { title, body, category } = req.body;

        const discussion = await discussionService.updateDiscussion(owner!, repo!, parsedDiscussionNumber, userId, {
            title,
            body,
            category,
        });

        sendSuccess(res, discussion, 'Discussion updated successfully');
    } catch (error) {
        next(error);
    }
};

export const deleteDiscussion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, discussionNumber } = req.params;
        const userId = req.user!.userId;
        const parsedDiscussionNumber = parseDiscussionNumber(discussionNumber!);

        const result = await discussionService.deleteDiscussion(owner!, repo!, parsedDiscussionNumber, userId);

        sendSuccess(res, result, 'Discussion deleted successfully');
    } catch (error) {
        next(error);
    }
};

export const addDiscussionComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, discussionNumber } = req.params;
        const userId = req.user!.userId;
        const parsedDiscussionNumber = parseDiscussionNumber(discussionNumber!);
        const { body } = req.body;

        const comment = await discussionService.addDiscussionComment(owner!, repo!, parsedDiscussionNumber, userId, body);

        sendSuccess(res, comment, 'Comment added successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const listDiscussionComments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, discussionNumber } = req.params;
        const requesterId = req.user?.userId;
        const parsedDiscussionNumber = parseDiscussionNumber(discussionNumber!);
        const { page, limit } = req.query;

        const result = await discussionService.listDiscussionComments(owner!, repo!, parsedDiscussionNumber, requesterId, {
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result, 'Comments retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const updateDiscussionComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, discussionNumber, commentId } = req.params;
        const userId = req.user!.userId;
        const parsedDiscussionNumber = parseDiscussionNumber(discussionNumber!);
        const { body } = req.body;

        const comment = await discussionService.updateDiscussionComment(
            owner!,
            repo!,
            parsedDiscussionNumber,
            commentId!,
            userId,
            body
        );

        sendSuccess(res, comment, 'Comment updated successfully');
    } catch (error) {
        next(error);
    }
};

export const deleteDiscussionComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, discussionNumber, commentId } = req.params;
        const userId = req.user!.userId;
        const parsedDiscussionNumber = parseDiscussionNumber(discussionNumber!);

        const result = await discussionService.deleteDiscussionComment(
            owner!,
            repo!,
            parsedDiscussionNumber,
            commentId!,
            userId
        );

        sendSuccess(res, result, 'Comment deleted successfully');
    } catch (error) {
        next(error);
    }
};
