import type { Repository } from './repository';
import type { User } from './user';
import type { Issue } from './issue';
import type { PullRequest } from './pullrequest';

/**
 * Search parameters for all search types
 */
export interface SearchParams {
    query: string;
    sort?: 'relevance' | 'created' | 'updated' | 'stars' | 'forks';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

/**
 * Repository search specific parameters
 */
export interface RepositorySearchParams extends SearchParams {
    language?: string;
    visibility?: 'public' | 'private' | 'all';
}

/**
 * User search specific parameters
 */
export interface UserSearchParams extends SearchParams {
    location?: string;
}

/**
 * Issue search specific parameters
 */
export interface IssueSearchParams extends SearchParams {
    state?: 'open' | 'closed' | 'all';
    labels?: string[];
}

/**
 * Pull request search specific parameters
 */
export interface PullRequestSearchParams extends SearchParams {
    state?: 'open' | 'closed' | 'merged' | 'all';
}

/**
 * Generic search response
 */
export interface SearchResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

/**
 * Repository search response
 */
export type RepositorySearchResponse = SearchResponse<Repository>;

/**
 * User search response
 */
export type UserSearchResponse = SearchResponse<User>;

/**
 * Issue search response
 */
export type IssueSearchResponse = SearchResponse<Issue>;

/**
 * Pull request search response
 */
export type PullRequestSearchResponse = SearchResponse<PullRequest>;

/**
 * Quick search result (for autocomplete)
 */
export interface QuickSearchResult {
    repositories: Repository[];
    users: User[];
    total: number;
}
