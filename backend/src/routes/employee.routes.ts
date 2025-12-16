import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const employeeController = new EmployeeController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Employee:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         employee_id:
 *           type: string
 *         user_id:
 *           type: string
 *         job_title:
 *           type: string
 *         department:
 *           type: string
 *         employment_type:
 *           type: string
 *           enum: [full_time, part_time, contract, intern]
 *         payment_frequency:
 *           type: string
 *           enum: [monthly, bi_weekly, weekly]
 *         basic_salary:
 *           type: number
 *         hire_date:
 *           type: string
 *           format: date
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create employee record (Admin only)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - job_title
 *               - department
 *               - hire_date
 *               - employment_type
 *               - payment_frequency
 *               - basic_salary
 *             properties:
 *               user_id:
 *                 type: string
 *               job_title:
 *                 type: string
 *               department:
 *                 type: string
 *               manager_id:
 *                 type: string
 *               hire_date:
 *                 type: string
 *                 format: date
 *               employment_type:
 *                 type: string
 *                 enum: [full_time, part_time, contract, intern]
 *               work_hours_per_week:
 *                 type: number
 *                 default: 40
 *               payment_frequency:
 *                 type: string
 *                 enum: [monthly, bi_weekly, weekly]
 *               basic_salary:
 *                 type: number
 *               salary_components:
 *                 type: object
 *               deductions:
 *                 type: object
 *               tax_preferences:
 *                 type: object
 *               bank_details:
 *                 type: object
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, employeeController.createEmployee);

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: employment_type
 *         schema:
 *           type: string
 *           enum: [full_time, part_time, contract, intern]
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: manager_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employees retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, employeeController.getEmployees);

/**
 * @swagger
 * /api/employees/search:
 *   get:
 *     summary: Search employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: employment_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
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
 *         description: Search results
 *       500:
 *         description: Server error
 */
router.get('/search', authenticate, employeeController.searchEmployees);

/**
 * @swagger
 * /api/employees/departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Departments retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/departments', authenticate, employeeController.getDepartments);

/**
 * @swagger
 * /api/employees/managers:
 *   get:
 *     summary: Get all managers
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Managers retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/managers', authenticate, employeeController.getManagers);

/**
 * @swagger
 * /api/employees/me:
 *   get:
 *     summary: Get my employee record
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee record retrieved successfully
 *       404:
 *         description: Employee record not found
 *       500:
 *         description: Server error
 */
router.get('/me', authenticate, employeeController.getMyEmployeeRecord);

/**
 * @swagger
 * /api/employees/me/reports:
 *   get:
 *     summary: Get my direct reports
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Direct reports retrieved successfully
 *       404:
 *         description: Employee record not found
 *       500:
 *         description: Server error
 */
router.get('/me/reports', authenticate, employeeController.getMyDirectReports);

/**
 * @swagger
 * /api/employees/user/{userId}:
 *   get:
 *     summary: Get employee by user ID
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.get('/user/:userId', authenticate, employeeController.getEmployeeByUserId);

/**
 * @swagger
 * /api/employees/{employeeId}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee retrieved successfully
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.get('/:employeeId', authenticate, employeeController.getEmployee);

/**
 * @swagger
 * /api/employees/{employeeId}:
 *   patch:
 *     summary: Update employee (Admin only)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               job_title:
 *                 type: string
 *               department:
 *                 type: string
 *               manager_id:
 *                 type: string
 *               employment_type:
 *                 type: string
 *               basic_salary:
 *                 type: number
 *               salary_components:
 *                 type: object
 *               deductions:
 *                 type: object
 *               tax_preferences:
 *                 type: object
 *               bank_details:
 *                 type: object
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.patch('/:employeeId', authenticate, employeeController.updateEmployee);

/**
 * @swagger
 * /api/employees/{employeeId}/terminate:
 *   patch:
 *     summary: Terminate employee (Admin only)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
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
 *               - termination_date
 *             properties:
 *               termination_date:
 *                 type: string
 *                 format: date
 *               termination_reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee terminated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.patch('/:employeeId/terminate', authenticate, employeeController.terminateEmployee);

/**
 * @swagger
 * /api/employees/{employeeId}/reactivate:
 *   patch:
 *     summary: Reactivate employee (Admin only)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee reactivated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.patch('/:employeeId/reactivate', authenticate, employeeController.reactivateEmployee);

/**
 * @swagger
 * /api/employees/{employeeId}/reports:
 *   get:
 *     summary: Get direct reports of an employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Direct reports retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/:employeeId/reports', authenticate, employeeController.getDirectReports);

/**
 * @swagger
 * /api/employees/{employeeId}/compensation:
 *   get:
 *     summary: Calculate total compensation for employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Compensation calculated successfully
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.get('/:employeeId/compensation', authenticate, employeeController.calculateTotalCompensation);

/**
 * @swagger
 * /api/employees/{employeeId}/bank-details/verify:
 *   patch:
 *     summary: Verify employee bank details (Admin only)
 *     tags: [Employee Banking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bank details verified successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Employee or bank details not found
 *       500:
 *         description: Server error
 */
router.patch('/:employeeId/bank-details/verify', authenticate, (req, res) => {
  // This will be handled by the employee controller
  const employeeController = new (require('../controllers/employee.controller').EmployeeController)();
  return employeeController.verifyBankDetails(req, res);
});

export default router;