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
import type { OrganizationPlan } from './Organization.entity';
import { User } from './User.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
  INCOMPLETE = 'incomplete'
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually'
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id', unique: true, length: 50 })
  subscription_id: string;

  @Column({ name: 'organization_id' })
  organization_id: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({
    type: 'enum',
    enum: ['starter', 'professional', 'enterprise', 'unlimited'],
    enumName: 'organization_plan'
  })
  plan: OrganizationPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    enumName: 'subscription_status',
    default: SubscriptionStatus.TRIALING
  })
  status: SubscriptionStatus;

  @Column({
    type: 'enum',
    enum: BillingCycle,
    enumName: 'billing_cycle',
    default: BillingCycle.MONTHLY
  })
  billing_cycle: BillingCycle;

  @Column({ name: 'user_limit' })
  user_limit: number;

  @Column({ name: 'manager_limit', default: 1 })
  manager_limit: number;

  @Column({ name: 'price_per_user', type: 'decimal', precision: 10, scale: 2 })
  price_per_user: number;

  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
  base_price: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ name: 'currency', length: 3, default: 'INR' })
  currency: string;

  @Column({ name: 'start_date', type: 'date' })
  start_date: Date;

  @Column({ name: 'end_date', type: 'date' })
  end_date: Date;

  @Column({ name: 'trial_end_date', type: 'date', nullable: true })
  trial_end_date: Date;

  @Column({ name: 'next_billing_date', type: 'date', nullable: true })
  next_billing_date: Date;

  @Column({ name: 'auto_renewal', default: true })
  auto_renewal: boolean;

  @Column({ type: 'json' })
  features: {
    hr_management: boolean;
    payroll_processing: boolean;
    certificate_automation: boolean;
    advanced_analytics: boolean;
    api_access: boolean;
    custom_branding: boolean;
    sso_integration: boolean;
    bulk_operations: boolean;
    priority_support: boolean;
    data_export: boolean;
  };

  @Column({ type: 'json', nullable: true })
  payment_info: {
    payment_method_id?: string;
    last_payment_date?: string;
    last_payment_amount?: number;
    payment_gateway?: string; // razorpay, stripe, etc.
    transaction_id?: string;
    invoice_number?: string;
  };

  @Column({ type: 'json', nullable: true })
  usage_metrics: {
    active_users: number;
    certificates_generated: number;
    payroll_cycles_processed: number;
    api_calls_month: number;
    storage_used_mb: number;
  };

  @Column({ name: 'created_by_id' })
  created_by_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  created_by: User;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
