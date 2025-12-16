import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { CertificateTemplate } from '../models/CertificateTemplate.entity';
import { User } from '../models/User.entity';
import { v4 as uuidv4 } from 'uuid';

interface CreateTemplateDTO {
  name: string;
  description?: string;
  background_url?: string;
  logo_url?: string;
  watermark_url?: string;
  template_config: any;
  created_by_id: string;
}

interface UpdateTemplateDTO {
  name?: string;
  description?: string;
  background_url?: string;
  logo_url?: string;
  watermark_url?: string;
  template_config?: any;
  is_active?: boolean;
}

export class CertificateTemplateService {
  private templateRepository: Repository<CertificateTemplate>;

  constructor() {
    this.templateRepository = AppDataSource.getRepository(CertificateTemplate);
  }

  async createTemplate(data: CreateTemplateDTO): Promise<CertificateTemplate> {
    const template = this.templateRepository.create({
      id: uuidv4(),
      ...data
    });

    return await this.templateRepository.save(template);
  }

  async getTemplates(isActive?: boolean): Promise<CertificateTemplate[]> {
    const query = this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.created_by', 'created_by');

    if (isActive !== undefined) {
      query.where('template.is_active = :isActive', { isActive });
    }

    return await query.orderBy('template.created_at', 'DESC').getMany();
  }

  async getTemplateById(id: string): Promise<CertificateTemplate | null> {
    return await this.templateRepository.findOne({
      where: { id },
      relations: ['created_by']
    });
  }

  async getDefaultTemplate(): Promise<CertificateTemplate | null> {
    return await this.templateRepository.findOne({
      where: { is_default: true, is_active: true },
      relations: ['created_by']
    });
  }

  async updateTemplate(id: string, data: UpdateTemplateDTO): Promise<CertificateTemplate | null> {
    const template = await this.getTemplateById(id);
    if (!template) {
      return null;
    }

    Object.assign(template, data);
    return await this.templateRepository.save(template);
  }

  async setDefaultTemplate(id: string): Promise<boolean> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(
        CertificateTemplate,
        { is_default: true },
        { is_default: false }
      );

      await queryRunner.manager.update(
        CertificateTemplate,
        { id },
        { is_default: true, is_active: true }
      );

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const template = await this.getTemplateById(id);
    if (!template) {
      return false;
    }

    if (template.is_default) {
      throw new Error('Cannot delete default template');
    }

    await this.templateRepository.update({ id }, { is_active: false });
    return true;
  }

  async validateTemplateConfig(config: any): Promise<boolean> {
    const requiredFields = ['layout', 'placeholders'];
    const requiredPlaceholders = ['learnerName', 'courseName', 'completionDate', 'certificateId'];

    if (!config || typeof config !== 'object') {
      return false;
    }

    for (const field of requiredFields) {
      if (!config[field]) {
        return false;
      }
    }

    if (!config.layout.width || !config.layout.height || !config.layout.orientation) {
      return false;
    }

    if (!config.placeholders || typeof config.placeholders !== 'object') {
      return false;
    }

    for (const placeholder of requiredPlaceholders) {
      if (!config.placeholders[placeholder]) {
        return false;
      }

      const placeholderConfig = config.placeholders[placeholder];
      if (typeof placeholderConfig.x !== 'number' || typeof placeholderConfig.y !== 'number') {
        return false;
      }
    }

    return true;
  }

  async getDefaultTemplateConfig(): Promise<any> {
    return {
      layout: {
        width: 800,
        height: 600,
        orientation: 'landscape' as const
      },
      placeholders: {
        learnerName: {
          x: 400,
          y: 200,
          fontSize: 36,
          fontFamily: 'Arial',
          color: '#000000'
        },
        courseName: {
          x: 400,
          y: 280,
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#333333'
        },
        completionDate: {
          x: 400,
          y: 350,
          fontSize: 18,
          fontFamily: 'Arial',
          color: '#666666'
        },
        instructorName: {
          x: 200,
          y: 500,
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#666666'
        },
        certificateId: {
          x: 600,
          y: 500,
          fontSize: 12,
          fontFamily: 'Arial',
          color: '#999999'
        },
        qrCode: {
          x: 700,
          y: 450,
          size: 80
        }
      },
      fonts: ['Arial', 'Times New Roman', 'Helvetica'],
      language: 'en',
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        text: '#000000'
      }
    };
  }
}
