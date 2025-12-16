import { Router } from 'express';
import { CompanyBankController } from '../controllers/company-bank.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const companyBankController = new CompanyBankController();

/**
 * @swagger
 * components:
 *   schemas:
 *     CompanyBankDetails:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         company_name:
 *           type: string
 *         account_holder_name:
 *           type: string
 *         account_number:
 *           type: string
 *         ifsc_code:
 *           type: string
 *         bank_name:
 *           type: string
 *         branch_name:
 *           type: string
 *         gst_number:
 *           type: string
 *         pan_number:
 *           type: string
 *         is_primary:
 *           type: boolean
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/company-bank:
 *   post:
 *     summary: Create company bank details (Admin only)
 *     tags: [Company Banking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_name
 *               - account_holder_name
 *               - account_number
 *               - ifsc_code
 *               - bank_name
 *             properties:
 *               company_name:
 *                 type: string
 *               account_holder_name:
 *                 type: string
 *               account_number:
 *                 type: string
 *               ifsc_code:
 *                 type: string
 *                 pattern: '^[A-Z]{4}0[A-Z0-9]{6}$'
 *               bank_name:
 *                 type: string
 *               branch_name:
 *                 type: string
 *               branch_address:
 *                 type: string
 *               swift_code:
 *                 type: string
 *               account_type:
 *                 type: string
 *               gst_number:
 *                 type: string
 *               pan_number:
 *                 type: string
 *               company_registration_number:
 *                 type: string
 *               additional_details:
 *                 type: object
 *     responses:
 *       201:
 *         description: Company bank details created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, companyBankController.createCompanyBankDetails);

/**
 * @swagger
 * /api/company-bank:
 *   get:
 *     summary: Get all company bank details
 *     tags: [Company Banking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: boolean
 *         description: Include inactive bank details
 *     responses:
 *       200:
 *         description: Company bank details retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, companyBankController.getCompanyBankDetails);

/**
 * @swagger
 * /api/company-bank/primary:
 *   get:
 *     summary: Get primary company bank details
 *     tags: [Company Banking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Primary bank details retrieved successfully
 *       404:
 *         description: No primary bank details found
 *       500:
 *         description: Server error
 */
router.get('/primary', authenticate, companyBankController.getPrimaryBankDetails);

/**
 * @swagger
 * /api/company-bank/{bankId}:
 *   patch:
 *     summary: Update company bank details (Admin only)
 *     tags: [Company Banking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bankId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company_name:
 *                 type: string
 *               account_holder_name:
 *                 type: string
 *               account_number:
 *                 type: string
 *               ifsc_code:
 *                 type: string
 *               bank_name:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Bank details updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Bank details not found
 *       500:
 *         description: Server error
 */
router.patch('/:bankId', authenticate, companyBankController.updateCompanyBankDetails);

/**
 * @swagger
 * /api/company-bank/{bankId}/set-primary:
 *   patch:
 *     summary: Set as primary bank details (Admin only)
 *     tags: [Company Banking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bankId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Primary bank details set successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Bank details not found
 *       500:
 *         description: Server error
 */
router.patch('/:bankId/set-primary', authenticate, companyBankController.setPrimaryBankDetails);

/**
 * @swagger
 * /api/company-bank/{bankId}/verify:
 *   patch:
 *     summary: Verify bank details (Admin only)
 *     tags: [Company Banking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bankId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bank details verified successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Bank details not found
 *       500:
 *         description: Server error
 */
router.patch('/:bankId/verify', authenticate, companyBankController.verifyBankDetails);

/**
 * @swagger
 * /api/company-bank/{bankId}:
 *   delete:
 *     summary: Delete company bank details (Admin only)
 *     tags: [Company Banking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bankId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bank details deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Bank details not found
 *       500:
 *         description: Server error
 */
router.delete('/:bankId', authenticate, companyBankController.deleteCompanyBankDetails);

export default router;
