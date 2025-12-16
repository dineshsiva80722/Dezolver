import { useEffect, useState } from 'react'
import { useAuthStore } from '@store/authStore'
import { useCertificatesStore } from '@store/certificatesStore'
import { useEmployeeStore } from '@store/employeeStore'
import { usePayrollStore } from '@store/payrollStore'
import DashboardCard from '@components/common/DashboardCard'
import LoadingSpinner from '@components/common/LoadingSpinner'
import { formatDate } from '@utils/formatters'

const UserDashboard = () => {
  const { user } = useAuthStore()
  const { certificates, fetchMyCertificates } = useCertificatesStore()
  const { myEmployee, fetchMyEmployee } = useEmployeeStore()
  const { myPayrolls, fetchMyPayrolls } = usePayrollStore()
  
  const [stats, setStats] = useState({
    problemsSolved: 0,
    totalProblems: 150,
    currentRating: 1200,
    contestsParticipated: 0,
    totalCertificates: 0,
    lastSalary: 0,
    organizationName: '',
    managerName: ''
  })

  useEffect(() => {
    if (user?.tier === 'user') {
      fetchMyCertificates()
      fetchMyEmployee()
      fetchMyPayrolls({ limit: 1 })
      
      setStats({
        problemsSolved: user.problems_solved || 0,
        totalProblems: 150,
        currentRating: user.rating || 1200,
        contestsParticipated: user.contests_participated_count || 0,
        totalCertificates: certificates.length,
        lastSalary: myPayrolls[0]?.net_salary || 0,
        organizationName: 'Demo Corporation',
        managerName: 'Demo Corporation Manager'
      })
    }
  }, [user, certificates.length, myPayrolls])

  return (
    <div className="space-y-8">
      {/* User Welcome */}
      <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 rounded-xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <span className="mr-3">🚀</span>
                Welcome, {user?.full_name || user?.username}!
              </h1>
              <p className="text-green-100 text-lg">
                {stats.organizationName} • Team Member
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.currentRating}</div>
              <div className="text-sm text-green-100">Current Rating</div>
            </div>
          </div>
          
          {/* User Quick Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">{stats.problemsSolved}</div>
              <div className="text-sm text-green-100">Problems Solved</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">{certificates.length}</div>
              <div className="text-sm text-green-100">Certificates</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">{stats.contestsParticipated}</div>
              <div className="text-sm text-green-100">Contests</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">{Math.round((stats.problemsSolved / stats.totalProblems) * 100)}%</div>
              <div className="text-sm text-green-100">Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* User Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Learning Progress */}
        <DashboardCard
          title="Learning Progress"
          subtitle="Your coding journey"
          value={`${stats.problemsSolved}/${stats.totalProblems}`}
          icon="📚"
          gradient="blue"
          href="/problems"
        >
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{Math.round((stats.problemsSolved / stats.totalProblems) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${(stats.problemsSolved / stats.totalProblems) * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">
              Keep solving to improve your rating!
            </div>
          </div>
        </DashboardCard>

        {/* My Certificates */}
        <DashboardCard
          title="My Achievements"
          subtitle="Earned certificates"
          value={certificates.length}
          icon="🎓"
          gradient="green"
          href="/certificates"
        >
          {certificates.length > 0 ? (
            <div>
              <div className="text-xs">Latest: {certificates[0]?.course_name}</div>
              <div className="text-xs text-gray-500 mt-1">
                Earned {formatDate(certificates[0]?.created_at)}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              Complete courses to earn certificates
            </div>
          )}
        </DashboardCard>

        {/* Employee Profile */}
        {myEmployee ? (
          <DashboardCard
            title="Employee Profile"
            subtitle="Your work information"
            value={myEmployee.job_title}
            icon="💼"
            gradient="purple"
            href="/employees"
          >
            <div className="space-y-1">
              <div className="text-xs">{myEmployee.department}</div>
              <div className="text-xs text-gray-500">
                Since {formatDate(myEmployee.hire_date)}
              </div>
              {myEmployee.bank_details?.is_verified && (
                <div className="text-xs">
                  <span className="px-1 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                    Bank Verified
                  </span>
                </div>
              )}
            </div>
          </DashboardCard>
        ) : (
          <DashboardCard
            title="Employee Status"
            subtitle="Not enrolled as employee"
            icon="💼"
            gradient="purple"
          >
            <div className="text-xs text-gray-500">
              Contact your manager to set up employee profile
            </div>
          </DashboardCard>
        )}

        {/* Salary Information */}
        {myEmployee && myPayrolls.length > 0 ? (
          <DashboardCard
            title="Latest Salary"
            subtitle="Your recent payroll"
            value={`₹${myPayrolls[0]?.net_salary.toLocaleString('en-IN')}`}
            icon="💰"
            gradient="orange"
            href="/payroll"
          >
            <div className="space-y-1">
              <div className="text-xs">
                {formatDate(myPayrolls[0]?.pay_period_start)} - {formatDate(myPayrolls[0]?.pay_period_end)}
              </div>
              <div className="text-xs">
                <span className={`px-1 py-0.5 rounded text-xs ${
                  myPayrolls[0]?.status === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {myPayrolls[0]?.status}
                </span>
              </div>
            </div>
          </DashboardCard>
        ) : (
          <DashboardCard
            title="Salary Information"
            subtitle="Payroll not available"
            icon="💰"
            gradient="orange"
          >
            <div className="text-xs text-gray-500">
              No salary records available
            </div>
          </DashboardCard>
        )}

        {/* Contest Performance */}
        <DashboardCard
          title="Contest Performance"
          subtitle="Competitive programming"
          value={stats.contestsParticipated}
          icon="🏆"
          gradient="indigo"
          href="/contests"
        >
          <div className="space-y-1">
            <div className="text-xs">Rating: {stats.currentRating}</div>
            <div className="text-xs">Max: {user?.max_rating || stats.currentRating}</div>
          </div>
        </DashboardCard>

        {/* Quick Actions */}
        <DashboardCard
          title="Quick Actions"
          subtitle="What would you like to do?"
          icon="⚡"
          gradient="red"
        >
          <div className="space-y-2">
            <a href="/problems" className="block text-xs text-blue-600 hover:text-blue-800 transition-colors">
              → Solve Problems
            </a>
            <a href="/contests" className="block text-xs text-green-600 hover:text-green-800 transition-colors">
              → Join Contest
            </a>
            <a href="/certificates" className="block text-xs text-purple-600 hover:text-purple-800 transition-colors">
              → View Certificates
            </a>
            {myEmployee && (
              <a href="/payroll" className="block text-xs text-orange-600 hover:text-orange-800 transition-colors">
                → View Salary
              </a>
            )}
          </div>
        </DashboardCard>
      </div>

      {/* Organization Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Organization Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Company Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Organization:</span>
                  <span className="font-medium">{stats.organizationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                  <span className="font-medium">Professional</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Your Role:</span>
                  <span className="font-medium capitalize">{user?.role?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Manager:</span>
                  <span className="font-medium">{stats.managerName}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Available Features</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-green-600">✅</span>
                  <span>Problem solving and contests</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-green-600">✅</span>
                  <span>Certificate generation</span>
                </div>
                {myEmployee && (
                  <>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-green-600">✅</span>
                      <span>HR and payroll access</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-green-600">✅</span>
                      <span>Employee portal</span>
                    </div>
                  </>
                )}
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-400">❌</span>
                  <span className="text-gray-500">User management (Manager only)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Path & Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recommended Learning Path</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="text-3xl mb-3">🧩</div>
            <div className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Data Structures</div>
            <div className="text-sm text-blue-700 dark:text-blue-400 mb-4">
              Master arrays, linked lists, and trees
            </div>
            <a href="/problems?category=data-structures" className="btn btn-primary btn-sm">
              Start Learning
            </a>
          </div>

          <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="text-3xl mb-3">⚡</div>
            <div className="font-semibold text-green-900 dark:text-green-300 mb-2">Algorithms</div>
            <div className="text-sm text-green-700 dark:text-green-400 mb-4">
              Learn sorting, searching, and graph algorithms
            </div>
            <a href="/problems?category=algorithms" className="btn btn-primary btn-sm">
              Explore
            </a>
          </div>

          <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
            <div className="text-3xl mb-3">🏆</div>
            <div className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Contests</div>
            <div className="text-sm text-purple-700 dark:text-purple-400 mb-4">
              Participate in weekly programming contests
            </div>
            <a href="/contests" className="btn btn-primary btn-sm">
              Join Contest
            </a>
          </div>
        </div>
      </div>

      {/* User Limitations Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center">
          <span className="mr-2">ℹ️</span>
          Your Access Level
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium text-blue-800 dark:text-blue-300">✅ You Can:</h4>
            <div className="space-y-1 text-blue-700 dark:text-blue-400">
              <div>• Solve problems and participate in contests</div>
              <div>• View and download your certificates</div>
              <div>• Access your employee profile and payroll</div>
              <div>• Update your personal banking details</div>
              <div>• View organization activity feed</div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-blue-800 dark:text-blue-300">❌ Manager Only:</h4>
            <div className="space-y-1 text-blue-600 dark:text-blue-400">
              <div>• Add or remove team members</div>
              <div>• Process payroll and HR operations</div>
              <div>• Create certificate templates</div>
              <div>• Access organization billing settings</div>
              <div>• Upgrade subscription plans</div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800/50 rounded-lg">
          <div className="text-xs text-blue-800 dark:text-blue-300">
            💡 <strong>Need manager access?</strong> Contact {stats.managerName} or purchase a manager license upgrade.
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Recent Activity</h2>
        
        <div className="space-y-4">
          {certificates.length > 0 && (
            <div className="flex items-center space-x-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-semibold">
                🎓
              </div>
              <div className="flex-1">
                <div className="font-medium text-green-800 dark:text-green-300">
                  Certificate Earned
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {certificates[0]?.course_name}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(certificates[0]?.created_at)}
              </div>
            </div>
          )}

          {myPayrolls.length > 0 && (
            <div className="flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-semibold">
                💰
              </div>
              <div className="flex-1">
                <div className="font-medium text-blue-800 dark:text-blue-300">
                  Salary Processed
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  ₹{myPayrolls[0]?.net_salary.toLocaleString('en-IN')} - {myPayrolls[0]?.status}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(myPayrolls[0]?.created_at)}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
              ✅
            </div>
            <div className="flex-1">
              <div className="font-medium text-purple-800 dark:text-purple-300">
                Problem Solved
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">
                Successfully solved "Two Sum" problem
              </div>
            </div>
            <div className="text-xs text-gray-500">
              3 hours ago
            </div>
          </div>

          <div className="text-center py-4">
            <a 
              href="/submissions" 
              className="text-sm text-primary hover:text-primary-600 font-medium"
            >
              View all activity →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDashboard