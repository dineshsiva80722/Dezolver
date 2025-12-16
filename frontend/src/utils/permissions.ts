/**
 * Permission and Feature Gating Utilities
 * Manages user access to features based on role, tier, and organization plan
 */

interface User {
  id: string
  username: string
  email: string
  full_name?: string
  role: 'user' | 'admin' | 'hr_manager' | 'manager' | 'super_admin' | 'problem_setter' | 'moderator'
  tier?: 'platform' | 'manager' | 'hr_manager' | 'employee' | 'user'
  organization_id?: string
}

/**
 * Check if user has admin role
 */
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin' || user?.role === 'super_admin'
}

export const isSuperAdmin = (user: User | null): boolean => {
  return user?.role === 'super_admin'
}

/**
 * Check if user has platform admin tier
 */
export const isPlatformAdmin = (user: User | null): boolean => {
  return user?.tier === 'platform'
}

/**
 * Check if user has manager tier
 */
export const isManager = (user: User | null): boolean => {
  return user?.role === 'manager' || user?.tier === 'manager' || isPlatformAdmin(user)
}

/**
 * Check if user has HR manager role
 */
export const isHRManager = (user: User | null): boolean => {
  return user?.role === 'hr_manager' || user?.tier === 'hr_manager' || isManager(user)
}

/**
 * Check if user belongs to an organization
 */
export const hasOrganization = (user: User | null): boolean => {
  return !!user?.organization_id
}

/**
 * Check if user can access HR modules
 */
export const canAccessHRModules = (user: User | null): boolean => {
  return hasOrganization(user)
}

/**
 * Check if user can access certificates
 */
export const canAccessCertificates = (user: User | null): boolean => {
  return isSuperAdmin(user) || hasOrganization(user)
}

/**
 * Check if user can access payroll
 */
export const canAccessPayroll = (user: User | null): boolean => {
  return isSuperAdmin(user) || hasOrganization(user)
}

/**
 * Check if user can access employee directory
 */
export const canAccessEmployees = (user: User | null): boolean => {
  return isSuperAdmin(user) || hasOrganization(user)
}

/**
 * Check if user can access bank details
 */
export const canAccessBankDetails = (user: User | null): boolean => {
  return isSuperAdmin(user) || (hasOrganization(user) && (isManager(user) || isHRManager(user) || isAdmin(user)))
}

/**
 * Check if user can access admin console
 */
export const canAccessAdminConsole = (user: User | null): boolean => {
  return isAdmin(user)
}

/**
 * Check if user can access HR admin features
 */
export const canAccessHRAdmin = (user: User | null): boolean => {
  return isAdmin(user) && hasOrganization(user)
}

/**
 * Check if user can access certificate admin features
 */
export const canAccessCertificateAdmin = (user: User | null): boolean => {
  return isAdmin(user) && hasOrganization(user)
}

/**
 * Check if user can manage subscription
 */
export const canManageSubscription = (user: User | null): boolean => {
  return isManager(user) && hasOrganization(user)
}

/**
 * Check if user can add/remove organization members
 */
export const canManageOrganizationMembers = (user: User | null): boolean => {
  return isManager(user) && hasOrganization(user)
}

/**
 * Check if user can access payment features
 */
export const canAccessPayments = (user: User | null): boolean => {
  return isManager(user) && hasOrganization(user)
}

/**
 * Get user display name
 */
export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Guest'
  return user.full_name || user.username || user.email
}

/**
 * Get user role display text
 */
export const getUserRoleDisplay = (user: User | null): string => {
  if (!user) return ''

  if (isPlatformAdmin(user)) return 'Platform Admin'
  if (isSuperAdmin(user)) return 'Super Admin'
  if (isManager(user)) return 'Manager'
  if (isHRManager(user)) return 'HR Manager'
  if (isAdmin(user)) return 'Admin'

  return user.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'User'
}

/**
 * Module visibility configuration
 */
export const getModuleVisibility = (user: User | null) => {
  return {
    // Core platform modules
    dashboard: !!user,
    problems: true,
    contests: true,
    groups: !!user,

    // HR & Finance modules
    certificates: canAccessCertificates(user),
    employees: canAccessEmployees(user),
    payroll: canAccessPayroll(user),
    bankDetails: canAccessBankDetails(user),
    subscription: canManageSubscription(user),

    // Admin modules
    adminConsole: canAccessAdminConsole(user),
    hrAdmin: canAccessHRAdmin(user),
    certificateAdmin: canAccessCertificateAdmin(user),

    // Payment modules
    payments: canAccessPayments(user),
  }
}

/**
 * Feature flags based on organization plan
 * This can be extended with actual plan data from the backend
 */
export interface OrganizationPlan {
  plan: 'starter' | 'professional' | 'enterprise' | 'unlimited'
  features: {
    maxUsers: number
    maxManagers: number
    hrManagement: boolean
    payrollProcessing: boolean
    certificateAutomation: boolean
    advancedAnalytics: boolean
    apiAccess: boolean
    customBranding: boolean
    ssoIntegration: boolean
    bulkOperations: boolean
    prioritySupport: boolean
    dedicatedSupport: boolean
  }
}

/**
 * Get features available for a plan
 */
export const getPlanFeatures = (plan: string): OrganizationPlan['features'] => {
  const planFeatures: Record<string, OrganizationPlan['features']> = {
    starter: {
      maxUsers: 25,
      maxManagers: 1,
      hrManagement: true,
      payrollProcessing: false,
      certificateAutomation: true,
      advancedAnalytics: false,
      apiAccess: false,
      customBranding: false,
      ssoIntegration: false,
      bulkOperations: false,
      prioritySupport: false,
      dedicatedSupport: false,
    },
    professional: {
      maxUsers: 100,
      maxManagers: 3,
      hrManagement: true,
      payrollProcessing: true,
      certificateAutomation: true,
      advancedAnalytics: true,
      apiAccess: false,
      customBranding: false,
      ssoIntegration: false,
      bulkOperations: false,
      prioritySupport: true,
      dedicatedSupport: false,
    },
    enterprise: {
      maxUsers: 500,
      maxManagers: 10,
      hrManagement: true,
      payrollProcessing: true,
      certificateAutomation: true,
      advancedAnalytics: true,
      apiAccess: true,
      customBranding: true,
      ssoIntegration: true,
      bulkOperations: true,
      prioritySupport: true,
      dedicatedSupport: false,
    },
    unlimited: {
      maxUsers: -1,
      maxManagers: -1,
      hrManagement: true,
      payrollProcessing: true,
      certificateAutomation: true,
      advancedAnalytics: true,
      apiAccess: true,
      customBranding: true,
      ssoIntegration: true,
      bulkOperations: true,
      prioritySupport: true,
      dedicatedSupport: true,
    },
  }

  return planFeatures[plan] || planFeatures.starter
}
