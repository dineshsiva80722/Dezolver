import Razorpay from 'razorpay';
import crypto from 'crypto';
import { AppDataSource } from '../config/database';
import { Payment, PaymentStatus, PaymentMethod } from '../models/Payment.entity';
import { Subscription, SubscriptionStatus } from '../models/Subscription.entity';

export interface CreateOrderParams {
  amount: number; // in rupees
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
}

export interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class RazorpayService {
  private razorpay: Razorpay;
  private keyId: string;
  private keySecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    if (!this.keyId || !this.keySecret) {
      throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
    }

    this.razorpay = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret,
    });
  }

  /**
   * Create a Razorpay order
   */
  async createOrder(params: CreateOrderParams): Promise<any> {
    try {
      const options = {
        amount: Math.round(params.amount * 100), // Convert to paise
        currency: params.currency || 'INR',
        receipt: params.receipt || `receipt_${Date.now()}`,
        notes: params.notes || {},
      };

      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error) {
      console.error('Razorpay create order error:', error);
      throw new Error(`Failed to create Razorpay order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(params: VerifyPaymentParams): boolean {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;

      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(body)
        .digest('hex');

      return expectedSignature === razorpay_signature;
    } catch (error) {
      console.error('Payment signature verification error:', error);
      return false;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(webhookBody: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
        .update(webhookBody)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Fetch payment details from Razorpay
   */
  async fetchPayment(paymentId: string): Promise<any> {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error('Fetch payment error:', error);
      throw new Error(`Failed to fetch payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch order details from Razorpay
   */
  async fetchOrder(orderId: string): Promise<any> {
    try {
      const order = await this.razorpay.orders.fetch(orderId);
      return order;
    } catch (error) {
      console.error('Fetch order error:', error);
      throw new Error(`Failed to fetch order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Capture payment (for authorized payments)
   */
  async capturePayment(paymentId: string, amount: number): Promise<any> {
    try {
      const payment = await this.razorpay.payments.capture(
        paymentId,
        Math.round(amount * 100), // Convert to paise
        'INR'
      );
      return payment;
    } catch (error) {
      console.error('Capture payment error:', error);
      throw new Error(`Failed to capture payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, amount?: number): Promise<any> {
    try {
      const options: any = {
        payment_id: paymentId,
      };

      if (amount) {
        options.amount = Math.round(amount * 100); // Convert to paise
      }

      const refund = await this.razorpay.payments.refund(paymentId, options);
      return refund;
    } catch (error) {
      console.error('Refund payment error:', error);
      throw new Error(`Failed to refund payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create payment record in database
   */
  async createPaymentRecord(data: {
    organization_id: string;
    subscription_id?: string;
    razorpay_order_id: string;
    razorpay_payment_id?: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    payment_method: PaymentMethod;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<Payment> {
    const paymentRepo = AppDataSource.getRepository(Payment);

    const payment = paymentRepo.create({
      organization_id: data.organization_id,
      subscription_id: data.subscription_id,
      transaction_id: data.razorpay_order_id,
      payment_gateway: 'razorpay',
      payment_gateway_order_id: data.razorpay_order_id,
      payment_gateway_payment_id: data.razorpay_payment_id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      payment_method: data.payment_method,
      description: data.description,
      payment_date: data.razorpay_payment_id ? new Date() : undefined,
      metadata: {
        ...data.metadata,
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
      },
    });

    return await paymentRepo.save(payment);
  }

  /**
   * Update payment record after successful payment
   */
  async updatePaymentRecord(
    orderId: string,
    paymentId: string,
    status: PaymentStatus,
    metadata?: Record<string, any>
  ): Promise<Payment | null> {
    const paymentRepo = AppDataSource.getRepository(Payment);

    const payment = await paymentRepo.findOne({
      where: { payment_gateway_order_id: orderId },
    });

    if (!payment) {
      return null;
    }

    payment.payment_gateway_payment_id = paymentId;
    payment.status = status;
    payment.payment_date = status === PaymentStatus.COMPLETED ? new Date() : payment.payment_date;
    payment.metadata = {
      ...payment.metadata,
      ...metadata,
      razorpay_payment_id: paymentId,
    };

    return await paymentRepo.save(payment);
  }

  /**
   * Update subscription payment info
   */
  async updateSubscriptionPaymentInfo(
    subscriptionId: string,
    paymentData: {
      payment_method_id?: string;
      transaction_id: string;
      amount: number;
    }
  ): Promise<void> {
    const subscriptionRepo = AppDataSource.getRepository(Subscription);

    const subscription = await subscriptionRepo.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.payment_info = {
      ...subscription.payment_info,
      payment_gateway: 'razorpay',
      payment_method_id: paymentData.payment_method_id,
      transaction_id: paymentData.transaction_id,
      last_payment_date: new Date().toISOString(),
      last_payment_amount: paymentData.amount,
    };

    // Update subscription status to active if payment is successful
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      subscription.status = SubscriptionStatus.ACTIVE;
    }

    await subscriptionRepo.save(subscription);
  }

  /**
   * Create subscription order (for recurring payments)
   */
  async createSubscriptionOrder(params: {
    subscription_id: string;
    organization_id: string;
    plan_name: string;
    amount: number;
    billing_cycle: string;
  }): Promise<{ order: any; payment: Payment }> {
    // Create Razorpay order
    const order = await this.createOrder({
      amount: params.amount,
      currency: 'INR',
      receipt: `sub_${params.subscription_id}_${Date.now()}`,
      notes: {
        subscription_id: params.subscription_id,
        organization_id: params.organization_id,
        plan_name: params.plan_name,
        billing_cycle: params.billing_cycle,
      },
    });

    // Create payment record
    const payment = await this.createPaymentRecord({
      organization_id: params.organization_id,
      subscription_id: params.subscription_id,
      razorpay_order_id: order.id,
      amount: params.amount,
      currency: 'INR',
      status: PaymentStatus.PENDING,
      payment_method: PaymentMethod.RAZORPAY,
      description: `${params.plan_name} subscription - ${params.billing_cycle}`,
      metadata: {
        plan_name: params.plan_name,
        billing_cycle: params.billing_cycle,
      },
    });

    return { order, payment };
  }

  /**
   * Get Razorpay key for frontend
   */
  getRazorpayKey(): string {
    return this.keyId;
  }
}