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
import { Assessment } from './Assessment.entity';

export enum AttemptStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  EVALUATED = 'evaluated'
}

@Entity('assessment_attempts')
export class AssessmentAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'assessment_id', type: 'uuid' })
  assessment_id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @Column({
    type: 'enum',
    enum: AttemptStatus,
    default: AttemptStatus.IN_PROGRESS
  })
  status: AttemptStatus;

  @Column({ name: 'start_time', type: 'timestamp' })
  start_time: Date;

  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  end_time: Date;

  @Column({ name: 'score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({ name: 'percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage: number;

  @Column({ name: 'is_passed', default: false })
  is_passed: boolean;

  @Column({ type: 'simple-json', nullable: true })
  answers: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Assessment)
  @JoinColumn({ name: 'assessment_id' })
  assessment: Assessment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
