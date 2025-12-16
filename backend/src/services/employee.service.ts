import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Employee, EmploymentType, PaymentFrequency } from '../models/Employee.entity';
import { User } from '../models/User.entity';
import { v4 as uuidv4 } from 'uuid';

interface CreateEmployeeDTO {
  user_id: string;
  job_title: string;
  department: string;
  manager_id?: string;
  hire_date: Date;
  employment_type: EmploymentType;
  work_hours_per_week?: number;
  payment_frequency: PaymentFrequency;
  basic_salary: number;
  salary_components?: any;
  deductions?: any;
  tax_preferences?: any;
  bank_details?: any;
}

interface UpdateEmployeeDTO {
  job_title?: string;
  department?: string;
  manager_id?: string;
  employment_type?: EmploymentType;
  work_hours_per_week?: number;
  payment_frequency?: PaymentFrequency;
  basic_salary?: number;
  salary_components?: any;
  deductions?: any;
  tax_preferences?: any;
  bank_details?: any;
  is_active?: boolean;
  termination_date?: Date;
  termination_reason?: string;
}

export class EmployeeService {
  private employeeRepository: Repository<Employee>;
  private userRepository: Repository<User>;

  constructor() {
    this.employeeRepository = AppDataSource.getRepository(Employee);
    this.userRepository = AppDataSource.getRepository(User);
  }

  async createEmployee(data: CreateEmployeeDTO): Promise<Employee> {
    const user = await this.userRepository.findOne({
      where: { id: data.user_id }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const existingEmployee = await this.employeeRepository.findOne({
      where: { user_id: data.user_id }
    });

    if (existingEmployee) {
      throw new Error('Employee record already exists for this user');
    }

    if (data.manager_id) {
      const manager = await this.employeeRepository.findOne({
        where: { id: data.manager_id, is_active: true }
      });

      if (!manager) {
        throw new Error('Manager not found');
      }
    }

    const employeeId = this.generateEmployeeId();

    const employee = this.employeeRepository.create({
      id: uuidv4(),
      employee_id: employeeId,
      ...data,
    });

    return await this.employeeRepository.save(employee);
  }

  private generateEmployeeId(): string {
    const timestamp = Date.now().toString().slice(-6);
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `EMP${timestamp}${randomStr}`;
  }

  async getEmployees(filters?: {
    department?: string;
    employment_type?: EmploymentType;
    is_active?: boolean;
    manager_id?: string;
  }): Promise<Employee[]> {
    const query = this.employeeRepository.createQueryBuilder('employee')
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('employee.manager', 'manager')
      .leftJoinAndSelect('manager.user', 'manager_user');

    if (filters?.department) {
      query.andWhere('employee.department = :department', { department: filters.department });
    }

    if (filters?.employment_type) {
      query.andWhere('employee.employment_type = :employment_type', { 
        employment_type: filters.employment_type 
      });
    }

    if (filters?.is_active !== undefined) {
      query.andWhere('employee.is_active = :is_active', { is_active: filters.is_active });
    }

    if (filters?.manager_id) {
      query.andWhere('employee.manager_id = :manager_id', { manager_id: filters.manager_id });
    }

    return await query
      .orderBy('employee.created_at', 'DESC')
      .getMany();
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    return await this.employeeRepository.findOne({
      where: { id },
      relations: ['user', 'manager', 'manager.user'],
    });
  }

  async getEmployeeByUserId(userId: string): Promise<Employee | null> {
    return await this.employeeRepository.findOne({
      where: { user_id: userId },
      relations: ['user', 'manager', 'manager.user'],
    });
  }

  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | null> {
    return await this.employeeRepository.findOne({
      where: { employee_id: employeeId },
      relations: ['user', 'manager', 'manager.user'],
    });
  }

  async updateEmployee(id: string, data: UpdateEmployeeDTO): Promise<Employee | null> {
    const employee = await this.getEmployeeById(id);
    if (!employee) {
      return null;
    }

    if (data.manager_id && data.manager_id !== employee.manager_id) {
      const manager = await this.employeeRepository.findOne({
        where: { id: data.manager_id, is_active: true }
      });

      if (!manager) {
        throw new Error('Manager not found');
      }
    }

    Object.assign(employee, data);
    return await this.employeeRepository.save(employee);
  }

  async terminateEmployee(id: string, terminationDate: Date, reason?: string): Promise<boolean> {
    const employee = await this.getEmployeeById(id);
    if (!employee) {
      return false;
    }

    employee.is_active = false;
    employee.termination_date = terminationDate;
    employee.termination_reason = reason;

    await this.employeeRepository.save(employee);
    return true;
  }

  async reactivateEmployee(id: string): Promise<boolean> {
    const employee = await this.getEmployeeById(id);
    if (!employee) {
      return false;
    }

    employee.is_active = true;
    employee.termination_date = null;
    employee.termination_reason = null;

    await this.employeeRepository.save(employee);
    return true;
  }

  async getDepartments(): Promise<string[]> {
    const result = await this.employeeRepository
      .createQueryBuilder('employee')
      .select('DISTINCT employee.department', 'department')
      .where('employee.is_active = :is_active', { is_active: true })
      .getRawMany();

    return result.map(row => row.department).filter(Boolean);
  }

  async getManagers(): Promise<Employee[]> {
    const allEmployees = await this.employeeRepository.find({
      where: { is_active: true },
      relations: ['user'],
    });

    const managersIds = new Set(
      allEmployees
        .map(emp => emp.manager_id)
        .filter(Boolean)
    );

    return allEmployees.filter(emp => managersIds.has(emp.id));
  }

  async getDirectReports(managerId: string): Promise<Employee[]> {
    return await this.employeeRepository.find({
      where: { 
        manager_id: managerId,
        is_active: true 
      },
      relations: ['user'],
      order: { created_at: 'DESC' }
    });
  }

  async validateBankDetails(bankDetails: any): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!bankDetails || typeof bankDetails !== 'object') {
      errors.push('Bank details object is required');
      return { isValid: false, errors };
    }

    // Required field validation
    if (!bankDetails.account_number || bankDetails.account_number.length < 8) {
      errors.push('Account number must be at least 8 digits');
    }

    if (!bankDetails.ifsc_code || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifsc_code)) {
      errors.push('Invalid IFSC code format (e.g., SBIN0001234)');
    }

