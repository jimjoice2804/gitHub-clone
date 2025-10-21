import { Router } from 'express';
import * as organizationController from '../controllers/organization.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
    createOrganizationSchema,
    updateOrganizationSchema,
    addOrganizationMemberSchema,
    updateOrganizationMemberRoleSchema,
    organizationNameParamSchema,
    organizationMemberParamSchema,
    listOrganizationsQuerySchema,
    listOrganizationMembersQuerySchema,
    listOrganizationReposQuerySchema,
} from '../utils/validations/organization.validation';

const router = Router();

/**
 * @route   GET /api/orgs
 * @desc    List all organizations
 * @access  Public
 */
router.get(
    '/',
    validateQuery(listOrganizationsQuerySchema),
    organizationController.listOrganizations
);

/**
 * @route   POST /api/orgs
 * @desc    Create a new organization
 * @access  Private
 */
router.post(
    '/',
    authenticate,
    validate(createOrganizationSchema),
    organizationController.createOrganization
);

/**
 * @route   GET /api/orgs/:org
 * @desc    Get an organization by name
 * @access  Public
 */
router.get(
    '/:org',
    validateParams(organizationNameParamSchema),
    organizationController.getOrganization
);

/**
 * @route   PATCH /api/orgs/:org
 * @desc    Update an organization
 * @access  Private (Admin)
 */
router.patch(
    '/:org',
    authenticate,
    validateParams(organizationNameParamSchema),
    validate(updateOrganizationSchema),
    organizationController.updateOrganization
);

/**
 * @route   DELETE /api/orgs/:org
 * @desc    Delete an organization
 * @access  Private (Owner only)
 */
router.delete(
    '/:org',
    authenticate,
    validateParams(organizationNameParamSchema),
    organizationController.deleteOrganization
);

/**
 * @route   GET /api/orgs/:org/repos
 * @desc    List organization repositories
 * @access  Public (private repos hidden to non-members)
 */
router.get(
    '/:org/repos',
    optionalAuthenticate,
    validateParams(organizationNameParamSchema),
    validateQuery(listOrganizationReposQuerySchema),
    organizationController.listOrganizationRepositories
);

/**
 * @route   GET /api/orgs/:org/members
 * @desc    List organization members
 * @access  Public
 */
router.get(
    '/:org/members',
    validateParams(organizationNameParamSchema),
    validateQuery(listOrganizationMembersQuerySchema),
    organizationController.listOrganizationMembers
);

/**
 * @route   POST /api/orgs/:org/members
 * @desc    Add a member to organization
 * @access  Private (Admin)
 */
router.post(
    '/:org/members',
    authenticate,
    validateParams(organizationNameParamSchema),
    validate(addOrganizationMemberSchema),
    organizationController.addOrganizationMember
);

/**
 * @route   GET /api/orgs/:org/members/:username
 * @desc    Get organization member
 * @access  Public
 */
router.get(
    '/:org/members/:username',
    validateParams(organizationMemberParamSchema),
    organizationController.getOrganizationMember
);

/**
 * @route   PATCH /api/orgs/:org/members/:username
 * @desc    Update member role
 * @access  Private (Admin)
 */
router.patch(
    '/:org/members/:username',
    authenticate,
    validateParams(organizationMemberParamSchema),
    validate(updateOrganizationMemberRoleSchema),
    organizationController.updateOrganizationMemberRole
);

/**
 * @route   DELETE /api/orgs/:org/members/:username
 * @desc    Remove member from organization
 * @access  Private (Admin)
 */
router.delete(
    '/:org/members/:username',
    authenticate,
    validateParams(organizationMemberParamSchema),
    organizationController.removeOrganizationMember
);

export default router;
