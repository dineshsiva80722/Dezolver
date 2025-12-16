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
import { Assessment } from './Assessment.entity';
import { QuestionOption } from './QuestionOption.entity';

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  MULTIPLE_SELECT = 'multiple_select',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  LONG_ANSWER = 'long_answer',
  CODING = 'coding'
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'assessment_id', type: 'uuid' })
  assessment_id: string;

  @Column({ type: 'text' })
  question_text: string;

  @Column({
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.MULTIPLE_CHOICE
  })
  type: QuestionType;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ default: 1 })
  marks: number;

  @Column({ name: 'order_index', default: 0 })
  order_index: number;

  @Column({ name: 'is_required', default: true })
  is_required: boolean;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Assessment, (assessment) => assessment.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessment_id' })
  assessment: Assessment;

  @OneToMany(() => QuestionOption, (option) => option.question, { cascade: true })
  options: QuestionOption[];
}
