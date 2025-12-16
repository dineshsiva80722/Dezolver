import { create } from 'zustand'
import { payrollAPI } from '@services/api'
import toast from 'react-hot-toast'

export interface PayrollRecord {
  id: string
  payroll_id: string
  employee_id: string
  pay_period_start: string
  pay_period_end: string
  working_days: number
  days_worked: number
  overtime_hours: number
  leave_days: number
  basic_salary: number
  earnings: any
  gross_salary: number
  deductions: any
  total_deductions: number
  net_salary: number
  status: 'draft' | 'processed' | 'paid' | 'cancelled'
  processed_at?: string
  payment_date?: string
  payment_reference?: string
  salary_slip_url?: string
  created_at: string
  employee?: {
    id: string
    employee_id: string
    user: {
      username: string
      full_name?: string
    }
    job_title: string
    department: string
  }
}

export interface PayrollSummary {
  totalEmployees: number
  totalGrossAmount: number
  totalDeductions: number
  totalNetAmount: number
  averageSalary: number
  departmentBreakdown?: { [department: string]: number }
}

interface PayrollState {
  // State
  payrolls: PayrollRecord[]
  myPayrolls: PayrollRecord[]
  selectedPayroll: PayrollRecord | null
  summary: PayrollSummary | null
  loading: boolean
  error: string | null

  // Actions - Payroll Calculation
  calculatePayroll: (data: any) => Promise<void>
  batchCalculatePayroll: (data: any) => Promise<void>

  // Actions - Payroll Processing
  processPayroll: (payrollId: string) => Promise<void>
  markPayrollAsPaid: (payrollId: string, data: any) => Promise<void>

  // Actions - Payroll Retrieval
  fetchEmployeePayrolls: (employeeId: string, params?: any) => Promise<void>
  fetchMyPayrolls: (params?: any) => Promise<void>
  fetchPayrollSummary: (params: any) => Promise<void>

  // Actions - Salary Slips
  generateSalarySlip: (payrollId: string) => Promise<void>
  batchGenerateSalarySlips: (payrollIds: string[]) => Promise<void>
  downloadSalarySlip: (payrollId: string) => Promise<void>

  // UI Actions
  setSelectedPayroll: (payroll: PayrollRecord | null) => void
  clearError: () => void
}

