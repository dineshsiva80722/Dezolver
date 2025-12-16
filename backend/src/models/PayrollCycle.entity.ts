import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from './User.entity';
import { PaymentFrequency } from './Employee.entity';

export enum PayrollCycleStatus {
  ACTIVE = 'active',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

@Entity('payroll_cycles')
export class PayrollCycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: PaymentFrequency
  })
  frequency: PaymentFrequency;

  @Column({ name: 'period_start', type: 'date' })
  period_start: Date;

  @Column({ name: 'period_end', type: 'date' })
  period_end: Date;

  @Column({ name: 'cut_off_date', type: 'date' })
  cut_off_date: Date;

  @Column({ name: 'payment_date', type: 'date' })
  payment_date: Date;

  @Column({
    type: 'enum',
    enum: PayrollCycleStatus,
    default: PayrollCycleStatus.ACTIVE
  })
  status: PayrollCycleStatus;

  @Column({ name: 'total_employees', default: 0 })
  total_employees: number;

  @Column({ name: 'processed_employees', default: 0 })
  processed_employees: number;

  @Column({ name: 'total_gross_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_gross_amount: number;

  @Column({ name: 'total_deductions', type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_deductions: number;

  @Column({ name: 'total_net_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_net_amount: number;

  @Column({ name: 'created_by_id' })
  created_by_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  created_by: User;

  @Column({ name: 'processed_by_id', nullable: true })
  processed_by_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'processed_by_id' })
  processed_by: User;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processed_at: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
