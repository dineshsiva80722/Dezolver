import { useEffect, useState } from 'react'
import { useAuthStore } from '@store/authStore'
import { useOrganizationStore } from '@store/organizationStore'
import DashboardCard from '@components/common/DashboardCard'

const ManagerDashboard = () => {
  const { user } = useAuthStore()
  const { 
    myOrganization,
    userLimits,
    loading,
    fetchMyOrganization,
    fetchUserLimits
  } = useOrganizationStore()

  useEffect(() => {
    if (user?.tier === 'manager' || user?.role === 'organization_manager' || user?.role === 'admin') {
      fetchMyOrganization()
      fetchUserLimits()
    }
  }, [user, fetchMyOrganization, fetchUserLimits])

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'trial':
        return 'bg-blue-100 text-blue-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const utilizationPercentage = myOrganization && myOrganization.user_limit > 0 
    ? Math.round((myOrganization.current_users / myOrganization.user_limit) * 100) 
    : 0

  const daysUntilRenewal = 25 // This would come from subscription data

  return (
    <div className="space-y-8">
      {/* Manager Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <span className="mr-3">👑</span>
                Organization Manager
              </h1>
              <p className="text-blue-100 text-lg">
                {myOrganization?.name || 'Your Organization'} • {myOrganization?.plan?.charAt(0).toUpperCase()}{myOrganization?.plan?.slice(1)} Plan
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{utilizationPercentage}%</div>
              <div className="text-sm text-blue-100">License Utilization</div>
            </div>
          </div>
          
          {/* Subscription Info */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">{myOrganization?.current_users || 0}/{myOrganization?.user_limit || 0}</div>
              <div className="text-sm text-blue-100">Users</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">{myOrganization?.current_managers || 0}/{myOrganization?.manager_limit || 0}</div>
              <div className="text-sm text-blue-100">Managers</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">{daysUntilRenewal}</div>
              <div className="text-sm text-blue-100">Days to Renewal</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className={`text-xl font-bold ${myOrganization?.status === 'active' ? 'text-green-300' : 'text-yellow-300'}`}>
                {myOrganization?.status?.toUpperCase() || 'UNKNOWN'}
              </div>
              <div className="text-sm text-blue-100">Status</div>
            </div>
          </div>
        </div>
      </div>

      {/* License Usage & Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="User Management"
          subtitle="Manage organization users"
          value={`${userLimits?.remainingSlots || 0} Slots Left`}
          icon="👥"
          gradient="blue"
          href="/employees"
        >
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Used</span>
              <span>{userLimits?.currentUsers || 0}/{userLimits?.userLimit || 0}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${userLimits && userLimits.userLimit > 0 ? (userLimits.currentUsers / userLimits.userLimit) * 100 : 0}%` }}
              />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="HR Operations"
          subtitle="Employee & payroll management"
          value="5 Certificates"
          icon="🏢"
          gradient="green"
          href="/admin/hr"
        >
          <div className="space-y-1">
            <div className="text-xs">Payroll cycles: 3</div>
            <div className="text-xs">Active employees: {myOrganization?.current_users || 0}</div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Subscription"
          subtitle="Plan and billing info"
          value={myOrganization?.plan?.charAt(0).toUpperCase() + (myOrganization?.plan?.slice(1) || '')}
          icon="💳"
          gradient="purple"
          href="/subscription"
        >
          <div className="space-y-1">
            <div className="text-xs">
              ₹{myOrganization?.plan === 'starter' ? '2,999' : 
                 myOrganization?.plan === 'professional' ? '9,999' :
                 myOrganization?.plan === 'enterprise' ? '24,999' : '49,999'}/month
            </div>
            <div className="text-xs">Renews in {daysUntilRenewal} days</div>
            <div className="text-xs">
              <span className={`px-2 py-0.5 rounded-full text-xs ${getSubscriptionStatusColor(myOrganization?.status || 'unknown')}`}>
                {myOrganization?.status || 'unknown'}
              </span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Quick Actions"
          subtitle="Common manager tasks"
          icon="⚡"
          gradient="orange"
        >
          <div className="space-y-2">
            <a href="/employees" className="block text-xs text-blue-600 hover:text-blue-800 transition-colors">
              → Add Team Member
            </a>
            <a href="/admin/hr" className="block text-xs text-green-600 hover:text-green-800 transition-colors">
              → Process Payroll
            </a>
            <a href="/certificates" className="block text-xs text-purple-600 hover:text-purple-800 transition-colors">
              → Generate Certificate
            </a>
          </div>
        </DashboardCard>
      </div>

      {/* User Limit Warning */}
      {utilizationPercentage > 80 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">
                Approaching User Limit
              </h3>
              <p className="text-yellow-700 dark:text-yellow-400">
                You're using {myOrganization?.current_users} of {myOrganization?.user_limit} users ({utilizationPercentage}% capacity). 
                Consider upgrading to add more team members.
              </p>
              <a href="/subscription" className="mt-2 inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                Upgrade Plan
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Manager Tools */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <span className="mr-2">🛠️</span>
          Manager Tools & Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/employees"
            className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors text-left"
          >
            <div className="text-lg font-semibold flex items-center">
              <span className="mr-2">👤</span>Add Team Member
            </div>
            <div className="text-sm text-gray-300 mt-1">{userLimits?.remainingSlots || 0} slots available</div>
          </a>
          
          <a
            href="/admin/hr"
            className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors text-left"
          >
            <div className="text-lg font-semibold flex items-center">
              <span className="mr-2">💰</span>Process Payroll
            </div>
            <div className="text-sm text-gray-300 mt-1">Monthly salary processing</div>
          </a>
          
          <a
            href="/admin/certificates"
            className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors text-left"
          >
            <div className="text-lg font-semibold flex items-center">
              <span className="mr-2">🎓</span>Issue Certificates
            </div>
            <div className="text-sm text-gray-300 mt-1">Create and manage certificates</div>
          </a>
          
          <a
            href="/subscription"
            className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors text-left"
          >
            <div className="text-lg font-semibold flex items-center">
              <span className="mr-2">📈</span>Upgrade Plan
            </div>
            <div className="text-sm text-gray-300 mt-1">Get more users and features</div>
          </a>
        </div>
      </div>

      {/* Feature Access & Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Features */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="mr-2">✨</span>
            Available Features
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-xl">👥</span>
                <div>
                  <div className="font-medium text-green-800 dark:text-green-300">HR Management</div>
                  <div className="text-xs text-green-600">Employee records and management</div>
                </div>
              </div>
              <span className="text-green-600 text-xl">
                {myOrganization?.features_enabled?.hr_management ? '✅' : '❌'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-xl">💰</span>
                <div>
                  <div className="font-medium text-green-800 dark:text-green-300">Payroll Processing</div>
                  <div className="text-xs text-green-600">Automated salary calculations</div>
                </div>
              </div>
              <span className="text-green-600 text-xl">
                {myOrganization?.features_enabled?.payroll_processing ? '✅' : '❌'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-xl">🎓</span>
                <div>
                  <div className="font-medium text-green-800 dark:text-green-300">Certificate Automation</div>
                  <div className="text-xs text-green-600">Generate and manage certificates</div>
                </div>
              </div>
              <span className="text-green-600 text-xl">
                {myOrganization?.features_enabled?.certificate_automation ? '✅' : '❌'}
              </span>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg border ${
              myOrganization?.features_enabled?.api_access 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
            }`}>
              <div className="flex items-center space-x-3">
                <span className={`text-xl ${myOrganization?.features_enabled?.api_access ? 'text-green-600' : 'text-gray-400'}`}>🔗</span>
                <div>
                  <div className={`font-medium ${myOrganization?.features_enabled?.api_access ? 'text-green-800 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    API Access
                  </div>
                  <div className={`text-xs ${myOrganization?.features_enabled?.api_access ? 'text-green-600' : 'text-gray-500'}`}>
                    {myOrganization?.features_enabled?.api_access ? 'Full API access available' : 'Upgrade to Enterprise for API access'}
                  </div>
                </div>
              </div>
              <span className={`text-xl ${myOrganization?.features_enabled?.api_access ? 'text-green-600' : 'text-gray-400'}`}>
                {myOrganization?.features_enabled?.api_access ? '✅' : '❌'}
              </span>
            </div>
          </div>
        </div>

        {/* Usage Analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="mr-2">📊</span>
            Usage Analytics
          </h2>
          
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">User Capacity</span>
                <span className="text-sm text-blue-600">{utilizationPercentage}%</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${utilizationPercentage}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-blue-600">
                {myOrganization?.current_users || 0} of {myOrganization?.user_limit || 0} users ({userLimits?.remainingSlots || 0} remaining)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-600">5</div>
                <div className="text-xs text-purple-700 dark:text-purple-400">Certificates Issued</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-orange-600">3</div>
                <div className="text-xs text-orange-700 dark:text-orange-400">Payroll Cycles</div>
              </div>
            </div>

            <div className="text-xs text-gray-500 text-center pt-3 border-t border-gray-200 dark:border-gray-700">
              💡 Upgrade to Enterprise for advanced analytics and API access
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Subscription Management</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Plan */}
          <div className="text-center p-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl">
            <div className="text-lg font-bold mb-2 capitalize">{myOrganization?.plan || 'Unknown'} Plan</div>
            <div className="text-3xl font-bold mb-2">
              ₹{myOrganization?.plan === 'starter' ? '2,999' : 
                 myOrganization?.plan === 'professional' ? '9,999' :
                 myOrganization?.plan === 'enterprise' ? '24,999' : '49,999'}
            </div>
            <div className="text-sm opacity-90 mb-4">per month</div>
            <div className="space-y-1 text-sm">
              <div>✅ {myOrganization?.user_limit === -1 ? 'Unlimited' : myOrganization?.user_limit} users included</div>
              <div>✅ HR & Employee Management</div>
              <div>{myOrganization?.features_enabled?.payroll_processing ? '✅' : '❌'} Payroll Processing</div>
              <div>✅ Certificate automation</div>
              <div>{myOrganization?.features_enabled?.advanced_analytics ? '✅' : '❌'} Advanced analytics</div>
            </div>
          </div>

          {/* Upgrade Options */}
          <div className="text-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
            <div className="text-lg font-bold mb-2 text-gray-700 dark:text-gray-300">Enterprise Plan</div>
            <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">₹24,999</div>
            <div className="text-sm text-gray-600 mb-4">per month</div>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <div>✅ 500 users included</div>
              <div>✅ All Professional features</div>
              <div>✅ API access</div>
              <div>✅ Custom branding</div>
            </div>
            <a href="/subscription" className="w-full btn btn-outline btn-sm">
              Upgrade Plan
            </a>
          </div>

          {/* Usage Summary */}
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Usage</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Users:</span>
                  <span className="font-medium">{myOrganization?.current_users || 0}/{myOrganization?.user_limit || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Certificates:</span>
                  <span className="font-medium">5</span>
                </div>
                <div className="flex justify-between">
                  <span>Payroll cycles:</span>
                  <span className="font-medium">3</span>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              💡 <strong>Need more users?</strong> Contact support or upgrade your plan to increase your user limit.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManagerDashboard