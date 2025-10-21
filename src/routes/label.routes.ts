import { Router } from 'express';
import * as labelController from '../controllers/label.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
    createLabelSchema,
    updateLabelSchema,
    listLabelsQuerySchema,
    labelNameParamSchema,
} from '../utils/validations/label.validation';

const router = Router();

/**
 * @route   GET /api/labels
 * @desc    List all labels
 * @access  Public
 */
router.get(
    '/',
    validateQuery(listLabelsQuerySchema),
    labelController.listLabels
);

/**
 * @route   POST /api/labels
 * @desc    Create a new label
 * @access  Private (Admin)
 */
router.post(
    '/',
    authenticate,
    validate(createLabelSchema),
    labelController.createLabel
);

/**
 * @route   GET /api/labels/:name
 * @desc    Get a label by name
 * @access  Public
 */
router.get(
    '/:name',
    validateParams(labelNameParamSchema),
    labelController.getLabel
);

/**
 * @route   PATCH /api/labels/:name
 * @desc    Update a label
 * @access  Private (Admin)
 */
router.patch(
    '/:name',
    authenticate,
    validateParams(labelNameParamSchema),
    validate(updateLabelSchema),
    labelController.updateLabel
);

/**
 * @route   DELETE /api/labels/:name
 * @desc    Delete a label
 * @access  Private (Admin)
 */
router.delete(
    '/:name',
    authenticate,
    validateParams(labelNameParamSchema),
    labelController.deleteLabel
);

export default router;
