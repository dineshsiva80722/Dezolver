import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Employee, PaymentFrequency } from '../models/Employee.entity';
import { PayrollRecord, PayrollStatus } from '../models/PayrollRecord.entity';
import { PayrollCycle, PayrollCycleStatus } from '../models/PayrollCycle.entity';
import { v4 as uuidv4 } from 'uuid';

interface PayrollCalculationData {
  employee: Employee;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  workingDays: number;
  daysWorked: number;
  overtimeHours?: number;
  leaveDays?: number;
  bonuses?: number;
  incentives?: number;
  customAllowances?: Array<{ name: string; amount: number }>;
  customDeductions?: Array<{ name: string; amount: number }>;
}

interface TaxCalculationResult {
  tds: number;
  professionalTax: number;
  totalTax: number;
}

export class PayrollCalculationService {
  private employeeRepository: Repository<Employee>;
  private payrollRepository: Repository<PayrollRecord>;
  private cycleRepository: Repository<PayrollCycle>;

  constructor() {
    this.employeeRepository = AppDataSource.getRepository(Employee);
    this.payrollRepository = AppDataSource.getRepository(PayrollRecord);
    this.cycleRepository = AppDataSource.getRepository(PayrollCycle);
  }

  async calculatePayroll(data: PayrollCalculationData): Promise<PayrollRecord> {
    const { employee } = data;
    
    const existingPayroll = await this.payrollRepository.findOne({
      where: {
        employee_id: employee.id,
        pay_period_start: data.payPeriodStart,
      }
    });

    if (existingPayroll) {
      throw new Error('Payroll already exists for this period');
    }

    const payrollId = this.generatePayrollId();
    
    const basicSalary = this.calculateProportionalSalary(
      employee.basic_salary,
      data.workingDays,
      data.daysWorked,
      employee.payment_frequency
    );

    const earnings = this.calculateEarnings(employee, data, basicSalary);
    const grossSalary = basicSalary + this.sumEarnings(earnings);
    
    const taxResult = this.calculateTax(employee, grossSalary);
    const deductions = this.calculateDeductions(employee, data, grossSalary, taxResult);
    
    const totalDeductions = this.sumDeductions(deductions);
    const netSalary = grossSalary - totalDeductions;

    const payrollRecord = this.payrollRepository.create({
      id: uuidv4(),
      payroll_id: payrollId,
      employee_id: employee.id,
      pay_period_start: data.payPeriodStart,
      pay_period_end: data.payPeriodEnd,
      working_days: data.workingDays,
      days_worked: data.daysWorked,
      overtime_hours: data.overtimeHours || 0,
      leave_days: data.leaveDays || 0,
      basic_salary: basicSalary,
      earnings,
      gross_salary: grossSalary,
      deductions,
      total_deductions: totalDeductions,
      net_salary: netSalary,
      status: PayrollStatus.DRAFT,
    });

    return await this.payrollRepository.save(payrollRecord);
  }

