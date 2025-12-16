import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index
} from 'typeorm';
import { User } from './User.entity';
import { Subscription } from './Subscription.entity';

export enum OrganizationStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
  TRIAL = 'trial'
}

export enum OrganizationPlan {
  STARTER = 'starter', // 25 users
  PROFESSIONAL = 'professional', // 100 users
  ENTERPRISE = 'enterprise', // 500 users
  UNLIMITED = 'unlimited' // unlimited users
}

@Entity('organizations')
@Index(['org_code'], { unique: true })
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_code', unique: true, length: 20 })
  org_code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255 })
  industry: string;

  @Column({ name: 'company_size', default: 'small' })
  company_size: string; // small, medium, large, enterprise

  @Column({ length: 255 })
  contact_email: string;

  @Column({ length: 20, nullable: true })
  phone_number: string;

  @Column({ type: 'json', nullable: true })
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };

  @Column({
    type: 'enum',
    enum: OrganizationPlan,
    enumName: 'organization_plan',
    default: OrganizationPlan.STARTER
  })
  plan: OrganizationPlan;

  @Column({
    type: 'enum',
    enum: OrganizationStatus,
    enumName: 'organization_status',
    default: OrganizationStatus.TRIAL
  })
  status: OrganizationStatus;

  @Column({ name: 'user_limit' })
  user_limit: number;

  @Column({ name: 'current_users', default: 0 })
  current_users: number;

  @Column({ name: 'manager_limit', default: 1 })
  manager_limit: number;

  @Column({ name: 'current_managers', default: 0 })
  current_managers: number;

  @Column({ name: 'trial_start_date', type: 'date', nullable: true })
  trial_start_date: Date;

  @Column({ name: 'trial_end_date', type: 'date', nullable: true })
  trial_end_date: Date;

  @Column({ name: 'subscription_start_date', type: 'date', nullable: true })
  subscription_start_date: Date;

  @Column({ name: 'subscription_end_date', type: 'date', nullable: true })
  subscription_end_date: Date;

  @Column({ type: 'json' })
  features_enabled: {
    hr_management: boolean;
    payroll_processing: boolean;
    certificate_automation: boolean;
    advanced_analytics: boolean;
    api_access: boolean;
    custom_branding: boolean;
    sso_integration: boolean;
    bulk_operations: boolean;
  };

  @Column({ type: 'json', nullable: true })
  billing_info: {
    billing_email?: string;
    billing_address?: any;
    payment_method?: string;
    tax_id?: string;
    po_number?: string;
  };

  @Column({ type: 'json', nullable: true })
  settings: {
    allow_self_registration?: boolean;
    require_email_verification?: boolean;
    password_policy?: any;
    session_timeout?: number;
    max_login_attempts?: number;
    custom_domain?: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relations
  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => Subscription, (subscription) => subscription.organization)
  subscriptions: Subscription[];
}
