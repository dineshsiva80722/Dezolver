import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types/enums';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// User management
router.get('/users', AdminController.getAllUsers);
router.put('/users/:id/role', AdminController.updateUserRole);
router.put('/users/:username/promote', AdminController.promoteUserToAdmin);
router.put('/users/:id/ban', AdminController.banUser);
router.put('/users/:id/unban', AdminController.unbanUser);
router.delete('/users/:id', AdminController.deleteUser);

// Manager management
router.post('/managers',
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').trim().isLength({ min: 2 }).withMessage('Full name required'),
  body('phone_number').optional().trim(),
  validate,
  AdminController.createManager
);
router.get('/managers', AdminController.getAllManagers);
router.get('/managers/:managerId', AdminController.getManagerById);

// System stats
router.get('/stats', AdminController.getSystemStats);

// Data management (development only)
router.post('/clear-data', AdminController.clearData);

export default router;