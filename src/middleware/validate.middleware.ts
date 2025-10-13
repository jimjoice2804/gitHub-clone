import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '@utils/response';

/**
 * Validation middleware factory
 * Creates middleware to validate request body against a Zod schema
 */
export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors: Record<string, string[]> = {};

                error.issues.forEach((err) => {
                    const path = err.path.join('.');
                    if (!errors[path]) {
                        errors[path] = [];
                    }
                    errors[path]?.push(err.message);
                });

                sendError(res, 'Validation failed', 400, errors);
                return;
            }

            sendError(res, 'Validation error', 400);
            return;
        }
    };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            schema.parse(req.query);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors: Record<string, string[]> = {};

                error.issues.forEach((err) => {
                    const path = err.path.join('.');
                    if (!errors[path]) {
                        errors[path] = [];
                    }
                    errors[path]?.push(err.message);
                });

                sendError(res, 'Validation failed', 400, errors);
                return;
            }

            sendError(res, 'Validation error', 400);
            return;
        }
    };
};

/**
 * Validate route parameters
 */
export const validateParams = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            schema.parse(req.params);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors: Record<string, string[]> = {};

                error.issues.forEach((err) => {
                    const path = err.path.join('.');
                    if (!errors[path]) {
                        errors[path] = [];
                    }
                    errors[path]?.push(err.message);
                });

                sendError(res, 'Validation failed', 400, errors);
                return;
            }

            sendError(res, 'Validation error', 400);
            return;
        }
    };
};
