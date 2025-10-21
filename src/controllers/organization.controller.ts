import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as organizationService from '../services/organization.service';

/**
 * Create a new organization
 * POST /api/orgs
 */
export const createOrganization = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.userId;
        const { name, displayName, description, avatarUrl, website, location, email } = req.body;
        const organization = await organizationService.createOrganization(userId, {
            name,
            displayName,
            description,
            avatarUrl,
            website,
            location,
            email,
        });
        res.status(201).json(organization);
    } catch (error) {
        next(error);
    }
};

/**
 * Get organization by name
 * GET /api/orgs/:org
 */
export const getOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { org } = req.params;
        const organization = await organizationService.getOrganization(org!);
        res.json(organization);
    } catch (error) {
        next(error);
    }
};

/**
 * Update organization
 * PATCH /api/orgs/:org
 */
export const updateOrganization = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { org } = req.params;
        const userId = req.user!.userId;
        const { displayName, description, avatarUrl, website, location, email } = req.body;
        const organization = await organizationService.updateOrganization(org!, userId, {
            displayName,
            description,
            avatarUrl,
            website,
            location,
            email,
        });
        res.json(organization);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete organization
 * DELETE /api/orgs/:org
 */
export const deleteOrganization = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { org } = req.params;
        const userId = req.user!.userId;
        await organizationService.deleteOrganization(org!, userId);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

/**
 * List all organizations
 * GET /api/orgs
 */
export const listOrganizations = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await organizationService.listOrganizations(req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * List user's organizations
 * GET /api/users/:username/orgs
 */
export const listUserOrganizations = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { username } = req.params;
        const result = await organizationService.listUserOrganizations(username!);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Add member to organization
 * POST /api/orgs/:org/members
 */
export const addOrganizationMember = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { org } = req.params;
        const adminUserId = req.user!.userId;
        const { username, role } = req.body;
        const member = await organizationService.addOrganizationMember(
            org!,
            adminUserId,
            username,
            role
        );
        res.status(201).json(member);
    } catch (error) {
        next(error);
    }
};

/**
 * Remove member from organization
 * DELETE /api/orgs/:org/members/:username
 */
export const removeOrganizationMember = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { org, username } = req.params;
        const adminUserId = req.user!.userId;
        await organizationService.removeOrganizationMember(org!, adminUserId, username!);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

/**
 * Update member role
 * PATCH /api/orgs/:org/members/:username
 */
export const updateOrganizationMemberRole = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { org, username } = req.params;
        const adminUserId = req.user!.userId;
        const { role } = req.body;
        const member = await organizationService.updateOrganizationMemberRole(
            org!,
            adminUserId,
            username!,
            role
        );
        res.json(member);
    } catch (error) {
        next(error);
    }
};

/**
 * List organization members
 * GET /api/orgs/:org/members
 */
export const listOrganizationMembers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { org } = req.params;
        const result = await organizationService.listOrganizationMembers(org!, req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Get organization member
 * GET /api/orgs/:org/members/:username
 */
export const getOrganizationMember = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { org, username } = req.params;
        const member = await organizationService.getOrganizationMember(org!, username!);
        res.json(member);
    } catch (error) {
        next(error);
    }
};

/**
 * List organization repositories
 * GET /api/orgs/:org/repos
 */
export const listOrganizationRepositories = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { org } = req.params;
        const requesterId = req.user?.userId;
        const result = await organizationService.listOrganizationRepositories(
            org!,
            requesterId,
            req.query
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
};
