import { create } from 'zustand'
import { employeeAPI } from '@services/api'
import toast from 'react-hot-toast'

export interface Employee {
  id: string
  employee_id: string
  user_id: string
  job_title: string
  department: string
  manager_id?: string
  hire_date: string
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern'
  work_hours_per_week: number
  payment_frequency: 'monthly' | 'bi_weekly' | 'weekly'
  basic_salary: number
  salary_components?: any
  deductions?: any
  tax_preferences?: any
  bank_details?: any
  is_active: boolean
  termination_date?: string
  termination_reason?: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    username: string
    full_name?: string
    email: string
  }
  manager?: Employee
}

export interface EmployeeCompensation {
  basic_salary: number
  total_allowances: number
  total_deductions: number
  gross_salary: number
  net_salary: number
}

interface EmployeeState {
  // State
  employees: Employee[]
  myEmployee: Employee | null
  selectedEmployee: Employee | null
  departments: string[]
  managers: Employee[]
  directReports: Employee[]
  compensation: EmployeeCompensation | null
  loading: boolean
  error: string | null

  // Actions
  fetchEmployees: (params?: any) => Promise<void>
  fetchMyEmployee: () => Promise<void>
  fetchEmployeeByUserId: (userId: string) => Promise<void>
  fetchEmployeeById: (employeeId: string) => Promise<void>
  createEmployee: (data: any) => Promise<void>
  updateEmployee: (employeeId: string, data: any) => Promise<void>
  terminateEmployee: (employeeId: string, data: any) => Promise<void>
  reactivateEmployee: (employeeId: string) => Promise<void>
  fetchDepartments: () => Promise<void>
  fetchManagers: () => Promise<void>
  fetchDirectReports: (employeeId?: string) => Promise<void>
  calculateCompensation: (employeeId: string) => Promise<void>
  searchEmployees: (params: any) => Promise<Employee[]>

  // UI Actions
  setSelectedEmployee: (employee: Employee | null) => void
  clearError: () => void
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  // Initial State
  employees: [],
  myEmployee: null,
  selectedEmployee: null,
  departments: [],
  managers: [],
  directReports: [],
  compensation: null,
  loading: false,
  error: null,

  // Actions
  fetchEmployees: async (params?: any) => {
    set({ loading: true, error: null })
    try {
      const response = await employeeAPI.getAll(params) as any
      set({ employees: response.data, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch employees', 
        loading: false 
      })
      toast.error('Failed to fetch employees')
    }
  },

  fetchMyEmployee: async () => {
    set({ loading: true, error: null })
    try {
      const response = await employeeAPI.getMyRecord() as any
      set({ myEmployee: response.data, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch employee record', 
        loading: false 
      })
      // Don't show toast for this as user might not be an employee
      console.warn('Employee record not found')
    }
  },

  fetchEmployeeByUserId: async (userId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await employeeAPI.getByUserId(userId) as any
      set({ myEmployee: response.data, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch employee record', 
        loading: false 
      })
      console.warn('Employee record not found for user')
    }
  },

  fetchEmployeeById: async (employeeId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await employeeAPI.getById(employeeId) as any
      set({ selectedEmployee: response.data, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch employee', 
        loading: false 
      })
      toast.error('Failed to fetch employee')
    }
  },

  createEmployee: async (data: any) => {
    set({ loading: true, error: null })
    try {
      await employeeAPI.create(data)
      toast.success('Employee created successfully!')
      await get().fetchEmployees()
      set({ loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to create employee', 
        loading: false 
      })
      toast.error('Failed to create employee')
    }
  },

  updateEmployee: async (employeeId: string, data: any) => {
    set({ loading: true, error: null })
    try {
      await employeeAPI.update(employeeId, data)
      toast.success('Employee updated successfully!')
      await get().fetchEmployees()
      if (get().selectedEmployee?.id === employeeId) {
        await get().fetchEmployeeById(employeeId)
      }
      set({ loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to update employee', 
        loading: false 
      })
      toast.error('Failed to update employee')
    }
  },

  terminateEmployee: async (employeeId: string, data: any) => {
    set({ loading: true, error: null })
    try {
      await employeeAPI.terminate(employeeId, data)
      toast.success('Employee terminated successfully')
      await get().fetchEmployees()
      if (get().selectedEmployee?.id === employeeId) {
        await get().fetchEmployeeById(employeeId)
      }
      set({ loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to terminate employee', 
        loading: false 
      })
      toast.error('Failed to terminate employee')
    }
  },

  reactivateEmployee: async (employeeId: string) => {
    set({ loading: true, error: null })
    try {
      await employeeAPI.reactivate(employeeId)
      toast.success('Employee reactivated successfully')
      await get().fetchEmployees()
      if (get().selectedEmployee?.id === employeeId) {
        await get().fetchEmployeeById(employeeId)
      }
      set({ loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to reactivate employee', 
        loading: false 
      })
      toast.error('Failed to reactivate employee')
    }
  },

  fetchDepartments: async () => {
    try {
      const response = await employeeAPI.getDepartments() as any
      set({ departments: response.data })
    } catch (error: any) {
      console.warn('Failed to fetch departments')
    }
  },

  fetchManagers: async () => {
    try {
      const response = await employeeAPI.getManagers() as any
      set({ managers: response.data })
    } catch (error: any) {
      console.warn('Failed to fetch managers')
    }
  },

  fetchDirectReports: async (employeeId?: string) => {
    set({ loading: true, error: null })
    try {
      const response = employeeId 
        ? await employeeAPI.getDirectReports(employeeId) as any
        : await employeeAPI.getMyDirectReports() as any
      set({ directReports: response.data, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch direct reports', 
        loading: false 
      })
      console.warn('Failed to fetch direct reports')
    }
  },

  calculateCompensation: async (employeeId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await employeeAPI.calculateCompensation(employeeId) as any
      set({ compensation: response.data, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to calculate compensation', 
        loading: false 
      })
      toast.error('Failed to calculate compensation')
    }
  },

  searchEmployees: async (params: any) => {
    set({ loading: true, error: null })
    try {
      const response = await employeeAPI.search(params) as any
      set({ loading: false })
      return response.data.employees
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to search employees', 
        loading: false 
      })
      toast.error('Failed to search employees')
      return []
    }
  },

  // UI Actions
  setSelectedEmployee: (employee: Employee | null) => {
    set({ selectedEmployee: employee })
  },

  clearError: () => {
    set({ error: null })
  },
}))
