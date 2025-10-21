import db from '@config/database';
import { Prisma } from '@prisma/client';

export const userIdentitySelect = {
    username: true,
    name: true,
} as const;

export type UserIdentity = Prisma.UserGetPayload<{ select: typeof userIdentitySelect }>;

export const fetchUserIdentity = (userId: string) =>
    db.user.findUnique({
        where: { id: userId },
        select: userIdentitySelect,
    });

export const resolveDisplayName = (identity?: UserIdentity | null) => {
    if (!identity) {
        return 'Someone';
    }

    if (identity.name && identity.name.trim().length > 0) {
        return identity.name;
    }

    return identity.username;
};
