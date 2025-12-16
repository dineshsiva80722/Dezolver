import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  requirePlatformAdmin,
  requireManager,
  requireFeature,
  requireOrganizationAccess,
  enforceUserLimits,
  requireActiveSubscription
} from '../middleware/rbac.middleware';

const router = Router();
const organizationController = new OrganizationController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Organization:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         org_code:
 *           type: string
 *         name:
 *           type: string
 *         plan:
 *           type: string
 *           enum: [starter, professional, enterprise, unlimited]
 *         status:
 *           type: string
 *           enum: [active, suspended, expired, trial]
 *         user_limit:
 *           type: integer
 *         current_users:
 *           type: integer
 *         features_enabled:
 *           type: object
 */

/**
 * @swagger
 * /api/organizations:
 *   post:
 *     summary: Create new organization (Platform Admin only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - industry
 *               - contact_email
 *               - plan
 *               - manager_user
 *             properties:
 *               name:
 *                 type: string
 *                 description: Organization name
 *               description:
 *                 type: string
 *               industry:
 *                 type: string
 *                 description: Industry type
 *               company_size:
 *                 type: string
 *                 enum: [small, medium, large, enterprise]
 *               contact_email:
 *                 type: string
 *                 format: email
 *               phone_number:
 *                 type: string
 *               address:
 *                 type: object
 *               plan:
 *                 type: string
 *                 enum: [starter, professional, enterprise, unlimited]
 *               manager_user:
 *                 type: object
 *                 required:
 *                   - username
 *                   - email
 *                   - password
 *                   - full_name
 *                 properties:
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *                   password:
 *                     type: string
 *                   full_name:
 *                     type: string
 *     responses:
 *       201:
 *         description: Organization created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, requirePlatformAdmin, organizationController.createOrganization);

/**
 * @swagger
 * /api/organizations/my:
 *   get:
 *     summary: Get my organization details
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization details retrieved successfully
 *       404:
 *         description: No organization found
 *       500:
 *         description: Server error
 */
router.get(
  '/my',
  authenticate,
  requireActiveSubscription,
  organizationController.getMyOrganization
);

/**
 * @swagger
 * /api/organizations/{organizationId}:
 *   get:
 *     summary: Get organization by ID
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organization retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:organizationId',
  authenticate,
  requireOrganizationAccess,
  organizationController.getOrganization
);

/**
 * @swagger
 * /api/organizations/{organizationId}/users:
 *   get:
 *     summary: Get organization users (Manager access required)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get(
  '/:organizationId/users',
  authenticate,
  requireActiveSubscription,
  requireManager,
  requireOrganizationAccess,
  organizationController.getOrganizationUsers
);

/**
 * @swagger
 * /api/organizations/{organizationId}/users:
 *   post:
 *     summary: Add user to organization (Manager access required)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - full_name
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               full_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, hr_manager]
 *     responses:
 *       201:
 *         description: User added successfully
 *       400:
 *         description: Validation error or user limit exceeded
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post(
  '/:organizationId/users',
  authenticate,
  requireActiveSubscription,
  requireManager,
  requireOrganizationAccess,
  enforceUserLimits,
  organizationController.addUser
);

/**
 * @swagger
 * /api/organizations/{organizationId}/upgrade:
 *   post:
 *     summary: Upgrade organization plan (Organization Owner only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [starter, professional, enterprise, unlimited]
 *               billing_cycle:
 *                 type: string
 *                 enum: [monthly, quarterly, annually]
 *                 default: monthly
 *     responses:
 *       200:
 *         description: Plan upgraded successfully
 *       400:
 *         description: Invalid plan or cannot downgrade
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post(
  '/:organizationId/upgrade',
  authenticate,
  requireManager,
  requireOrganizationAccess,
  organizationController.upgradePlan
);

/**
 * @swagger
 * /api/organizations/permissions:
 *   get:
 *     summary: Get user permissions for UI adaptation
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/permissions', authenticate, organizationController.getUserPermissions);

/**
 * @swagger
 * /api/organizations/user-limits:
 *   get:
 *     summary: Check current user limits
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User limits retrieved successfully
 *       404:
 *         description: No organization found
 *       500:
 *         description: Server error
 */
router.get('/user-limits', authenticate, organizationController.checkUserLimits);

/**
 * @swagger
 * /api/organizations/platform/stats:
 *   get:
 *     summary: Get platform-wide statistics (Platform Admin only)
 *     tags: [Platform Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform statistics retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get(
  '/platform/stats',
  authenticate,
  requirePlatformAdmin,
  organizationController.getPlatformStats
);

export default router;
