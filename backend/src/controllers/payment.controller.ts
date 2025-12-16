import { Request, Response } from 'express';
import { RazorpayService } from '../services/razorpay.service';
import { PaymentStatus } from '../models/Payment.entity';
import { AppDataSource } from '../config/database';
import { Payment } from '../models/Payment.entity';
import { Subscription } from '../models/Subscription.entity';

export class PaymentController {
  private razorpayService: RazorpayService;

  constructor() {
    this.razorpayService = new RazorpayService();
  }

  /**
   * Get Razorpay configuration (key) for frontend
   */
  getConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const key = this.razorpayService.getRazorpayKey();

      res.status(200).json({
        success: true,
        data: {
          key_id: key,
        },
      });
    } catch (error) {
      console.error('Get config error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment configuration',
      });
    }
  };

  /**
   * Create payment order for subscription
   */
  createSubscriptionOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { subscription_id } = req.body;
      const currentUser = (req as any).user;

      if (!subscription_id) {
        res.status(400).json({
          success: false,
          message: 'Subscription ID is required',
        });
        return;
      }

      // Get subscription details
      const subscriptionRepo = AppDataSource.getRepository(Subscription);
      const subscription = await subscriptionRepo.findOne({
        where: { id: subscription_id },
        relations: ['organization'],
      });

      if (!subscription) {
        res.status(404).json({
          success: false,
          message: 'Subscription not found',
        });
        return;
      }

      // Check if user has access to this subscription
      if (
        currentUser.organization_id !== subscription.organization_id &&
        currentUser.tier !== 'platform'
      ) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      // Create order
      const { order, payment } = await this.razorpayService.createSubscriptionOrder({
        subscription_id: subscription.id,
        organization_id: subscription.organization_id,
        plan_name: subscription.plan,
        amount: Number(subscription.total_amount),
        billing_cycle: subscription.billing_cycle,
      });

      res.status(201).json({
        success: true,
        message: 'Payment order created successfully',
        data: {
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          key_id: this.razorpayService.getRazorpayKey(),
          payment_id: payment.id,
        },
      });
    } catch (error) {
      console.error('Create subscription order error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create payment order',
      });
    }
  };

  /**
   * Create custom payment order
   */
  createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { amount, description, metadata } = req.body;
      const currentUser = (req as any).user;

      if (!amount || amount <= 0) {
        res.status(400).json({
          success: false,
          message: 'Valid amount is required',
        });
        return;
      }

      if (!currentUser.organization_id) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required',
        });
        return;
      }

      // Create Razorpay order
      const order = await this.razorpayService.createOrder({
        amount,
        currency: 'INR',
        receipt: `order_${currentUser.organization_id}_${Date.now()}`,
        notes: metadata || {},
      });

      // Create payment record
      const payment = await this.razorpayService.createPaymentRecord({
        organization_id: currentUser.organization_id,
        razorpay_order_id: order.id,
        amount,
        currency: 'INR',
        status: PaymentStatus.PENDING,
        payment_method: 'razorpay' as any,
        description: description || 'Payment for services',
        metadata,
      });

      res.status(201).json({
        success: true,
        message: 'Payment order created successfully',
        data: {
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          key_id: this.razorpayService.getRazorpayKey(),
          payment_id: payment.id,
        },
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create payment order',
      });
    }
  };

  /**
   * Verify payment after successful payment on frontend
   */
  verifyPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const currentUser = (req as any).user;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        res.status(400).json({
          success: false,
          message: 'Missing payment verification parameters',
        });
        return;
      }

      // Verify signature
      const isValid = this.razorpayService.verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      if (!isValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid payment signature',
        });
        return;
      }

      // Fetch payment details from Razorpay
      const paymentDetails = await this.razorpayService.fetchPayment(razorpay_payment_id);

      // Update payment record
      const payment = await this.razorpayService.updatePaymentRecord(
        razorpay_order_id,
        razorpay_payment_id,
        PaymentStatus.COMPLETED,
        {
          razorpay_signature,
          payment_details: paymentDetails,
        }
      );

      if (!payment) {
        res.status(404).json({
          success: false,
          message: 'Payment record not found',
        });
        return;
      }

      // Update subscription if this was a subscription payment
      if (payment.subscription_id) {
        await this.razorpayService.updateSubscriptionPaymentInfo(payment.subscription_id, {
          payment_method_id: paymentDetails.method,
          transaction_id: razorpay_payment_id,
          amount: Number(payment.amount),
        });
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          payment_id: payment.id,
          transaction_id: razorpay_payment_id,
          amount: payment.amount,
          status: payment.status,
        },
      });
    } catch (error) {
      console.error('Verify payment error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify payment',
      });
    }
  };

  /**
   * Get payment details
   */
  getPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentId } = req.params;
      const currentUser = (req as any).user;

      const paymentRepo = AppDataSource.getRepository(Payment);
      const payment = await paymentRepo.findOne({
        where: { id: paymentId },
        relations: ['organization', 'subscription'],
      });

      if (!payment) {
        res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
        return;
      }

      // Check access
      if (
        currentUser.organization_id !== payment.organization_id &&
        currentUser.tier !== 'platform'
      ) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      console.error('Get payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment',
      });
    }
  };

  /**
   * Get organization payments
   */
  getOrganizationPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;
      const currentUser = (req as any).user;

      // Check access
      if (currentUser.organization_id !== organizationId && currentUser.tier !== 'platform') {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const paymentRepo = AppDataSource.getRepository(Payment);
      const payments = await paymentRepo.find({
        where: { organization_id: organizationId },
        order: { created_at: 'DESC' },
      });

      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      console.error('Get organization payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payments',
      });
    }
  };

  /**
   * Handle Razorpay webhook
   */
  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const webhookBody = JSON.stringify(req.body);
      const signature = req.headers['x-razorpay-signature'] as string;

      if (!signature) {
        res.status(400).json({
          success: false,
          message: 'Missing webhook signature',
        });
        return;
      }

      // Verify webhook signature
      const isValid = this.razorpayService.verifyWebhookSignature(webhookBody, signature);

      if (!isValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid webhook signature',
        });
        return;
      }

      const event = req.body;
      const eventType = event.event;

      console.log('Razorpay webhook event:', eventType);

      // Handle different webhook events
      switch (eventType) {
        case 'payment.authorized':
          await this.handlePaymentAuthorized(event.payload.payment.entity);
          break;

        case 'payment.captured':
          await this.handlePaymentCaptured(event.payload.payment.entity);
          break;

        case 'payment.failed':
          await this.handlePaymentFailed(event.payload.payment.entity);
          break;

        case 'order.paid':
          await this.handleOrderPaid(event.payload.order.entity);
          break;

        case 'refund.created':
          await this.handleRefundCreated(event.payload.refund.entity);
          break;

        default:
          console.log('Unhandled webhook event:', eventType);
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      console.error('Webhook handler error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process webhook',
      });
    }
  };

  // Private webhook handlers
  private async handlePaymentAuthorized(payment: any): Promise<void> {
    console.log('Payment authorized:', payment.id);
    // Update payment status if needed
  }

  private async handlePaymentCaptured(payment: any): Promise<void> {
    console.log('Payment captured:', payment.id);

    await this.razorpayService.updatePaymentRecord(
      payment.order_id,
      payment.id,
      PaymentStatus.COMPLETED,
      {
        captured: true,
        payment_method: payment.method,
      }
    );
  }

  private async handlePaymentFailed(payment: any): Promise<void> {
    console.log('Payment failed:', payment.id);

    await this.razorpayService.updatePaymentRecord(
      payment.order_id,
      payment.id,
      PaymentStatus.FAILED,
      {
        error_code: payment.error_code,
        error_description: payment.error_description,
      }
    );
  }

  private async handleOrderPaid(order: any): Promise<void> {
    console.log('Order paid:', order.id);
    // Additional logic for order completion
  }

  private async handleRefundCreated(refund: any): Promise<void> {
    console.log('Refund created:', refund.id);

    const paymentRepo = AppDataSource.getRepository(Payment);
    const payment = await paymentRepo.findOne({
      where: { payment_gateway_payment_id: refund.payment_id },
    });

    if (payment) {
      payment.status = PaymentStatus.REFUNDED;
      payment.metadata = {
        ...payment.metadata,
        refund_id: refund.id,
        refund_amount: refund.amount / 100,
        refund_date: new Date().toISOString(),
      };
      await paymentRepo.save(payment);
    }
  }
}