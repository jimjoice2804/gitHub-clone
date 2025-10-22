import { api } from '@/lib/api/client';
import { Issue, IssueComment, CreateIssueData, UpdateIssueData, IssueState } from '@/lib/types';

export interface GetIssuesParams {
    repositoryId?: string;
    state?: IssueState | 'ALL';
    search?: string;
    sort?: 'created' | 'updated' | 'comments';
    direction?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface IssuesResponse {
    issues: Issue[];
    total: number;
    page: number;
    limit: number;
}

export const issueApi = {
    // Get all issues (optionally filtered by repository)
    getIssues: (params?: GetIssuesParams) =>
        api.get<IssuesResponse>('/issues', { params }),

    // Get issues for a specific repository
    getRepositoryIssues: (owner: string, repo: string, params?: GetIssuesParams) =>
        api.get<IssuesResponse>(`/repositories/${owner}/${repo}/issues`, { params }),

    // Get single issue
    getIssue: (owner: string, repo: string, issueNumber: number) =>
        api.get<Issue>(`/repositories/${owner}/${repo}/issues/${issueNumber}`),

    // Create issue
    createIssue: (owner: string, repo: string, data: CreateIssueData) =>
        api.post<Issue>(`/repositories/${owner}/${repo}/issues`, data),

    // Update issue
    updateIssue: (owner: string, repo: string, issueNumber: number, data: UpdateIssueData) =>
        api.patch<Issue>(`/repositories/${owner}/${repo}/issues/${issueNumber}`, data),

    // Close issue
    closeIssue: (owner: string, repo: string, issueNumber: number) =>
        api.patch<Issue>(`/repositories/${owner}/${repo}/issues/${issueNumber}/close`),

    // Reopen issue
    reopenIssue: (owner: string, repo: string, issueNumber: number) =>
        api.patch<Issue>(`/repositories/${owner}/${repo}/issues/${issueNumber}/reopen`),

    // Delete issue
    deleteIssue: (owner: string, repo: string, issueNumber: number) =>
        api.delete<{ success: boolean }>(`/repositories/${owner}/${repo}/issues/${issueNumber}`),

    // Get issue comments
    getComments: (owner: string, repo: string, issueNumber: number) =>
        api.get<IssueComment[]>(`/repositories/${owner}/${repo}/issues/${issueNumber}/comments`),

    // Add comment
    addComment: (owner: string, repo: string, issueNumber: number, body: string) =>
        api.post<IssueComment>(`/repositories/${owner}/${repo}/issues/${issueNumber}/comments`, { body }),

    // Update comment
    updateComment: (owner: string, repo: string, issueNumber: number, commentId: string, body: string) =>
        api.patch<IssueComment>(`/repositories/${owner}/${repo}/issues/${issueNumber}/comments/${commentId}`, { body }),

    // Delete comment
    deleteComment: (owner: string, repo: string, issueNumber: number, commentId: string) =>
        api.delete<{ success: boolean }>(`/repositories/${owner}/${repo}/issues/${issueNumber}/comments/${commentId}`),
};
