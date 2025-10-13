import bcrypt from 'bcryptjs';
import prisma from '@config/database';
import { ApiError } from '../types/index';
import { generateAccessToken, generateRefreshToken } from '@utils/jwt';
import type { RegisterInput, LoginInput } from '@utils/validations/auth.validation';

/**
 * Register a new user
 */
export const registerUser = async (data: RegisterInput) => {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [{ email: data.email }, { username: data.username }],
        },
    });

    if (existingUser) {
        if (existingUser.email === data.email) {
            throw new ApiError(400, 'Email already registered');
        }
        if (existingUser.username === data.username) {
            throw new ApiError(400, 'Username already taken');
        }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
        data: {
            username: data.username,
            email: data.email,
            password: hashedPassword,
            name: data.name,
        },
        select: {
            id: true,
            username: true,
            email: true,
            name: true,
            bio: true,
            avatarUrl: true,
            createdAt: true,
        },
    });

    // Generate tokens
    const tokenPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
        user,
        accessToken,
        refreshToken,
    };
};

/**
 * Login user
 */
export const loginUser = async (data: LoginInput) => {
    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (!user) {
        throw new ApiError(401, 'Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid email or password');
    }

    // Generate tokens
    const tokenPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
    };
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            email: true,
            name: true,
            bio: true,
            location: true,
            website: true,
            avatarUrl: true,
            company: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {
                    repositories: true,
                    followers: true,
                    following: true,
                },
            },
        },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return user;
};

/**
 * Get user by username
 */
export const getUserByUsername = async (username: string) => {
    const user = await prisma.user.findUnique({
        where: { username },
        select: {
            id: true,
            username: true,
            email: true,
            name: true,
            bio: true,
            location: true,
            website: true,
            avatarUrl: true,
            company: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {
                    repositories: true,
                    followers: true,
                    following: true,
                },
            },
        },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return user;
};

/**
 * Refresh access token
 */
export const refreshAccessToken = (refreshToken: string) => {
    // This will be implemented in the controller using verifyRefreshToken
    // and generating a new access token
    return { refreshToken };
};
