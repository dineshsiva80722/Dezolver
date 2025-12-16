import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { Employee } from './Employee.entity';
import { User } from './User.entity';

export enum PayrollStatus {
  DRAFT = 'draft',
  PROCESSED = 'processed',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

@Entity('payroll_records')
@Index(['employee_id', 'pay_period_start'], { unique: true })
export class PayrollRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payroll_id', unique: true, length: 50 })
  payroll_id: string;

  @Column({ name: 'employee_id' })
  employee_id: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'pay_period_start', type: 'date' })
  pay_period_start: Date;

  @Column({ name: 'pay_period_end', type: 'date' })
  pay_period_end: Date;

  @Column({ name: 'working_days', type: 'decimal', precision: 5, scale: 2 })
  working_days: number;

  @Column({ name: 'days_worked', type: 'decimal', precision: 5, scale: 2 })
  days_worked: number;

  @Column({ name: 'overtime_hours', type: 'decimal', precision: 5, scale: 2, default: 0 })
  overtime_hours: number;

  @Column({ name: 'leave_days', type: 'decimal', precision: 5, scale: 2, default: 0 })
  leave_days: number;

  @Column({ name: 'basic_salary', type: 'decimal', precision: 10, scale: 2 })
  basic_salary: number;

  @Column({ type: 'json' })
  earnings: {
    hra?: number;
    transport_allowance?: number;
    meal_allowance?: number;
    medical_allowance?: number;
    overtime_pay?: number;
    bonus?: number;
    incentives?: number;
    custom_allowances?: Array<{
      name: string;
      amount: number;
    }>;
  };

  @Column({ name: 'gross_salary', type: 'decimal', precision: 10, scale: 2 })
  gross_salary: number;

  @Column({ type: 'json' })
  deductions: {
    pf?: number;
    esi?: number;
    professional_tax?: number;
    tds?: number;
    insurance?: number;
    loan_deduction?: number;
    leave_deduction?: number;
    custom_deductions?: Array<{
      name: string;
      amount: number;
    }>;
  };

  @Column({ name: 'total_deductions', type: 'decimal', precision: 10, scale: 2 })
  total_deductions: number;

  @Column({ name: 'net_salary', type: 'decimal', precision: 10, scale: 2 })
  net_salary: number;

  @Column({
    type: 'enum',
    enum: PayrollStatus,
    default: PayrollStatus.DRAFT
  })
  status: PayrollStatus;

  @Column({ name: 'processed_by_id', nullable: true })
  processed_by_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'processed_by_id' })
  processed_by: User;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processed_at: Date;

  @Column({ name: 'payment_date', type: 'timestamp', nullable: true })
  payment_date: Date;

  @Column({ name: 'payment_reference', length: 255, nullable: true })
  payment_reference: string;

  @Column({ name: 'salary_slip_url', length: 500, nullable: true })
  salary_slip_url: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
