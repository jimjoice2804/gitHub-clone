/**
 * Repository related types
 */
export interface Repository {
    id: string;
    name: string;
    description: string | null;
    isPrivate: boolean;
    language: string | null;
    defaultBranch: string;
    gitUrl: string;
    starsCount: number;
    forksCount: number;
    watchersCount: number;
    issuesCount: number;
    pullRequestsCount: number;
    discussionsCount: number;
    ownerId: string;
    forkedFromId: string | null;
    organizationId: string | null;
    createdAt: string;
    updatedAt: string;
    owner: {
        id: string;
        username: string;
        name: string | null;
        avatarUrl: string | null;
    };
}

export interface CreateRepositoryData {
    name: string;
    description?: string;
    isPrivate?: boolean;
    language?: string;
}

export interface UpdateRepositoryData {
    description?: string;
    isPrivate?: boolean;
    language?: string;
}

export interface RepositoryStats {
    stars: number;
    watchers: number;
    forks: number;
}

export interface Branch {
    id: string;
    name: string;
    sha: string;
    isProtected: boolean;
    repositoryId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Commit {
    id: string;
    sha: string;
    message: string;
    authorId: string;
    repositoryId: string;
    createdAt: string;
    author: {
        id: string;
        username: string;
        name: string | null;
        avatarUrl: string | null;
    };
}

export interface Tag {
    id: string;
    name: string;
    sha: string;
    message: string | null;
    createdAt: string;
}

export interface Release {
    id: string;
    tagName: string;
    name: string | null;
    body: string | null;
    draft: boolean;
    prerelease: boolean;
    repositoryId: string;
    createdAt: string;
    publishedAt: string | null;
    author: {
        id: string;
        username: string;
        name: string | null;
        avatarUrl: string | null;
    };
}

export type FileType = 'file' | 'directory';

export interface FileEntry {
    name: string;
    path: string;
    type: FileType;
    size?: number;
    sha?: string;
}

export interface FileTree {
    path: string;
    entries: FileEntry[];
}

export interface FileContent {
    path: string;
    content: string;
    encoding: 'utf-8' | 'base64';
    size: number;
    sha: string;
}
