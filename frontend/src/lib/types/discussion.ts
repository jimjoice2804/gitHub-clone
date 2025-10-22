/**
 * Discussion related types
 */
export type DiscussionState = 'OPEN' | 'LOCKED';

export interface DiscussionTag {
    id: string;
    name: string;
}

export interface Discussion {
    id: string;
    number: number;
    title: string;
    body: string | null;
    state: DiscussionState;
    category: string | null;
    repositoryId: string;
    authorId: string;
    lockedAt: string | null;
    createdAt: string;
    updatedAt: string;
    author: {
        id: string;
        username: string;
        name: string | null;
        avatarUrl: string | null;
    };
    tags: DiscussionTag[];
    _count: {
        comments: number;
    };
}

export interface CreateDiscussionData {
    title: string;
    body?: string;
    category?: string | null;
    tagIds?: string[];
}

export interface UpdateDiscussionData {
    title?: string;
    body?: string;
    category?: string | null;
}

export interface DiscussionComment {
    id: string;
    body: string;
    discussionId: string;
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
