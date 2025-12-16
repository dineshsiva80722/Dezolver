import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Certificate, CertificateTriggerType, CertificateStatus } from '../models/Certificate.entity';
import { CertificateTemplate } from '../models/CertificateTemplate.entity';
import { User } from '../models/User.entity';
import { Problem } from '../models/Problem.entity';
import { Contest } from '../models/Contest.entity';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

interface GenerateCertificateDTO {
  learner_id: string;
  instructor_id?: string;
  template_id?: string;
  course_name: string;
  problem_id?: string;
  contest_id?: string;
  trigger_type: CertificateTriggerType;
  completion_date: Date;
  metadata?: any;
}

export class CertificateGenerationService {
  private certificateRepository: Repository<Certificate>;
  private templateRepository: Repository<CertificateTemplate>;
  private userRepository: Repository<User>;
  private problemRepository: Repository<Problem>;
  private contestRepository: Repository<Contest>;

  constructor() {
    this.certificateRepository = AppDataSource.getRepository(Certificate);
    this.templateRepository = AppDataSource.getRepository(CertificateTemplate);
    this.userRepository = AppDataSource.getRepository(User);
    this.problemRepository = AppDataSource.getRepository(Problem);
    this.contestRepository = AppDataSource.getRepository(Contest);
  }

  async generateCertificate(data: GenerateCertificateDTO): Promise<Certificate> {
    const learner = await this.userRepository.findOne({
      where: { id: data.learner_id }
    });
    
    if (!learner) {
      throw new Error('Learner not found');
    }

    let template: CertificateTemplate | null;
    if (data.template_id) {
      template = await this.templateRepository.findOne({
        where: { id: data.template_id, is_active: true }
      });
    } else {
      template = await this.templateRepository.findOne({
        where: { is_default: true, is_active: true }
      });
    }

    if (!template) {
      throw new Error('Certificate template not found');
    }

    const certificateId = this.generateCertificateId();
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-certificate/${certificateId}`;

    const certificate = this.certificateRepository.create({
      id: uuidv4(),
      certificate_id: certificateId,
      learner_id: data.learner_id,
      instructor_id: data.instructor_id,
      template_id: template.id,
      course_name: data.course_name,
      problem_id: data.problem_id,
      contest_id: data.contest_id,
      trigger_type: data.trigger_type,
      status: CertificateStatus.GENERATED,
      verification_url: verificationUrl,
      completion_date: data.completion_date,
      metadata: data.metadata,
    });

    const savedCertificate = await this.certificateRepository.save(certificate);

    try {
      const { pdfUrl, imageUrl, qrCodeUrl } = await this.generateCertificatePDF(savedCertificate, template, learner);
      
      savedCertificate.pdf_url = pdfUrl;
      savedCertificate.image_url = imageUrl;
      savedCertificate.qr_code_url = qrCodeUrl;

      await this.certificateRepository.save(savedCertificate);
      
      return savedCertificate;
    } catch (error) {
      await this.certificateRepository.delete(savedCertificate.id);
      throw error;
    }
  }

  private generateCertificateId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `CERT-${timestamp}-${randomStr}`.toUpperCase();
  }

  private async generateCertificatePDF(
    certificate: Certificate, 
    template: CertificateTemplate, 
    learner: User
  ): Promise<{ pdfUrl: string; imageUrl: string; qrCodeUrl: string }> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'certificates');
    const qrCodesDir = path.join(process.cwd(), 'uploads', 'qr-codes');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(qrCodesDir)) {
      fs.mkdirSync(qrCodesDir, { recursive: true });
    }

    const pdfFilename = `certificate-${certificate.certificate_id}.pdf`;
    const pdfPath = path.join(uploadsDir, pdfFilename);
    
    const qrCodeFilename = `qr-${certificate.certificate_id}.png`;
    const qrCodePath = path.join(qrCodesDir, qrCodeFilename);

    await QRCode.toFile(qrCodePath, certificate.verification_url, {
      width: template.template_config.placeholders.qrCode?.size || 80,
      margin: 1,
    });

    const doc = new PDFDocument({
      size: [template.template_config.layout.width, template.template_config.layout.height],
      margin: 0,
    });

    doc.pipe(fs.createWriteStream(pdfPath));

    if (template.background_url) {
      try {
        doc.image(template.background_url, 0, 0, {
          width: template.template_config.layout.width,
          height: template.template_config.layout.height,
        });
      } catch (error) {
        console.warn('Failed to load background image:', error);
      }
    }

    const placeholders = template.template_config.placeholders;

    if (placeholders.learnerName) {
      const config = placeholders.learnerName;
      doc.fontSize(config.fontSize || 36)
         .fillColor(config.color || '#000000')
         .font('Helvetica')
         .text(learner.full_name || learner.username, config.x, config.y, { align: 'center' });
    }

    if (placeholders.courseName) {
      const config = placeholders.courseName;
      doc.fontSize(config.fontSize || 24)
         .fillColor(config.color || '#333333')
         .font('Helvetica')
         .text(certificate.course_name, config.x, config.y, { align: 'center' });
    }

    if (placeholders.completionDate) {
      const config = placeholders.completionDate;
      const formattedDate = certificate.completion_date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.fontSize(config.fontSize || 18)
         .fillColor(config.color || '#666666')
         .font('Helvetica')
         .text(formattedDate, config.x, config.y, { align: 'center' });
    }

    if (placeholders.instructorName && certificate.instructor_id) {
      try {
        const instructor = await this.userRepository.findOne({
          where: { id: certificate.instructor_id }
        });
        if (instructor) {
          const config = placeholders.instructorName;
          doc.fontSize(config.fontSize || 16)
             .fillColor(config.color || '#666666')
             .font('Helvetica')
             .text(`Instructor: ${instructor.full_name || instructor.username}`, config.x, config.y);
        }
      } catch (error) {
        console.warn('Failed to load instructor details:', error);
      }
    }

    if (placeholders.certificateId) {
      const config = placeholders.certificateId;
      doc.fontSize(config.fontSize || 12)
         .fillColor(config.color || '#999999')
         .font('Helvetica')
         .text(`Certificate ID: ${certificate.certificate_id}`, config.x, config.y);
    }

    if (placeholders.qrCode) {
      const config = placeholders.qrCode;
      try {
        doc.image(qrCodePath, config.x, config.y, {
          width: config.size || 80,
          height: config.size || 80,
        });
      } catch (error) {
        console.warn('Failed to add QR code to PDF:', error);
      }
    }

    if (template.logo_url) {
      try {
        doc.image(template.logo_url, 50, 50, { width: 100 });
      } catch (error) {
        console.warn('Failed to load logo image:', error);
      }
    }

    if (template.watermark_url) {
      try {
        doc.image(template.watermark_url, 0, 0, {
          width: template.template_config.layout.width,
          height: template.template_config.layout.height,
          opacity: 0.1,
        });
      } catch (error) {
        console.warn('Failed to load watermark image:', error);
      }
    }

    doc.end();

    const baseUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    
    return {
      pdfUrl: `${baseUrl}/uploads/certificates/${pdfFilename}`,
      imageUrl: `${baseUrl}/uploads/certificates/${pdfFilename}`,
      qrCodeUrl: `${baseUrl}/uploads/qr-codes/${qrCodeFilename}`,
    };
  }

  async getCertificateById(id: string): Promise<Certificate | null> {
    return await this.certificateRepository.findOne({
      where: { id },
      relations: ['learner', 'instructor', 'template', 'problem', 'contest'],
    });
  }

  async getCertificateByCertificateId(certificateId: string): Promise<Certificate | null> {
    return await this.certificateRepository.findOne({
      where: { certificate_id: certificateId },
      relations: ['learner', 'instructor', 'template', 'problem', 'contest'],
    });
  }

  async getUserCertificates(userId: string): Promise<Certificate[]> {
    return await this.certificateRepository.find({
      where: { learner_id: userId, is_revoked: false },
      relations: ['template', 'problem', 'contest'],
      order: { created_at: 'DESC' },
    });
  }

  async revokeCertificate(id: string, reason: string, revokedBy: string): Promise<boolean> {
    const certificate = await this.getCertificateById(id);
    if (!certificate) {
      return false;
    }

    certificate.is_revoked = true;
    certificate.revoked_reason = reason;
    certificate.revoked_at = new Date();
    
    await this.certificateRepository.save(certificate);
    return true;
  }

  async reissueCertificate(originalCertificateId: string): Promise<Certificate> {
    const originalCertificate = await this.getCertificateById(originalCertificateId);
    if (!originalCertificate) {
      throw new Error('Original certificate not found');
    }

    const newCertificateData: GenerateCertificateDTO = {
      learner_id: originalCertificate.learner_id,
      instructor_id: originalCertificate.instructor_id,
      template_id: originalCertificate.template_id,
      course_name: originalCertificate.course_name,
      problem_id: originalCertificate.problem_id,
      contest_id: originalCertificate.contest_id,
      trigger_type: originalCertificate.trigger_type,
      completion_date: originalCertificate.completion_date,
      metadata: originalCertificate.metadata,
    };

    return await this.generateCertificate(newCertificateData);
  }

  async updateCertificateDownloadCount(certificateId: string): Promise<void> {
    await this.certificateRepository.increment(
      { certificate_id: certificateId },
      'download_count',
      1
    );
    
    await this.certificateRepository.update(
      { certificate_id: certificateId },
      { last_downloaded_at: new Date() }
    );
  }

  async batchGenerateCertificates(certificates: GenerateCertificateDTO[]): Promise<Certificate[]> {
    const results: Certificate[] = [];
    
    for (const certificateData of certificates) {
      try {
        const certificate = await this.generateCertificate(certificateData);
        results.push(certificate);
      } catch (error) {
        console.error(`Failed to generate certificate for learner ${certificateData.learner_id}:`, error);
        throw error;
      }
    }
    
    return results;
  }
}