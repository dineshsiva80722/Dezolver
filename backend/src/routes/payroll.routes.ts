import { Router } from 'express';
import { PayrollController } from '../controllers/payroll.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const payrollController = new PayrollController();

/**
 * @swagger
 * components:
 *   schemas:
 *     PayrollRecord:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         payroll_id:
 *           type: string
 *         employee_id:
 *           type: string
 *         pay_period_start:
 *           type: string
 *           format: date
 *         pay_period_end:
 *           type: string
 *           format: date
 *         working_days:
 *           type: number
 *         days_worked:
 *           type: number
 *         overtime_hours:
 *           type: number
 *         leave_days:
 *           type: number
 *         basic_salary:
 *           type: number
 *         gross_salary:
 *           type: number
 *         total_deductions:
 *           type: number
 *         net_salary:
 *           type: number
 *         status:
 *           type: string
 *           enum: [draft, processed, paid, cancelled]
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/payroll/calculate:
 *   post:
 *     summary: Calculate payroll for an employee (Admin only)
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_id
 *               - pay_period_start
 *               - pay_period_end
 *               - working_days
 *               - days_worked
 *             properties:
 *               employee_id:
 *                 type: string
 *               pay_period_start:
 *                 type: string
 *                 format: date
 *               pay_period_end:
 *                 type: string
 *                 format: date
 *               working_days:
 *                 type: number
 *               days_worked:
 *                 type: number
 *               overtime_hours:
 *                 type: number
 *               leave_days:
 *                 type: number
 *               bonuses:
 *                 type: number
 *               incentives:
 *                 type: number
 *               custom_allowances:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     amount:
 *                       type: number
 *               custom_deductions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     amount:
 *                       type: number
 *     responses:
 *       201:
 *         description: Payroll calculated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.post('/calculate', authenticate, payrollController.calculatePayroll);

/**
 * @swagger
 * /api/payroll/batch-calculate:
 *   post:
 *     summary: Calculate payroll for multiple employees (Admin only)
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_ids
 *               - pay_period_start
 *               - pay_period_end
 *               - working_days
 *             properties:
 *               employee_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               pay_period_start:
 *                 type: string
 *                 format: date
 *               pay_period_end:
 *                 type: string
 *                 format: date
 *               working_days:
 *                 type: number
 *     responses:
 *       201:
 *         description: Batch payroll calculated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: No valid employees found
 *       500:
 *         description: Server error
 */
router.post('/batch-calculate', authenticate, payrollController.batchCalculatePayroll);

/**
 * @swagger
 * /api/payroll/{payrollId}/process:
 *   patch:
 *     summary: Process payroll record (Admin only)
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payrollId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payroll processed successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Payroll record not found
 *       500:
 *         description: Server error
 */
router.patch('/:payrollId/process', authenticate, payrollController.processPayroll);

/**
 * @swagger
 * /api/payroll/{payrollId}/mark-paid:
 *   patch:
 *     summary: Mark payroll as paid (Admin only)
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payrollId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_date
 *               - payment_reference
 *             properties:
 *               payment_date:
 *                 type: string
 *                 format: date
 *               payment_reference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payroll marked as paid successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Payroll record not found
 *       500:
 *         description: Server error
 */
router.patch('/:payrollId/mark-paid', authenticate, payrollController.markPayrollAsPaid);

/**
 * @swagger
 * /api/payroll/employee/{employeeId}:
 *   get:
 *     summary: Get payroll records for an employee
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Payroll records retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.get('/employee/:employeeId', authenticate, payrollController.getEmployeePayrolls);

/**
 * @swagger
 * /api/payroll/my:
 *   get:
 *     summary: Get my payroll records
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Payroll records retrieved successfully
 *       404:
 *         description: Employee record not found
 *       500:
 *         description: Server error
 */
router.get('/my', authenticate, payrollController.getMyPayrolls);

/**
 * @swagger
 * /api/payroll/summary:
 *   get:
 *     summary: Get payroll summary (Admin only)
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payroll summary retrieved successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/summary', authenticate, payrollController.getPayrollSummary);

// Salary Slip Routes

/**
 * @swagger
 * /api/payroll/{payrollId}/salary-slip/generate:
 *   post:
 *     summary: Generate salary slip (Admin only)
 *     tags: [Salary Slips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payrollId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Salary slip generated successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post('/:payrollId/salary-slip/generate', authenticate, payrollController.generateSalarySlip);

/**
 * @swagger
 * /api/payroll/salary-slips/batch-generate:
 *   post:
 *     summary: Generate salary slips in batch (Admin only)
 *     tags: [Salary Slips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payroll_ids
 *             properties:
 *               payroll_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Salary slips generated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post('/salary-slips/batch-generate', authenticate, payrollController.batchGenerateSalarySlips);

/**
 * @swagger
 * /api/payroll/{payrollId}/salary-slip/download:
 *   get:
 *     summary: Download salary slip
 *     tags: [Salary Slips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payrollId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Salary slip download info
 *       404:
 *         description: Salary slip not found
 *       500:
 *         description: Server error
 */
router.get('/:payrollId/salary-slip/download', authenticate, payrollController.downloadSalarySlip);

export default router;