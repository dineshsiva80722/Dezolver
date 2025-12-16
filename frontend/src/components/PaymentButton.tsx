import React, { useState } from 'react';
import { paymentService } from '@/services/payment.service';
import toast from 'react-hot-toast';

interface PaymentButtonProps {
  subscriptionId?: string;
  amount?: number;
  description?: string;
  userName?: string;
  userEmail?: string;
  userContact?: string;
  onSuccess?: (data: any) => void;
  onFailure?: (error: any) => void;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
  metadata?: Record<string, any>;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  subscriptionId,
  amount,
  description,
  userName,
  userEmail,
  userContact,
  onSuccess,
  onFailure,
  buttonText = 'Pay Now',
  className = '',
  disabled = false,
  metadata,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const userDetails = {
        name: userName,
        email: userEmail,
        contact: userContact,
      };

      const callbacks = {
        onSuccess: (data: any) => {
          toast.success('Payment successful!');
          onSuccess?.(data);
          setIsProcessing(false);
        },
        onFailure: (error: any) => {
          const errorMessage = error.message || 'Payment failed';
          toast.error(errorMessage);
          onFailure?.(error);
          setIsProcessing(false);
        },
      };

      // Process subscription or custom payment
      if (subscriptionId) {
        await paymentService.processSubscriptionPayment(
          subscriptionId,
          userDetails,
          callbacks
        );
      } else if (amount && description) {
        await paymentService.processCustomPayment(
          amount,
          description,
          userDetails,
          callbacks,
          metadata
        );
      } else {
        throw new Error('Invalid payment configuration');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      onFailure?.(error);
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || isProcessing}
      className={`payment-button ${className} ${
        isProcessing ? 'processing' : ''
      }`}
    >
      {isProcessing ? 'Processing...' : buttonText}
    </button>
  );
};

export default PaymentButton;