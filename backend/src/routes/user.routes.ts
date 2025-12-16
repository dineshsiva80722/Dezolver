import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile', authenticate, UserController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               bio:
 *                 type: string
 *               country:
 *                 type: string
 *               github_username:
 *                 type: string
 *               linkedin_url:
 *                 type: string
 *               website_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/profile', authenticate, UserController.updateProfile);

/**
 * @swagger
 * /api/users/me/stats:
 *   get:
 *     summary: Get current user statistics (from database)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved from database
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     problemsSolved:
 *                       type: integer
 *                     totalSubmissions:
 *                       type: integer
 *                     acceptedSubmissions:
 *                       type: integer
 *                     currentRating:
 *                       type: integer
 *                     maxRating:
 *                       type: integer
 *                     contestsParticipated:
 *                       type: integer
 *                     weeklyActivity:
 *                       type: integer
 *                     monthlyActivity:
 *                       type: integer
 *                     difficultyBreakdown:
 *                       type: object
 *                       properties:
 *                         easy:
 *                           type: integer
 *                         medium:
 *                           type: integer
 *                         hard:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/me/stats', authenticate, UserController.getUserStats);

/**
 * @swagger
 * /api/users/{userId}/stats:
 *   get:
 *     summary: Get user statistics by user ID (from database)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User statistics retrieved from database
 *       404:
 *         description: User not found
 */
router.get('/:userId/stats', UserController.getUserStatsByUserId);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 */
router.get('/:id', UserController.getUserById);

export default router;