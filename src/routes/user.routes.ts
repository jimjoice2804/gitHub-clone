import { Router } from 'express';
import * as userController from '@controllers/user.controller';
import * as organizationController from '@controllers/organization.controller';
import { authenticate, optionalAuthenticate } from '@middleware/auth.middleware';
import { validate, validateQuery, validateParams } from '@middleware/validate.middleware';
import {
    updateProfileSchema,
    changePasswordSchema,
    searchUsersSchema,
    usernameParamSchema,
    paginationSchema,
} from '@utils/validations/user.validation';

const router = Router();

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Public
 */
router.get('/search', validateQuery(searchUsersSchema), userController.searchUsers);

/**
 * @route   PUT /api/users/profile
 * @desc    Update own profile
 * @access  Private
 */
router.put('/profile', authenticate, validate(updateProfileSchema), userController.updateProfile);

/**
 * @route   PUT /api/users/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password', authenticate, validate(changePasswordSchema), userController.changePassword);

/**
 * @route   GET /api/users/:username
 * @desc    Get user profile by username
 * @access  Public (but shows more info if authenticated)
 */
router.get('/:username', optionalAuthenticate, validateParams(usernameParamSchema), userController.getUserProfile);

/**
 * @route   POST /api/users/:username/follow
 * @desc    Follow a user
 * @access  Private
 */
router.post('/:username/follow', authenticate, validateParams(usernameParamSchema), userController.followUser);

/**
 * @route   DELETE /api/users/:username/follow
 * @desc    Unfollow a user
 * @access  Private
 */
router.delete('/:username/follow', authenticate, validateParams(usernameParamSchema), userController.unfollowUser);

/**
 * @route   GET /api/users/:username/followers
 * @desc    Get user's followers
 * @access  Public
 */
router.get(
    '/:username/followers',
    validateParams(usernameParamSchema),
    validateQuery(paginationSchema),
    userController.getFollowers,
);

/**
 * @route   GET /api/users/:username/following
 * @desc    Get users that this user is following
 * @access  Public
 */
router.get(
    '/:username/following',
    validateParams(usernameParamSchema),
    validateQuery(paginationSchema),
    userController.getFollowing,
);

/**
 * @route   GET /api/users/:username/orgs
 * @desc    Get user's organizations
 * @access  Public
 */
router.get(
    '/:username/orgs',
    validateParams(usernameParamSchema),
    organizationController.listUserOrganizations,
);

export default router;
