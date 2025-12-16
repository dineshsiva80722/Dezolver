import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@store/authStore'
import toast from 'react-hot-toast'
import { config, constants } from '@/config'

class ApiService {
  private api: AxiosInstance
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (value?: any) => void
    reject: (reason?: any) => void
  }> = []

  constructor() {
    this.api = axios.create({
      baseURL: config.api.baseUrl,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        // Try to get token from store first, then from localStorage
        let token = useAuthStore.getState().token
        if (!token) {
          token = localStorage.getItem('techfolks_auth_token')
        }
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any
        const { response } = error

        if (response?.status === constants.httpStatus.UNAUTHORIZED && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`
                return this.api(originalRequest)
              })
              .catch((err) => Promise.reject(err))
          }

          originalRequest._retry = true
          this.isRefreshing = true

          // Try to refresh the token
          const refreshToken = localStorage.getItem('techfolks_refresh_token')

          if (refreshToken) {
            try {
              const response = await axios.post(
                `${config.api.baseUrl}/auth/refresh-token`,
                { refreshToken }
              )

              if (response.data.success && response.data.data.token) {
                const newToken = response.data.data.token

                // Update token in store and localStorage
                useAuthStore.getState().setToken(newToken)

                // Process queued requests
                this.processQueue(null, newToken)

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return this.api(originalRequest)
              }
            } catch (refreshError) {
              // Refresh failed, logout user
              this.processQueue(refreshError, null)
              useAuthStore.getState().logout()
              window.location.href = '/login'
              toast.error('Session expired. Please login again.')
              return Promise.reject(refreshError)
            } finally {
              this.isRefreshing = false
            }
          } else {
            // No refresh token available, logout
            this.isRefreshing = false
            useAuthStore.getState().logout()
            window.location.href = '/login'
            toast.error('Session expired. Please login again.')
          }
        } else if (response?.status === constants.httpStatus.FORBIDDEN) {
          toast.error('You do not have permission to perform this action.')
        } else if (response?.status === constants.httpStatus.INTERNAL_SERVER_ERROR) {
          toast.error('Server error. Please try again later.')
        }

        return Promise.reject(error)
      },
    )
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error)
      } else {
        promise.resolve(token)
      }
    })
    this.failedQueue = []
  }

  // Generic request methods
  async get<T = any>(url: string, config?: AxiosRequestConfig) {
    const response = await this.api.get<T>(url, config)
    return response.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.api.post<T>(url, data, config)
    return response.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.api.put<T>(url, data, config)
    return response.data
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.api.patch<T>(url, data, config)
    return response.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig) {
    const response = await this.api.delete<T>(url, config)
    return response.data
  }
}

export const apiService = new ApiService()

// Specific API endpoints
export const authAPI = {
  login: (data: { username: string; password: string }) =>
    apiService.post('/auth/login', data),
  register: (data: { username: string; email: string; password: string; fullName: string; phoneNumber?: string }) =>
    apiService.post('/auth/register', data),
  logout: () => apiService.post('/auth/logout'),
  me: () => apiService.get('/auth/profile'),
  refreshToken: () => apiService.post('/auth/refresh-token'),
}

export const problemsAPI = {
  getAll: (params?: any) => apiService.get('/problems', { params }),
  getById: (id: string) => apiService.get(`/problems/${id}`),
  create: (data: any) => apiService.post('/problems', data),
  update: (id: string, data: any) => apiService.put(`/problems/${id}`, data),
  delete: (id: string) => apiService.delete(`/problems/${id}`),
  getRecommendations: () => apiService.get('/problems/recommendations'),
  submit: (problemId: string, data: { code: string; language: string }) =>
    apiService.post(`/problems/${problemId}/submit`, data),
  getSubmissions: (problemId: string) =>
    apiService.get(`/problems/${problemId}/submissions`),
}

export const contestsAPI = {
  getAll: (params?: any) => apiService.get('/contests', { params }),
  getById: (id: string) => apiService.get(`/contests/${id}`),
  create: (data: any) => apiService.post('/contests', data),
  update: (id: string, data: any) => apiService.put(`/contests/${id}`, data),
  delete: (id: string) => apiService.delete(`/contests/${id}`),
  register: (id: string) => apiService.post(`/contests/${id}/register`),
  unregister: (id: string) => apiService.delete(`/contests/${id}/register`),
  getLeaderboard: (id: string) => apiService.get(`/contests/${id}/leaderboard`),
  getProblems: (id: string) => apiService.get(`/contests/${id}/problems`),
  addProblem: (id: string, problemId: string) => apiService.post(`/contests/${id}/problems`, { problemId }),
  removeProblem: (id: string, problemId: string) => apiService.delete(`/contests/${id}/problems/${problemId}`),
}

export const userAPI = {
  getProfile: () => apiService.get('/users/profile'),
  updateProfile: (data: any) => apiService.put('/users/profile', data),
  getUserById: (id: string) => apiService.get(`/users/${id}`),
  getSubmissions: (userId?: string) =>
    apiService.get(userId ? `/users/${userId}/submissions` : '/users/me/submissions'),
  getStats: (userId?: string) =>
    apiService.get(userId ? `/users/${userId}/stats` : '/users/me/stats'),
}

export const leaderboardAPI = {
  getGlobal: (params?: any) => apiService.get('/leaderboard/global', { params }),
  getWeekly: (params?: any) => apiService.get('/leaderboard/weekly', { params }),
  getMonthly: (params?: any) => apiService.get('/leaderboard/monthly', { params }),
  getUserPosition: (userId: string) => apiService.get(`/leaderboard/user/${userId}`),
}

export const groupsAPI = {
  getAll: (params?: any) => apiService.get('/groups', { params }),
  getMyGroups: () => apiService.get('/groups/my'),
  getById: (id: string) => apiService.get(`/groups/${id}`),
  create: (data: any) => apiService.post('/groups', data),
  update: (id: string, data: any) => apiService.put(`/groups/${id}`, data),
  delete: (id: string) => apiService.delete(`/groups/${id}`),
  join: (inviteCode: string) => apiService.post(`/groups/join/${inviteCode}`),
  leave: (id: string) => apiService.post(`/groups/${id}/leave`),
  getMembers: (id: string) => apiService.get(`/groups/${id}/members`),
  removeMember: (id: string, userId: string) => apiService.delete(`/groups/${id}/members/${userId}`),
  promoteMember: (id: string, userId: string) => apiService.post(`/groups/${id}/members/${userId}/promote`),
  demoteMember: (id: string, userId: string) => apiService.post(`/groups/${id}/members/${userId}/demote`),
  createContest: (id: string, data: any) => apiService.post(`/groups/${id}/contests`, data),
}

export const dashboardAPI = {
  getStats: () => apiService.get('/dashboard'),
}

export const adminAPI = {
  getUsers: (params?: any) => apiService.get('/admin/users', { params }),
  banUser: (userId: string) => apiService.put(`/admin/users/${userId}/ban`),
  unbanUser: (userId: string) => apiService.put(`/admin/users/${userId}/unban`),
  deleteUser: (userId: string) => apiService.delete(`/admin/users/${userId}`),
  promoteUser: (userId: string) => apiService.put(`/admin/users/${userId}/promote`),
  promoteUserByUsername: (username: string) => apiService.put(`/admin/users/${username}/promote`),
  updateUserRole: (userId: string, role: string) => apiService.put(`/admin/users/${userId}/role`, { role }),
  getSystemStats: () => apiService.get('/admin/stats'),
  clearData: () => apiService.post('/admin/clear-data'),
}

// Certificate Management APIs
export const certificatesAPI = {
  // Certificate Generation
  generate: (data: any) => apiService.post('/certificates/generate', data),
  batchGenerate: (data: any) => apiService.post('/certificates/batch-generate', data),
  
  // Certificate Retrieval
  getMyCertificates: () => apiService.get('/certificates/my'),
  getUserCertificates: (userId: string) => apiService.get(`/certificates/user/${userId}`),
  downloadCertificate: (certificateId: string) => apiService.get(`/certificates/download/${certificateId}`),
  
  // Certificate Verification
  verifyCertificate: (certificateId: string) => apiService.get(`/certificates/verify/${certificateId}`),
  
  // Certificate Management (Admin)
  revokeCertificate: (certificateId: string, reason: string) => 
    apiService.patch(`/certificates/${certificateId}/revoke`, { reason }),
  reissueCertificate: (certificateId: string) => 
    apiService.post(`/certificates/${certificateId}/reissue`),
  searchCertificates: (params: any) => apiService.get('/certificates/search', { params }),
  
  // Template Management
  getTemplates: (params?: any) => apiService.get('/certificates/templates', { params }),
  createTemplate: (data: any) => apiService.post('/certificates/templates', data),
  getTemplate: (templateId: string) => apiService.get(`/certificates/templates/${templateId}`),
  updateTemplate: (templateId: string, data: any) => 
    apiService.patch(`/certificates/templates/${templateId}`, data),
  setDefaultTemplate: (templateId: string) => 
    apiService.patch(`/certificates/templates/${templateId}/set-default`),
  
  // Upload template assets
  uploadTemplateAssets: (formData: FormData) => 
    apiService.post('/certificates/templates/upload-assets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
}

// Employee Management APIs
export const employeeAPI = {
  // Employee CRUD
  create: (data: any) => apiService.post('/employees', data),
  getAll: (params?: any) => apiService.get('/employees', { params }),
  getById: (employeeId: string) => apiService.get(`/employees/${employeeId}`),
  getByUserId: (userId: string) => apiService.get(`/employees/user/${userId}`),
  getMyRecord: () => apiService.get('/employees/me'),
  update: (employeeId: string, data: any) => apiService.patch(`/employees/${employeeId}`, data),
  
  // Employee Management
  terminate: (employeeId: string, data: any) => 
    apiService.patch(`/employees/${employeeId}/terminate`, data),
  reactivate: (employeeId: string) => 
    apiService.patch(`/employees/${employeeId}/reactivate`),
  
  // Organization Structure
  getDepartments: () => apiService.get('/employees/departments'),
  getManagers: () => apiService.get('/employees/managers'),
  getDirectReports: (employeeId: string) => apiService.get(`/employees/${employeeId}/reports`),
  getMyDirectReports: () => apiService.get('/employees/me/reports'),
  
  // Compensation
  calculateCompensation: (employeeId: string) => 
    apiService.get(`/employees/${employeeId}/compensation`),
  
  // Search
  search: (params: any) => apiService.get('/employees/search', { params }),

  // Bank Details
  verifyBankDetails: (employeeId: string) => 
    apiService.patch(`/employees/${employeeId}/bank-details/verify`),
}

// Company Bank Management APIs
export const companyBankAPI = {
  // Company Bank CRUD
  create: (data: any) => apiService.post('/company-bank', data),
  getAll: (params?: any) => apiService.get('/company-bank', { params }),
  getPrimary: () => apiService.get('/company-bank/primary'),
  update: (bankId: string, data: any) => apiService.patch(`/company-bank/${bankId}`, data),
  
  // Bank Management
  setPrimary: (bankId: string) => apiService.patch(`/company-bank/${bankId}/set-primary`),
  verify: (bankId: string) => apiService.patch(`/company-bank/${bankId}/verify`),
  delete: (bankId: string) => apiService.delete(`/company-bank/${bankId}`),
}

// Payroll Management APIs
export const payrollAPI = {
  // Payroll Calculation
  calculate: (data: any) => apiService.post('/payroll/calculate', data),
  batchCalculate: (data: any) => apiService.post('/payroll/batch-calculate', data),
  
  // Payroll Processing
  process: (payrollId: string) => apiService.patch(`/payroll/${payrollId}/process`),
  markAsPaid: (payrollId: string, data: any) => 
    apiService.patch(`/payroll/${payrollId}/mark-paid`, data),
  
  // Payroll Retrieval
  getEmployeePayrolls: (employeeId: string, params?: any) => 
    apiService.get(`/payroll/employee/${employeeId}`, { params }),
  getMyPayrolls: (params?: any) => apiService.get('/payroll/my', { params }),
  
  // Salary Slips
  generateSalarySlip: (payrollId: string) => 
    apiService.post(`/payroll/${payrollId}/salary-slip/generate`),
  batchGenerateSalarySlips: (data: any) => 
    apiService.post('/payroll/salary-slips/batch-generate', data),
  downloadSalarySlip: (payrollId: string) => 
    apiService.get(`/payroll/${payrollId}/salary-slip/download`),
  
  // Reports
  getSummary: (params: any) => apiService.get('/payroll/summary', { params }),
}

// Organization Management APIs
export const organizationAPI = {
  // Organization Management
  create: (data: any) => apiService.post('/organizations', data),
  getMy: () => apiService.get('/organizations/my'),
  getById: (id: string) => apiService.get(`/organizations/${id}`),
  
  // User Management
  getUsers: (orgId: string) => apiService.get(`/organizations/${orgId}/users`),
  addUser: (orgId: string, userData: any) => apiService.post(`/organizations/${orgId}/users`, userData),
  
  // Subscription Management
  upgradePlan: (orgId: string, data: any) => apiService.post(`/organizations/${orgId}/upgrade`, data),
  
  // Permissions and Limits
  getUserPermissions: () => apiService.get('/organizations/permissions'),
  checkUserLimits: () => apiService.get('/organizations/user-limits'),
  
  // Platform Admin only
  getPlatformStats: () => apiService.get('/organizations/platform/stats'),
}

export const workspaceAPI = {
  executeCode: (data: { language: string; source_code: string; input?: string; file_name?: string }) =>
    apiService.post('/submissions/run', data),
}
