import { Request, Response } from 'express';
import { CompanyBankService } from '../services/company-bank.service';
import { UserRole } from '../models/User.entity';

export class CompanyBankController {
  private bankService: CompanyBankService;

  constructor() {
    this.bankService = new CompanyBankService();
  }

  createCompanyBankDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        company_name,
        account_holder_name,
        account_number,
        ifsc_code,
        bank_name,
        branch_name,
        branch_address,
        swift_code,
        account_type,
        gst_number,
        pan_number,
        company_registration_number,
        additional_details
      } = req.body;
      
      const currentUser = (req as any).user;

      if (currentUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can manage company bank details'
        });
        return;
      }

      if (!company_name || !account_holder_name || !account_number || !ifsc_code || !bank_name) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: company_name, account_holder_name, account_number, ifsc_code, bank_name'
        });
        return;
      }

      // Validate bank details
      const validation = await this.bankService.validateBankDetails({
        account_number,
        ifsc_code,
        account_holder_name,
        bank_name,
        pan_number,
        gst_number
      });

      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid bank details',
          errors: validation.errors
        });
        return;
      }

      const bankDetails = await this.bankService.createCompanyBankDetails({
        company_name,
        account_holder_name,
        account_number,
        ifsc_code,
        bank_name,
        branch_name,
        branch_address,
        swift_code,
        account_type,
        gst_number,
        pan_number,
        company_registration_number,
        additional_details,
        created_by_id: currentUser.userId
      });

      res.status(201).json({
        success: true,
        message: 'Company bank details created successfully',
        data: bankDetails
      });
    } catch (error) {
      console.error('Create company bank details error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create company bank details'
      });
    }
  };

  getCompanyBankDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { include_inactive } = req.query;
      
      const bankDetails = await this.bankService.getCompanyBankDetails(
        include_inactive === 'true'
      );

      res.status(200).json({
        success: true,
        data: bankDetails
      });
    } catch (error) {
      console.error('Get company bank details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve company bank details'
      });
    }
  };

  getPrimaryBankDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const bankDetails = await this.bankService.getPrimaryCompanyBankDetails();

      if (!bankDetails) {
        res.status(404).json({
          success: false,
          message: 'No primary bank details found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: bankDetails
      });
    } catch (error) {
      console.error('Get primary bank details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve primary bank details'
      });
    }
  };

  updateCompanyBankDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { bankId } = req.params;
      const updateData = req.body;
      const currentUser = (req as any).user;

      if (currentUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can update company bank details'
        });
        return;
      }

      // Validate bank details if provided
      if (updateData.account_number || updateData.ifsc_code) {
        const validation = await this.bankService.validateBankDetails(updateData);
        if (!validation.isValid) {
          res.status(400).json({
            success: false,
            message: 'Invalid bank details',
            errors: validation.errors
          });
          return;
        }
      }

      const bankDetails = await this.bankService.updateCompanyBankDetails(bankId, updateData);

      if (!bankDetails) {
        res.status(404).json({
          success: false,
          message: 'Company bank details not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Company bank details updated successfully',
        data: bankDetails
      });
    } catch (error) {
      console.error('Update company bank details error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update company bank details'
      });
    }
  };

  setPrimaryBankDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { bankId } = req.params;
      const currentUser = (req as any).user;

      if (currentUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can set primary bank details'
        });
        return;
      }

      const success = await this.bankService.setPrimaryBankDetails(bankId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Primary bank details set successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Bank details not found'
        });
      }
    } catch (error) {
      console.error('Set primary bank details error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to set primary bank details'
      });
    }
  };

  verifyBankDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { bankId } = req.params;
      const currentUser = (req as any).user;

      if (currentUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can verify bank details'
        });
        return;
      }

      const success = await this.bankService.verifyBankDetails(bankId, currentUser.userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Bank details verified successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Bank details not found'
        });
      }
    } catch (error) {
      console.error('Verify bank details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify bank details'
      });
    }
  };

  deleteCompanyBankDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { bankId } = req.params;
      const currentUser = (req as any).user;

      if (currentUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can delete company bank details'
        });
        return;
      }

      const success = await this.bankService.deleteCompanyBankDetails(bankId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Company bank details deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Bank details not found'
        });
      }
    } catch (error) {
      console.error('Delete company bank details error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete company bank details'
      });
    }
  };
}