import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User.entity';
import { UserRole, UserAddedBy } from '../types/enums';
import { AuthRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

const userRepository = AppDataSource.getRepository(User);

export class ManagerController {
  /**
   * Add a new student (Manager only)
   */
  static async addStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const managerId = req.user!.userId;
      const { username, email, password, full_name, phone_number } = req.body;

      // Verify the requester is a manager
      const manager = await userRepository.findOne({ where: { id: managerId } });

      if (!manager || manager.role !== UserRole.MANAGER) {
        return res.status(403).json({
          success: false,
          message: 'Only managers can add students'
        });
      }

      // Check if username or email already exists
      const existingUser = await userRepository.findOne({
        where: [{ username }, { email }]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            existingUser.username === username ? 'Username already exists' : 'Email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new student
      const student = userRepository.create({
        username,
        email,
        password: hashedPassword,
        full_name,
        phone_number,
        role: UserRole.USER,
        managed_by: managerId,
        added_by: UserAddedBy.MANAGER,
        is_verified: true // Students added by managers are auto-verified
      });

      await userRepository.save(student);

      // Remove password from response
      const { password: _, ...studentData } = student;

      logger.info(`Manager ${manager.username} added student ${student.username}`);

      res.status(201).json({
        success: true,
        message: 'Student added successfully',
        data: studentData
      });
    } catch (error) {
      logger.error('Error adding student:', error);
      next(error);
    }
  }

  /**
   * Get all students managed by this manager
   */
  static async getMyStudents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const managerId = req.user!.userId;

      // Verify the requester is a manager
      const manager = await userRepository.findOne({ where: { id: managerId } });

      if (!manager || manager.role !== UserRole.MANAGER) {
        return res.status(403).json({
          success: false,
          message: 'Only managers can view their students'
        });
      }

      // Get all students managed by this manager
      const students = await userRepository.find({
        where: { managed_by: managerId },
        select: [
          'id',
          'username',
          'email',
          'full_name',
          'phone_number',
          'rating',
          'max_rating',
          'problems_solved',
          'contests_participated_count',
          'is_active',
          'created_at',
          'last_login'
        ],
        order: { created_at: 'DESC' }
      });

      res.json({
        success: true,
        data: {
          total: students.length,
          students
        }
      });
    } catch (error) {
      logger.error('Error fetching students:', error);
      next(error);
    }
  }

  /**
   * Get a specific student's details (Manager can only see their own students)
   */
  static async getStudentById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const managerId = req.user!.userId;
      const { studentId } = req.params;

      // Verify the requester is a manager
      const manager = await userRepository.findOne({ where: { id: managerId } });

      if (!manager || manager.role !== UserRole.MANAGER) {
        return res.status(403).json({
          success: false,
          message: 'Only managers can view student details'
        });
      }

      // Get student and verify they belong to this manager
      const student = await userRepository.findOne({
        where: {
          id: studentId,
          managed_by: managerId
        },
        select: [
          'id',
          'username',
          'email',
          'full_name',
          'phone_number',
          'rating',
          'max_rating',
          'problems_solved',
          'contests_participated_count',
          'is_active',
          'is_verified',
          'created_at',
          'last_login',
          'country',
          'institution'
        ]
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found or does not belong to you'
        });
      }

      res.json({
        success: true,
        data: student
      });
    } catch (error) {
      logger.error('Error fetching student:', error);
      next(error);
    }
  }

  /**
   * Update a student's information (Manager only for their students)
   */
  static async updateStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const managerId = req.user!.userId;
      const { studentId } = req.params;
      const updates = req.body;

      // Verify the requester is a manager
      const manager = await userRepository.findOne({ where: { id: managerId } });

      if (!manager || manager.role !== UserRole.MANAGER) {
        return res.status(403).json({
          success: false,
          message: 'Only managers can update student information'
        });
      }

      // Get student and verify they belong to this manager
      const student = await userRepository.findOne({
        where: {
          id: studentId,
          managed_by: managerId
        }
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found or does not belong to you'
        });
      }

      // Fields that managers can update
      const allowedFields = ['full_name', 'phone_number', 'institution', 'country'];

      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          (student as any)[field] = updates[field];
        }
      });

      await userRepository.save(student);

      logger.info(`Manager ${manager.username} updated student ${student.username}`);

      res.json({
        success: true,
        message: 'Student updated successfully',
        data: student
      });
    } catch (error) {
      logger.error('Error updating student:', error);
      next(error);
    }
  }

  /**
   * Deactivate a student (Manager only for their students)
   */
  static async deactivateStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const managerId = req.user!.userId;
      const { studentId } = req.params;

      // Verify the requester is a manager
      const manager = await userRepository.findOne({ where: { id: managerId } });

      if (!manager || manager.role !== UserRole.MANAGER) {
        return res.status(403).json({
          success: false,
          message: 'Only managers can deactivate students'
        });
      }

      // Get student and verify they belong to this manager
      const student = await userRepository.findOne({
        where: {
          id: studentId,
          managed_by: managerId
        }
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found or does not belong to you'
        });
      }

      student.is_active = false;
      await userRepository.save(student);

      logger.info(`Manager ${manager.username} deactivated student ${student.username}`);

      res.json({
        success: true,
        message: 'Student deactivated successfully'
      });
    } catch (error) {
      logger.error('Error deactivating student:', error);
      next(error);
    }
  }

  /**
   * Reactivate a student (Manager only for their students)
   */
  static async reactivateStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const managerId = req.user!.userId;
      const { studentId } = req.params;

      // Verify the requester is a manager
      const manager = await userRepository.findOne({ where: { id: managerId } });

      if (!manager || manager.role !== UserRole.MANAGER) {
        return res.status(403).json({
          success: false,
          message: 'Only managers can reactivate students'
        });
      }

      // Get student and verify they belong to this manager
      const student = await userRepository.findOne({
        where: {
          id: studentId,
          managed_by: managerId
        }
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found or does not belong to you'
        });
      }

      student.is_active = true;
      await userRepository.save(student);

      logger.info(`Manager ${manager.username} reactivated student ${student.username}`);

      res.json({
        success: true,
        message: 'Student reactivated successfully'
      });
    } catch (error) {
      logger.error('Error reactivating student:', error);
      next(error);
    }
  }

  /**
   * Get manager dashboard statistics
   */
  static async getManagerStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const managerId = req.user!.userId;

      // Verify the requester is a manager
      const manager = await userRepository.findOne({ where: { id: managerId } });

      if (!manager || manager.role !== UserRole.MANAGER) {
        return res.status(403).json({
          success: false,
          message: 'Only managers can view statistics'
        });
      }

      // Get statistics
      const totalStudents = await userRepository.count({
        where: { managed_by: managerId }
      });

      const activeStudents = await userRepository.count({
        where: {
          managed_by: managerId,
          is_active: true
        }
      });

      const students = await userRepository.find({
        where: { managed_by: managerId },
        select: ['problems_solved', 'rating', 'contests_participated_count']
      });

      const totalProblemsSolved = students.reduce((sum, s) => sum + (s.problems_solved || 0), 0);
      const averageRating =
        students.length > 0
          ? Math.round(students.reduce((sum, s) => sum + (s.rating || 0), 0) / students.length)
          : 0;
      const totalContests = students.reduce(
        (sum, s) => sum + (s.contests_participated_count || 0),
        0
      );

      res.json({
        success: true,
        data: {
          totalStudents,
          activeStudents,
          inactiveStudents: totalStudents - activeStudents,
          totalProblemsSolved,
          averageRating,
          totalContests,
          manager: {
            id: manager.id,
            username: manager.username,
            full_name: manager.full_name
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching manager stats:', error);
      next(error);
    }
  }
}
