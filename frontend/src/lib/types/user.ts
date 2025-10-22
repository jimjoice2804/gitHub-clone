/**
 * User related types
 */
export interface User {
    id: string;
    username: string;
    email: string;
    name: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    avatarUrl: string | null;
    company: string | null;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserProfile extends User {
    stats: {
        repositories: number;
        followers: number;
        following: number;
    };
    /** Whether the current authenticated user is following this profile */
    isFollowing?: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    name?: string;
}

export interface TokenPayload {
    userId: string;
    email: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}
