import { useEffect, useState } from 'react'
import { useAuthStore } from '@store/authStore'
import { useEmployeeStore } from '@store/employeeStore'
import { useCertificatesStore } from '@store/certificatesStore'
import { usePayrollStore } from '@store/payrollStore'
import DashboardCard from '@components/common/DashboardCard'
import { Navigate } from 'react-router-dom'

const EliteAdminDashboard = () => {
  const { user } = useAuthStore()
  const { employees, fetchEmployees } = useEmployeeStore()
  const { certificates, templates, fetchTemplates, searchCertificates } = useCertificatesStore()
  const { summary, fetchPayrollSummary } = usePayrollStore()

  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeEmployees: 0,
    totalCertificates: 0,
    monthlyPayroll: 0,
    pendingVerifications: 0,
    systemHealth: 98
  })

  const [recentActivity] = useState([
    { type: 'certificate', message: 'Certificate generated for Full Stack Development', time: '2 hours ago', icon: '🎓' },
    { type: 'payroll', message: 'Monthly payroll processed for 15 employees', time: '1 day ago', icon: '💰' },
    { type: 'employee', message: 'New employee added: John Doe', time: '2 days ago', icon: '👤' },
    { type: 'system', message: 'System backup completed successfully', time: '3 days ago', icon: '💾' }
  ])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchEmployees()
      fetchTemplates()
      searchCertificates({ limit: 100 })
      fetchPayrollSummary({
        start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      })

      // Simulate fetching system stats
      setSystemStats({
        totalUsers: 1250,
        activeEmployees: employees.filter(emp => emp.is_active).length,
        totalCertificates: certificates.length,
        monthlyPayroll: summary?.totalNetAmount || 0,
        pendingVerifications: employees.filter(emp => emp.bank_details && !emp.bank_details.is_verified).length,
        systemHealth: 98
      })
    }
  }, [user, employees.length, certificates.length, summary])

  // Redirect if not admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/profile" replace />
  }

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-blue-500/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <span className="mr-3">🛠️</span>
                Administrator Console
              </h1>
              <p className="text-slate-300 text-lg">
                System overview and platform management
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{systemStats.systemHealth}%</div>
              <div className="text-sm text-slate-300">System Health</div>
            </div>
          </div>
          
          {/* Admin Quick Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
              <div className="text-sm text-slate-300">Total Users</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">{systemStats.activeEmployees}</div>
              <div className="text-sm text-slate-300">Employees</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">{systemStats.totalCertificates}</div>
              <div className="text-sm text-slate-300">Certificates</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">₹{(systemStats.monthlyPayroll / 100000).toFixed(1)}L</div>
              <div className="text-sm text-slate-300">YTD Payroll</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-yellow-400">{systemStats.pendingVerifications}</div>
              <div className="text-sm text-slate-300">Pending Tasks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* HR Management */}
        <DashboardCard
          title="HR Management"
          subtitle="Employee & Payroll Operations"
          value={`${systemStats.activeEmployees} Active`}
          icon="👥"
          gradient="blue"
          href="/admin/hr"
          trend={{
            value: 5,
            label: 'new this month',
            isPositive: true
          }}
        >
          <div className="space-y-2">
            <div className="text-xs text-gray-600">Recent Actions:</div>
            <div className="text-xs">• {systemStats.pendingVerifications} bank verifications pending</div>
            <div className="text-xs">• Monthly payroll ready for processing</div>
          </div>
        </DashboardCard>

        {/* Certificate Administration */}
        <DashboardCard
          title="Certificate System"
          subtitle="Templates & Verification"
          value={`${templates.length} Templates`}
          icon="🎖️"
          gradient="green"
          href="/admin/certificates"
        >
          <div className="space-y-2">
            <div className="text-xs text-gray-600">System Status:</div>
            <div className="text-xs">• {systemStats.totalCertificates} total certificates issued</div>
            <div className="text-xs">• All templates active and verified</div>
          </div>
        </DashboardCard>

        {/* System Health */}
        <DashboardCard
          title="System Performance"
          subtitle="Platform Health & Metrics"
          value={`${systemStats.systemHealth}%`}
          icon="📊"
          gradient="purple"
          trend={{
            value: 2,
            label: 'improvement',
            isPositive: true
          }}
        >
          <div className="space-y-2">
            <div className="text-xs text-gray-600">Performance:</div>
            <div className="text-xs">• Database: 99.9% uptime</div>
            <div className="text-xs">• API Response: &lt;145ms avg</div>
          </div>
        </DashboardCard>

        {/* User Management */}
        <DashboardCard
          title="User Management"
          subtitle="Platform Users & Security"
          value={`${systemStats.totalUsers.toLocaleString()}`}
          icon="🔐"
          gradient="orange"
          href="/admin"
        >
          <div className="space-y-2">
            <div className="text-xs text-gray-600">Security Status:</div>
            <div className="text-xs">• All users verified</div>
            <div className="text-xs">• No security incidents</div>
          </div>
        </DashboardCard>

        {/* Financial Overview */}
        <DashboardCard
          title="Financial Overview"
          subtitle="Payroll & Expenses"
          value={`₹${(systemStats.monthlyPayroll / 100000).toFixed(1)}L`}
          icon="💰"
          gradient="indigo"
          href="/admin/hr"
        >
          <div className="space-y-2">
            <div className="text-xs text-gray-600">This Year:</div>
            <div className="text-xs">• Total disbursed: ₹{(systemStats.monthlyPayroll / 100000).toFixed(1)}L</div>
            <div className="text-xs">• Average salary: ₹{summary ? Math.round(summary.averageSalary / 1000) : 0}K</div>
          </div>
        </DashboardCard>

        {/* Subscription & Billing */}
        <DashboardCard
          title="Subscription & Billing"
          subtitle="Plan Management & Payments"
          icon="💳"
          gradient="orange"
          href="/subscription"
        >
          <div className="space-y-2">
            <div className="text-xs text-gray-600">Billing Status:</div>
            <div className="text-xs">• Manage subscription plans</div>
            <div className="text-xs">• View payment history</div>
            <div className="text-xs">• Razorpay integration active</div>
          </div>
        </DashboardCard>

        {/* Quick Actions */}
        <DashboardCard
          title="Quick Actions"
          subtitle="Common Admin Tasks"
          icon="⚡"
          gradient="red"
        >
          <div className="space-y-2">
            <a href="/admin/hr" className="block text-xs text-blue-600 hover:text-blue-800 transition-colors">
              → Process Monthly Payroll
            </a>
            <a href="/admin/certificates" className="block text-xs text-green-600 hover:text-green-800 transition-colors">
              → Create Certificate Template
            </a>
            <a href="/bank-details" className="block text-xs text-purple-600 hover:text-purple-800 transition-colors">
              → Manage Bank Details
            </a>
            <a href="/subscription" className="block text-xs text-pink-600 hover:text-pink-800 transition-colors">
              → Subscription Management
            </a>
          </div>
        </DashboardCard>
      </div>

      {/* Management Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HR Operations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="mr-2">🏢</span>
            HR Operations Center
          </h2>
          
          <div className="space-y-4">
            <a 
              href="/admin/hr"
              className="block p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-blue-900 dark:text-blue-300">Employee Management</div>
                  <div className="text-sm text-blue-700 dark:text-blue-400">Manage employee records and hierarchy</div>
                </div>
                <div className="text-2xl">👥</div>
              </div>
            </a>

            <a 
              href="/admin/hr"
              className="block p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-green-900 dark:text-green-300">Payroll Processing</div>
                  <div className="text-sm text-green-700 dark:text-green-400">Calculate and process monthly salaries</div>
                </div>
                <div className="text-2xl">💰</div>
              </div>
            </a>

            <a 
              href="/bank-details"
              className="block p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-purple-900 dark:text-purple-300">Banking Operations</div>
                  <div className="text-sm text-purple-700 dark:text-purple-400">Manage company and employee bank details</div>
                </div>
                <div className="text-2xl">🏦</div>
              </div>
            </a>
          </div>
        </div>

        {/* Certificate Operations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="mr-2">🎓</span>
            Certificate Operations
          </h2>
          
          <div className="space-y-4">
            <a 
              href="/admin/certificates"
              className="block p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-indigo-900 dark:text-indigo-300">Template Management</div>
                  <div className="text-sm text-indigo-700 dark:text-indigo-400">Create and manage certificate templates</div>
                </div>
                <div className="text-2xl">🎨</div>
              </div>
            </a>

            <a 
              href="/admin/certificates"
              className="block p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-teal-900 dark:text-teal-300">Certificate Verification</div>
                  <div className="text-sm text-teal-700 dark:text-teal-400">Monitor and manage certificate authenticity</div>
                </div>
                <div className="text-2xl">🔍</div>
              </div>
            </a>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-yellow-900 dark:text-yellow-300">Bulk Operations</div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-400">Generate certificates for multiple learners</div>
                </div>
                <div className="text-2xl">📋</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="mr-2">📈</span>
            Recent Platform Activity
          </h2>
          
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {activity.message}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'certificate' ? 'bg-green-500' :
                  activity.type === 'payroll' ? 'bg-blue-500' :
                  activity.type === 'employee' ? 'bg-purple-500' :
                  'bg-gray-500'
                }`}></div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <a href="/admin" className="text-sm text-primary hover:text-primary-600 font-medium">
              View full activity log →
            </a>
          </div>
        </div>

        {/* System Alerts & Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="mr-2">🔔</span>
            Alerts & Tasks
          </h2>
          
          <div className="space-y-3">
            {systemStats.pendingVerifications > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-yellow-800 dark:text-yellow-300 text-sm">
                      Bank Verification Required
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      {systemStats.pendingVerifications} employees need bank verification
                    </div>
                  </div>
                  <a href="/bank-details" className="text-yellow-600 hover:text-yellow-800 text-xs">
                    Review →
                  </a>
                </div>
              </div>
            )}

            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-green-800 dark:text-green-300 text-sm">
                    System Healthy
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    All services running optimally
                  </div>
                </div>
                <div className="text-green-600 text-xl">✅</div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-800 dark:text-blue-300 text-sm">
                    Monthly Reports Ready
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    Payroll and certificate reports available
                  </div>
                </div>
                <a href="/admin/hr" className="text-blue-600 hover:text-blue-800 text-xs">
                  View →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Administrative Quick Actions */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <span className="mr-2">⚡</span>
          Administrative Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.href = '/admin/hr'}
            className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors text-left"
          >
            <div className="text-lg font-semibold flex items-center">
              <span className="mr-2">🚀</span>Process Payroll
            </div>
            <div className="text-sm text-gray-300 mt-1">Run monthly salary processing</div>
          </button>
          
          <button
            onClick={() => window.location.href = '/admin/certificates'}
            className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors text-left"
          >
            <div className="text-lg font-semibold flex items-center">
              <span className="mr-2">🎨</span>Create Template
            </div>
            <div className="text-sm text-gray-300 mt-1">Design new certificate template</div>
          </button>
          
          <button
            onClick={() => window.location.href = '/bank-details'}
            className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors text-left"
          >
            <div className="text-lg font-semibold flex items-center">
              <span className="mr-2">🏦</span>Verify Banks
            </div>
            <div className="text-sm text-gray-300 mt-1">Approve banking information</div>
          </button>
          
          <button
            onClick={() => window.location.href = '/admin'}
            className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors text-left"
          >
            <div className="text-lg font-semibold flex items-center">
              <span className="mr-2">📊</span>View Reports
            </div>
            <div className="text-sm text-gray-300 mt-1">System analytics and reports</div>
          </button>

          <button
            onClick={() => window.location.href = '/subscription'}
            className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors text-left"
          >
            <div className="text-lg font-semibold flex items-center">
              <span className="mr-2">💳</span>Manage Subscription
            </div>
            <div className="text-sm text-gray-300 mt-1">Plans, billing, and payments</div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default EliteAdminDashboard