    if (!bankDetails.account_holder_name || bankDetails.account_holder_name.trim().length < 2) {
      errors.push('Account holder name is required');
    }

    if (!bankDetails.bank_name || bankDetails.bank_name.trim().length < 2) {
      errors.push('Bank name is required');
    }

    // Optional validations
    if (bankDetails.upi_id && !/^[\w.-]+@[\w.-]+$/.test(bankDetails.upi_id)) {
      errors.push('Invalid UPI ID format');
    }

    if (bankDetails.micr_code && !/^[0-9]{9}$/.test(bankDetails.micr_code)) {
      errors.push('MICR code must be 9 digits');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async verifyEmployeeBankDetails(employeeId: string, verifiedBy: string): Promise<boolean> {
    const employee = await this.getEmployeeById(employeeId);
    if (!employee || !employee.bank_details) {
      return false;
    }

    employee.bank_details = {
      ...employee.bank_details,
      is_verified: true,
      verification_date: new Date().toISOString()
    };

    await this.employeeRepository.save(employee);
    return true;
  }

  async calculateTotalCompensation(employeeId: string): Promise<{
    basic_salary: number;
    total_allowances: number;
    total_deductions: number;
    gross_salary: number;
    net_salary: number;
  }> {
    const employee = await this.getEmployeeById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const basicSalary = employee.basic_salary;
    let totalAllowances = 0;
    let totalDeductions = 0;

    if (employee.salary_components) {
      const components = employee.salary_components;
      totalAllowances += (components.hra || 0);
      totalAllowances += (components.transport_allowance || 0);
      totalAllowances += (components.meal_allowance || 0);
      totalAllowances += (components.medical_allowance || 0);
      totalAllowances += (components.bonus || 0);

      if (components.custom_allowances && Array.isArray(components.custom_allowances)) {
        for (const allowance of components.custom_allowances) {
          if (allowance.type === 'fixed') {
            totalAllowances += allowance.amount;
          } else if (allowance.type === 'percentage') {
            totalAllowances += (basicSalary * allowance.amount) / 100;
          }
        }
      }
    }

    if (employee.deductions) {
      const deductions = employee.deductions;
      totalDeductions += (deductions.pf || 0);
      totalDeductions += (deductions.esi || 0);
      totalDeductions += (deductions.professional_tax || 0);
      totalDeductions += (deductions.insurance || 0);
      totalDeductions += (deductions.loan_deduction || 0);

      if (deductions.custom_deductions && Array.isArray(deductions.custom_deductions)) {
        for (const deduction of deductions.custom_deductions) {
          if (deduction.type === 'fixed') {
            totalDeductions += deduction.amount;
          } else if (deduction.type === 'percentage') {
            totalDeductions += (basicSalary * deduction.amount) / 100;
          }
        }
      }
    }

    const grossSalary = basicSalary + totalAllowances;
    const netSalary = grossSalary - totalDeductions;

    return {
      basic_salary: basicSalary,
      total_allowances: totalAllowances,
      total_deductions: totalDeductions,
      gross_salary: grossSalary,
      net_salary: netSalary,
    };
  }

  async searchEmployees(searchParams: {
    query?: string;
    department?: string;
    employment_type?: EmploymentType;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{
    employees: Employee[];
    total: number;
  }> {
    const query = this.employeeRepository.createQueryBuilder('employee')
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('employee.manager', 'manager')
      .leftJoinAndSelect('manager.user', 'manager_user');

    if (searchParams.query) {
      query.andWhere(
        '(user.username ILIKE :search OR user.full_name ILIKE :search OR employee.employee_id ILIKE :search OR employee.job_title ILIKE :search)',
        { search: `%${searchParams.query}%` }
      );
    }

    if (searchParams.department) {
      query.andWhere('employee.department = :department', { 
        department: searchParams.department 
      });
    }

    if (searchParams.employment_type) {
      query.andWhere('employee.employment_type = :employment_type', { 
        employment_type: searchParams.employment_type 
      });
    }

    if (searchParams.is_active !== undefined) {
      query.andWhere('employee.is_active = :is_active', { 
        is_active: searchParams.is_active 
      });
    }

    const total = await query.getCount();

    if (searchParams.limit) {
      query.limit(searchParams.limit);
    }

    if (searchParams.offset) {
      query.offset(searchParams.offset);
    }

    const employees = await query
      .orderBy('employee.created_at', 'DESC')
      .getMany();

    return { employees, total };
  }
}