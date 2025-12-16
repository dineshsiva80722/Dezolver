import { Request, Response } from 'express';
import { PayrollCalculationService } from '../services/payroll-calculation.service';
import { SalarySlipService } from '../services/salary-slip.service';
import { EmployeeService } from '../services/employee.service';
import { PayrollStatus } from '../models/PayrollRecord.entity';
import { UserRole } from '../models/User.entity';

export class PayrollController {
  private payrollService: PayrollCalculationService;
  private salarySlipService: SalarySlipService;
  private employeeService: EmployeeService;

  constructor() {
    this.payrollService = new PayrollCalculationService();
    this.salarySlipService = new SalarySlipService();
    this.employeeService = new EmployeeService();
  }

  calculatePayroll = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        employee_id,
        pay_period_start,
        pay_period_end,
        working_days,
        days_worked,
        overtime_hours,
        leave_days,
        bonuses,
        incentives,
        custom_allowances,
        custom_deductions
      } = req.body;

      const currentUser = (req as any).user;
      if (currentUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can calculate payroll'
        });
        return;
      }

      if (!employee_id || !pay_period_start || !pay_period_end || !working_days || !days_worked) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: employee_id, pay_period_start, pay_period_end, working_days, days_worked'
        });
        return;
      }

      const employee = await this.employeeService.getEmployeeById(employee_id);
      if (!employee) {
        res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
        return;
      }

      const payrollRecord = await this.payrollService.calculatePayroll({
        employee,
        payPeriodStart: new Date(pay_period_start),
        payPeriodEnd: new Date(pay_period_end),
        workingDays: working_days,
        daysWorked: days_worked,
        overtimeHours: overtime_hours,
        leaveDays: leave_days,
        bonuses,
        incentives,
        customAllowances: custom_allowances,
        customDeductions: custom_deductions
      });

      res.status(201).json({
        success: true,
        message: 'Payroll calculated successfully',
        data: payrollRecord
      });
    } catch (error) {
      console.error('Calculate payroll error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to calculate payroll'
      });
    }
  };

  batchCalculatePayroll = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        employee_ids,
        pay_period_start,
        pay_period_end,
        working_days
      } = req.body;

      const currentUser = (req as any).user;
      if (currentUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can calculate batch payroll'
        });
        return;
      }

      if (!Array.isArray(employee_ids) || employee_ids.length === 0 || !pay_period_start || !pay_period_end || !working_days) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: employee_ids (array), pay_period_start, pay_period_end, working_days'
        });
        return;
      }

      const employees = await Promise.all(
        employee_ids.map(id => this.employeeService.getEmployeeById(id))
      );

      const validEmployees = employees.filter(emp => emp !== null);

      if (validEmployees.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No valid employees found'
        });
        return;
      }

      const payrollRecords = await this.payrollService.batchCalculatePayroll(
        validEmployees,
        new Date(pay_period_start),
        new Date(pay_period_end),
        working_days
      );

      res.status(201).json({
        success: true,
        message: `Payroll calculated for ${payrollRecords.length} employees`,
        data: payrollRecords
      });
    } catch (error) {
      console.error('Batch calculate payroll error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to calculate batch payroll'
      });
    }
  };

  processPayroll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { payrollId } = req.params;
      const currentUser = (req as any).user;

      if (currentUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can process payroll'
        });
        return;
      }

      const processedPayroll = await this.payrollService.processPayroll(payrollId, currentUser.userId);

      if (!processedPayroll) {
        res.status(404).json({
          success: false,
          message: 'Payroll record not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Payroll processed successfully',
        data: processedPayroll
      });
    } catch (error) {
      console.error('Process payroll error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process payroll'
      });
    }
  };

  markPayrollAsPaid = async (req: Request, res: Response): Promise<void> => {
    try {
      const { payrollId } = req.params;
      const { payment_date, payment_reference } = req.body;
      const currentUser = (req as any).user;

      if (currentUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can mark payroll as paid'
        });
        return;
      }

      if (!payment_date || !payment_reference) {
        res.status(400).json({
          success: false,
          message: 'Payment date and payment reference are required'
        });
        return;
      }

      const paidPayroll = await this.payrollService.markPayrollAsPaid(
        payrollId,
        new Date(payment_date),
        payment_reference
      );

      if (!paidPayroll) {
        res.status(404).json({
          success: false,
          message: 'Payroll record not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Payroll marked as paid successfully',
        data: paidPayroll
      });
    } catch (error) {
      console.error('Mark payroll as paid error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to mark payroll as paid'
      });
    }
  };

  getEmployeePayrolls = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const { limit, offset } = req.query;
      const currentUser = (req as any).user;

      const employee = await this.employeeService.getEmployeeById(employeeId);
      if (!employee) {
        res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
        return;
      }

      if (currentUser.role !== UserRole.ADMIN && currentUser.userId !== employee.user_id) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const result = await this.payrollService.getPayrollsByEmployee(
        employeeId,
        limit ? parseInt(limit as string, 10) : undefined,
        offset ? parseInt(offset as string, 10) : undefined
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get employee payrolls error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payrolls'
      });
    }
  };

  getMyPayrolls = async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit, offset } = req.query;
      const currentUser = (req as any).user;

      const employee = await this.employeeService.getEmployeeByUserId(currentUser.userId);
      if (!employee) {
        res.status(404).json({
          success: false,
          message: 'Employee record not found'
        });
        return;
      }

      const result = await this.payrollService.getPayrollsByEmployee(
        employee.id,
        limit ? parseInt(limit as string, 10) : undefined,
        offset ? parseInt(offset as string, 10) : undefined
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get my payrolls error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payrolls'
      });
    }
  };

  generateSalarySlip = async (req: Request, res: Response): Promise<void> => {
    try {
      const { payrollId } = req.params;
      const currentUser = (req as any).user;

      if (currentUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can generate salary slips'
        });
        return;
      }

      const salarySlipUrl = await this.salarySlipService.generateSalarySlip(payrollId);

      res.status(200).json({
        success: true,
        message: 'Salary slip generated successfully',
        data: {
          salary_slip_url: salarySlipUrl
        }
      });
    } catch (error) {
      console.error('Generate salary slip error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate salary slip'
      });
    }
  };

  batchGenerateSalarySlips = async (req: Request, res: Response): Promise<void> => {
    try {
      const { payroll_ids } = req.body;
      const currentUser = (req as any).user;

      if (currentUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can generate salary slips'
        });
        return;
      }

      if (!Array.isArray(payroll_ids) || payroll_ids.length === 0) {
        res.status(400).json({
          success: false,
          message: 'payroll_ids array is required and must not be empty'
        });
        return;
      }

      const salarySlipUrls = await this.salarySlipService.batchGenerateSalarySlips(payroll_ids);

      res.status(200).json({
        success: true,
        message: `Generated ${salarySlipUrls.length} salary slips`,
        data: {
          salary_slip_urls: salarySlipUrls
        }
      });
    } catch (error) {
      console.error('Batch generate salary slips error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate salary slips'
      });
    }
  };

  downloadSalarySlip = async (req: Request, res: Response): Promise<void> => {
    try {
      const { payrollId } = req.params;
      const currentUser = (req as any).user;

      const employee = await this.employeeService.getEmployeeByUserId(currentUser.userId);

      const salarySlipUrl = await this.salarySlipService.getSalarySlipUrl(payrollId);

      if (!salarySlipUrl) {
        res.status(404).json({
          success: false,
          message: 'Salary slip not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          salary_slip_url: salarySlipUrl
        }
      });
    } catch (error) {
      console.error('Download salary slip error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download salary slip'
      });
    }
  };

  getPayrollSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { start_date, end_date, department } = req.query;
      const currentUser = (req as any).user;

      if (currentUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can view payroll summary'
        });
        return;
      }

      if (!start_date || !end_date) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
        return;
      }

      const summary = await this.payrollService.getPayrollSummary(
        new Date(start_date as string),
        new Date(end_date as string),
        department as string
      );

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Get payroll summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payroll summary'
      });
    }
  };
}