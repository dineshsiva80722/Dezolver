import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  ManyToMany,
  ManyToOne,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { Submission } from './Submission.entity';
import { Contest } from './Contest.entity';
import { AssessmentAttempt } from './AssessmentAttempt.entity';
import { Organization } from './Organization.entity';

export enum UserRole {
  USER = 'user',
  MANAGER = 'manager',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  PROBLEM_SETTER = 'problem_setter',
  MODERATOR = 'moderator',
  ORGANIZATION_MANAGER = 'organization_manager',
  HR_MANAGER = 'hr_manager',
  PLATFORM_ADMIN = 'platform_admin',
}

export enum UserTier {
  USER = 'user',
  MANAGER = 'manager',
  PLATFORM = 'platform',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  @IsNotEmpty()
  username: string;

  @Column({ unique: true, length: 255 })
  @IsEmail()
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  @MinLength(8)
  password: string;

  @Column({ name: 'full_name', length: 255, nullable: true })
  full_name: string;

  @Column({ name: 'phone_number', length: 20, nullable: true })
  phone_number: string;

  @Column({ name: 'avatar_url', length: 500, nullable: true })
  avatar_url: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ length: 255, nullable: true })
  institution: string;

  @Column({ name: 'github_username', length: 100, nullable: true })
  github_username: string;

  @Column({ name: 'linkedin_url', length: 500, nullable: true })
  linkedin_url: string;

  @Column({ name: 'website_url', length: 500, nullable: true })
  website_url: string;

  @Column({ default: 1200 })
  rating: number;

  @Column({ name: 'max_rating', default: 1200 })
  max_rating: number;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserTier,
    default: UserTier.USER,
  })
  tier: UserTier;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @Column({ name: 'is_verified', default: false })
  is_verified: boolean;

  @Column({ name: 'is_banned', default: false })
  is_banned: boolean;

  @Column({ name: 'is_organization_owner', default: false })
  is_organization_owner: boolean;

  @Column({ name: 'verification_token', length: 255, nullable: true })
  verification_token: string;

  @Column({ name: 'reset_password_token', length: 255, nullable: true })
  reset_password_token: string;

  @Column({ name: 'reset_password_expires', type: 'timestamp', nullable: true })
  reset_password_expires: Date;

  @Column({ name: 'invited_by_id', type: 'uuid', nullable: true })
  invited_by_id: string;

  @Column({ name: 'invitation_accepted_at', type: 'timestamp', nullable: true })
  invitation_accepted_at: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  last_login: Date;

  @Column({ name: 'problems_solved', default: 0 })
  problems_solved: number;

  @Column({ name: 'contests_participated', default: 0 })
  contests_participated_count: number;

  @Column({ name: 'contribution_points', default: 0 })
  contribution_points: number;

  @Column({ name: 'managed_by', type: 'uuid', nullable: true, select: false })
  managed_by: string;

  @Column({ name: 'added_by', type: 'varchar', length: 20, nullable: true, default: 'self', select: false })
  added_by: string;

  // Relations
  @ManyToOne(() => User, user => user.managedUsers, { nullable: true })
  @JoinColumn({ name: 'managed_by' })
  manager: User;

  @OneToMany(() => User, user => user.manager)
  managedUsers: User[];

  @OneToMany(() => Submission, submission => submission.user)
  submissions: Submission[];

  @ManyToMany(() => Contest)
  @JoinTable({
    name: 'contest_participants',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'contest_id' }
  })
  contests: Contest[];

  @OneToMany(() => AssessmentAttempt, attempt => attempt.user)
  assessmentAttempts: AssessmentAttempt[];

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organization_id: string | null;

  @ManyToOne(() => Organization, org => org.users, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization | null;
}
