import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User.entity';
import { UserRole } from '../types/enums';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

export class SuperAdminController {
  /**
   * Get all admins (Super Admin only)
   */
  static async getAllAdmins(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRepository = AppDataSource.getRepository(User);

      const admins = await userRepository.find({
        where: { role: UserRole.ADMIN },
        select: [
          'id',
          'username',
          'email',
          'full_name',
          'phone_number',
          'is_active',
          'is_verified',
          'created_at',
          'last_login',
          'contribution_points'
        ],
        order: { created_at: 'DESC' }
      });

      // Get additional stats for each admin
      const adminsWithStats = await Promise.all(
        admins.map(async (admin) => {
          const managedStudents = await userRepository.count({
            where: { managed_by: admin.id }
          });

          return {
            ...admin,
            managedStudents
          };
        })
      );

      res.json({
        success: true,
        data: {
          total: admins.length,
          admins: adminsWithStats
        }
      });
    } catch (error) {
      logger.error('Error fetching admins:', error);
      next(error);
    }
  }

  /**
   * Get detailed statistics about all admins (Super Admin only)
   */
  static async getAdminStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRepository = AppDataSource.getRepository(User);

      const totalAdmins = await userRepository.count({
        where: { role: UserRole.ADMIN }
      });

      const activeAdmins = await userRepository.count({
        where: {
          role: UserRole.ADMIN,
          is_active: true
        }
      });

      const verifiedAdmins = await userRepository.count({
        where: {
          role: UserRole.ADMIN,
          is_verified: true
        }
      });

      res.json({
        success: true,
        data: {
          totalAdmins,
          activeAdmins,
          verifiedAdmins,
          inactiveAdmins: totalAdmins - activeAdmins
        }
      });
    } catch (error) {
      logger.error('Error fetching admin stats:', error);
      next(error);
    }
  }

  /**
   * Promote an admin to super admin (Super Admin only)
   */
  static async promoteToSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const userRepository = AppDataSource.getRepository(User);

      const user = await userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.role === UserRole.SUPER_ADMIN) {
        return res.status(400).json({
          success: false,
          message: 'User is already a super admin'
        });
      }

      user.role = UserRole.SUPER_ADMIN;
      await userRepository.save(user);

      const { password, verification_token, reset_password_token, ...userResponse } = user;

      logger.info(`User ${user.username} promoted to super admin by ${req.user?.username}`);

      res.json({
        success: true,
        message: `User ${user.username} promoted to super admin successfully`,
        data: userResponse
      });
    } catch (error) {
      logger.error('Error promoting to super admin:', error);
      next(error);
    }
  }

  /**
   * Demote a super admin to admin (Super Admin only)
   */
  static async demoteToAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const userRepository = AppDataSource.getRepository(User);

      const user = await userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.role !== UserRole.SUPER_ADMIN) {
        return res.status(400).json({
          success: false,
          message: 'User is not a super admin'
        });
      }

      // Prevent self-demotion
      if (user.id === req.user?.userId) {
        return res.status(403).json({
          success: false,
          message: 'Cannot demote yourself'
        });
      }

      user.role = UserRole.ADMIN;
      await userRepository.save(user);

      const { password, verification_token, reset_password_token, ...userResponse } = user;

      logger.info(`User ${user.username} demoted to admin by ${req.user?.username}`);

      res.json({
        success: true,
        message: `User ${user.username} demoted to admin successfully`,
        data: userResponse
      });
    } catch (error) {
      logger.error('Error demoting super admin:', error);
      next(error);
    }
  }

  /**
   * Get all super admins (Super Admin only)
   */
  static async getAllSuperAdmins(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRepository = AppDataSource.getRepository(User);

      const superAdmins = await userRepository.find({
        where: { role: UserRole.SUPER_ADMIN },
        select: [
          'id',
          'username',
          'email',
          'full_name',
          'phone_number',
          'is_active',
          'is_verified',
          'created_at',
          'last_login'
        ],
        order: { created_at: 'DESC' }
      });

      res.json({
        success: true,
        data: {
          total: superAdmins.length,
          superAdmins
        }
      });
    } catch (error) {
      logger.error('Error fetching super admins:', error);
      next(error);
    }
  }
}
