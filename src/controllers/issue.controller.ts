import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as issueService from '../services/issue.service';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../types/index';

const parseIssueNumber = (issueNumber: string): number => {
    const parsed = parseInt(issueNumber, 10);
    if (Number.isNaN(parsed)) {
        throw new ApiError(400, 'Invalid issue number');
    }
    return parsed;
};

export const createIssue = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user!.userId;
        const { title, body, assigneeIds, labelIds } = req.body;

        const issue = await issueService.createIssue(owner!, repo!, userId, {
            title,
            body,
            assigneeIds,
            labelIds,
        });

        sendSuccess(res, issue, 'Issue created successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const listIssues = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo } = req.params;
        const requesterId = req.user?.userId;
        const { state, assignee, labels, search, page, limit } = req.query;

        let labelIds: string[] | undefined;
        if (typeof labels === 'string') {
            labelIds = labels.split(',').map((value) => value.trim()).filter(Boolean);
        } else if (Array.isArray(labels)) {
            labelIds = labels
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

        const result = await issueService.listIssues(owner!, repo!, requesterId, {
            state: state as 'open' | 'closed' | undefined,
            assigneeId: assignee as string | undefined,
            labelIds,
            search: search as string | undefined,
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result, 'Issues retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const getIssue = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, issueNumber } = req.params;
        const requesterId = req.user?.userId;
        const parsedIssueNumber = parseIssueNumber(issueNumber!);

        const issue = await issueService.getIssue(owner!, repo!, parsedIssueNumber, requesterId);

        sendSuccess(res, issue, 'Issue retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const updateIssue = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, issueNumber } = req.params;
        const userId = req.user!.userId;
        const parsedIssueNumber = parseIssueNumber(issueNumber!);
        const { title, body } = req.body;

        const issue = await issueService.updateIssue(owner!, repo!, parsedIssueNumber, userId, {
            title,
            body,
        });

        sendSuccess(res, issue, 'Issue updated successfully');
    } catch (error) {
        next(error);
    }
};

export const updateIssueState = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, issueNumber } = req.params;
        const userId = req.user!.userId;
        const parsedIssueNumber = parseIssueNumber(issueNumber!);
        const { state } = req.body;

        const issue = await issueService.updateIssueState(owner!, repo!, parsedIssueNumber, userId, state);

        sendSuccess(res, issue, 'Issue state updated successfully');
    } catch (error) {
        next(error);
    }
};

export const setIssueAssignees = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, issueNumber } = req.params;
        const userId = req.user!.userId;
        const parsedIssueNumber = parseIssueNumber(issueNumber!);
        const { assigneeIds } = req.body;

        const issue = await issueService.setIssueAssignees(owner!, repo!, parsedIssueNumber, userId, assigneeIds);

        sendSuccess(res, issue, 'Issue assignees updated successfully');
    } catch (error) {
        next(error);
    }
};

export const setIssueLabels = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, issueNumber } = req.params;
        const userId = req.user!.userId;
        const parsedIssueNumber = parseIssueNumber(issueNumber!);
        const { labelIds } = req.body;

        const issue = await issueService.setIssueLabels(owner!, repo!, parsedIssueNumber, userId, labelIds);

        sendSuccess(res, issue, 'Issue labels updated successfully');
    } catch (error) {
        next(error);
    }
};

export const addIssueComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, issueNumber } = req.params;
        const userId = req.user!.userId;
        const parsedIssueNumber = parseIssueNumber(issueNumber!);
        const { body } = req.body;

        const comment = await issueService.addIssueComment(owner!, repo!, parsedIssueNumber, userId, body);

        sendSuccess(res, comment, 'Comment added successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const listIssueComments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, issueNumber } = req.params;
        const requesterId = req.user?.userId;
        const parsedIssueNumber = parseIssueNumber(issueNumber!);
        const { page, limit } = req.query;

        const result = await issueService.listIssueComments(owner!, repo!, parsedIssueNumber, requesterId, {
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result, 'Comments retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const updateIssueComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, issueNumber, commentId } = req.params;
        const userId = req.user!.userId;
        const parsedIssueNumber = parseIssueNumber(issueNumber!);
        const { body } = req.body;

        const comment = await issueService.updateIssueComment(
            owner!,
            repo!,
            parsedIssueNumber,
            commentId!,
            userId,
            body
        );

        sendSuccess(res, comment, 'Comment updated successfully');
    } catch (error) {
        next(error);
    }
};

export const deleteIssueComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { owner, repo, issueNumber, commentId } = req.params;
        const userId = req.user!.userId;
        const parsedIssueNumber = parseIssueNumber(issueNumber!);

        const result = await issueService.deleteIssueComment(owner!, repo!, parsedIssueNumber, commentId!, userId);

        sendSuccess(res, result, 'Comment deleted successfully');
    } catch (error) {
        next(error);
    }
};
