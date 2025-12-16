import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Assessment, AssessmentType, AssessmentDifficulty } from '../models/Assessment.entity';
import { Question, QuestionType } from '../models/Question.entity';
import { QuestionOption } from '../models/QuestionOption.entity';
import { AssessmentAttempt, AttemptStatus } from '../models/AssessmentAttempt.entity';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { In } from 'typeorm';

export class AssessmentController {
  /**
   * Create a new assessment
   */
  static async createAssessment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        title,
        description,
        type,
        difficulty,
        duration_minutes,
        passing_percentage,
        total_marks,
        is_public,
        start_time,
        end_time,
      } = req.body;

      const assessmentRepository = AppDataSource.getRepository(Assessment);

      const assessment = new Assessment();
      assessment.title = title;
      assessment.description = description;
      assessment.type = type || AssessmentType.QUIZ;
      assessment.difficulty = difficulty || AssessmentDifficulty.MEDIUM;
      assessment.duration_minutes = duration_minutes;
      assessment.passing_percentage = passing_percentage || 60;
      assessment.total_marks = total_marks || 100;
      assessment.is_public = is_public || false;
      assessment.start_time = start_time ? new Date(start_time) : null;
      assessment.end_time = end_time ? new Date(end_time) : null;
      assessment.created_by = req.user?.userId || '';

      await assessmentRepository.save(assessment);

      logger.info(`Assessment created: ${assessment.id} by ${req.user?.username}`);

      res.status(201).json({
        success: true,
        message: 'Assessment created successfully',
        data: assessment,
      });
    } catch (error) {
      logger.error('Error creating assessment:', error);
      next(error);
    }
  }

  /**
   * Get all assessments
   */
  static async getAllAssessments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const assessmentRepository = AppDataSource.getRepository(Assessment);

      const assessments = await assessmentRepository.find({
        relations: ['creator', 'questions'],
        order: { created_at: 'DESC' },
      });

      res.json({
        success: true,
        data: {
          total: assessments.length,
          assessments,
        },
      });
    } catch (error) {
      logger.error('Error fetching assessments:', error);
      next(error);
    }
  }

  /**
   * Get assessment by ID with questions
   */
  static async getAssessmentById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const assessmentRepository = AppDataSource.getRepository(Assessment);

      const assessment = await assessmentRepository.findOne({
        where: { id },
        relations: ['creator', 'questions', 'questions.options'],
        order: {
          questions: {
            order_index: 'ASC',
            options: {
              order_index: 'ASC',
            },
          },
        },
      });

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found',
        });
      }

      res.json({
        success: true,
        data: assessment,
      });
    } catch (error) {
      logger.error('Error fetching assessment:', error);
      next(error);
    }
  }

  /**
   * Update assessment
   */
  static async updateAssessment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const assessmentRepository = AppDataSource.getRepository(Assessment);

      const assessment = await assessmentRepository.findOne({
        where: { id },
      });

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found',
        });
      }

      // Update allowed fields
      const allowedFields = [
        'title',
        'description',
        'type',
        'difficulty',
        'duration_minutes',
        'passing_percentage',
        'total_marks',
        'is_published',
        'is_public',
        'start_time',
        'end_time',
      ];

      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          (assessment as any)[field] = updates[field];
        }
      });

      await assessmentRepository.save(assessment);

      logger.info(`Assessment updated: ${assessment.id} by ${req.user?.username}`);

      res.json({
        success: true,
        message: 'Assessment updated successfully',
        data: assessment,
      });
    } catch (error) {
      logger.error('Error updating assessment:', error);
      next(error);
    }
  }

  /**
   * Delete assessment
   */
  static async deleteAssessment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const assessmentRepository = AppDataSource.getRepository(Assessment);

      const assessment = await assessmentRepository.findOne({
        where: { id },
      });

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found',
        });
      }

      await assessmentRepository.remove(assessment);

      logger.info(`Assessment deleted: ${id} by ${req.user?.username}`);

      res.json({
        success: true,
        message: 'Assessment deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting assessment:', error);
      next(error);
    }
  }

  /**
   * Add question to assessment
   */
  static async addQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { assessmentId } = req.params;
      const { question_text, type, explanation, marks, order_index, options, is_required } = req.body;

      const assessmentRepository = AppDataSource.getRepository(Assessment);
      const questionRepository = AppDataSource.getRepository(Question);
      const optionRepository = AppDataSource.getRepository(QuestionOption);

      const assessment = await assessmentRepository.findOne({
        where: { id: assessmentId },
      });

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found',
        });
      }

      const question = questionRepository.create({
        assessment_id: assessmentId,
        question_text,
        type: type || QuestionType.MULTIPLE_CHOICE,
        explanation,
        marks: marks || 1,
        order_index: order_index || 0,
        is_required: is_required !== undefined ? is_required : true,
      });

      await questionRepository.save(question);

      // Add options if provided
      if (options && Array.isArray(options) && options.length > 0) {
        const questionOptions = options.map((opt, index) =>
          optionRepository.create({
            question_id: question.id,
            option_text: opt.option_text,
            is_correct: opt.is_correct || false,
            order_index: opt.order_index !== undefined ? opt.order_index : index,
          })
        );

        await optionRepository.save(questionOptions);
        question.options = questionOptions;
      }

      logger.info(`Question added to assessment ${assessmentId} by ${req.user?.username}`);

      res.status(201).json({
        success: true,
        message: 'Question added successfully',
        data: question,
      });
    } catch (error) {
      logger.error('Error adding question:', error);
      next(error);
    }
  }

  /**
   * Update question
   */
  static async updateQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { questionId } = req.params;
      const updates = req.body;

      const questionRepository = AppDataSource.getRepository(Question);

      const question = await questionRepository.findOne({
        where: { id: questionId },
        relations: ['options'],
      });

      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found',
        });
      }

      // Update question fields
      const allowedFields = ['question_text', 'type', 'explanation', 'marks', 'order_index', 'is_required'];
      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          (question as any)[field] = updates[field];
        }
      });

      await questionRepository.save(question);

      // Update options if provided
      if (updates.options && Array.isArray(updates.options)) {
        const optionRepository = AppDataSource.getRepository(QuestionOption);

        // Delete existing options
        await optionRepository.delete({ question_id: questionId });

        // Create new options
        const questionOptions = updates.options.map((opt: any, index: number) =>
          optionRepository.create({
            question_id: questionId,
            option_text: opt.option_text,
            is_correct: opt.is_correct || false,
            order_index: opt.order_index !== undefined ? opt.order_index : index,
          })
        );

        await optionRepository.save(questionOptions);
        question.options = questionOptions;
      }

      logger.info(`Question updated: ${questionId} by ${req.user?.username}`);

      res.json({
        success: true,
        message: 'Question updated successfully',
        data: question,
      });
    } catch (error) {
      logger.error('Error updating question:', error);
      next(error);
    }
  }

  /**
   * Delete question
   */
  static async deleteQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { questionId } = req.params;
      const questionRepository = AppDataSource.getRepository(Question);

      const question = await questionRepository.findOne({
        where: { id: questionId },
      });

      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found',
        });
      }

      await questionRepository.remove(question);

      logger.info(`Question deleted: ${questionId} by ${req.user?.username}`);

      res.json({
        success: true,
        message: 'Question deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting question:', error);
      next(error);
    }
  }

  /**
   * Map multiple questions to assessment (bulk add)
   */
  static async mapQuestionsToAssessment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { assessmentId } = req.params;
      const { questions } = req.body;

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Questions array is required',
        });
      }

      const assessmentRepository = AppDataSource.getRepository(Assessment);
      const questionRepository = AppDataSource.getRepository(Question);
      const optionRepository = AppDataSource.getRepository(QuestionOption);

      const assessment = await assessmentRepository.findOne({
        where: { id: assessmentId },
      });

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found',
        });
      }

      const createdQuestions = [];

      for (const q of questions) {
        const question = questionRepository.create({
          assessment_id: assessmentId,
          question_text: q.question_text,
          type: q.type || QuestionType.MULTIPLE_CHOICE,
          explanation: q.explanation,
          marks: q.marks || 1,
          order_index: q.order_index || 0,
          is_required: q.is_required !== undefined ? q.is_required : true,
        });

        await questionRepository.save(question);

        // Add options if provided
        if (q.options && Array.isArray(q.options) && q.options.length > 0) {
          const questionOptions = q.options.map((opt: any, index: number) =>
            optionRepository.create({
              question_id: question.id,
              option_text: opt.option_text,
              is_correct: opt.is_correct || false,
              order_index: opt.order_index !== undefined ? opt.order_index : index,
            })
          );

          await optionRepository.save(questionOptions);
          question.options = questionOptions;
        }

        createdQuestions.push(question);
      }

      logger.info(`${createdQuestions.length} questions mapped to assessment ${assessmentId} by ${req.user?.username}`);

      res.status(201).json({
        success: true,
        message: `${createdQuestions.length} questions added successfully`,
        data: createdQuestions,
      });
    } catch (error) {
      logger.error('Error mapping questions:', error);
      next(error);
    }
  }

  /**
   * Start assessment attempt
   */
  static async startAttempt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { assessmentId } = req.params;
      const attemptRepository = AppDataSource.getRepository(AssessmentAttempt);
      const assessmentRepository = AppDataSource.getRepository(Assessment);

      const assessment = await assessmentRepository.findOne({
        where: { id: assessmentId },
      });

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found',
        });
      }

      // Check if assessment is published
      if (!assessment.is_published && assessment.created_by !== req.user?.userId) {
        return res.status(403).json({
          success: false,
          message: 'Assessment is not published',
        });
      }

      const attempt = attemptRepository.create({
        assessment_id: assessmentId,
        user_id: req.user?.userId,
        start_time: new Date(),
        status: AttemptStatus.IN_PROGRESS,
      });

      await attemptRepository.save(attempt);

      res.status(201).json({
        success: true,
        message: 'Assessment attempt started',
        data: attempt,
      });
    } catch (error) {
      logger.error('Error starting attempt:', error);
      next(error);
    }
  }

  /**
   * Submit assessment attempt
   */
  static async submitAttempt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { attemptId } = req.params;
      const { answers } = req.body;

      const attemptRepository = AppDataSource.getRepository(AssessmentAttempt);

      const attempt = await attemptRepository.findOne({
        where: { id: attemptId, user_id: req.user?.userId },
        relations: ['assessment', 'assessment.questions', 'assessment.questions.options'],
      });

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message: 'Attempt not found',
        });
      }

      if (attempt.status !== AttemptStatus.IN_PROGRESS) {
        return res.status(400).json({
          success: false,
          message: 'Attempt is not in progress',
        });
      }

      // Calculate score
      let score = 0;
      const assessment = attempt.assessment;

      for (const question of assessment.questions) {
        const userAnswer = answers[question.id];
        if (!userAnswer) continue;

        if (question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.TRUE_FALSE) {
          const correctOption = question.options.find((opt) => opt.is_correct);
          if (correctOption && userAnswer === correctOption.id) {
            score += question.marks;
          }
        } else if (question.type === QuestionType.MULTIPLE_SELECT) {
          const correctOptions = question.options.filter((opt) => opt.is_correct).map((opt) => opt.id);
          const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
          if (
            correctOptions.length === userAnswers.length &&
            correctOptions.every((id) => userAnswers.includes(id))
          ) {
            score += question.marks;
          }
        }
      }

      const percentage = (score / assessment.total_marks) * 100;
      const is_passed = percentage >= assessment.passing_percentage;

      attempt.end_time = new Date();
      attempt.answers = answers;
      attempt.score = score;
      attempt.percentage = percentage;
      attempt.is_passed = is_passed;
      attempt.status = AttemptStatus.COMPLETED;

      await attemptRepository.save(attempt);

      logger.info(`Assessment attempt submitted: ${attemptId} by ${req.user?.username}`);

      res.json({
        success: true,
        message: 'Attempt submitted successfully',
        data: {
          attempt_id: attempt.id,
          score,
          percentage,
          is_passed,
          total_marks: assessment.total_marks,
        },
      });
    } catch (error) {
      logger.error('Error submitting attempt:', error);
      next(error);
    }
  }

  /**
   * Get user's attempts for an assessment
   */
  static async getUserAttempts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { assessmentId } = req.params;
      const attemptRepository = AppDataSource.getRepository(AssessmentAttempt);

      const attempts = await attemptRepository.find({
        where: {
          assessment_id: assessmentId,
          user_id: req.user?.userId,
        },
        order: { created_at: 'DESC' },
      });

      res.json({
        success: true,
        data: {
          total: attempts.length,
          attempts,
        },
      });
    } catch (error) {
      logger.error('Error fetching attempts:', error);
      next(error);
    }
  }
}
