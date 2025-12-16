import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from './User.entity';
import { PayrollRecord } from './PayrollRecord.entity';

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERN = 'intern'
}

export enum PaymentFrequency {
  MONTHLY = 'monthly',
  BI_WEEKLY = 'bi_weekly',
  WEEKLY = 'weekly'
}

@Entity('employees')
@Index(['employee_id'], { unique: true })
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id', unique: true, length: 50 })
  employee_id: string;

  @Column({ name: 'user_id', unique: true })
  user_id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'job_title', length: 255 })
  job_title: string;

  @Column({ name: 'department', length: 100 })
  department: string;

  @Column({ name: 'manager_id', nullable: true })
  manager_id: string;

  @OneToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager: Employee;

  @Column({ name: 'hire_date', type: 'date' })
  hire_date: Date;

  @Column({
    type: 'enum',
    enum: EmploymentType,
    default: EmploymentType.FULL_TIME
  })
  employment_type: EmploymentType;

  @Column({ name: 'work_hours_per_week', type: 'decimal', precision: 5, scale: 2, default: 40 })
  work_hours_per_week: number;

  @Column({
    type: 'enum',
    enum: PaymentFrequency,
    default: PaymentFrequency.MONTHLY
  })
  payment_frequency: PaymentFrequency;

  @Column({ name: 'basic_salary', type: 'decimal', precision: 10, scale: 2 })
  basic_salary: number;

  @Column({ type: 'json', nullable: true })
  salary_components: {
    hra?: number;
    transport_allowance?: number;
    meal_allowance?: number;
    medical_allowance?: number;
    bonus?: number;
    overtime_rate?: number;
    custom_allowances?: Array<{
      name: string;
      amount: number;
      type: 'fixed' | 'percentage';
    }>;
  };

  @Column({ type: 'json', nullable: true })
  deductions: {
    pf?: number;
    esi?: number;
    professional_tax?: number;
    insurance?: number;
    loan_deduction?: number;
    custom_deductions?: Array<{
      name: string;
      amount: number;
      type: 'fixed' | 'percentage';
    }>;
  };

  @Column({ type: 'json', nullable: true })
  tax_preferences: {
    tax_regime: 'old' | 'new';
    pan_number?: string;
    tax_exemptions?: Array<{
      section: string;
      amount: number;
    }>;
  };

  @Column({ type: 'json', nullable: true })
  bank_details: {
    account_number: string;
    ifsc_code: string;
    bank_name: string;
    branch_name?: string;
    branch_address?: string;
    account_holder_name: string;
    account_type?: string; // savings, current, salary
    micr_code?: string;
    upi_id?: string;
    nominee_name?: string;
    nominee_relation?: string;
    is_verified?: boolean;
    verification_date?: string;
  };

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @Column({ name: 'termination_date', type: 'date', nullable: true })
  termination_date: Date | null;

  @Column({ name: 'termination_reason', type: 'text', nullable: true })
  termination_reason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => PayrollRecord, (payroll) => payroll.employee)
  payroll_records: PayrollRecord[];
}
