import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User.entity';
import { UserRole, UserAddedBy } from '../types/enums';
import { AuthRequest } from '../middleware/auth.middleware';
import { MoreThan } from 'typeorm';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

export class AdminController {
  static async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      
      const users = await userRepository.find({
        select: [
          'id', 'username', 'email', 'full_name', 'role', 'rating', 
          'max_rating', 'problems_solved', 'contests_participated_count',
          'is_verified', 'created_at', 'last_login'
        ],
        order: { created_at: 'DESC' }
      });

      res.json({
        success: true,
        data: { users }
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const userRepository = AppDataSource.getRepository(User);

      // Validate role
      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified'
        });
      }

      const user = await userRepository.findOne({
        where: { id: id }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.role = role;
      await userRepository.save(user);

      // Remove sensitive data from response
      const { password: _, verification_token: __, reset_password_token: ___, ...userResponse } = user;

      res.json({
        success: true,
        message: `User role updated to ${role} successfully`,
        data: userResponse
      });
    } catch (error) {
      next(error);
    }
  }

  static async promoteUserToAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { username } = req.params;
      const userRepository = AppDataSource.getRepository(User);

      const user = await userRepository.findOne({
        where: { username }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.role = UserRole.ADMIN;
      await userRepository.save(user);

      // Remove sensitive data from response
      const { password: _, verification_token: __, reset_password_token: ___, ...userResponse } = user;

      res.json({
        success: true,
        message: `User ${username} promoted to admin successfully`,
        data: userResponse
      });
    } catch (error) {
      next(error);
    }
  }

  static async banUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userRepository = AppDataSource.getRepository(User);

      const user = await userRepository.findOne({
        where: { id: id }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.is_banned = true;
      await userRepository.save(user);

      res.json({
        success: true,
        message: 'User banned successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async unbanUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userRepository = AppDataSource.getRepository(User);

      const user = await userRepository.findOne({
        where: { id: id }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.is_banned = false;
      await userRepository.save(user);

      res.json({
        success: true,
        message: 'User unbanned successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userRepository = AppDataSource.getRepository(User);

      const user = await userRepository.findOne({
        where: { id: id }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent deletion of admin users
      if (user.role === UserRole.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete admin users'
        });
      }

      await userRepository.remove(user);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSystemStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      
      const [
        totalUsers,
        activeUsers,
        adminUsers,
        verifiedUsers
      ] = await Promise.all([
        userRepository.count(),
        userRepository.count({ where: { last_login: MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) } }),
        userRepository.count({ where: { role: UserRole.ADMIN } }),
        userRepository.count({ where: { is_verified: true } })
      ]);

      res.json({
        success: true,
        data: {
          total_users: totalUsers,
          active_users: activeUsers,
          admin_users: adminUsers,
          verified_users: verifiedUsers,
          total_problems: 0, // TODO: implement when problem model is available
          total_contests: 0, // TODO: implement when contest model is available
          total_submissions: 0, // TODO: implement when submission model is available
          server_uptime: process.uptime(),
          memory_usage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
          cpu_usage: 0 // TODO: implement CPU usage monitoring
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async clearData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // This is a dangerous operation - only for development
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          message: 'Data clearing is not allowed in production'
        });
      }

      const userRepository = AppDataSource.getRepository(User);
      
      // Keep admin users but delete all others
      await userRepository.delete({ role: { $ne: UserRole.ADMIN } as any });

      res.json({
        success: true,
        message: 'Non-admin data cleared successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new manager (Admin only)
   */
  static async createManager(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { username, email, password, full_name, phone_number } = req.body;
      const userRepository = AppDataSource.getRepository(User);

      // Check if username or email already exists
      const existingUser = await userRepository.findOne({
        where: [
          { username },
          { email }
        ]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: existingUser.username === username 
            ? 'Username already exists' 
            : 'Email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new manager
      const manager = userRepository.create({
        username,
        email,
        password: hashedPassword,
        full_name,
        phone_number,
        role: UserRole.MANAGER,
        added_by: UserAddedBy.ADMIN,
        is_verified: true, // Managers created by admin are auto-verified
        is_active: true
      });

      await userRepository.save(manager);

      // Remove password from response
      const { password: _, ...managerData } = manager;

      logger.info(`Admin created new manager: ${manager.username}`);

      res.status(201).json({
        success: true,
        message: 'Manager created successfully',
        data: managerData
      });
    } catch (error) {
      logger.error('Error creating manager:', error);
      next(error);
    }
  }

  /**
   * Get all managers (Admin only)
   */
  static async getAllManagers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRepository = AppDataSource.getRepository(User);

      const managers = await userRepository.find({
        where: { role: UserRole.MANAGER },
        select: [
          'id', 'username', 'email', 'full_name', 'phone_number',
          'is_active', 'is_verified', 'created_at', 'last_login'
        ],
        order: { created_at: 'DESC' }
      });

      // Get student count for each manager
      const managersWithStats = await Promise.all(
        managers.map(async (manager) => {
          const studentCount = await userRepository.count({
            where: { managed_by: manager.id }
          });

          return {
            ...manager,
            studentCount
          };
        })
      );

      res.json({
        success: true,
        data: {
          total: managers.length,
          managers: managersWithStats
        }
      });
    } catch (error) {
      logger.error('Error fetching managers:', error);
      next(error);
    }
  }

  /**
   * Get specific manager details with their students (Admin only)
   */
  static async getManagerById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { managerId } = req.params;
      const userRepository = AppDataSource.getRepository(User);

      const manager = await userRepository.findOne({
        where: { 
          id: managerId,
          role: UserRole.MANAGER
        },
        select: [
          'id', 'username', 'email', 'full_name', 'phone_number',
          'is_active', 'is_verified', 'created_at', 'last_login'
        ]
      });

      if (!manager) {
        return res.status(404).json({
          success: false,
          message: 'Manager not found'
        });
      }

      // Get all students managed by this manager
      const students = await userRepository.find({
        where: { managed_by: managerId },
        select: [
          'id', 'username', 'email', 'full_name', 'rating', 
          'problems_solved', 'is_active', 'created_at'
        ]
      });

      res.json({
        success: true,
        data: {
          manager,
          students,
          studentCount: students.length
        }
      });
    } catch (error) {
      logger.error('Error fetching manager:', error);
      next(error);
    }
  }
}