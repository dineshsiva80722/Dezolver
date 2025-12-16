import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User.entity';
import { Problem } from './Problem.entity';
import { Contest } from './Contest.entity';
import { CertificateTemplate } from './CertificateTemplate.entity';

export enum CertificateTriggerType {
  COURSE_COMPLETION = 'course_completion',
  ASSESSMENT_PASS = 'assessment_pass',
  CONTEST_COMPLETION = 'contest_completion',
  PROBLEM_SOLVED = 'problem_solved',
  MANUAL_APPROVAL = 'manual_approval',
}

export enum CertificateStatus {
  GENERATED = 'generated',
  SENT = 'sent',
  DOWNLOADED = 'downloaded',
  REVOKED = 'revoked',
}

@Entity('certificates')
@Index(['certificate_id'], { unique: true })
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'certificate_id', unique: true, length: 50 })
  certificate_id: string;

  @Column({ name: 'learner_id' })
  learner_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'learner_id' })
  learner: User;

  @Column({ name: 'instructor_id', nullable: true })
  instructor_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'instructor_id' })
  instructor: User;

  @Column({ name: 'template_id' })
  template_id: string;

  @ManyToOne(() => CertificateTemplate)
  @JoinColumn({ name: 'template_id' })
  template: CertificateTemplate;

  @Column({ name: 'course_name', length: 255 })
  course_name: string;

  @Column({ name: 'problem_id', nullable: true })
  problem_id: string;

  @ManyToOne(() => Problem, { nullable: true })
  @JoinColumn({ name: 'problem_id' })
  problem: Problem;

  @Column({ name: 'contest_id', nullable: true })
  contest_id: string;

  @ManyToOne(() => Contest, { nullable: true })
  @JoinColumn({ name: 'contest_id' })
  contest: Contest;

  @Column({
    type: 'enum',
    enum: CertificateTriggerType,
  })
  trigger_type: CertificateTriggerType;

  @Column({
    type: 'enum',
    enum: CertificateStatus,
    default: CertificateStatus.GENERATED,
  })
  status: CertificateStatus;

  @Column({ name: 'pdf_url', length: 500, nullable: true })
  pdf_url: string;

  @Column({ name: 'image_url', length: 500, nullable: true })
  image_url: string;

  @Column({ name: 'qr_code_url', length: 500, nullable: true })
  qr_code_url: string;

  @Column({ name: 'verification_url', length: 500 })
  verification_url: string;

  @Column({ name: 'completion_date', type: 'timestamp' })
  completion_date: Date;

  @Column({ name: 'is_revoked', default: false })
  is_revoked: boolean;

  @Column({ name: 'revoked_reason', type: 'text', nullable: true })
  revoked_reason: string;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revoked_at: Date;

  @Column({ name: 'download_count', default: 0 })
  download_count: number;

  @Column({ name: 'last_downloaded_at', type: 'timestamp', nullable: true })
  last_downloaded_at: Date;

  @Column({ type: 'json', nullable: true })
  metadata: {
    grade?: number;
    score?: number;
    additional_info?: string;
    custom_fields?: Record<string, any>;
  };

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}