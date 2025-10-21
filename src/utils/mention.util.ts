import db from '@config/database';

const mentionRegex = /@([a-zA-Z0-9_-]{3,})/g;

export const extractMentions = (text?: string | null): string[] => {
    if (!text) {
        return [];
    }

    const matches = text.matchAll(mentionRegex);
    const uniqueUsernames = new Set<string>();

    for (const match of matches) {
        if (match[1]) {
            uniqueUsernames.add(match[1]);
        }
    }

    return Array.from(uniqueUsernames);
};

export const resolveMentionRecipientIds = async (
    usernames: string[],
    repository: { ownerId: string; isPrivate: boolean }
): Promise<string[]> => {
    if (usernames.length === 0) {
        return [];
    }

    const users = await db.user.findMany({
        where: {
            username: {
                in: usernames,
            },
        },
        select: {
            id: true,
        },
    });

    if (users.length === 0) {
        return [];
    }

    if (!repository.isPrivate) {
        return users.map((user) => user.id);
    }

    return users.filter((user) => user.id === repository.ownerId).map((user) => user.id);
};
