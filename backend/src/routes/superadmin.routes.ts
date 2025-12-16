import { Router } from 'express';
import { SuperAdminController } from '../controllers/superadmin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types/enums';

const router = Router();

// All routes require super admin authentication
router.use(authenticate);
router.use(authorize(UserRole.SUPER_ADMIN));

// Get all admins
router.get('/admins', SuperAdminController.getAllAdmins);

// Get admin statistics
router.get('/admins/stats', SuperAdminController.getAdminStats);

// Get all super admins
router.get('/super-admins', SuperAdminController.getAllSuperAdmins);

// Promote user to super admin
router.put('/users/:userId/promote-super-admin', SuperAdminController.promoteToSuperAdmin);

// Demote super admin to admin
router.put('/users/:userId/demote-to-admin', SuperAdminController.demoteToAdmin);

export default router;
