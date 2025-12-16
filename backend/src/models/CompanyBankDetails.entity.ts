import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';

@Entity('company_bank_details')
export class CompanyBankDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  company_name: string;

  @Column({ length: 255 })
  account_holder_name: string;

  @Column({ length: 50 })
  account_number: string;

  @Column({ length: 11 })
  ifsc_code: string;

  @Column({ length: 255 })
  bank_name: string;

  @Column({ length: 255, nullable: true })
  branch_name: string;

  @Column({ length: 255, nullable: true })
  branch_address: string;

  @Column({ length: 20, nullable: true })
  swift_code: string;

  @Column({ length: 50, nullable: true })
  account_type: string; // savings, current, etc.

  @Column({ length: 15, nullable: true })
  gst_number: string;

  @Column({ length: 10, nullable: true })
  pan_number: string;

  @Column({ length: 15, nullable: true })
  company_registration_number: string;

  @Column({ name: 'is_primary', default: false })
  is_primary: boolean;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @Column({ type: 'json', nullable: true })
  additional_details: {
    micr_code?: string;
    upi_id?: string;
    authorized_signatory?: string;
    contact_person?: string;
    phone_number?: string;
    email?: string;
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