export const usePayrollStore = create<PayrollState>((set, get) => ({
  // Initial State
  payrolls: [],
  myPayrolls: [],
  selectedPayroll: null,
  summary: null,
  loading: false,
  error: null,

  // Payroll Calculation Actions
  calculatePayroll: async (data: any) => {
    set({ loading: true, error: null })
    try {
      await payrollAPI.calculate(data)
      toast.success('Payroll calculated successfully!')
      // Refresh payrolls if we have employee data
      if (data.employee_id) {
        await get().fetchEmployeePayrolls(data.employee_id)
      }
      set({ loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to calculate payroll', 
        loading: false 
      })
      toast.error('Failed to calculate payroll')
    }
  },

  batchCalculatePayroll: async (data: any) => {
    set({ loading: true, error: null })
    try {
      const response = await payrollAPI.batchCalculate(data) as any
      toast.success(`Payroll calculated for ${response.data.length} employees`)
      set({ loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to calculate batch payroll', 
        loading: false 
      })
      toast.error('Failed to calculate batch payroll')
    }
  },

  // Payroll Processing Actions
  processPayroll: async (payrollId: string) => {
    set({ loading: true, error: null })
    try {
      await payrollAPI.process(payrollId)
      toast.success('Payroll processed successfully!')
      // Update the payroll in the list
      const payrolls = get().payrolls.map(p => 
        p.id === payrollId ? { ...p, status: 'processed' as const } : p
      )
      set({ payrolls, loading: false })
      
      // Update selected payroll if it's the one being processed
      if (get().selectedPayroll?.id === payrollId) {
        set({ selectedPayroll: { ...get().selectedPayroll!, status: 'processed' } })
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to process payroll', 
        loading: false 
      })
      toast.error('Failed to process payroll')
    }
  },

  markPayrollAsPaid: async (payrollId: string, data: any) => {
    set({ loading: true, error: null })
    try {
      await payrollAPI.markAsPaid(payrollId, data)
      toast.success('Payroll marked as paid successfully!')
      // Update the payroll in the list
      const payrolls = get().payrolls.map(p => 
        p.id === payrollId ? { 
          ...p, 
          status: 'paid' as const,
          payment_date: data.payment_date,
          payment_reference: data.payment_reference
        } : p
      )
      set({ payrolls, loading: false })
      
      // Update selected payroll if it's the one being marked as paid
      if (get().selectedPayroll?.id === payrollId) {
        set({ 
          selectedPayroll: { 
            ...get().selectedPayroll!, 
            status: 'paid',
            payment_date: data.payment_date,
            payment_reference: data.payment_reference
          } 
        })
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to mark payroll as paid', 
        loading: false 
      })
      toast.error('Failed to mark payroll as paid')
    }
  },

  // Payroll Retrieval Actions
  fetchEmployeePayrolls: async (employeeId: string, params?: any) => {
    set({ loading: true, error: null })
    try {
      const response = await payrollAPI.getEmployeePayrolls(employeeId, params) as any
      set({ payrolls: response.data.records, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch payrolls', 
        loading: false 
      })
      toast.error('Failed to fetch payrolls')
    }
  },

  fetchMyPayrolls: async (params?: any) => {
    set({ loading: true, error: null })
    try {
      const response = await payrollAPI.getMyPayrolls(params) as any
      set({ myPayrolls: response.data.records, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch payrolls', 
        loading: false 
      })
      toast.error('Failed to fetch payrolls')
    }
  },

  fetchPayrollSummary: async (params: any) => {
    set({ loading: true, error: null })
    try {
      const response = await payrollAPI.getSummary(params) as any
      set({ summary: response.data, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch payroll summary', 
        loading: false 
      })
      toast.error('Failed to fetch payroll summary')
    }
  },

  // Salary Slip Actions
  generateSalarySlip: async (payrollId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await payrollAPI.generateSalarySlip(payrollId) as any
      toast.success('Salary slip generated successfully!')
      
      // Update the payroll with salary slip URL
      const payrolls = get().payrolls.map(p => 
        p.id === payrollId ? { 
          ...p, 
          salary_slip_url: response.data.salary_slip_url 
        } : p
      )
      set({ payrolls, loading: false })
      
      if (get().selectedPayroll?.id === payrollId) {
        set({ 
          selectedPayroll: { 
            ...get().selectedPayroll!, 
            salary_slip_url: response.data.salary_slip_url 
          } 
        })
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to generate salary slip', 
        loading: false 
      })
      toast.error('Failed to generate salary slip')
    }
  },

  batchGenerateSalarySlips: async (payrollIds: string[]) => {
    set({ loading: true, error: null })
    try {
      const response = await payrollAPI.batchGenerateSalarySlips({ payroll_ids: payrollIds }) as any
      toast.success(`Generated ${response.data.salary_slip_urls.length} salary slips`)
      set({ loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to generate salary slips', 
        loading: false 
      })
      toast.error('Failed to generate salary slips')
    }
  },

  downloadSalarySlip: async (payrollId: string) => {
    try {
      const response = await payrollAPI.downloadSalarySlip(payrollId) as any
      if (response.data.salary_slip_url) {
        window.open(response.data.salary_slip_url, '_blank')
        toast.success('Salary slip downloaded!')
      }
    } catch (error: any) {
      toast.error('Failed to download salary slip')
    }
  },

  // UI Actions
  setSelectedPayroll: (payroll: PayrollRecord | null) => {
    set({ selectedPayroll: payroll })
  },

  clearError: () => {
    set({ error: null })
  },
}))