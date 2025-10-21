import db from '@config/database';
import { Prisma } from '@prisma/client';
import { ApiError } from '../types/index';

const labelSelect = {
    id: true,
    name: true,
    color: true,
    description: true,
    createdAt: true,
    _count: {
        select: {
            issues: true,
            pullRequests: true,
        },
    },
} satisfies Prisma.LabelSelect;

type LabelWithCount = Prisma.LabelGetPayload<{ select: typeof labelSelect }>;

const mapLabel = (label: LabelWithCount) => ({
    id: label.id,
    name: label.name,
    color: label.color,
    description: label.description,
    createdAt: label.createdAt,
    usage: {
        issues: label._count.issues,
        pullRequests: label._count.pullRequests,
        total: label._count.issues + label._count.pullRequests,
    },
});

/**
 * Create a new label
 */
export const createLabel = async (data: {
    name: string;
    color: string;
    description?: string;
}) => {
    // Check if label with this name already exists
    const existing = await db.label.findUnique({
        where: { name: data.name },
        select: { id: true },
    });

    if (existing) {
        throw new ApiError(400, 'A label with this name already exists');
    }

    const label = await db.label.create({
        data: {
            name: data.name,
            color: data.color,
            description: data.description || null,
        },
        select: labelSelect,
    });

    return mapLabel(label);
};

/**
 * Update a label
 */
export const updateLabel = async (
    name: string,
    data: {
        name?: string;
        color?: string;
        description?: string;
    }
) => {
    // Find existing label
    const existing = await db.label.findUnique({
        where: { name },
        select: { id: true },
    });

    if (!existing) {
        throw new ApiError(404, 'Label not found');
    }

    // If renaming, check if new name is already taken
    if (data.name && data.name !== name) {
        const nameConflict = await db.label.findUnique({
            where: { name: data.name },
            select: { id: true },
        });

        if (nameConflict) {
            throw new ApiError(400, 'A label with this name already exists');
        }
    }

    const label = await db.label.update({
        where: { name },
        data: {
            name: data.name,
            color: data.color,
            description: data.description !== undefined ? data.description : undefined,
        },
        select: labelSelect,
    });

    return mapLabel(label);
};

/**
 * Delete a label
 */
export const deleteLabel = async (name: string) => {
    const label = await db.label.findUnique({
        where: { name },
        select: { id: true },
    });

    if (!label) {
        throw new ApiError(404, 'Label not found');
    }

    // Delete label (cascade will remove associations)
    await db.label.delete({
        where: { name },
    });
};

/**
 * List all labels
 */
export const listLabels = async (options?: {
    search?: string;
    page?: number;
    limit?: number;
}) => {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Prisma.LabelWhereInput = {};

    if (options?.search) {
        where.OR = [
            {
                name: {
                    contains: options.search,
                    mode: 'insensitive',
                },
            },
            {
                description: {
                    contains: options.search,
                    mode: 'insensitive',
                },
            },
        ];
    }

    const [labels, total] = await Promise.all([
        db.label.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
            select: labelSelect,
        }),
        db.label.count({ where }),
    ]);

    return {
        labels: labels.map(mapLabel),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1,
        },
    };
};

/**
 * Get a label by name
 */
export const getLabel = async (name: string) => {
    const label = await db.label.findUnique({
        where: { name },
        select: labelSelect,
    });

    if (!label) {
        throw new ApiError(404, 'Label not found');
    }

    return mapLabel(label);
};

/**
 * Get labels by IDs (utility function)
 */
export const getLabelsByIds = async (labelIds: string[]) => {
    if (labelIds.length === 0) {
        return [];
    }

    const labels = await db.label.findMany({
        where: {
            id: { in: labelIds },
        },
        select: {
            id: true,
            name: true,
            color: true,
            description: true,
        },
    });

    return labels;
};
