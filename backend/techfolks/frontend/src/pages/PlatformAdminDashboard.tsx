import { useEffect, useState } from 'react'
import { useAuthStore } from '@store/authStore'
import { useOrganizationStore } from '@store/organizationStore'
import DashboardCard from '@components/common/DashboardCard'
import LoadingSpinner from '@components/common/LoadingSpinner'
import { Navigate } from 'react-router-dom'

const PlatformAdminDashboard = () => {
  const { user } = useAuthStore()
  const { 
    platformStats, 
    loading, 
    error,
    fetchPlatformStats,
    createOrganization,
    clearError 
  } = useOrganizationStore()
  
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    industry: '',
    contact_email: '',
    plan: 'professional',
    manager_user: {
      username: '',
      email: '',
      password: '',
      full_name: ''
    }
  })

  useEffect(() => {
    if (user?.role === 'platform_admin' || user?.tier === 'platform') {
      fetchPlatformStats()
    }
  }, [user, fetchPlatformStats])

  const handleCreateOrganization = async () => {
    if (!newOrgForm.name || !newOrgForm.industry || !newOrgForm.contact_email ||
        !newOrgForm.manager_user.username || !newOrgForm.manager_user.email ||
        !newOrgForm.manager_user.password || !newOrgForm.manager_user.full_name) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await createOrganization({
        ...newOrgForm,
        company_size: 'medium'
      })
      setShowCreateOrg(false)
      setNewOrgForm({
        name: '',
        industry: '',
        contact_email: '',
        plan: 'professional',
        manager_user: {
          username: '',
          email: '',
          password: '',
          full_name: ''
        }
      })
    } catch (error) {
      // Error already handled in store
    }
  }

  // Redirect if not platform admin
  if (!user || user.role !== 'platform_admin') {
    return <Navigate to="/profile" replace />
  }

  return (
    <div className="space-y-8">
      {/* Platform Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 rounded-xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-blue-500/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <span className="mr-3">🌟</span>
                TechFolks Platform Console
              </h1>
              <p className="text-slate-300 text-lg">
                Multi-tenant enterprise platform administration
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">₹{(platformStats.totalRevenue / 100000).toFixed(1)}L</div>
              <div className="text-sm text-slate-300">Monthly Revenue</div>
            </div>
          </div>
          
          {/* Platform Metrics */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">{platformStats?.totalOrganizations || 0}</div>
              <div className="text-sm text-slate-300">Total Organizations</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">{platformStats?.activeOrganizations || 0}</div>
              <div className="text-sm text-slate-300">Active Orgs</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">{platformStats?.totalUsers?.toLocaleString() || '0'}</div>
              <div className="text-sm text-slate-300">Total Users</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">{platformStats ? Math.round((platformStats.activeOrganizations / platformStats.totalOrganizations) * 100) : 0}%</div>
              <div className="text-sm text-slate-300">Active Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue & Subscription Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Revenue Analytics"
          subtitle="Monthly recurring revenue"
          value={`₹${platformStats ? (platformStats.totalRevenue / 100000).toFixed(1) : '0'}L`}
          icon="💰"
          gradient="green"
          trend={{
            value: 15,
            label: 'growth',
            isPositive: true
          }}
        >
          <div className="space-y-1">
            <div className="text-xs">ARR: ₹{platformStats ? (platformStats.totalRevenue * 12 / 100000).toFixed(1) : '0'}L</div>
            <div className="text-xs">Avg per org: ₹{platformStats && platformStats.activeOrganizations > 0 ? Math.round(platformStats.totalRevenue / platformStats.activeOrganizations / 1000) : 0}K</div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Organizations"
          subtitle="Platform tenants"
          value={platformStats?.totalOrganizations || 0}
          icon="🏢"
          gradient="blue"
          trend={{
            value: 8,
            label: 'new this month',
            isPositive: true
          }}
        >
          <div className="space-y-1">
            <div className="text-xs">Active: {platformStats?.activeOrganizations || 0}</div>
            <div className="text-xs">Churn rate: 2.1%</div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="User Growth"
          subtitle="Platform-wide users"
          value={platformStats?.totalUsers?.toLocaleString() || '0'}
          icon="👥"
          gradient="purple"
          trend={{
            value: 12,
            label: 'growth',
            isPositive: true
          }}
        >
          <div className="space-y-1">
            <div className="text-xs">Avg per org: {platformStats && platformStats.activeOrganizations > 0 ? Math.round(platformStats.totalUsers / platformStats.activeOrganizations) : 0}</div>
            <div className="text-xs">Monthly active: 89%</div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Platform Health"
          subtitle="System performance"
          value="99.9%"
          icon="📊"
          gradient="indigo"
        >
          <div className="space-y-1">
            <div className="text-xs">Uptime: 99.9%</div>
            <div className="text-xs">Avg response: 125ms</div>
          </div>
        </DashboardCard>
      </div>

      {/* Plan Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Subscription Plan Distribution</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{platformStats?.planDistribution?.starter || 0}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Starter Plans</div>
              <div className="text-xs text-blue-600">₹2,999/month • 25 users</div>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{platformStats?.planDistribution?.professional || 0}</div>
              <div className="text-sm text-green-700 dark:text-green-300">Professional Plans</div>
              <div className="text-xs text-green-600">₹9,999/month • 100 users</div>
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{platformStats?.planDistribution?.enterprise || 0}</div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Enterprise Plans</div>
              <div className="text-xs text-purple-600">₹24,999/month • 500 users</div>
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{platformStats?.planDistribution?.unlimited || 0}</div>
              <div className="text-sm text-orange-700 dark:text-orange-300">Unlimited Plans</div>
              <div className="text-xs text-orange-600">₹49,999/month • Unlimited</div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Management Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization Management */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="mr-2">🏢</span>
            Organization Management
          </h2>
          
          <div className="space-y-4">
            <button 
              onClick={() => setShowCreateOrg(true)}
              className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-blue-900 dark:text-blue-300">Create New Organization</div>
                  <div className="text-sm text-blue-700 dark:text-blue-400">Set up new tenant with manager license</div>
                </div>
                <div className="text-2xl">➕</div>
              </div>
            </button>

            <button className="w-full p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-green-900 dark:text-green-300">Manage Subscriptions</div>
                  <div className="text-sm text-green-700 dark:text-green-400">View and manage organization licenses</div>
                </div>
                <div className="text-2xl">📋</div>
              </div>
            </button>

            <button className="w-full p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-purple-900 dark:text-purple-300">Platform Analytics</div>
                  <div className="text-sm text-purple-700 dark:text-purple-400">View detailed platform metrics</div>
                </div>
                <div className="text-2xl">📈</div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Platform Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="mr-2">⚡</span>
            Recent Platform Activity
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
                💼
              </div>
              <div className="flex-1">
                <div className="font-medium text-green-800 dark:text-green-300 text-sm">
                  New Organization Created
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Demo Corporation upgraded to Professional plan
                </div>
              </div>
              <div className="text-xs text-gray-500">2h ago</div>
            </div>

            <div className="flex items-center space-x-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                💰
              </div>
              <div className="flex-1">
                <div className="font-medium text-blue-800 dark:text-blue-300 text-sm">
                  Payment Processed
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  ₹9,999 subscription renewal - Acme Corp
                </div>
              </div>
              <div className="text-xs text-gray-500">4h ago</div>
            </div>

            <div className="flex items-center space-x-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                📊
              </div>
              <div className="flex-1">
                <div className="font-medium text-purple-800 dark:text-purple-300 text-sm">
                  Usage Milestone
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  Platform reached 1,000+ active users
                </div>
              </div>
              <div className="text-xs text-gray-500">1d ago</div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Management Tools */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <span className="mr-2">🛠️</span>
          Platform Management Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors text-left">
            <div className="text-lg font-semibold flex items-center">
              <span className="mr-2">🏢</span>Create Organization
            </div>
            <div className="text-sm text-gray-300 mt-1">Set up new tenant with licensing</div>
          </button>
          
          <button className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors text-left">
            <div className="text-lg font-semibold flex items-center">
              <span className="mr-2">💳</span>Billing Management
            </div>
            <div className="text-sm text-gray-300 mt-1">Process payments and renewals</div>
          </button>
          
          <button className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors text-left">
            <div className="text-lg font-semibold flex items-center">
              <span className="mr-2">📈</span>Platform Analytics
            </div>
            <div className="text-sm text-gray-300 mt-1">Detailed usage and revenue analytics</div>
          </button>
          
          <button className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors text-left">
            <div className="text-lg font-semibold flex items-center">
              <span className="mr-2">⚙️</span>System Config
            </div>
            <div className="text-sm text-gray-300 mt-1">Platform-wide settings and features</div>
          </button>
        </div>
      </div>

      {/* Organization List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Organizations Overview</h2>
        
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Demo Corporation</div>
                      <div className="text-sm text-gray-500">DEMO001</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Professional
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>2 / 100 users</div>
                    <div className="text-xs text-gray-500">3 managers allowed</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    ₹9,999/month
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">View</button>
                      <button className="text-green-600 hover:text-green-800">Manage</button>
                      <button className="text-purple-600 hover:text-purple-800">Billing</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Organization Modal */}
      {showCreateOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New Organization
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Set up a new tenant organization with manager license
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Organization Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Organization Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      value={newOrgForm.name}
                      onChange={(e) => setNewOrgForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Acme Corporation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Industry *
                    </label>
                    <select
                      value={newOrgForm.industry}
                      onChange={(e) => setNewOrgForm(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Industry</option>
                      <option value="Technology">Technology</option>
                      <option value="Finance">Finance</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Retail">Retail</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      value={newOrgForm.contact_email}
                      onChange={(e) => setNewOrgForm(prev => ({ ...prev, contact_email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="admin@acmecorp.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subscription Plan *
                    </label>
                    <select
                      value={newOrgForm.plan}
                      onChange={(e) => setNewOrgForm(prev => ({ ...prev, plan: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="starter">Starter - ₹2,999/month (25 users)</option>
                      <option value="professional">Professional - ₹9,999/month (100 users)</option>
                      <option value="enterprise">Enterprise - ₹24,999/month (500 users)</option>
                      <option value="unlimited">Unlimited - ₹49,999/month (Unlimited users)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Manager User Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Manager Account</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Manager Username *
                    </label>
                    <input
                      type="text"
                      value={newOrgForm.manager_user.username}
                      onChange={(e) => setNewOrgForm(prev => ({ 
                        ...prev, 
                        manager_user: { ...prev.manager_user, username: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="manager123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Manager Email *
                    </label>
                    <input
                      type="email"
                      value={newOrgForm.manager_user.email}
                      onChange={(e) => setNewOrgForm(prev => ({ 
                        ...prev, 
                        manager_user: { ...prev.manager_user, email: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="manager@acmecorp.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Manager Full Name *
                    </label>
                    <input
                      type="text"
                      value={newOrgForm.manager_user.full_name}
                      onChange={(e) => setNewOrgForm(prev => ({ 
                        ...prev, 
                        manager_user: { ...prev.manager_user, full_name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Temporary Password *
                    </label>
                    <input
                      type="password"
                      value={newOrgForm.manager_user.password}
                      onChange={(e) => setNewOrgForm(prev => ({ 
                        ...prev, 
                        manager_user: { ...prev.manager_user, password: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Temporary password"
                    />
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                  <button onClick={clearError} className="ml-2 underline text-sm">
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateOrg(false)
                  clearError()
                }}
                className="btn btn-outline"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrganization}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Creating...' : 'Create Organization'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlatformAdminDashboard