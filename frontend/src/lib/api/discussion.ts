import { api } from '@/lib/api/client';
import type {
    Discussion,
    DiscussionComment,
    CreateDiscussionData,
    UpdateDiscussionData,
    DiscussionState,
} from '@/lib/types';

export interface GetDiscussionsParams {
    state?: DiscussionState | 'ALL';
    search?: string;
    category?: string;
    sort?: 'created' | 'updated' | 'comments';
    direction?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface DiscussionsResponse {
    discussions: Discussion[];
    total: number;
    page: number;
    limit: number;
}

export const discussionApi = {
    // Repository discussions
    getRepositoryDiscussions(owner: string, repo: string, params: GetDiscussionsParams = {}) {
        return api.get<DiscussionsResponse>(`/repositories/${owner}/${repo}/discussions`, { params });
    },

    getDiscussion(owner: string, repo: string, number: number) {
        return api.get<Discussion>(`/repositories/${owner}/${repo}/discussions/${number}`);
    },

    createDiscussion(owner: string, repo: string, data: CreateDiscussionData) {
        return api.post<Discussion>(`/repositories/${owner}/${repo}/discussions`, data);
    },

    updateDiscussion(owner: string, repo: string, number: number, data: UpdateDiscussionData) {
        return api.patch<Discussion>(`/repositories/${owner}/${repo}/discussions/${number}`, data);
    },

    lockDiscussion(owner: string, repo: string, number: number) {
        return api.post<Discussion>(`/repositories/${owner}/${repo}/discussions/${number}/lock`);
    },

    unlockDiscussion(owner: string, repo: string, number: number) {
        return api.post<Discussion>(`/repositories/${owner}/${repo}/discussions/${number}/unlock`);
    },

    // Comments
    getComments(owner: string, repo: string, number: number) {
        return api.get<DiscussionComment[]>(`/repositories/${owner}/${repo}/discussions/${number}/comments`);
    },

    addComment(owner: string, repo: string, number: number, body: string) {
        return api.post<DiscussionComment>(`/repositories/${owner}/${repo}/discussions/${number}/comments`, { body });
    },

    updateComment(owner: string, repo: string, number: number, commentId: string, body: string) {
        return api.patch<DiscussionComment>(
            `/repositories/${owner}/${repo}/discussions/${number}/comments/${commentId}`,
            { body }
        );
    },

    deleteComment(owner: string, repo: string, number: number, commentId: string) {
        return api.delete<{ success: boolean }>(
            `/repositories/${owner}/${repo}/discussions/${number}/comments/${commentId}`
        );
    },
};