  private generatePayrollId(): string {
    const date = new Date();
    const monthYear = `${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getFullYear()).slice(-2)}`;
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PAY${monthYear}${randomStr}`;
  }

  private calculateProportionalSalary(
    basicSalary: number,
    workingDays: number,
    daysWorked: number,
    frequency: PaymentFrequency
  ): number {
    if (workingDays === 0) return 0;
    
    const dailyRate = basicSalary / workingDays;
    return dailyRate * daysWorked;
  }

  private calculateEarnings(
    employee: Employee,
    data: PayrollCalculationData,
    basicSalary: number
  ): any {
    const earnings: any = {};
    const components = employee.salary_components || {};

    if (components.hra) {
      earnings.hra = this.calculateProportionalAmount(
        components.hra,
        data.workingDays,
        data.daysWorked
      );
    }

    if (components.transport_allowance) {
      earnings.transport_allowance = this.calculateProportionalAmount(
        components.transport_allowance,
        data.workingDays,
        data.daysWorked
      );
    }

    if (components.meal_allowance) {
      earnings.meal_allowance = this.calculateProportionalAmount(
        components.meal_allowance,
        data.workingDays,
        data.daysWorked
      );
    }

    if (components.medical_allowance) {
      earnings.medical_allowance = this.calculateProportionalAmount(
        components.medical_allowance,
        data.workingDays,
        data.daysWorked
      );
    }

    if (data.overtimeHours && components.overtime_rate) {
      earnings.overtime_pay = data.overtimeHours * components.overtime_rate;
    }

    if (data.bonuses) {
      earnings.bonus = data.bonuses;
    }

    if (data.incentives) {
      earnings.incentives = data.incentives;
    }

    if (data.customAllowances && data.customAllowances.length > 0) {
      earnings.custom_allowances = data.customAllowances;
    }

    if (components.custom_allowances && Array.isArray(components.custom_allowances)) {
      const customAllowances = components.custom_allowances.map(allowance => {
        let amount = 0;
        if (allowance.type === 'fixed') {
          amount = this.calculateProportionalAmount(
            allowance.amount,
            data.workingDays,
            data.daysWorked
          );
        } else if (allowance.type === 'percentage') {
          amount = (basicSalary * allowance.amount) / 100;
        }
        return { name: allowance.name, amount };
      });
      
      if (!earnings.custom_allowances) {
        earnings.custom_allowances = [];
      }
      earnings.custom_allowances.push(...customAllowances);
    }

    return earnings;
  }

  private calculateProportionalAmount(
    amount: number,
    workingDays: number,
    daysWorked: number
  ): number {
    if (workingDays === 0) return 0;
    return (amount / workingDays) * daysWorked;
  }

  private sumEarnings(earnings: any): number {
    let total = 0;
    
    Object.keys(earnings).forEach(key => {
      if (key === 'custom_allowances' && Array.isArray(earnings[key])) {
        total += earnings[key].reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      } else if (typeof earnings[key] === 'number') {
        total += earnings[key];
      }
    });

    return total;
  }

  private calculateTax(employee: Employee, grossSalary: number): TaxCalculationResult {
    const taxPreferences = employee.tax_preferences || {};
    let tds = 0;
    let professionalTax = 0;

    const annualSalary = grossSalary * 12;

    if (taxPreferences.tax_regime === 'old') {
      tds = this.calculateTDSOldRegime(annualSalary, taxPreferences.tax_exemptions || []);
    } else {
      tds = this.calculateTDSNewRegime(annualSalary);
    }

    tds = tds / 12;

    if (grossSalary > 15000) {
      professionalTax = 200;
    } else if (grossSalary > 10000) {
      professionalTax = 150;
    }

    return {
      tds,
      professionalTax,
      totalTax: tds + professionalTax
    };
  }

  private calculateTDSOldRegime(annualSalary: number, exemptions: any[]): number {
    let taxableIncome = annualSalary;
    
    const standardDeduction = Math.min(50000, annualSalary);
    taxableIncome -= standardDeduction;

    exemptions.forEach(exemption => {
      taxableIncome -= exemption.amount || 0;
    });

    taxableIncome = Math.max(0, taxableIncome);

    let tax = 0;
    if (taxableIncome <= 250000) {
      tax = 0;
    } else if (taxableIncome <= 500000) {
      tax = (taxableIncome - 250000) * 0.05;
    } else if (taxableIncome <= 1000000) {
      tax = 12500 + (taxableIncome - 500000) * 0.20;
    } else {
      tax = 112500 + (taxableIncome - 1000000) * 0.30;
    }

    const cess = tax * 0.04;
    return tax + cess;
  }

  private calculateTDSNewRegime(annualSalary: number): number {
    let taxableIncome = annualSalary;
    
    let tax = 0;
    if (taxableIncome <= 300000) {
      tax = 0;
    } else if (taxableIncome <= 600000) {
      tax = (taxableIncome - 300000) * 0.05;
    } else if (taxableIncome <= 900000) {
      tax = 15000 + (taxableIncome - 600000) * 0.10;
    } else if (taxableIncome <= 1200000) {
      tax = 45000 + (taxableIncome - 900000) * 0.15;
    } else if (taxableIncome <= 1500000) {
      tax = 90000 + (taxableIncome - 1200000) * 0.20;
    } else {
      tax = 150000 + (taxableIncome - 1500000) * 0.30;
    }

    const cess = tax * 0.04;
    return tax + cess;
  }

  private calculateDeductions(
    employee: Employee,
    data: PayrollCalculationData,
    grossSalary: number,
    taxResult: TaxCalculationResult
  ): any {
    const deductions: any = {};
    const deductionConfig = employee.deductions || {};

    if (deductionConfig.pf) {
      deductions.pf = Math.min(grossSalary * 0.12, 1800);
    }

    if (deductionConfig.esi && grossSalary <= 21000) {
      deductions.esi = grossSalary * 0.0075;
    }

    deductions.professional_tax = taxResult.professionalTax;
    deductions.tds = taxResult.tds;

    if (deductionConfig.insurance) {
      deductions.insurance = this.calculateProportionalAmount(
        deductionConfig.insurance,
        data.workingDays,
        data.daysWorked
      );
    }

    if (deductionConfig.loan_deduction) {
      deductions.loan_deduction = deductionConfig.loan_deduction;
    }

    if (data.leaveDays && data.leaveDays > 0) {
      const dailyRate = employee.basic_salary / data.workingDays;
      deductions.leave_deduction = dailyRate * data.leaveDays;
    }

    if (data.customDeductions && data.customDeductions.length > 0) {
      deductions.custom_deductions = data.customDeductions;
    }

    if (deductionConfig.custom_deductions && Array.isArray(deductionConfig.custom_deductions)) {
      const customDeductions = deductionConfig.custom_deductions.map(deduction => {
        let amount = 0;
        if (deduction.type === 'fixed') {
          amount = this.calculateProportionalAmount(
            deduction.amount,
            data.workingDays,
            data.daysWorked
          );
        } else if (deduction.type === 'percentage') {
          amount = (grossSalary * deduction.amount) / 100;
        }
        return { name: deduction.name, amount };
      });
      
      if (!deductions.custom_deductions) {
        deductions.custom_deductions = [];
      }
      deductions.custom_deductions.push(...customDeductions);
    }

    return deductions;
  }

  private sumDeductions(deductions: any): number {
    let total = 0;
    
    Object.keys(deductions).forEach(key => {
      if (key === 'custom_deductions' && Array.isArray(deductions[key])) {
        total += deductions[key].reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      } else if (typeof deductions[key] === 'number') {
        total += deductions[key];
      }
    });

    return total;
  }

  async batchCalculatePayroll(
    employees: Employee[],
    payPeriodStart: Date,
    payPeriodEnd: Date,
    workingDays: number
  ): Promise<PayrollRecord[]> {
    const results: PayrollRecord[] = [];
    
    for (const employee of employees) {
      try {
        const calculationData: PayrollCalculationData = {
          employee,
          payPeriodStart,
          payPeriodEnd,
          workingDays,
          daysWorked: workingDays,
        };

        const payrollRecord = await this.calculatePayroll(calculationData);
        results.push(payrollRecord);
      } catch (error) {
        console.error(`Failed to calculate payroll for employee ${employee.employee_id}:`, error);
      }
    }
    
    return results;
  }

  async processPayroll(payrollId: string, processedBy: string): Promise<PayrollRecord | null> {
    const payroll = await this.payrollRepository.findOne({
      where: { id: payrollId }
    });

    if (!payroll) {
      return null;
    }

    if (payroll.status !== PayrollStatus.DRAFT) {
      throw new Error('Payroll is not in draft status');
    }

    payroll.status = PayrollStatus.PROCESSED;
    payroll.processed_by_id = processedBy;
    payroll.processed_at = new Date();

    return await this.payrollRepository.save(payroll);
  }

  async markPayrollAsPaid(
    payrollId: string, 
    paymentDate: Date, 
    paymentReference: string
  ): Promise<PayrollRecord | null> {
    const payroll = await this.payrollRepository.findOne({
      where: { id: payrollId }
    });

    if (!payroll) {
      return null;
    }

    if (payroll.status !== PayrollStatus.PROCESSED) {
      throw new Error('Payroll must be processed before marking as paid');
    }

    payroll.status = PayrollStatus.PAID;
    payroll.payment_date = paymentDate;
    payroll.payment_reference = paymentReference;

    return await this.payrollRepository.save(payroll);
  }

  async getPayrollsByEmployee(
    employeeId: string,
    limit?: number,
    offset?: number
  ): Promise<{ records: PayrollRecord[]; total: number }> {
    const query = this.payrollRepository.createQueryBuilder('payroll')
      .where('payroll.employee_id = :employeeId', { employeeId })
      .orderBy('payroll.pay_period_start', 'DESC');

    const total = await query.getCount();

    if (limit) {
      query.limit(limit);
    }

    if (offset) {
      query.offset(offset);
    }

    const records = await query.getMany();

    return { records, total };
  }

  async getPayrollSummary(
    startDate: Date,
    endDate: Date,
    department?: string
  ): Promise<{
    totalEmployees: number;
    totalGrossAmount: number;
    totalDeductions: number;
    totalNetAmount: number;
    averageSalary: number;
    departmentBreakdown?: { [department: string]: number };
  }> {
    const query = this.payrollRepository.createQueryBuilder('payroll')
      .leftJoinAndSelect('payroll.employee', 'employee')
      .where('payroll.pay_period_start >= :startDate', { startDate })
      .andWhere('payroll.pay_period_end <= :endDate', { endDate });

    if (department) {
      query.andWhere('employee.department = :department', { department });
    }

    const records = await query.getMany();

    const totalEmployees = records.length;
    const totalGrossAmount = records.reduce((sum, record) => sum + record.gross_salary, 0);
    const totalDeductions = records.reduce((sum, record) => sum + record.total_deductions, 0);
    const totalNetAmount = records.reduce((sum, record) => sum + record.net_salary, 0);
    const averageSalary = totalEmployees > 0 ? totalNetAmount / totalEmployees : 0;

    return {
      totalEmployees,
      totalGrossAmount,
      totalDeductions,
      totalNetAmount,
      averageSalary,
    };
  }
}