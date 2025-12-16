import React, { useState } from 'react';
import { PaymentButton } from '@/components/PaymentButton';
import { useAuthStore } from '@/store/authStore';

export const PaymentTestPage: React.FC = () => {
  const { user } = useAuthStore();
  const [paymentMode, setPaymentMode] = useState<'test' | 'subscription'>('test');
  const [testAmount, setTestAmount] = useState<number>(100);
  const [testDescription, setTestDescription] = useState<string>('Test Payment');
  const [subscriptionId, setSubscriptionId] = useState<string>('');

  const handlePaymentSuccess = (data: any) => {
    console.log('Payment successful:', data);
    alert(`Payment successful! Transaction ID: ${data.transaction_id}`);
  };

  const handlePaymentFailure = (error: any) => {
    console.error('Payment failed:', error);
    alert(`Payment failed: ${error.message}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6">Payment Integration Test</h1>

        {/* Mode Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Mode
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setPaymentMode('test')}
              className={`px-4 py-2 rounded ${
                paymentMode === 'test'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Test Payment
            </button>
            <button
              onClick={() => setPaymentMode('subscription')}
              className={`px-4 py-2 rounded ${
                paymentMode === 'subscription'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Subscription Payment
            </button>
          </div>
        </div>

        {/* Test Payment Form */}
        {paymentMode === 'test' && (
          <div className="mb-6 p-4 border border-gray-300 rounded">
            <h2 className="text-xl font-semibold mb-4">Test Payment</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <PaymentButton
              amount={testAmount}
              description={testDescription}
              userName={user?.full_name}
              userEmail={user?.email}
              userContact="9999999999"
              onSuccess={handlePaymentSuccess}
              onFailure={handlePaymentFailure}
              buttonText={`Pay ₹${testAmount}`}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              metadata={{ test: true }}
            />
          </div>
        )}

        {/* Subscription Payment Form */}
        {paymentMode === 'subscription' && (
          <div className="mb-6 p-4 border border-gray-300 rounded">
            <h2 className="text-xl font-semibold mb-4">Subscription Payment</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subscription ID
              </label>
              <input
                type="text"
                value={subscriptionId}
                onChange={(e) => setSubscriptionId(e.target.value)}
                placeholder="Enter subscription UUID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <PaymentButton
              subscriptionId={subscriptionId}
              userName={user?.full_name}
              userEmail={user?.email}
              userContact="9999999999"
              onSuccess={handlePaymentSuccess}
              onFailure={handlePaymentFailure}
              buttonText="Pay for Subscription"
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={!subscriptionId}
            />
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-900 mb-2">Test Card Details</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Card Number:</strong> 4111 1111 1111 1111 (Success)</p>
            <p><strong>Card Number:</strong> 4111 1111 1111 1234 (Failure)</p>
            <p><strong>CVV:</strong> Any 3 digits</p>
            <p><strong>Expiry:</strong> Any future date</p>
            <p><strong>Test UPI:</strong> success@razorpay (Success)</p>
            <p><strong>Test UPI:</strong> failure@razorpay (Failure)</p>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold text-yellow-900 mb-2">Setup Required</h3>
          <div className="text-sm text-yellow-800 space-y-1">
            <p>1. Add Razorpay credentials to backend .env file:</p>
            <pre className="bg-yellow-100 p-2 rounded mt-2 overflow-x-auto">
              RAZORPAY_KEY_ID=your_key_id{'\n'}
              RAZORPAY_KEY_SECRET=your_key_secret{'\n'}
              RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
            </pre>
            <p className="mt-2">2. Run the database migration (create-payments-table.sql)</p>
            <p>3. Restart the backend server</p>
            <p>4. Get test keys from <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Razorpay Dashboard</a></p>
          </div>
        </div>

        {/* User Info Display */}
        {user && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <h3 className="font-semibold text-gray-900 mb-2">Current User Details</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Name:</strong> {user.full_name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Organization ID:</strong> {user.organization_id || 'N/A'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentTestPage;