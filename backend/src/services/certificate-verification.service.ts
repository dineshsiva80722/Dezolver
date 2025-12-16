import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Certificate } from '../models/Certificate.entity';
import { User } from '../models/User.entity';

interface VerificationResult {
  isValid: boolean;
  certificate?: {
    id: string;
    certificate_id: string;
    learner_name: string;
    learner_username: string;
    course_name: string;
    completion_date: Date;
    instructor_name?: string;
    issued_date: Date;
    problem_title?: string;
    contest_name?: string;
  };
  error?: string;
}

export class CertificateVerificationService {
  private certificateRepository: Repository<Certificate>;

  constructor() {
    this.certificateRepository = AppDataSource.getRepository(Certificate);
  }

  async verifyCertificate(certificateId: string): Promise<VerificationResult> {
    try {
      const certificate = await this.certificateRepository.findOne({
        where: { certificate_id: certificateId },
        relations: ['learner', 'instructor', 'template', 'problem', 'contest']
      });

      if (!certificate) {
        return {
          isValid: false,
          error: 'Certificate not found'
        };
      }

      if (certificate.is_revoked) {
        return {
          isValid: false,
          error: 'Certificate has been revoked'
        };
      }

      return {
        isValid: true,
        certificate: {
          id: certificate.id,
          certificate_id: certificate.certificate_id,
          learner_name: certificate.learner.full_name || certificate.learner.username,
          learner_username: certificate.learner.username,
          course_name: certificate.course_name,
          completion_date: certificate.completion_date,
          instructor_name: certificate.instructor?.full_name || certificate.instructor?.username,
          issued_date: certificate.created_at,
          problem_title: certificate.problem?.title,
          contest_name: certificate.contest?.title
        }
      };
    } catch (error) {
      console.error('Certificate verification error:', error);
      return {
        isValid: false,
        error: 'Verification service error'
      };
    }
  }

  async verifyQRCode(qrCodeData: string): Promise<VerificationResult> {
    try {
      const url = new URL(qrCodeData);
      const pathParts = url.pathname.split('/');
      const certificateId = pathParts[pathParts.length - 1];

      if (!certificateId) {
        return {
          isValid: false,
          error: 'Invalid QR code format'
        };
      }

      return await this.verifyCertificate(certificateId);
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid QR code URL'
      };
    }
  }

  async getCertificateVerificationStats(certificateId: string): Promise<{
    verificationCount: number;
    lastVerified: Date | null;
  }> {
    const certificate = await this.certificateRepository.findOne({
      where: { certificate_id: certificateId }
    });

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    return {
      verificationCount: 0,
      lastVerified: null
    };
  }

  async logVerificationAttempt(certificateId: string, ipAddress?: string): Promise<void> {
    console.log(
      `Certificate verification attempt for ${certificateId} from IP: ${ipAddress || 'unknown'}`
    );
  }

  async getBulkVerificationStatus(certificateIds: string[]): Promise<{
    valid: string[];
    revoked: string[];
    notFound: string[];
  }> {
    const certificates = await this.certificateRepository.find({
      where: certificateIds.map((id) => ({ certificate_id: id })),
      select: ['certificate_id', 'is_revoked']
    });

    const foundIds = certificates.map((cert) => cert.certificate_id);
    const valid = certificates
      .filter((cert) => !cert.is_revoked)
      .map((cert) => cert.certificate_id);
    const revoked = certificates
      .filter((cert) => cert.is_revoked)
      .map((cert) => cert.certificate_id);
    const notFound = certificateIds.filter((id) => !foundIds.includes(id));

    return { valid, revoked, notFound };
  }

  async searchCertificates(searchParams: {
    learnerUsername?: string;
    courseName?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{
    certificates: VerificationResult['certificate'][];
    total: number;
  }> {
    const query = this.certificateRepository
      .createQueryBuilder('certificate')
      .leftJoinAndSelect('certificate.learner', 'learner')
      .leftJoinAndSelect('certificate.instructor', 'instructor')
      .leftJoinAndSelect('certificate.problem', 'problem')
      .leftJoinAndSelect('certificate.contest', 'contest')
      .where('certificate.is_revoked = :isRevoked', { isRevoked: false });

    if (searchParams.learnerUsername) {
      query.andWhere('learner.username ILIKE :username', {
        username: `%${searchParams.learnerUsername}%`
      });
    }

    if (searchParams.courseName) {
      query.andWhere('certificate.course_name ILIKE :courseName', {
        courseName: `%${searchParams.courseName}%`
      });
    }

    if (searchParams.dateFrom) {
      query.andWhere('certificate.completion_date >= :dateFrom', {
        dateFrom: searchParams.dateFrom
      });
    }

    if (searchParams.dateTo) {
      query.andWhere('certificate.completion_date <= :dateTo', {
        dateTo: searchParams.dateTo
      });
    }

    const total = await query.getCount();

    if (searchParams.limit) {
      query.limit(searchParams.limit);
    }

    if (searchParams.offset) {
      query.offset(searchParams.offset);
    }

    const certificates = await query.orderBy('certificate.created_at', 'DESC').getMany();

    const mappedCertificates = certificates.map((cert) => ({
      id: cert.id,
      certificate_id: cert.certificate_id,
      learner_name: cert.learner.full_name || cert.learner.username,
      learner_username: cert.learner.username,
      course_name: cert.course_name,
      completion_date: cert.completion_date,
      instructor_name: cert.instructor?.full_name || cert.instructor?.username,
      issued_date: cert.created_at,
      problem_title: cert.problem?.title,
      contest_name: cert.contest?.title
    }));

    return {
      certificates: mappedCertificates,
      total
    };
  }
}
