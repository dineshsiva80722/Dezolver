import { useEffect, useState } from 'react'
import { useAuthStore } from '@store/authStore'
import { useCertificatesStore } from '@store/certificatesStore'
import { useEmployeeStore } from '@store/employeeStore'
import { usePayrollStore } from '@store/payrollStore'
import DashboardCard from '@components/common/DashboardCard'
import { formatDate } from '@utils/formatters'

const EliteDashboard = () => {
  const { user } = useAuthStore()
  const { certificates, fetchMyCertificates } = useCertificatesStore()
  const { myEmployee, fetchMyEmployee } = useEmployeeStore()
  const { myPayrolls, fetchMyPayrolls } = usePayrollStore()
  
  const [stats, setStats] = useState({
    totalProblems: 150,
    solvedProblems: 0,
    contestsParticipated: 0,
    currentRating: 1200,
    totalCertificates: 0,
    lastSalary: 0
  })

  useEffect(() => {
    if (user) {
      fetchMyCertificates()
      fetchMyEmployee()
      fetchMyPayrolls({ limit: 1 })
      
      setStats({
        totalProblems: 150,
        solvedProblems: user.problems_solved || 0,
        contestsParticipated: user.contests_participated_count || 0,
        currentRating: user.rating || 1200,
        totalCertificates: certificates.length,
        lastSalary: myPayrolls[0]?.net_salary || 0
      })
    }
  }, [user, certificates.length, myPayrolls])

  const isAdmin = user?.role === 'admin'

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.full_name || user?.username}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                Ready to continue your {isAdmin ? 'administrative' : 'learning'} journey?
              </p>
            </div>
            <div className="text-6xl opacity-50">
              {isAdmin ? '🛠️' : '🚀'}
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">{stats.currentRating}</div>
              <div className="text-sm text-blue-100">Current Rating</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">{stats.solvedProblems}</div>
              <div className="text-sm text-blue-100">Problems Solved</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">{certificates.length}</div>
              <div className="text-sm text-blue-100">Certificates</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">{stats.contestsParticipated}</div>
              <div className="text-sm text-blue-100">Contests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Coding Performance */}
        <DashboardCard
          title="Coding Performance"
          subtitle="Your problem-solving journey"
          value={`${stats.solvedProblems}/${stats.totalProblems}`}
          icon="🧩"
          gradient="blue"
          href="/problems"
        >
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{Math.round((stats.solvedProblems / stats.totalProblems) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${(stats.solvedProblems / stats.totalProblems) * 100}%` }}
              />
            </div>
          </div>
        </DashboardCard>

        {/* Certificates */}
        <DashboardCard
          title="Achievements"
          subtitle="Your earned certificates"
          value={certificates.length}
          icon="🎓"
          gradient="green"
          href="/certificates"
        >
          {certificates.length > 0 ? (
            <div>
              Latest: {certificates[0]?.course_name}
              <div className="text-xs text-gray-500 mt-1">
                Earned {formatDate(certificates[0]?.created_at)}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">
              Complete courses to earn certificates
            </div>
          )}
        </DashboardCard>

        {/* Employee Info */}
        {myEmployee ? (
          <DashboardCard
            title="Employee Profile"
            subtitle="Your employment details"
            value={myEmployee.job_title}
            icon="👤"
            gradient="purple"
            href="/employees"
          >
            <div className="space-y-1">
              <div>{myEmployee.department}</div>
              <div className="text-xs text-gray-500">
                Employee since {formatDate(myEmployee.hire_date)}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  myEmployee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {myEmployee.is_active ? 'Active' : 'Inactive'}
                </span>
                {myEmployee.bank_details?.is_verified && (
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    Bank Verified
                  </span>
                )}
              </div>
            </div>
          </DashboardCard>
        ) : (
          <DashboardCard
            title="Employee Profile"
            subtitle="Join as an employee"
            icon="👤"
            gradient="purple"
            href="/employees"
          >
            <div className="text-gray-500">
              No employee profile found. Contact admin to set up your employee record.
            </div>
          </DashboardCard>
        )}

        {/* Payroll Info */}
        {myPayrolls.length > 0 ? (
          <DashboardCard
            title="Latest Payroll"
            subtitle="Your recent salary"
            value={`₹${myPayrolls[0]?.net_salary.toLocaleString('en-IN')}`}
            icon="💰"
            gradient="orange"
            href="/payroll"
          >
            <div className="space-y-1">
              <div className="text-xs">
                Period: {formatDate(myPayrolls[0]?.pay_period_start)} - {formatDate(myPayrolls[0]?.pay_period_end)}
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  myPayrolls[0]?.status === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : myPayrolls[0]?.status === 'processed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {myPayrolls[0]?.status.toUpperCase()}
                </span>
              </div>
            </div>
          </DashboardCard>
        ) : (
          <DashboardCard
            title="Payroll"
            subtitle="Salary information"
            icon="💰"
            gradient="orange"
            href="/payroll"
          >
            <div className="text-gray-500">
              No payroll records available yet.
            </div>
          </DashboardCard>
        )}

        {/* Contest Performance */}
        <DashboardCard
          title="Contest Performance"
          subtitle="Your competitive stats"
          value={stats.contestsParticipated}
          icon="🏆"
          gradient="indigo"
          href="/contests"
        >
          <div className="space-y-1">
            <div className="text-xs text-gray-500">
              Rating: {stats.currentRating}
            </div>
            <div className="text-xs text-gray-500">
              Max Rating: {user?.max_rating || stats.currentRating}
            </div>
          </div>
        </DashboardCard>

        {/* Quick Actions */}
        <DashboardCard
          title="Quick Actions"
          subtitle="Common tasks"
          icon="⚡"
          gradient="red"
        >
          <div className="space-y-2">
            <a href="/problems" className="block text-sm text-blue-600 hover:text-blue-800 transition-colors">
              → Solve Problems
            </a>
            <a href="/certificates" className="block text-sm text-green-600 hover:text-green-800 transition-colors">
              → View Certificates
            </a>
            {myEmployee && (
              <a href="/bank-details" className="block text-sm text-purple-600 hover:text-purple-800 transition-colors">
                → Update Bank Details
              </a>
            )}
            <a href="/settings" className="block text-sm text-gray-600 hover:text-gray-800 transition-colors">
              → Account Settings
            </a>
          </div>
        </DashboardCard>
      </div>

      {/* Admin Quick Access */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">🛠️</span>
            Administrator Quick Access
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <a 
              href="/admin/hr"
              className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors"
            >
              <div className="text-lg font-semibold">HR Management</div>
              <div className="text-sm text-gray-300">Employees & Payroll</div>
            </a>
            <a 
              href="/admin/certificates"
              className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors"
            >
              <div className="text-lg font-semibold">Certificates</div>
              <div className="text-sm text-gray-300">Templates & Verification</div>
            </a>
            <a 
              href="/admin"
              className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors"
            >
              <div className="text-lg font-semibold">System Console</div>
              <div className="text-sm text-gray-300">Platform Management</div>
            </a>
            <a 
              href="/bank-details"
              className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors"
            >
              <div className="text-lg font-semibold">Bank Management</div>
              <div className="text-sm text-gray-300">Company & Employee Banking</div>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default EliteDashboard