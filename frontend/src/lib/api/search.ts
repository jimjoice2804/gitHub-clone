import { api } from './client';
import type {
    SearchParams,
    RepositorySearchParams,
    UserSearchParams,
    IssueSearchParams,
    PullRequestSearchParams,
    RepositorySearchResponse,
    UserSearchResponse,
    IssueSearchResponse,
    PullRequestSearchResponse,
    QuickSearchResult,
} from '@/lib/types';

/**
 * Search API endpoints
 */
export const searchApi = {
    /**
     * Quick search for autocomplete (searches repos and users)
     */
    quickSearch: async (query: string): Promise<QuickSearchResult> => {
        return await api.get<QuickSearchResult>('/search/quick', {
            params: { query, limit: 5 },
        });
    },

    /**
     * Search repositories with advanced filters
     */
    searchRepositories: async (params: RepositorySearchParams): Promise<RepositorySearchResponse> => {
        return await api.get<RepositorySearchResponse>('/search/repositories', {
            params,
        });
    },

    /**
     * Search users
     */
    searchUsers: async (params: UserSearchParams): Promise<UserSearchResponse> => {
        return await api.get<UserSearchResponse>('/search/users', {
            params,
        });
    },

    /**
     * Search issues
     */
    searchIssues: async (params: IssueSearchParams): Promise<IssueSearchResponse> => {
        return await api.get<IssueSearchResponse>('/search/issues', {
            params,
        });
    },

    /**
     * Search pull requests
     */
    searchPullRequests: async (params: PullRequestSearchParams): Promise<PullRequestSearchResponse> => {
        return await api.get<PullRequestSearchResponse>('/search/pull-requests', {
            params,
        });
    },

    /**
     * Global search (searches across all types)
     */
    globalSearch: async (params: SearchParams) => {
        return await api.get('/search', {
            params,
        });
    },
};
