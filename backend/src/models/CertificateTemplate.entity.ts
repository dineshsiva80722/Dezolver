import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';
import { Certificate } from './Certificate.entity';

@Entity('certificate_templates')
export class CertificateTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'background_url', length: 500, nullable: true })
  background_url: string;

  @Column({ name: 'logo_url', length: 500, nullable: true })
  logo_url: string;

  @Column({ name: 'watermark_url', length: 500, nullable: true })
  watermark_url: string;

  @Column({ type: 'json' })
  template_config: {
    layout: {
      width: number;
      height: number;
      orientation: 'portrait' | 'landscape';
    };
    placeholders: {
      learnerName: { x: number; y: number; fontSize: number; fontFamily: string; color: string };
      courseName: { x: number; y: number; fontSize: number; fontFamily: string; color: string };
      completionDate: { x: number; y: number; fontSize: number; fontFamily: string; color: string };
      instructorName: { x: number; y: number; fontSize: number; fontFamily: string; color: string };
      certificateId: { x: number; y: number; fontSize: number; fontFamily: string; color: string };
      qrCode: { x: number; y: number; size: number };
    };
    fonts: string[];
    language: string;
    colors: {
      primary: string;
      secondary: string;
      text: string;
    };
  };

  @Column({ name: 'is_default', default: false })
  is_default: boolean;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @Column({ name: 'created_by_id' })
  created_by_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  created_by: User;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => Certificate, certificate => certificate.template)
  certificates: Certificate[];
}