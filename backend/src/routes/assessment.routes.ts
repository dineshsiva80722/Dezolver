import { Router } from 'express';
import { AssessmentController } from '../controllers/assessment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types/enums';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Assessment CRUD (Admin/Problem Setter only)
router.post('/', authorize(UserRole.ADMIN, UserRole.PROBLEM_SETTER), AssessmentController.createAssessment);
router.get('/', AssessmentController.getAllAssessments);
router.get('/:id', AssessmentController.getAssessmentById);
router.put('/:id', authorize(UserRole.ADMIN, UserRole.PROBLEM_SETTER), AssessmentController.updateAssessment);
router.delete('/:id', authorize(UserRole.ADMIN, UserRole.PROBLEM_SETTER), AssessmentController.deleteAssessment);

// Question management (Admin/Problem Setter only)
router.post('/:assessmentId/questions', authorize(UserRole.ADMIN, UserRole.PROBLEM_SETTER), AssessmentController.addQuestion);
router.put('/questions/:questionId', authorize(UserRole.ADMIN, UserRole.PROBLEM_SETTER), AssessmentController.updateQuestion);
router.delete('/questions/:questionId', authorize(UserRole.ADMIN, UserRole.PROBLEM_SETTER), AssessmentController.deleteQuestion);

// Bulk question mapping (Admin/Problem Setter only)
router.post('/:assessmentId/questions/bulk', authorize(UserRole.ADMIN, UserRole.PROBLEM_SETTER), AssessmentController.mapQuestionsToAssessment);

// Assessment attempts (All authenticated users)
router.post('/:assessmentId/attempts', AssessmentController.startAttempt);
router.put('/attempts/:attemptId/submit', AssessmentController.submitAttempt);
router.get('/:assessmentId/attempts/me', AssessmentController.getUserAttempts);

export default router;
