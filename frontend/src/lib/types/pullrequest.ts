import { Label } from './issue';

/**
 * Pull Request related types
 */
export type PullRequestState = 'OPEN' | 'CLOSED' | 'MERGED';
export type ReviewState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED';

export interface PullRequest {
    id: string;
    number: number;
    title: string;
    body: string | null;
    state: PullRequestState;
    headBranch: string;
    baseBranch: string;
    repositoryId: string;
    authorId: string;
    mergedAt: string | null;
    closedAt: string | null;
    createdAt: string;
    updatedAt: string;
    author: {
        id: string;
        username: string;
        name: string | null;
        avatarUrl: string | null;
    };
    assignees: Array<{
        id: string;
        username: string;
        name: string | null;
        avatarUrl: string | null;
    }>;
    labels: Label[];
    _count: {
        comments: number;
        reviews: number;
    };
}

export interface CreatePullRequestData {
    title: string;
    body?: string;
    headBranch: string;
    baseBranch: string;
    assigneeIds?: string[];
    labelIds?: string[];
}

export interface UpdatePullRequestData {
    title?: string;
    body?: string;
}

export interface PullRequestReview {
    id: string;
    state: ReviewState;
    body: string | null;
    pullRequestId: string;
    authorId: string;
    createdAt: string;
    updatedAt: string;
    author: {
        id: string;
        username: string;
        name: string | null;
        avatarUrl: string | null;
    };
}

export interface PullRequestComment {
    id: string;
    body: string;
    pullRequestId: string;
    authorId: string;
    createdAt: string;
    updatedAt: string;
    author: {
        id: string;
        username: string;
        name: string | null;
        avatarUrl: string | null;
    };
}
