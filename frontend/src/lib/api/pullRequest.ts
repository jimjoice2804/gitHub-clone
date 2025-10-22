import { api } from './client';
import type {
    PullRequest,
    CreatePullRequestData,
    UpdatePullRequestData,
    PullRequestComment,
    PullRequestState,
} from '@/lib/types/pullrequest';

export interface GetPullRequestsParams {
    state?: PullRequestState | 'ALL';
    search?: string;
    sort?: 'created' | 'updated' | 'comments';
    direction?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface PullRequestsResponse {
    pullRequests: PullRequest[];
    total: number;
    page: number;
    limit: number;
}

export const pullRequestApi = {
    async getRepositoryPullRequests(
        owner: string,
        repo: string,
        params: GetPullRequestsParams = {}
    ) {
        return api.get<PullRequestsResponse>(`/repositories/${owner}/${repo}/pulls`, { params });
    },

    async getPullRequest(owner: string, repo: string, number: number) {
        return api.get<PullRequest>(`/repositories/${owner}/${repo}/pulls/${number}`);
    },

    async createPullRequest(
        owner: string,
        repo: string,
        body: CreatePullRequestData
    ) {
        return api.post<PullRequest>(`/repositories/${owner}/${repo}/pulls`, body);
    },

    async updatePullRequest(
        owner: string,
        repo: string,
        number: number,
        body: UpdatePullRequestData
    ) {
        return api.patch<PullRequest>(`/repositories/${owner}/${repo}/pulls/${number}`, body);
    },

    async closePullRequest(owner: string, repo: string, number: number) {
        return api.post<PullRequest>(`/repositories/${owner}/${repo}/pulls/${number}/close`);
    },

    async reopenPullRequest(owner: string, repo: string, number: number) {
        return api.post<PullRequest>(`/repositories/${owner}/${repo}/pulls/${number}/reopen`);
    },

    async mergePullRequest(owner: string, repo: string, number: number) {
        return api.post<PullRequest>(`/repositories/${owner}/${repo}/pulls/${number}/merge`);
    },

    async getComments(owner: string, repo: string, number: number) {
        return api.get<PullRequestComment[]>(`/repositories/${owner}/${repo}/pulls/${number}/comments`);
    },

    async addComment(
        owner: string,
        repo: string,
        number: number,
        body: string
    ) {
        return api.post<PullRequestComment>(`/repositories/${owner}/${repo}/pulls/${number}/comments`, { body });
    },

    async updateComment(
        owner: string,
        repo: string,
        number: number,
        commentId: string,
        body: string
    ) {
        return api.patch<PullRequestComment>(
            `/repositories/${owner}/${repo}/pulls/${number}/comments/${commentId}`,
            { body }
        );
    },

    async deleteComment(
        owner: string,
        repo: string,
        number: number,
        commentId: string
    ) {
        return api.delete<{ success: true }>(
            `/repositories/${owner}/${repo}/pulls/${number}/comments/${commentId}`
        );
    },
};