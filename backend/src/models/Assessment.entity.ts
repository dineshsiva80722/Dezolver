import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { User } from './User.entity';
import { Question } from './Question.entity';

export enum AssessmentType {
  QUIZ = 'quiz',
  TEST = 'test',
  EXAM = 'exam',
  PRACTICE = 'practice'
}

export enum AssessmentDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

@Entity('assessments')
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: AssessmentType,
    default: AssessmentType.QUIZ
  })
  type: AssessmentType;

  @Column({
    type: 'enum',
    enum: AssessmentDifficulty,
    default: AssessmentDifficulty.MEDIUM
  })
  difficulty: AssessmentDifficulty;

  @Column({ name: 'duration_minutes', nullable: true })
  duration_minutes: number;

  @Column({ name: 'passing_percentage', default: 60 })
  passing_percentage: number;

  @Column({ name: 'total_marks', default: 100 })
  total_marks: number;

  @Column({ name: 'is_published', default: false })
  is_published: boolean;

  @Column({ name: 'is_public', default: false })
  is_public: boolean;

  @Column({ name: 'start_time', type: 'timestamp', nullable: true })
  start_time: Date | null;

  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  end_time: Date | null;

  @Column({ name: 'created_by', type: 'uuid' })
  created_by: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => Question, (question) => question.assessment)
  questions: Question[];
}
