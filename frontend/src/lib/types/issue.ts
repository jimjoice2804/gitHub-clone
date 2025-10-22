/**
 * Issue related types
 */
export type IssueState = 'OPEN' | 'CLOSED';

export interface Label {
    id: string;
    name: string;
    color: string;
    description: string | null;
    createdAt: string;
    usage: {
        issues: number;
        pullRequests: number;
        total: number;
    };
}

export interface Issue {
    id: string;
    number: number;
    title: string;
    body: string | null;
    state: IssueState;
    repositoryId: string;
    authorId: string;
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
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
    };
}

export interface CreateIssueData {
    title: string;
    body?: string;
    assigneeIds?: string[];
    labelIds?: string[];
}

export interface UpdateIssueData {
    title?: string;
    body?: string;
}

export interface IssueComment {
    id: string;
    body: string;
    issueId: string;
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
