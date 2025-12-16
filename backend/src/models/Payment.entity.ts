import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Organization } from './Organization.entity';
import { Subscription } from './Subscription.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  RAZORPAY = 'razorpay',
  STRIPE = 'stripe',
  BANK_TRANSFER = 'bank_transfer',
  UPI = 'upi',
  CARD = 'card',
  NETBANKING = 'netbanking',
  WALLET = 'wallet'
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organization_id: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'subscription_id', nullable: true })
  subscription_id: string;

  @ManyToOne(() => Subscription, { nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column({ name: 'transaction_id', unique: true, length: 100 })
  transaction_id: string;

  @Column({ name: 'payment_gateway', length: 50 })
  payment_gateway: string; // razorpay, stripe, etc.

  @Column({ name: 'payment_gateway_order_id', length: 100, nullable: true })
  payment_gateway_order_id: string;

  @Column({ name: 'payment_gateway_payment_id', length: 100, nullable: true })
  payment_gateway_payment_id: string;

  @Column({ name: 'amount', type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'currency', length: 3, default: 'INR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    enumName: 'payment_status',
    default: PaymentStatus.PENDING
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    enumName: 'payment_method',
    default: PaymentMethod.RAZORPAY
  })
  payment_method: PaymentMethod;

  @Column({ name: 'payment_date', type: 'timestamp', nullable: true })
  payment_date: Date;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    plan_name?: string;
    billing_cycle?: string;
    invoice_number?: string;
    receipt?: string;
    error_code?: string;
    error_description?: string;
    refund_id?: string;
    refund_amount?: number;
    refund_date?: string;
    [key: string]: any;
  };

  @Column({ name: 'invoice_url', type: 'text', nullable: true })
  invoice_url: string;

  @Column({ name: 'receipt_url', type: 'text', nullable: true })
  receipt_url: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
