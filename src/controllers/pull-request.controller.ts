import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as pullRequestService from '../services/pull-request.service';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../types/index';

const parsePullNumber = (pullNumber: string): number => {
    const parsed = parseInt(pullNumber, 10);
    if (Number.isNaN(parsed)) {
        throw new ApiError(400, 'Invalid pull request number');
    }
    return parsed;
};

const parseLabelQuery = (raw: unknown): string[] | undefined => {
    if (!raw) {
        return undefined;
    }

    if (typeof raw === 'string') {
        return raw
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);
    }

    if (Array.isArray(raw)) {
        return raw
            .map((value) => String(value))
            .reduce<string[]>((accumulator, current) => {
                current
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .forEach((item) => accumulator.push(item));
                return accumulator;
            }, []);
    }

    return undefined;
};

export const createPullRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user!.userId;
        const { title, body, headBranch, baseBranch, assigneeIds, labelIds } = req.body;

        const pullRequest = await pullRequestService.createPullRequest(owner!, repo!, userId, {
            title,
            body,
            headBranch,
            baseBranch,
            assigneeIds,
            labelIds,
        });

        sendSuccess(res, pullRequest, 'Pull request created successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const listPullRequests = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const requesterId = req.user?.userId;
        const { state, assignee, labels, search, head, base, page, limit } = req.query;

        const labelIds = parseLabelQuery(labels);

        const result = await pullRequestService.listPullRequests(owner!, repo!, requesterId, {
            state: state as 'open' | 'closed' | 'merged' | undefined,
            assigneeId: assignee as string | undefined,
            labelIds,
            search: search as string | undefined,
            head: head as string | undefined,
            base: base as string | undefined,
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result, 'Pull requests retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const getPullRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, pullNumber } = req.params;
        const requesterId = req.user?.userId;
        const parsedNumber = parsePullNumber(pullNumber!);

        const pullRequest = await pullRequestService.getPullRequest(owner!, repo!, parsedNumber, requesterId);

        sendSuccess(res, pullRequest, 'Pull request retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const updatePullRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, pullNumber } = req.params;
        const userId = req.user!.userId;
        const parsedNumber = parsePullNumber(pullNumber!);
        const { title, body } = req.body;

        const pullRequest = await pullRequestService.updatePullRequest(owner!, repo!, parsedNumber, userId, {
            title,
            body,
        });

        sendSuccess(res, pullRequest, 'Pull request updated successfully');
    } catch (error) {
        next(error);
    }
};

export const updatePullRequestState = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, pullNumber } = req.params;
        const userId = req.user!.userId;
        const parsedNumber = parsePullNumber(pullNumber!);
        const { state } = req.body;

        const pullRequest = await pullRequestService.updatePullRequestState(owner!, repo!, parsedNumber, userId, state);

        sendSuccess(res, pullRequest, 'Pull request state updated successfully');
    } catch (error) {
        next(error);
    }
};

export const setPullRequestAssignees = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, pullNumber } = req.params;
        const userId = req.user!.userId;
        const parsedNumber = parsePullNumber(pullNumber!);
        const { assigneeIds } = req.body;

        const pullRequest = await pullRequestService.setPullRequestAssignees(owner!, repo!, parsedNumber, userId, assigneeIds);

        sendSuccess(res, pullRequest, 'Pull request assignees updated successfully');
    } catch (error) {
        next(error);
    }
};

export const setPullRequestLabels = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, pullNumber } = req.params;
        const userId = req.user!.userId;
        const parsedNumber = parsePullNumber(pullNumber!);
        const { labelIds } = req.body;

        const pullRequest = await pullRequestService.setPullRequestLabels(owner!, repo!, parsedNumber, userId, labelIds);

        sendSuccess(res, pullRequest, 'Pull request labels updated successfully');
    } catch (error) {
        next(error);
    }
};

export const addPullRequestComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, pullNumber } = req.params;
        const userId = req.user!.userId;
        const parsedNumber = parsePullNumber(pullNumber!);
        const { body } = req.body;

        const comment = await pullRequestService.addPullRequestComment(owner!, repo!, parsedNumber, userId, body);

        sendSuccess(res, comment, 'Comment added successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const listPullRequestComments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, pullNumber } = req.params;
        const requesterId = req.user?.userId;
        const parsedNumber = parsePullNumber(pullNumber!);
        const { page, limit } = req.query;

        const result = await pullRequestService.listPullRequestComments(owner!, repo!, parsedNumber, requesterId, {
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result, 'Comments retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const updatePullRequestComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, pullNumber, commentId } = req.params;
        const userId = req.user!.userId;
        const parsedNumber = parsePullNumber(pullNumber!);
        const { body } = req.body;

        const comment = await pullRequestService.updatePullRequestComment(
            owner!,
            repo!,
            parsedNumber,
            commentId!,
            userId,
            body
        );

        sendSuccess(res, comment, 'Comment updated successfully');
    } catch (error) {
        next(error);
    }
};

export const deletePullRequestComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, pullNumber, commentId } = req.params;
        const userId = req.user!.userId;
        const parsedNumber = parsePullNumber(pullNumber!);

        const result = await pullRequestService.deletePullRequestComment(owner!, repo!, parsedNumber, commentId!, userId);

        sendSuccess(res, result, 'Comment deleted successfully');
    } catch (error) {
        next(error);
    }
};

export const createPullRequestReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, pullNumber } = req.params;
        const userId = req.user!.userId;
        const parsedNumber = parsePullNumber(pullNumber!);
        const { state, body } = req.body;

        const review = await pullRequestService.createPullRequestReview(owner!, repo!, parsedNumber, userId, {
            state,
            body,
        });

        sendSuccess(res, review, 'Review submitted successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const listPullRequestReviews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, pullNumber } = req.params;
        const requesterId = req.user?.userId;
        const parsedNumber = parsePullNumber(pullNumber!);

        const reviews = await pullRequestService.listPullRequestReviews(owner!, repo!, parsedNumber, requesterId);

        sendSuccess(res, reviews, 'Reviews retrieved successfully');
    } catch (error) {
        next(error);
    }
};
