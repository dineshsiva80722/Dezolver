-- Create payments table for Razorpay integration
-- Drop existing enum types if they exist
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;

-- Create enum types
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');
CREATE TYPE payment_method AS ENUM ('razorpay', 'stripe', 'bank_transfer', 'upi', 'card', 'netbanking', 'wallet');

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    subscription_id UUID,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    payment_gateway VARCHAR(50) NOT NULL,
    payment_gateway_order_id VARCHAR(100),
    payment_gateway_payment_id VARCHAR(100),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status payment_status DEFAULT 'pending',
    payment_method payment_method DEFAULT 'razorpay',
    payment_date TIMESTAMP,
    description TEXT,
    metadata JSONB,
    invoice_url TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT fk_payments_organization FOREIGN KEY (organization_id)
        REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_subscription FOREIGN KEY (subscription_id)
        REFERENCES subscriptions(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_organization_id ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_gateway_order_id ON payments(payment_gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_gateway_payment_id ON payments(payment_gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON payments;
CREATE TRIGGER trigger_update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Stores all payment transactions for organizations including Razorpay and other payment gateways';
COMMENT ON COLUMN payments.transaction_id IS 'Unique transaction identifier';
COMMENT ON COLUMN payments.payment_gateway IS 'Payment gateway used (razorpay, stripe, etc.)';
COMMENT ON COLUMN payments.payment_gateway_order_id IS 'Order ID from payment gateway (e.g., Razorpay order_id)';
COMMENT ON COLUMN payments.payment_gateway_payment_id IS 'Payment ID from payment gateway (e.g., Razorpay payment_id)';
COMMENT ON COLUMN payments.metadata IS 'Additional payment metadata in JSON format';

-- Grant permissions (adjust based on your database user setup)
-- GRANT SELECT, INSERT, UPDATE ON payments TO your_app_user;
-- GRANT USAGE ON SEQUENCE payments_id_seq TO your_app_user;