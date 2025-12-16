# Razorpay Payment Gateway Integration

This document describes the Razorpay payment gateway integration for the TechFolks platform.

## Overview

The platform now includes complete Razorpay payment integration for handling subscription payments, custom orders, and payment verification.

## Features

- ✅ Create payment orders for subscriptions
- ✅ Create custom payment orders
- ✅ Payment signature verification
- ✅ Webhook handling for payment events
- ✅ Payment tracking and history
- ✅ Refund support
- ✅ Multi-payment method support (UPI, Cards, NetBanking, Wallets)

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

**How to get these values:**
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to Settings → API Keys
3. Generate Test/Live keys
4. For webhook secret: Settings → Webhooks → Create Webhook

### 2. Database Migration

Run the SQL migration to create the payments table:

```bash
psql -U postgres -d techfolks_db -f create-payments-table.sql
```

Or if using Docker:

```bash
docker exec -i your_postgres_container psql -U postgres -d techfolks_db < create-payments-table.sql
```

### 3. Webhook Configuration

Configure webhook in Razorpay Dashboard:

1. Go to Settings → Webhooks
2. Click "Create New Webhook"
3. Set URL: `https://your-domain.com/api/payments/webhook`
4. Select events:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
   - `refund.created`
5. Save and copy the webhook secret to your `.env` file

## API Endpoints

### 1. Get Payment Configuration

```http
GET /api/payments/config
Authorization: Bearer <token>
```

Returns Razorpay key_id for frontend integration.

**Response:**
```json
{
  "success": true,
  "data": {
    "key_id": "rzp_test_xxxxx"
  }
}
```

### 2. Create Subscription Order

```http
POST /api/payments/orders/subscription
Authorization: Bearer <token>
Content-Type: application/json

{
  "subscription_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment order created successfully",
  "data": {
    "order_id": "order_xxxxx",
    "amount": 999900,
    "currency": "INR",
    "key_id": "rzp_test_xxxxx",
    "payment_id": "uuid"
  }
}
```

### 3. Create Custom Order

```http
POST /api/payments/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 999.00,
  "description": "Payment for services",
  "metadata": {
    "custom_field": "value"
  }
}
```

### 4. Verify Payment

```http
POST /api/payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_xxxxx",
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_signature": "signature_xxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "payment_id": "uuid",
    "transaction_id": "pay_xxxxx",
    "amount": 999.00,
    "status": "completed"
  }
}
```

### 5. Get Payment Details

```http
GET /api/payments/:paymentId
Authorization: Bearer <token>
```

### 6. Get Organization Payments

```http
GET /api/payments/organization/:organizationId
Authorization: Bearer <token>
```

### 7. Webhook Endpoint

```http
POST /api/payments/webhook
X-Razorpay-Signature: <signature>
```

This endpoint is called by Razorpay for payment events.

## Frontend Integration Example

### React/Next.js Integration

```javascript
// 1. Get Razorpay configuration
const configResponse = await fetch('/api/payments/config', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { data: { key_id } } = await configResponse.json();

// 2. Create order
const orderResponse = await fetch('/api/payments/orders/subscription', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    subscription_id: 'your-subscription-id'
  })
});
const { data: orderData } = await orderResponse.json();

// 3. Initialize Razorpay checkout
const options = {
  key: key_id,
  amount: orderData.amount,
  currency: orderData.currency,
  order_id: orderData.order_id,
  name: 'TechFolks',
  description: 'Subscription Payment',
  handler: async function(response) {
    // 4. Verify payment on backend
    const verifyResponse = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      })
    });

    const result = await verifyResponse.json();
    if (result.success) {
      alert('Payment successful!');
      // Redirect to success page
    }
  },
  prefill: {
    name: 'Customer Name',
    email: 'customer@example.com',
    contact: '9999999999'
  },
  theme: {
    color: '#3399cc'
  }
};

const rzp = new Razorpay(options);
rzp.open();
```

## Payment Flow

1. **Create Order**: Backend creates an order with Razorpay
2. **Frontend Checkout**: User completes payment on Razorpay checkout
3. **Verify Payment**: Backend verifies payment signature
4. **Update Records**: Payment and subscription records are updated
5. **Webhook**: Razorpay sends webhook for payment events (backup verification)

## Database Schema

### Payments Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | Foreign key to organizations |
| subscription_id | UUID | Foreign key to subscriptions (nullable) |
| transaction_id | VARCHAR(100) | Unique transaction ID |
| payment_gateway | VARCHAR(50) | Payment gateway name |
| payment_gateway_order_id | VARCHAR(100) | Razorpay order_id |
| payment_gateway_payment_id | VARCHAR(100) | Razorpay payment_id |
| amount | DECIMAL(10,2) | Payment amount |
| currency | VARCHAR(3) | Currency code (default: INR) |
| status | ENUM | pending, processing, completed, failed, refunded, cancelled |
| payment_method | ENUM | razorpay, stripe, upi, card, etc. |
| payment_date | TIMESTAMP | Payment completion date |
| description | TEXT | Payment description |
| metadata | JSONB | Additional payment data |
| invoice_url | TEXT | Invoice URL |
| receipt_url | TEXT | Receipt URL |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## Testing

### Test Cards (Razorpay Test Mode)

- **Success**: 4111 1111 1111 1111
- **Failure**: 4111 1111 1111 1234
- CVV: Any 3 digits
- Expiry: Any future date

### Test UPI ID

- success@razorpay
- failure@razorpay

## Security Best Practices

1. **Never expose Key Secret** in frontend code
2. **Always verify signatures** on the backend
3. **Use HTTPS** for webhook endpoints
4. **Validate webhook signatures** before processing
5. **Store sensitive data** encrypted
6. **Log all transactions** for audit trails
7. **Implement rate limiting** on payment endpoints
8. **Use environment variables** for all credentials

## Error Handling

The service includes comprehensive error handling for:
- Payment creation failures
- Signature verification failures
- Webhook validation failures
- Database transaction failures
- Network timeout errors

## Support

For issues or questions:
1. Check Razorpay Dashboard for transaction details
2. Review server logs for error messages
3. Verify webhook delivery in Razorpay Dashboard
4. Check payment status in database

## Additional Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- [Razorpay Checkout](https://razorpay.com/docs/payment-gateway/web-integration/standard/)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)