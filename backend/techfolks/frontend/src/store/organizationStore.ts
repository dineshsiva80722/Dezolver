import { create } from 'zustand'
import { organizationAPI } from '@services/api'
import toast from 'react-hot-toast'

export interface Organization {
  id: string
  org_code: string
  name: string
  plan: 'starter' | 'professional' | 'enterprise' | 'unlimited'
  status: 'active' | 'suspended' | 'expired' | 'trial'
  user_limit: number
  current_users: number
  manager_limit: number
  current_managers: number
  features_enabled: {
    hr_management: boolean
    payroll_processing: boolean
    certificate_automation: boolean
    advanced_analytics: boolean
    api_access: boolean
    custom_branding: boolean
    sso_integration: boolean
    bulk_operations: boolean
  }
}

export interface UserPermissions {
  canManageUsers: boolean
  canManagePayroll: boolean
  canManageCertificates: boolean
  canViewAnalytics: boolean
  canManageOrganization: boolean
  canAccessAPI: boolean
  features: any
}

export interface UserLimits {
  canAddUser: boolean
  currentUsers: number
  userLimit: number
  remainingSlots: number
}

export interface PlatformStats {
  totalOrganizations: number
  activeOrganizations: number
  totalRevenue: number
  totalUsers: number
  planDistribution: {
    starter: number
    professional: number
    enterprise: number
    unlimited: number
  }
}

interface OrganizationState {
  // State
  myOrganization: Organization | null
  platformStats: PlatformStats | null
  userPermissions: UserPermissions | null
  userLimits: UserLimits | null
  organizationUsers: any[]
  loading: boolean
  error: string | null

  // Actions
  fetchMyOrganization: () => Promise<void>
  fetchUserPermissions: () => Promise<void>
  fetchUserLimits: () => Promise<void>
  fetchPlatformStats: () => Promise<void>
  fetchOrganizationUsers: (orgId: string) => Promise<void>
  addUserToOrganization: (orgId: string, userData: any) => Promise<void>
  upgradePlan: (orgId: string, data: any) => Promise<void>
  createOrganization: (data: any) => Promise<void>

  // UI Actions
  clearError: () => void
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  // Initial State
  myOrganization: null,
  platformStats: null,
  userPermissions: null,
  userLimits: null,
  organizationUsers: [],
  loading: false,
  error: null,

  // Actions
  fetchMyOrganization: async () => {
    set({ loading: true, error: null })
    try {
      const response = await organizationAPI.getMy() as any
      set({ myOrganization: response.data.organization, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch organization', 
        loading: false 
      })
      console.warn('No organization found for user')
    }
  },

  fetchUserPermissions: async () => {
    try {
      const response = await organizationAPI.getUserPermissions() as any
      set({ userPermissions: response.data.permissions })
    } catch (error: any) {
      console.warn('Failed to fetch user permissions')
    }
  },

  fetchUserLimits: async () => {
    try {
      const response = await organizationAPI.checkUserLimits() as any
      set({ userLimits: response.data })
    } catch (error: any) {
      console.warn('Failed to fetch user limits')
    }
  },

  fetchPlatformStats: async () => {
    set({ loading: true, error: null })
    try {
      const response = await organizationAPI.getPlatformStats() as any
      set({ platformStats: response.data, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch platform stats', 
        loading: false 
      })
      toast.error('Failed to fetch platform statistics')
    }
  },

  fetchOrganizationUsers: async (orgId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await organizationAPI.getUsers(orgId) as any
      set({ organizationUsers: response.data.users, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch users', 
        loading: false 
      })
      toast.error('Failed to fetch organization users')
    }
  },

  addUserToOrganization: async (orgId: string, userData: any) => {
    set({ loading: true, error: null })
    try {
      await organizationAPI.addUser(orgId, userData)
      toast.success('User added successfully!')
      // Refresh user limits and organization data
      await get().fetchUserLimits()
      await get().fetchOrganizationUsers(orgId)
      set({ loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to add user', 
        loading: false 
      })
      toast.error(error.response?.data?.message || 'Failed to add user')
    }
  },

  upgradePlan: async (orgId: string, data: any) => {
    set({ loading: true, error: null })
    try {
      await organizationAPI.upgradePlan(orgId, data)
      toast.success('Plan upgraded successfully!')
      await get().fetchMyOrganization()
      await get().fetchUserLimits()
      set({ loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to upgrade plan', 
        loading: false 
      })
      toast.error(error.response?.data?.message || 'Failed to upgrade plan')
    }
  },

  createOrganization: async (data: any) => {
    set({ loading: true, error: null })
    try {
      const response = await organizationAPI.create(data) as any
      toast.success('Organization created successfully!')
      // Refresh platform stats
      await get().fetchPlatformStats()
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to create organization', 
        loading: false 
      })
      toast.error('Failed to create organization')
      throw error
    }
  },

  // UI Actions
  clearError: () => {
    set({ error: null })
  },
}))