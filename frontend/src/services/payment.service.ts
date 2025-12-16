import axios from 'axios';
import { config } from '@/config';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayConfig {
  key_id: string;
}

export interface PaymentOrder {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  payment_id: string;
}

export interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface CreateOrderParams {
  amount: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreateSubscriptionOrderParams {
  subscription_id: string;
}

class PaymentService {
  private baseURL: string;

  constructor() {
    this.baseURL = config.api.baseUrl;
  }

  private getAuthHeader() {
    const token = localStorage.getItem('techfolks_auth_token');
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Get Razorpay configuration
   */
  async getConfig(): Promise<RazorpayConfig> {
    const response = await axios.get(`${this.baseURL}/payments/config`, {
      headers: this.getAuthHeader(),
    });
    return response.data.data;
  }

  /**
   * Create subscription payment order
   */
  async createSubscriptionOrder(params: CreateSubscriptionOrderParams): Promise<PaymentOrder> {
    const response = await axios.post(
      `${this.baseURL}/payments/orders/subscription`,
      params,
      {
        headers: {
          ...this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.data;
  }

  /**
   * Create custom payment order
   */
  async createOrder(params: CreateOrderParams): Promise<PaymentOrder> {
    const response = await axios.post(`${this.baseURL}/payments/orders`, params, {
      headers: {
        ...this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    return response.data.data;
  }

  /**
   * Verify payment after successful payment
   */
  async verifyPayment(params: PaymentVerification): Promise<any> {
    const response = await axios.post(`${this.baseURL}/payments/verify`, params, {
      headers: {
        ...this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<any> {
    const response = await axios.get(`${this.baseURL}/payments/${paymentId}`, {
      headers: this.getAuthHeader(),
    });
    return response.data.data;
  }

  /**
   * Get organization payments
   */
  async getOrganizationPayments(organizationId: string): Promise<any[]> {
    const response = await axios.get(
      `${this.baseURL}/payments/organization/${organizationId}`,
      {
        headers: this.getAuthHeader(),
      }
    );
    return response.data.data;
  }

  /**
   * Initialize Razorpay checkout
   */
  async initiatePayment(
    orderData: PaymentOrder,
    options: {
      name?: string;
      description?: string;
      prefill?: {
        name?: string;
        email?: string;
        contact?: string;
      };
      theme?: {
        color?: string;
      };
      onSuccess?: (response: any) => void;
      onFailure?: (error: any) => void;
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        reject(new Error('Razorpay SDK not loaded'));
        return;
      }

      const razorpayOptions = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: options.name || 'TechFolks',
        description: options.description || 'Payment',
        handler: async (response: any) => {
          try {
            // Verify payment on backend
            const verificationResult = await this.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verificationResult.success) {
              options.onSuccess?.(verificationResult.data);
              resolve();
            } else {
              options.onFailure?.(new Error('Payment verification failed'));
              reject(new Error('Payment verification failed'));
            }
          } catch (error) {
            options.onFailure?.(error);
            reject(error);
          }
        },
        modal: {
          ondismiss: () => {
            const error = new Error('Payment cancelled by user');
            options.onFailure?.(error);
            reject(error);
          },
        },
        prefill: options.prefill || {},
        theme: options.theme || {
          color: '#3399cc',
        },
      };

      const rzp = new window.Razorpay(razorpayOptions);
      rzp.open();
    });
  }

  /**
   * Complete flow: Create order and initiate payment
   */
  async processSubscriptionPayment(
    subscriptionId: string,
    userDetails: {
      name?: string;
      email?: string;
      contact?: string;
    },
    callbacks: {
      onSuccess?: (data: any) => void;
      onFailure?: (error: any) => void;
    }
  ): Promise<void> {
    try {
      // Create order
      const orderData = await this.createSubscriptionOrder({
        subscription_id: subscriptionId,
      });

      // Initiate payment
      await this.initiatePayment(orderData, {
        name: 'TechFolks',
        description: 'Subscription Payment',
        prefill: userDetails,
        onSuccess: callbacks.onSuccess,
        onFailure: callbacks.onFailure,
      });
    } catch (error) {
      callbacks.onFailure?.(error);
      throw error;
    }
  }

  /**
   * Complete flow: Create custom order and initiate payment
   */
  async processCustomPayment(
    amount: number,
    description: string,
    userDetails: {
      name?: string;
      email?: string;
      contact?: string;
    },
    callbacks: {
      onSuccess?: (data: any) => void;
      onFailure?: (error: any) => void;
    },
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Create order
      const orderData = await this.createOrder({
        amount,
        description,
        metadata,
      });

      // Initiate payment
      await this.initiatePayment(orderData, {
        name: 'TechFolks',
        description: description,
        prefill: userDetails,
        onSuccess: callbacks.onSuccess,
        onFailure: callbacks.onFailure,
      });
    } catch (error) {
      callbacks.onFailure?.(error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
export default paymentService;