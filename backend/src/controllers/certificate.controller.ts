import { Request, Response } from 'express';
import { CertificateGenerationService } from '../services/certificate-generation.service';
import { CertificateTemplateService } from '../services/certificate-template.service';
import { CertificateVerificationService } from '../services/certificate-verification.service';
import { CertificateTriggerType } from '../models/Certificate.entity';
import { UserRole } from '../models/User.entity';

export class CertificateController {
  private generationService: CertificateGenerationService;
  private templateService: CertificateTemplateService;
  private verificationService: CertificateVerificationService;

  constructor() {
    this.generationService = new CertificateGenerationService();
    this.templateService = new CertificateTemplateService();
    this.verificationService = new CertificateVerificationService();
  }

  generateCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        learner_id,
        instructor_id,
        template_id,
        course_name,
        problem_id,
        contest_id,
        trigger_type,
        completion_date,
        metadata
      } = req.body;

      if (!learner_id || !course_name || !trigger_type || !completion_date) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: learner_id, course_name, trigger_type, completion_date'
        });
        return;
      }

      const certificate = await this.generationService.generateCertificate({
        learner_id,
        instructor_id,
        template_id,
        course_name,
        problem_id,
        contest_id,
        trigger_type: trigger_type as CertificateTriggerType,
        completion_date: new Date(completion_date),
        metadata
      });

      res.status(201).json({
        success: true,
        message: 'Certificate generated successfully',
        data: certificate
      });
    } catch (error) {
      console.error('Certificate generation error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate certificate'
      });
    }
  };

  batchGenerateCertificates = async (req: Request, res: Response): Promise<void> => {
    try {
      const { certificates } = req.body;

      if (!Array.isArray(certificates) || certificates.length === 0) {
        res.status(400).json({
          success: false,
          message: 'certificates array is required and must not be empty'
        });
        return;
      }

      const results = await this.generationService.batchGenerateCertificates(
        certificates.map(cert => ({
          ...cert,
          completion_date: new Date(cert.completion_date)
        }))
      );

      res.status(201).json({
        success: true,
        message: 'Certificates generated successfully',
        data: results
      });
    } catch (error) {
      console.error('Batch certificate generation error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate certificates'
      });
    }
  };

  getUserCertificates = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId || (req as any).user.userId;
      
      const certificates = await this.generationService.getUserCertificates(userId);

      res.status(200).json({
        success: true,
        data: certificates
      });
    } catch (error) {
      console.error('Get user certificates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve certificates'
      });
    }
  };

  downloadCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { certificateId } = req.params;

      const certificate = await this.generationService.getCertificateByCertificateId(certificateId);

      if (!certificate) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
        return;
      }

      if (certificate.is_revoked) {
        res.status(410).json({
          success: false,
          message: 'Certificate has been revoked'
        });
        return;
      }

      await this.generationService.updateCertificateDownloadCount(certificateId);

      res.status(200).json({
        success: true,
        data: {
          pdf_url: certificate.pdf_url,
          image_url: certificate.image_url,
          certificate_id: certificate.certificate_id,
          learner_name: certificate.learner.full_name || certificate.learner.username,
          course_name: certificate.course_name
        }
      });
    } catch (error) {
      console.error('Download certificate error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download certificate'
      });
    }
  };

  verifyCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { certificateId } = req.params;

      const result = await this.verificationService.verifyCertificate(certificateId);

      if (result.isValid) {
        res.status(200).json({
          success: true,
          message: 'Certificate is valid',
          data: result.certificate
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.error || 'Certificate verification failed'
        });
      }
    } catch (error) {
      console.error('Certificate verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Verification service error'
      });
    }
  };

  revokeCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { certificateId } = req.params;
      const { reason } = req.body;
      const adminUser = (req as any).user;

      if (adminUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can revoke certificates'
        });
        return;
      }

      const success = await this.generationService.revokeCertificate(
        certificateId,
        reason,
        adminUser.userId
      );

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Certificate revoked successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
      }
    } catch (error) {
      console.error('Revoke certificate error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to revoke certificate'
      });
    }
  };

  reissueCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { certificateId } = req.params;
      const adminUser = (req as any).user;

      if (adminUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can reissue certificates'
        });
        return;
      }

      const newCertificate = await this.generationService.reissueCertificate(certificateId);

      res.status(201).json({
        success: true,
        message: 'Certificate reissued successfully',
        data: newCertificate
      });
    } catch (error) {
      console.error('Reissue certificate error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reissue certificate'
      });
    }
  };

  createTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        description,
        background_url,
        logo_url,
        watermark_url,
        template_config
      } = req.body;
      const user = (req as any).user;

      if (!name || !template_config) {
        res.status(400).json({
          success: false,
          message: 'Name and template_config are required'
        });
        return;
      }

      const isValidConfig = await this.templateService.validateTemplateConfig(template_config);
      if (!isValidConfig) {
        res.status(400).json({
          success: false,
          message: 'Invalid template configuration'
        });
        return;
      }

      const template = await this.templateService.createTemplate({
        name,
        description,
        background_url,
        logo_url,
        watermark_url,
        template_config,
        created_by_id: user.userId
      });

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: template
      });
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create template'
      });
    }
  };

  getTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const { active } = req.query;
      const isActive = active === 'true' ? true : active === 'false' ? false : undefined;

      const templates = await this.templateService.getTemplates(isActive);

      res.status(200).json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve templates'
      });
    }
  };

  getTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { templateId } = req.params;

      const template = await this.templateService.getTemplateById(templateId);

      if (!template) {
        res.status(404).json({
          success: false,
          message: 'Template not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Get template error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve template'
      });
    }
  };

  updateTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { templateId } = req.params;
      const updateData = req.body;

      if (updateData.template_config) {
        const isValidConfig = await this.templateService.validateTemplateConfig(updateData.template_config);
        if (!isValidConfig) {
          res.status(400).json({
            success: false,
            message: 'Invalid template configuration'
          });
          return;
        }
      }

      const template = await this.templateService.updateTemplate(templateId, updateData);

      if (!template) {
        res.status(404).json({
          success: false,
          message: 'Template not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        data: template
      });
    } catch (error) {
      console.error('Update template error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update template'
      });
    }
  };

  setDefaultTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { templateId } = req.params;
      const user = (req as any).user;

      if (user.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can set default templates'
        });
        return;
      }

      await this.templateService.setDefaultTemplate(templateId);

      res.status(200).json({
        success: true,
        message: 'Default template set successfully'
      });
    } catch (error) {
      console.error('Set default template error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set default template'
      });
    }
  };

  searchCertificates = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        learnerUsername,
        courseName,
        dateFrom,
        dateTo,
        limit = 10,
        offset = 0
      } = req.query;

      const searchParams = {
        learnerUsername: learnerUsername as string,
        courseName: courseName as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10)
      };

      const result = await this.verificationService.searchCertificates(searchParams);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Search certificates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search certificates'
      });
    }
  };
}