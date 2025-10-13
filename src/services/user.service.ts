import bcrypt from 'bcryptjs';
import db from '@config/database';
import { ApiError } from '../types/index';

/**
 * Get user profile by username
 */
export const getUserByUsername = async (username: string, requesterId?: string) => {
    const user = await db.user.findUnique({
        where: { username },
        select: {
            id: true,
            username: true,
            email: true,
            name: true,
            bio: true,
            avatarUrl: true,
            location: true,
            website: true,
            company: true,
            createdAt: true,
            _count: {
                select: {
                    repositories: true,
                    followers: true,
                    following: true,
                    stars: true,
                },
            },
        },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Check if requester is following this user
    let isFollowing = false;
    if (requesterId && requesterId !== user.id) {
        const follow = await db.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: requesterId,
                    followingId: user.id,
                },
            },
        });
        isFollowing = !!follow;
    }

    return {
        ...user,
        isFollowing,
        stats: {
            repositories: user._count.repositories,
            followers: user._count.followers,
            following: user._count.following,
            stars: user._count.stars,
        },
    };
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId: string, data: {
    name?: string;
    bio?: string;
    avatarUrl?: string;
    location?: string;
    website?: string;
    company?: string;
}) => {
    const user = await db.user.update({
        where: { id: userId },
        data,
        select: {
            id: true,
            username: true,
            email: true,
            name: true,
            bio: true,
            avatarUrl: true,
            location: true,
            website: true,
            company: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return user;
};

/**
 * Change user password
 */
export const changeUserPassword = async (userId: string, currentPassword: string, newPassword: string) => {
    // Get user with password
    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            password: true,
        },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
        throw new ApiError(401, 'Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
};

/**
 * Follow a user
 */
export const followUser = async (followerId: string, usernameToFollow: string) => {
    // Get user to follow
    const userToFollow = await db.user.findUnique({
        where: { username: usernameToFollow },
        select: { id: true, username: true },
    });

    if (!userToFollow) {
        throw new ApiError(404, 'User not found');
    }

    // Can't follow yourself
    if (followerId === userToFollow.id) {
        throw new ApiError(400, 'You cannot follow yourself');
    }

    // Check if already following
    const existingFollow = await db.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId,
                followingId: userToFollow.id,
            },
        },
    });

    if (existingFollow) {
        throw new ApiError(400, 'You are already following this user');
    }

    // Create follow relationship
    await db.follow.create({
        data: {
            followerId,
            followingId: userToFollow.id,
        },
    });

    return { message: `You are now following ${userToFollow.username}` };
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (followerId: string, usernameToUnfollow: string) => {
    // Get user to unfollow
    const userToUnfollow = await db.user.findUnique({
        where: { username: usernameToUnfollow },
        select: { id: true, username: true },
    });

    if (!userToUnfollow) {
        throw new ApiError(404, 'User not found');
    }

    // Check if following
    const existingFollow = await db.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId,
                followingId: userToUnfollow.id,
            },
        },
    });

    if (!existingFollow) {
        throw new ApiError(400, 'You are not following this user');
    }

    // Delete follow relationship
    await db.follow.delete({
        where: {
            followerId_followingId: {
                followerId,
                followingId: userToUnfollow.id,
            },
        },
    });

    return { message: `You have unfollowed ${userToUnfollow.username}` };
};

/**
 * Get user's followers
 */
export const getUserFollowers = async (username: string, page = 1, limit = 20) => {
    const user = await db.user.findUnique({
        where: { username },
        select: { id: true },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
        db.follow.findMany({
            where: { followingId: user.id },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                follower: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatarUrl: true,
                        bio: true,
                    },
                },
                createdAt: true,
            },
        }),
        db.follow.count({
            where: { followingId: user.id },
        }),
    ]);

    return {
        followers: followers.map((f) => f.follower),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get users that a user is following
 */
export const getUserFollowing = async (username: string, page = 1, limit = 20) => {
    const user = await db.user.findUnique({
        where: { username },
        select: { id: true },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
        db.follow.findMany({
            where: { followerId: user.id },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                following: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatarUrl: true,
                        bio: true,
                    },
                },
                createdAt: true,
            },
        }),
        db.follow.count({
            where: { followerId: user.id },
        }),
    ]);

    return {
        following: following.map((f) => f.following),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Search users by username or name
 */
export const searchUsers = async (query: string, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        db.user.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { name: { contains: query, mode: 'insensitive' } },
                ],
            },
            skip,
            take: limit,
            select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
                bio: true,
                _count: {
                    select: {
                        repositories: true,
                        followers: true,
                    },
                },
            },
            orderBy: {
                followers: {
                    _count: 'desc',
                },
            },
        }),
        db.user.count({
            where: {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { name: { contains: query, mode: 'insensitive' } },
                ],
            },
        }),
    ]);

    return {
        users: users.map((user) => ({
            ...user,
            stats: {
                repositories: user._count.repositories,
                followers: user._count.followers,
            },
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};
