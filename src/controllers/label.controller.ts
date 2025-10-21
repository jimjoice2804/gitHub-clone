import { Request, Response, NextFunction } from 'express';
import * as labelService from '../services/label.service';

/**
 * Create a new label
 * POST /api/labels
 */
export const createLabel = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const label = await labelService.createLabel(req.body);
        res.status(201).json(label);
    } catch (error) {
        next(error);
    }
};

/**
 * Update a label
 * PATCH /api/labels/:name
 */
export const updateLabel = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name } = req.params as { name: string };
        const label = await labelService.updateLabel(name, req.body);
        res.json(label);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a label
 * DELETE /api/labels/:name
 */
export const deleteLabel = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name } = req.params as { name: string };
        await labelService.deleteLabel(name);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

/**
 * List all labels
 * GET /api/labels
 */
export const listLabels = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await labelService.listLabels(req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Get a label by name
 * GET /api/labels/:name
 */
export const getLabel = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name } = req.params as { name: string };
        const label = await labelService.getLabel(name);
        res.json(label);
    } catch (error) {
        next(error);
    }
};
