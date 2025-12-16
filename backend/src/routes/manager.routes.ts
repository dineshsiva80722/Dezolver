import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { ManagerController } from '../controllers/manager.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types/enums';

const router = Router();

// All manager routes require authentication and manager role
router.use(authenticate);
router.use(authorize(UserRole.MANAGER));

/**
 * @swagger
 * /api/managers/students:
 *   post:
 *     summary: Add a new student (Manager only)
 *     tags: [Managers]
 *     security:
 *       - bearerAuth: []
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
 *                 description: Student's username
 *               email:
 *                 type: string
 *                 description: Student's email
 *               password:
 *                 type: string
 *                 description: Student's password
 *               full_name:
 *                 type: string
 *                 description: Student's full name
 *               phone_number:
 *                 type: string
 *                 description: Student's phone number
 *     responses:
 *       201:
 *         description: Student added successfully
 *       400:
 *         description: Validation error or user exists
 *       403:
 *         description: Not authorized (not a manager)
 */
router.post(
  '/students',
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').trim().isLength({ min: 2 }).withMessage('Full name required'),
  body('phone_number').optional().trim(),
  validate,
  ManagerController.addStudent
);

/**
 * @swagger
 * /api/managers/students:
 *   get:
 *     summary: Get all students managed by this manager
 *     tags: [Managers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students
 *       403:
 *         description: Not authorized
 */
router.get('/students', ManagerController.getMyStudents);

/**
 * @swagger
 * /api/managers/students/{studentId}:
 *   get:
 *     summary: Get specific student details
 *     tags: [Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student details
 *       404:
 *         description: Student not found
 */
router.get('/students/:studentId', ManagerController.getStudentById);

/**
 * @swagger
 * /api/managers/students/{studentId}:
 *   put:
 *     summary: Update student information
 *     tags: [Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               institution:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       404:
 *         description: Student not found
 */
router.put(
  '/students/:studentId',
  body('full_name').optional().trim(),
  body('phone_number').optional().trim(),
  body('institution').optional().trim(),
  body('country').optional().trim(),
  validate,
  ManagerController.updateStudent
);

/**
 * @swagger
 * /api/managers/students/{studentId}/deactivate:
 *   post:
 *     summary: Deactivate a student
 *     tags: [Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student deactivated
 *       404:
 *         description: Student not found
 */
router.post('/students/:studentId/deactivate', ManagerController.deactivateStudent);

/**
 * @swagger
 * /api/managers/students/{studentId}/reactivate:
 *   post:
 *     summary: Reactivate a student
 *     tags: [Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student reactivated
 *       404:
 *         description: Student not found
 */
router.post('/students/:studentId/reactivate', ManagerController.reactivateStudent);

/**
 * @swagger
 * /api/managers/stats:
 *   get:
 *     summary: Get manager dashboard statistics
 *     tags: [Managers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Manager statistics
 */
router.get('/stats', ManagerController.getManagerStats);

export default router;
