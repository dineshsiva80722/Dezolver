import { Request, Response } from 'express';
import { EmployeeService } from '../services/employee.service';
import { EmploymentType, PaymentFrequency } from '../models/Employee.entity';
import { UserRole } from '../models/User.entity';

export class EmployeeController {
  private employeeService: EmployeeService;

  constructor() {
    this.employeeService = new EmployeeService();
  }

  createEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        user_id,
        job_title,
        department,
        manager_id,
        hire_date,
        employment_type,
        work_hours_per_week,
        payment_frequency,
        basic_salary,
        salary_components,
        deductions,
        tax_preferences,
        bank_details
      } = req.body;

      const currentUser = (req as any).user;
      if (currentUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can create employee records'
        });
        return;
      }

      if (!user_id || !job_title || !department || !hire_date || !employment_type || !payment_frequency || !basic_salary) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: user_id, job_title, department, hire_date, employment_type, payment_frequency, basic_salary'
        });
        return;
      }

      if (bank_details) {
        const validation = await this.employeeService.validateBankDetails(bank_details);
        if (!validation.isValid) {
          res.status(400).json({
            success: false,
            message: 'Invalid bank details',
            errors: validation.errors
          });
          return;
        }
      }

      const employee = await this.employeeService.createEmployee({
        user_id,
        job_title,
        department,
        manager_id,
        hire_date: new Date(hire_date),
        employment_type: employment_type as EmploymentType,
        work_hours_per_week,
        payment_frequency: payment_frequency as PaymentFrequency,
        basic_salary,
        salary_components,
        deductions,
        tax_preferences,
        bank_details
      });

      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: employee
      });
    } catch (error) {
      console.error('Create employee error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create employee'
      });
    }
  };

  getEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
      const { department, employment_type, is_active, manager_id } = req.query;

      const filters = {
        department: department as string,
        employment_type: employment_type as EmploymentType,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
        manager_id: manager_id as string,
      };

      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const employees = await this.employeeService.getEmployees(filters);

      res.status(200).json({
        success: true,
        data: employees
      });
    } catch (error) {
      console.error('Get employees error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employees'
      });
    }
  };

  getEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employeeId } = req.params;

      const employee = await this.employeeService.getEmployeeById(employeeId);

      if (!employee) {
        res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: employee
      });
    } catch (error) {
      console.error('Get employee error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employee'
      });
    }
  };

  getEmployeeByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const currentUser = (req as any).user;

      if (currentUser.role !== UserRole.ADMIN && currentUser.userId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const employee = await this.employeeService.getEmployeeByUserId(userId);

      if (!employee) {
        res.status(404).json({
          success: false,
          message: 'Employee record not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: employee
      });
    } catch (error) {
      console.error('Get employee by user ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employee'
      });
    }
  };

  getMyEmployeeRecord = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;

      const employee = await this.employeeService.getEmployeeByUserId(currentUser.userId);

      if (!employee) {
        res.status(404).json({
          success: false,
          message: 'Employee record not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: employee
      });
    } catch (error) {
      console.error('Get my employee record error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employee record'
      });
    }
  };

  updateEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const updateData = req.body;
      const currentUser = (req as any).user;

      if (currentUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can update employee records'
        });
        return;
      }

      if (updateData.bank_details) {
        const validation = await this.employeeService.validateBankDetails(updateData.bank_details);
        if (!validation.isValid) {
          res.status(400).json({
            success: false,
            message: 'Invalid bank details',
            errors: validation.errors
          });
          return;
        }
      }

      const employee = await this.employeeService.updateEmployee(employeeId, updateData);

      if (!employee) {
        res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Employee updated successfully',
        data: employee
      });
    } catch (error) {
      console.error('Update employee error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update employee'
      });
    }
  };

  terminateEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const { termination_date, termination_reason } = req.body;
      const currentUser = (req as any).user;

      if (currentUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can terminate employees'
        });
        return;
      }

      if (!termination_date) {
        res.status(400).json({
          success: false,
          message: 'Termination date is required'
        });
        return;
      }

      const success = await this.employeeService.terminateEmployee(
        employeeId,
        new Date(termination_date),
        termination_reason
      );

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Employee terminated successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }
    } catch (error) {
      console.error('Terminate employee error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to terminate employee'
      });
    }
  };

  reactivateEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const currentUser = (req as any).user;

      if (currentUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can reactivate employees'
        });
        return;
      }

      const success = await this.employeeService.reactivateEmployee(employeeId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Employee reactivated successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }
    } catch (error) {
      console.error('Reactivate employee error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reactivate employee'
      });
    }
  };

  getDepartments = async (req: Request, res: Response): Promise<void> => {
    try {
      const departments = await this.employeeService.getDepartments();

      res.status(200).json({
        success: true,
        data: departments
      });
    } catch (error) {
      console.error('Get departments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve departments'
      });
    }
  };

  getManagers = async (req: Request, res: Response): Promise<void> => {
    try {
      const managers = await this.employeeService.getManagers();

      res.status(200).json({
        success: true,
        data: managers
      });
    } catch (error) {
      console.error('Get managers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve managers'
      });
    }
  };

  getDirectReports = async (req: Request, res: Response): Promise<void> => {
    try {
      const { managerId } = req.params;

      const directReports = await this.employeeService.getDirectReports(managerId);

      res.status(200).json({
        success: true,
        data: directReports
      });
    } catch (error) {
      console.error('Get direct reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve direct reports'
      });
    }
  };

  getMyDirectReports = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;

      const employee = await this.employeeService.getEmployeeByUserId(currentUser.userId);
      if (!employee) {
        res.status(404).json({
          success: false,
          message: 'Employee record not found'
        });
        return;
      }

      const directReports = await this.employeeService.getDirectReports(employee.id);

      res.status(200).json({
        success: true,
        data: directReports
      });
    } catch (error) {
      console.error('Get my direct reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve direct reports'
      });
    }
  };

  calculateTotalCompensation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employeeId } = req.params;

      const compensation = await this.employeeService.calculateTotalCompensation(employeeId);

      res.status(200).json({
        success: true,
        data: compensation
      });
    } catch (error) {
      console.error('Calculate compensation error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to calculate compensation'
      });
    }
  };

  searchEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        query,
        department,
        employment_type,
        is_active,
        limit = 10,
        offset = 0
      } = req.query;

      const searchParams = {
        query: query as string,
        department: department as string,
        employment_type: employment_type as EmploymentType,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10)
      };

      const result = await this.employeeService.searchEmployees(searchParams);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Search employees error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search employees'
      });
    }
  };

  verifyBankDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const currentUser = (req as any).user;

      if (currentUser.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only admins can verify bank details'
        });
        return;
      }

      const success = await this.employeeService.verifyEmployeeBankDetails(employeeId, currentUser.userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Employee bank details verified successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Employee or bank details not found'
        });
      }
    } catch (error) {
      console.error('Verify employee bank details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify bank details'
      });
    }
  };
}