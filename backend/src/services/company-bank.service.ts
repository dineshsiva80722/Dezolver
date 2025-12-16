import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { CompanyBankDetails } from '../models/CompanyBankDetails.entity';
import { v4 as uuidv4 } from 'uuid';

interface CreateCompanyBankDetailsDTO {
  company_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch_name?: string;
  branch_address?: string;
  swift_code?: string;
  account_type?: string;
  gst_number?: string;
  pan_number?: string;
  company_registration_number?: string;
  additional_details?: any;
  created_by_id: string;
}

interface UpdateCompanyBankDetailsDTO {
  company_name?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  branch_name?: string;
  branch_address?: string;
  swift_code?: string;
  account_type?: string;
  gst_number?: string;
  pan_number?: string;
  company_registration_number?: string;
  additional_details?: any;
  is_active?: boolean;
}

export class CompanyBankService {
  private bankRepository: Repository<CompanyBankDetails>;

  constructor() {
    this.bankRepository = AppDataSource.getRepository(CompanyBankDetails);
  }

  async createCompanyBankDetails(data: CreateCompanyBankDetailsDTO): Promise<CompanyBankDetails> {
    // If this is being set as primary, unset other primary accounts
    if (data.additional_details?.is_primary) {
      await this.bankRepository.update({ is_primary: true }, { is_primary: false });
    }

    const bankDetails = this.bankRepository.create({
      id: uuidv4(),
      ...data
    });

    return await this.bankRepository.save(bankDetails);
  }

  async getCompanyBankDetails(includeInactive: boolean = false): Promise<CompanyBankDetails[]> {
    const query = this.bankRepository
      .createQueryBuilder('bank')
      .leftJoinAndSelect('bank.created_by', 'created_by');

    if (!includeInactive) {
      query.where('bank.is_active = :isActive', { isActive: true });
    }

    return await query
      .orderBy('bank.is_primary', 'DESC')
      .addOrderBy('bank.created_at', 'DESC')
      .getMany();
  }

  async getPrimaryCompanyBankDetails(): Promise<CompanyBankDetails | null> {
    return await this.bankRepository.findOne({
      where: { is_primary: true, is_active: true },
      relations: ['created_by']
    });
  }

  async getCompanyBankDetailsById(id: string): Promise<CompanyBankDetails | null> {
    return await this.bankRepository.findOne({
      where: { id },
      relations: ['created_by']
    });
  }

  async updateCompanyBankDetails(
    id: string,
    data: UpdateCompanyBankDetailsDTO
  ): Promise<CompanyBankDetails | null> {
    const bankDetails = await this.getCompanyBankDetailsById(id);
    if (!bankDetails) {
      return null;
    }

    // If setting as primary, unset other primary accounts
    if (data.additional_details?.is_primary) {
      await this.bankRepository.update({ is_primary: true }, { is_primary: false });
    }

    Object.assign(bankDetails, data);
    return await this.bankRepository.save(bankDetails);
  }

  async setPrimaryBankDetails(id: string): Promise<boolean> {
    const bankDetails = await this.getCompanyBankDetailsById(id);
    if (!bankDetails) {
      return false;
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Unset all primary accounts
      await queryRunner.manager.update(
        CompanyBankDetails,
        { is_primary: true },
        { is_primary: false }
      );

      // Set this account as primary
      await queryRunner.manager.update(
        CompanyBankDetails,
        { id },
        { is_primary: true, is_active: true }
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

  async deleteCompanyBankDetails(id: string): Promise<boolean> {
    const bankDetails = await this.getCompanyBankDetailsById(id);
    if (!bankDetails) {
      return false;
    }

    if (bankDetails.is_primary) {
      throw new Error('Cannot delete primary bank account. Set another account as primary first.');
    }

    await this.bankRepository.update({ id }, { is_active: false });
    return true;
  }

  async validateBankDetails(bankDetails: any): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Required fields validation
    if (!bankDetails.account_number || bankDetails.account_number.length < 8) {
      errors.push('Account number must be at least 8 digits');
    }

    if (!bankDetails.ifsc_code || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifsc_code)) {
      errors.push('Invalid IFSC code format');
    }

    if (!bankDetails.account_holder_name || bankDetails.account_holder_name.trim().length < 2) {
      errors.push('Account holder name is required');
    }

    if (!bankDetails.bank_name || bankDetails.bank_name.trim().length < 2) {
      errors.push('Bank name is required');
    }

    // PAN validation if provided
    if (bankDetails.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(bankDetails.pan_number)) {
      errors.push('Invalid PAN number format');
    }

    // GST validation if provided
    if (
      bankDetails.gst_number &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(bankDetails.gst_number)
    ) {
      errors.push('Invalid GST number format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async verifyBankDetails(id: string, verifiedBy: string): Promise<boolean> {
    const bankDetails = await this.getCompanyBankDetailsById(id);
    if (!bankDetails) {
      return false;
    }

    bankDetails.additional_details = {
      ...bankDetails.additional_details,
      is_verified: true,
      verification_date: new Date().toISOString(),
      verified_by: verifiedBy
    };

    await this.bankRepository.save(bankDetails);
    return true;
  }

  async getBankDetailsForPayroll(): Promise<CompanyBankDetails | null> {
    return await this.getPrimaryCompanyBankDetails();
  }
}
