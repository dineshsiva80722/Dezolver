import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User.entity';
import { Submission } from '../models/Submission.entity';
import { AssessmentAttempt } from '../models/AssessmentAttempt.entity';
import { AuthRequest } from '../middleware/auth.middleware';
import { SubmissionVerdict } from '../types/enums';

const userRepository = AppDataSource.getRepository(User);
const submissionRepository = AppDataSource.getRepository(Submission);
const assessmentAttemptRepository = AppDataSource.getRepository(AssessmentAttempt);

export class UserController {
  static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const user = await userRepository.findOne({
        where: { id: userId },
        select: [
          'id',
          'username',
          'email',
          'full_name',
          'bio',
          'country',
          'rating',
          'max_rating',
          'problems_solved',
          'contests_participated_count',
          'created_at',
          'last_login',
          'phone_number',
          'avatar_url',
          'institution',
          'github_username',
          'linkedin_url',
          'website_url'
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get submission statistics
      const totalSubmissions = await submissionRepository.count({
        where: { user_id: userId }
      });

      const acceptedSubmissions = await submissionRepository.count({
        where: {
          user_id: userId,
          verdict: SubmissionVerdict.ACCEPTED
        }
      });

      // Get assessment statistics
      const assessmentAttempts = await assessmentAttemptRepository.find({
        where: { user_id: userId },
        relations: ['assessment'],
        order: { created_at: 'DESC' },
        take: 10
      });

      const totalAssessmentAttempts = assessmentAttempts.length;
      const completedAssessments = assessmentAttempts.filter(
        (a) => a.status === 'completed' || a.status === 'evaluated'
      ).length;
      const passedAssessments = assessmentAttempts.filter((a) => a.is_passed).length;
      const averageScore =
        totalAssessmentAttempts > 0
          ? assessmentAttempts.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0) /
            totalAssessmentAttempts
          : 0;

      const userData = {
        ...user,
        total_submissions: totalSubmissions,
        accepted_submissions: acceptedSubmissions,
        assessment_stats: {
          total_attempts: totalAssessmentAttempts,
          completed_assessments: completedAssessments,
          passed_assessments: passedAssessments,
          average_score: Math.round(averageScore * 100) / 100,
          recent_attempts: assessmentAttempts.slice(0, 5).map((attempt) => ({
            id: attempt.id,
            assessment_id: attempt.assessment_id,
            assessment_title: attempt.assessment?.title,
            status: attempt.status,
            score: attempt.score,
            percentage: attempt.percentage,
            is_passed: attempt.is_passed,
            start_time: attempt.start_time,
            end_time: attempt.end_time,
            created_at: attempt.created_at
          }))
        }
      };

      res.json({
        success: true,
        data: userData
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const updates = req.body;

      // Fields that users can update
      const allowedFields = [
        'full_name',
        'bio',
        'country',
        'github_username',
        'linkedin_url',
        'website_url'
      ];

      const user = await userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update only allowed fields
      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          (user as any)[field] = updates[field];
        }
      });

      await userRepository.save(user);

      res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await userRepository.findOne({
        where: { id },
        select: [
          'id',
          'username',
          'full_name',
          'bio',
          'country',
          'rating',
          'max_rating',
          'problems_solved',
          'contests_participated_count',
          'created_at'
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      // Get user data from database
      const user = await userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get total submissions from database
      const totalSubmissions = await submissionRepository.count({
        where: { user_id: userId }
      });

      // Get accepted submissions from database
      const acceptedSubmissions = await submissionRepository.count({
        where: {
          user_id: userId,
          verdict: SubmissionVerdict.ACCEPTED
        }
      });

      // Get difficulty breakdown from database
      const difficultyStats = await AppDataSource.query(
        `
        SELECT
          p.difficulty,
          COUNT(DISTINCT p.id) as count
        FROM problems p
        INNER JOIN submissions s ON p.id = s.problem_id
        WHERE s.user_id = $1 AND s.verdict = 'accepted'
        GROUP BY p.difficulty
      `,
        [userId]
      );

      // Map difficulty stats
      const difficultyBreakdown = {
        easy: 0,
        medium: 0,
        hard: 0
      };

      difficultyStats.forEach((stat: any) => {
        const difficulty = stat.difficulty.toLowerCase();
        if (difficulty in difficultyBreakdown) {
          difficultyBreakdown[difficulty as keyof typeof difficultyBreakdown] = parseInt(
            stat.count
          );
        }
      });

      // Get weekly and monthly activity from database
      const activityStats = await AppDataSource.query(
        `
        SELECT
          COUNT(CASE WHEN s.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as weekly_activity,
          COUNT(CASE WHEN s.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as monthly_activity
        FROM submissions s
        WHERE s.user_id = $1
      `,
        [userId]
      );

      // Get assessment statistics
      const assessmentAttempts = await assessmentAttemptRepository.find({
        where: { user_id: userId },
        relations: ['assessment'],
        order: { created_at: 'DESC' }
      });

      const totalAssessmentAttempts = assessmentAttempts.length;
      const completedAssessments = assessmentAttempts.filter(
        (a) => a.status === 'completed' || a.status === 'evaluated'
      ).length;
      const passedAssessments = assessmentAttempts.filter((a) => a.is_passed).length;
      const averageAssessmentScore =
        totalAssessmentAttempts > 0
          ? assessmentAttempts.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0) /
            totalAssessmentAttempts
          : 0;

      const stats = {
        problemsSolved: user.problems_solved || 0,
        totalSubmissions,
        acceptedSubmissions,
        currentRating: user.rating || 1200,
        maxRating: user.max_rating || user.rating || 1200,
        contestsParticipated: user.contests_participated_count || 0,
        weeklyActivity: parseInt(activityStats[0]?.weekly_activity) || 0,
        monthlyActivity: parseInt(activityStats[0]?.monthly_activity) || 0,
        recentSubmissions: [],
        difficultyBreakdown,
        assessments: {
          total_attempts: totalAssessmentAttempts,
          completed: completedAssessments,
          passed: passedAssessments,
          average_score: Math.round(averageAssessmentScore * 100) / 100
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserStatsByUserId(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      // Get user data from database
      const user = await userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get total submissions from database
      const totalSubmissions = await submissionRepository.count({
        where: { user_id: userId }
      });

      // Get accepted submissions from database
      const acceptedSubmissions = await submissionRepository.count({
        where: {
          user_id: userId,
          verdict: SubmissionVerdict.ACCEPTED
        }
      });

      // Get difficulty breakdown from database
      const difficultyStats = await AppDataSource.query(
        `
        SELECT
          p.difficulty,
          COUNT(DISTINCT p.id) as count
        FROM problems p
        INNER JOIN submissions s ON p.id = s.problem_id
        WHERE s.user_id = $1 AND s.verdict = 'accepted'
        GROUP BY p.difficulty
      `,
        [userId]
      );

      // Map difficulty stats
      const difficultyBreakdown = {
        easy: 0,
        medium: 0,
        hard: 0
      };

      difficultyStats.forEach((stat: any) => {
        const difficulty = stat.difficulty.toLowerCase();
        if (difficulty in difficultyBreakdown) {
          difficultyBreakdown[difficulty as keyof typeof difficultyBreakdown] = parseInt(
            stat.count
          );
        }
      });

      // Get weekly and monthly activity from database
      const activityStats = await AppDataSource.query(
        `
        SELECT
          COUNT(CASE WHEN s.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as weekly_activity,
          COUNT(CASE WHEN s.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as monthly_activity
        FROM submissions s
        WHERE s.user_id = $1
      `,
        [userId]
      );

      // Get assessment statistics
      const assessmentAttempts = await assessmentAttemptRepository.find({
        where: { user_id: userId },
        relations: ['assessment'],
        order: { created_at: 'DESC' }
      });

      const totalAssessmentAttempts = assessmentAttempts.length;
      const completedAssessments = assessmentAttempts.filter(
        (a) => a.status === 'completed' || a.status === 'evaluated'
      ).length;
      const passedAssessments = assessmentAttempts.filter((a) => a.is_passed).length;
      const averageAssessmentScore =
        totalAssessmentAttempts > 0
          ? assessmentAttempts.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0) /
            totalAssessmentAttempts
          : 0;

      const stats = {
        problemsSolved: user.problems_solved || 0,
        totalSubmissions,
        acceptedSubmissions,
        currentRating: user.rating || 1200,
        maxRating: user.max_rating || user.rating || 1200,
        contestsParticipated: user.contests_participated_count || 0,
        weeklyActivity: parseInt(activityStats[0]?.weekly_activity) || 0,
        monthlyActivity: parseInt(activityStats[0]?.monthly_activity) || 0,
        recentSubmissions: [],
        difficultyBreakdown,
        assessments: {
          total_attempts: totalAssessmentAttempts,
          completed: completedAssessments,
          passed: passedAssessments,
          average_score: Math.round(averageAssessmentScore * 100) / 100
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}
