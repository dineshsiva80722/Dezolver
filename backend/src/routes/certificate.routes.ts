import { Router } from 'express';
import { CertificateController } from '../controllers/certificate.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { uploadTemplateAssets, getFileUrl } from '../middleware/upload.middleware';

const router = Router();
const certificateController = new CertificateController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Certificate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         certificate_id:
 *           type: string
 *         learner_id:
 *           type: string
 *         course_name:
 *           type: string
 *         trigger_type:
 *           type: string
 *           enum: [course_completion, assessment_pass, contest_completion, problem_solved, manual_approval]
 *         status:
 *           type: string
 *           enum: [generated, sent, downloaded, revoked]
 *         completion_date:
 *           type: string
 *           format: date
 *         pdf_url:
 *           type: string
 *         verification_url:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 * 
 *     CertificateTemplate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         template_config:
 *           type: object
 *         is_default:
 *           type: boolean
 *         is_active:
 *           type: boolean
 */

/**
 * @swagger
 * /api/certificates/generate:
 *   post:
 *     summary: Generate a certificate
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - learner_id
 *               - course_name
 *               - trigger_type
 *               - completion_date
 *             properties:
 *               learner_id:
 *                 type: string
 *               instructor_id:
 *                 type: string
 *               template_id:
 *                 type: string
 *               course_name:
 *                 type: string
 *               problem_id:
 *                 type: string
 *               contest_id:
 *                 type: string
 *               trigger_type:
 *                 type: string
 *                 enum: [course_completion, assessment_pass, contest_completion, problem_solved, manual_approval]
 *               completion_date:
 *                 type: string
 *                 format: date
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Certificate generated successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/generate', authenticate, certificateController.generateCertificate);

/**
 * @swagger
 * /api/certificates/batch-generate:
 *   post:
 *     summary: Generate certificates in batch
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - certificates
 *             properties:
 *               certificates:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Certificates generated successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/batch-generate', authenticate, certificateController.batchGenerateCertificates);

/**
 * @swagger
 * /api/certificates/user/{userId}:
 *   get:
 *     summary: Get certificates for a user
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Certificates retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/user/:userId', authenticate, certificateController.getUserCertificates);

/**
 * @swagger
 * /api/certificates/my:
 *   get:
 *     summary: Get my certificates
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Certificates retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/my', authenticate, certificateController.getUserCertificates);

/**
 * @swagger
 * /api/certificates/download/{certificateId}:
 *   get:
 *     summary: Download certificate
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: certificateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Certificate download info
 *       404:
 *         description: Certificate not found
 *       410:
 *         description: Certificate revoked
 *       500:
 *         description: Server error
 */
router.get('/download/:certificateId', certificateController.downloadCertificate);

/**
 * @swagger
 * /api/certificates/verify/{certificateId}:
 *   get:
 *     summary: Verify certificate
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: certificateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Certificate is valid
 *       404:
 *         description: Certificate not found or invalid
 *       500:
 *         description: Server error
 */
router.get('/verify/:certificateId', certificateController.verifyCertificate);

/**
 * @swagger
 * /api/certificates/{certificateId}/revoke:
 *   patch:
 *     summary: Revoke certificate (Admin only)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: certificateId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Certificate revoked successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Certificate not found
 *       500:
 *         description: Server error
 */
router.patch('/:certificateId/revoke', authenticate, certificateController.revokeCertificate);

/**
 * @swagger
 * /api/certificates/{certificateId}/reissue:
 *   post:
 *     summary: Reissue certificate (Admin only)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: certificateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Certificate reissued successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Certificate not found
 *       500:
 *         description: Server error
 */
router.post('/:certificateId/reissue', authenticate, certificateController.reissueCertificate);

/**
 * @swagger
 * /api/certificates/search:
 *   get:
 *     summary: Search certificates
 *     tags: [Certificates]
 *     parameters:
 *       - in: query
 *         name: learnerUsername
 *         schema:
 *           type: string
 *       - in: query
 *         name: courseName
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Search results
 *       500:
 *         description: Server error
 */
router.get('/search', certificateController.searchCertificates);

// Certificate Templates Routes

/**
 * @swagger
 * /api/certificates/templates:
 *   get:
 *     summary: Get certificate templates
 *     tags: [Certificate Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/templates', authenticate, certificateController.getTemplates);

/**
 * @swagger
 * /api/certificates/templates:
 *   post:
 *     summary: Create certificate template
 *     tags: [Certificate Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - template_config
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               background_url:
 *                 type: string
 *               logo_url:
 *                 type: string
 *               watermark_url:
 *                 type: string
 *               template_config:
 *                 type: object
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/templates', authenticate, certificateController.createTemplate);

/**
 * @swagger
 * /api/certificates/templates/{templateId}:
 *   get:
 *     summary: Get certificate template
 *     tags: [Certificate Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template retrieved successfully
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.get('/templates/:templateId', authenticate, certificateController.getTemplate);

/**
 * @swagger
 * /api/certificates/templates/{templateId}:
 *   patch:
 *     summary: Update certificate template
 *     tags: [Certificate Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               template_config:
 *                 type: object
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.patch('/templates/:templateId', authenticate, certificateController.updateTemplate);

/**
 * @swagger
 * /api/certificates/templates/{templateId}/set-default:
 *   patch:
 *     summary: Set default template (Admin only)
 *     tags: [Certificate Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Default template set successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.patch('/templates/:templateId/set-default', authenticate, certificateController.setDefaultTemplate);

/**
 * @swagger
 * /api/certificates/templates/upload-assets:
 *   post:
 *     summary: Upload template assets (background, logo, watermark)
 *     tags: [Certificate Templates]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               background:
 *                 type: string
 *                 format: binary
 *                 description: Background image for certificate
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Logo image for certificate
 *               watermark:
 *                 type: string
 *                 format: binary
 *                 description: Watermark image for certificate
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     background_url:
 *                       type: string
 *                     logo_url:
 *                       type: string
 *                     watermark_url:
 *                       type: string
 *       400:
 *         description: Upload error
 *       413:
 *         description: File too large
 *       500:
 *         description: Server error
 */
router.post('/templates/upload-assets', authenticate, (req, res) => {
  uploadTemplateAssets(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'File too large. Maximum size is 10MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Upload failed'
      });
    }

    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const urls: { [key: string]: string } = {};

      if (files.background && files.background[0]) {
        urls.background_url = getFileUrl(files.background[0].filename, 'templates');
      }

      if (files.logo && files.logo[0]) {
        urls.logo_url = getFileUrl(files.logo[0].filename, 'templates');
      }

      if (files.watermark && files.watermark[0]) {
        urls.watermark_url = getFileUrl(files.watermark[0].filename, 'templates');
      }

      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully',
        data: urls
      });
    } catch (error) {
      console.error('File processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process uploaded files'
      });
    }
  });
});

export default router;