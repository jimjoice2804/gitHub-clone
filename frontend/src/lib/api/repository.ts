import { api } from '@/lib/api/client';
import { Repository, CreateRepositoryData, UpdateRepositoryData, Branch, Release, FileTree, FileContent, Commit } from '@/lib/types';

export interface GetRepositoriesParams {
    search?: string;
    visibility?: 'all' | 'public' | 'private';
    sort?: 'name' | 'updated' | 'created' | 'stars';
    direction?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface RepositoriesResponse {
    repositories: Repository[];
    total: number;
    page: number;
    limit: number;
}

export const repositoryApi = {
    getRepositories: (params?: GetRepositoriesParams) =>
        api.get<RepositoriesResponse>('/repositories', { params }),

    getRepository: (owner: string, repo: string) =>
        api.get<Repository>(`/repositories/${owner}/${repo}`),

    createRepository: (data: CreateRepositoryData) =>
        api.post<Repository>('/repositories', data),

    updateRepository: (owner: string, repo: string, data: UpdateRepositoryData) =>
        api.put<Repository>(`/repositories/${owner}/${repo}`, data),

    deleteRepository: (owner: string, repo: string) =>
        api.delete<{ success: boolean }>(`/repositories/${owner}/${repo}`),

    starRepository: (owner: string, repo: string) =>
        api.post<{ success: boolean }>(`/repositories/${owner}/${repo}/star`),

    unstarRepository: (owner: string, repo: string) =>
        api.delete<{ success: boolean }>(`/repositories/${owner}/${repo}/star`),

    watchRepository: (owner: string, repo: string) =>
        api.post<{ success: boolean }>(`/repositories/${owner}/${repo}/watch`),

    unwatchRepository: (owner: string, repo: string) =>
        api.delete<{ success: boolean }>(`/repositories/${owner}/${repo}/watch`),

    getStarredRepositories: (params?: GetRepositoriesParams) =>
        api.get<RepositoriesResponse>('/user/starred', { params }),

    getWatchedRepositories: (params?: GetRepositoriesParams) =>
        api.get<RepositoriesResponse>('/user/watching', { params }),

    forkRepository: (owner: string, repo: string) =>
        api.post<Repository>(`/repositories/${owner}/${repo}/fork`),

    // Branches
    getBranches: (owner: string, repo: string) =>
        api.get<Branch[]>(`/repositories/${owner}/${repo}/branches`),

    createBranch: (owner: string, repo: string, data: { name: string; from?: string }) =>
        api.post<Branch>(`/repositories/${owner}/${repo}/branches`, data),

    deleteBranch: (owner: string, repo: string, branch: string) =>
        api.delete<{ success: boolean }>(`/repositories/${owner}/${repo}/branches/${encodeURIComponent(branch)}`),

    // Releases
    getReleases: (owner: string, repo: string) =>
        api.get<Release[]>(`/repositories/${owner}/${repo}/releases`),

    getRelease: (owner: string, repo: string, tag: string) =>
        api.get<Release>(`/repositories/${owner}/${repo}/releases/${encodeURIComponent(tag)}`),

    createRelease: (owner: string, repo: string, data: { tagName: string; name?: string; body?: string; draft?: boolean; prerelease?: boolean }) =>
        api.post<Release>(`/repositories/${owner}/${repo}/releases`, data),

    updateRelease: (owner: string, repo: string, tag: string, data: { name?: string; body?: string; draft?: boolean; prerelease?: boolean }) =>
        api.put<Release>(`/repositories/${owner}/${repo}/releases/${encodeURIComponent(tag)}`, data),

    deleteRelease: (owner: string, repo: string, tag: string) =>
        api.delete<{ success: boolean }>(`/repositories/${owner}/${repo}/releases/${encodeURIComponent(tag)}`),

    // File Browser
    getFileTree: (owner: string, repo: string, branch: string, path: string = '') => {
        const encodedBranch = encodeURIComponent(branch);
        const encodedPath = path ? `/${encodeURIComponent(path)}` : '';
        return api.get<FileTree>(`/repositories/${owner}/${repo}/tree/${encodedBranch}${encodedPath}`);
    },

    getFileContent: (owner: string, repo: string, branch: string, path: string) => {
        const encodedBranch = encodeURIComponent(branch);
        const encodedPath = encodeURIComponent(path);
        return api.get<FileContent>(`/repositories/${owner}/${repo}/content/${encodedBranch}/${encodedPath}`);
    },

    getCommits: (owner: string, repo: string, params?: { branch?: string; limit?: number; page?: number }) =>
        api.get<Commit[]>(`/repositories/${owner}/${repo}/commits`, { params }),
};
