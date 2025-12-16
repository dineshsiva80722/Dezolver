import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  requireManager,
  requireOrganizationAccess,
  requireActiveSubscription
} from '../middleware/rbac.middleware';

const router = Router();
const paymentController = new PaymentController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         organization_id:
 *           type: string
 *         subscription_id:
 *           type: string
 *         transaction_id:
 *           type: string
 *         payment_gateway:
 *           type: string
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded, cancelled]
 *         payment_method:
 *           type: string
 *         payment_date:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/payments/config:
 *   get:
 *     summary: Get Razorpay configuration for frontend
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     key_id:
 *                       type: string
 *       500:
 *         description: Server error
 */
router.get('/config', authenticate, paymentController.getConfig);

/**
 * @swagger
 * /api/payments/orders/subscription:
 *   post:
 *     summary: Create payment order for subscription
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscription_id
 *             properties:
 *               subscription_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment order created successfully
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Access denied
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Server error
 */
router.post(
  '/orders/subscription',
  authenticate,
  requireActiveSubscription,
  paymentController.createSubscriptionOrder
);

/**
 * @swagger
 * /api/payments/orders:
 *   post:
 *     summary: Create custom payment order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount in rupees
 *               description:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Payment order created successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/orders', authenticate, paymentController.createOrder);

/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     summary: Verify payment after successful payment on frontend
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpay_order_id
 *               - razorpay_payment_id
 *               - razorpay_signature
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Invalid signature or missing parameters
 *       404:
 *         description: Payment record not found
 *       500:
 *         description: Server error
 */
router.post('/verify', authenticate, paymentController.verifyPayment);

/**
 * @swagger
 * /api/payments/{paymentId}:
 *   get:
 *     summary: Get payment details
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.get('/:paymentId', authenticate, paymentController.getPayment);

/**
 * @swagger
 * /api/payments/organization/{organizationId}:
 *   get:
 *     summary: Get all payments for an organization
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get(
  '/organization/:organizationId',
  authenticate,
  requireManager,
  paymentController.getOrganizationPayments
);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Handle Razorpay webhook events
 *     tags: [Payments]
 *     description: This endpoint receives webhook notifications from Razorpay for payment events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature
 *       500:
 *         description: Server error
 */
router.post('/webhook', paymentController.handleWebhook);

export default router;
