import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { useAuthStore } from '@store/authStore'
import { useSettingsStore } from '@store/settingsStore'
import EliteLayout from '@components/common/EliteLayout'
import LoadingSpinner from '@components/common/LoadingSpinner'
import ProtectedRoute from '@components/auth/ProtectedRoute'
import { config } from '@/config'

// Lazy load pages for better performance
const HomePage = lazy(() => import('@pages/HomePage'))
const LoginPage = lazy(() => import('@pages/LoginPage'))
const RegisterPage = lazy(() => import('@pages/RegisterPage'))
const ProblemsPage = lazy(() => import('@pages/ProblemsPage'))
const ProblemDetailPage = lazy(() => import('@pages/ProblemDetailPageEnhanced'))
const ProblemSolvingPage = lazy(() => import('@pages/ProblemSolvingPage'))
const ContestsPage = lazy(() => import('@pages/ContestsPage'))
const ContestDetailPage = lazy(() => import('@pages/ContestDetailPage'))
const LeaderboardPage = lazy(() => import('@pages/LeaderboardPage'))
const SubmissionsPage = lazy(() => import('@pages/SubmissionsPage'))
// const DashboardPage = lazy(() => import('@pages/DashboardPage'))
const GroupsPage = lazy(() => import('@pages/GroupsPage'))
const CreateProblemPage = lazy(() => import('@pages/CreateProblemPage'))
const EditProblemPage = lazy(() => import('@pages/EditProblemPage'))
const CreateContestPage = lazy(() => import('@pages/CreateContestPage'))
const EditContestPage = lazy(() => import('@pages/EditContestPage'))
const CreateGroupPage = lazy(() => import('@pages/CreateGroupPage'))
const EditGroupPage = lazy(() => import('@pages/EditGroupPage'))
const GroupManagePage = lazy(() => import('@pages/GroupManagePage'))
const GroupModeratePage = lazy(() => import('@pages/GroupModeratePage'))
const GroupDetailPage = lazy(() => import('@pages/GroupDetailPage'))
const GroupMembersPage = lazy(() => import('@pages/GroupMembersPage'))
const JoinGroupPage = lazy(() => import('@pages/JoinGroupPage'))
const GroupContestsPage = lazy(() => import('@pages/GroupContestsPage'))
const CreateGroupContestPage = lazy(() => import('@pages/CreateGroupContestPage'))
const GroupForumPage = lazy(() => import('@pages/GroupForumPage'))
const AdminConsolePage = lazy(() => import('@pages/AdminConsolePage'))
const SettingsPage = lazy(() => import('@pages/SettingsPage'))
const EmployeesPage = lazy(() => import('@pages/EmployeesPage'))
const PayrollPage = lazy(() => import('@pages/PayrollPage'))
const AdminCertificatesPage = lazy(() => import('@pages/AdminCertificatesPage'))
const AdminHRPage = lazy(() => import('@pages/AdminHRPage'))
const BankDetailsPage = lazy(() => import('@pages/BankDetailsPage'))
const EliteDashboard = lazy(() => import('@pages/EliteDashboard'))
const EliteCertificatesPage = lazy(() => import('@pages/EliteCertificatesPage'))
const EliteAdminDashboard = lazy(() => import('@pages/EliteAdminDashboard'))
const PaymentTestPage = lazy(() => import('@pages/PaymentTestPage'))
const SubscriptionManagementPage = lazy(() => import('@pages/SubscriptionManagementPageEnhanced'))
const AdminManagersPage = lazy(() => import('@pages/AdminManagersPage'))
const ManagerStudentsPage = lazy(() => import('@pages/ManagerStudentsPage'))
const AssessmentPage = lazy(() => import('@pages/AssessmentPage'))
const SuperAdminDashboard = lazy(() => import('@pages/SuperAdminDashboard'))

function App() {
  const { isAuthenticated, user, login, logout, setLoading, setInitialized } = useAuthStore()
  const { setTheme, theme } = useSettingsStore()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const switchAccount = searchParams.get('switch') === 'true'

  // Initialize app
  useEffect(() => {
    setTheme(theme)

    // Check for existing auth token and validate it
    const initAuth = async () => {
      const token = localStorage.getItem('techfolks_auth_token')
      const refreshToken = localStorage.getItem('techfolks_refresh_token')

      if (token) {
        setLoading(true)
        try {
          // Validate token by calling /auth/profile endpoint
          const apiUrl = config.api.baseUrl
          const response = await fetch(`${apiUrl}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })

          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              login(result.data, token, refreshToken || undefined)
            } else {
              // Token validation failed, try to refresh
              await tryRefreshToken(apiUrl, refreshToken)
            }
          } else if (response.status === 401) {
            // Token expired or invalid, try to refresh
            await tryRefreshToken(apiUrl, refreshToken)
          } else {
            // Other error, clear auth
            localStorage.removeItem('techfolks_auth_token')
            localStorage.removeItem('techfolks_refresh_token')
            logout()
          }
        } catch (error) {
          console.error('Auth validation error:', error)
          // Try to refresh token before giving up
          await tryRefreshToken(config.api.baseUrl, refreshToken)
        } finally {
          setLoading(false)
          setInitialized(true)
        }
      } else {
        // No token found, mark as initialized
        setInitialized(true)
      }
    }

    const tryRefreshToken = async (apiUrl: string, refreshToken: string | null) => {
      if (!refreshToken) {
        localStorage.removeItem('techfolks_auth_token')
        localStorage.removeItem('techfolks_refresh_token')
        logout()
        return
      }

      try {
        const refreshResponse = await fetch(`${apiUrl}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        })

        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json()
          if (refreshResult.success && refreshResult.data.token) {
            // Get user profile with new token
            const profileResponse = await fetch(`${apiUrl}/auth/profile`, {
              headers: { 'Authorization': `Bearer ${refreshResult.data.token}` }
            })

            if (profileResponse.ok) {
              const profileResult = await profileResponse.json()
              if (profileResult.success && profileResult.data) {
                login(profileResult.data, refreshResult.data.token, refreshToken)
                return
              }
            }
          }
        }

        // Refresh failed, clear everything
        localStorage.removeItem('techfolks_auth_token')
        localStorage.removeItem('techfolks_refresh_token')
        logout()
      } catch (error) {
        console.error('Token refresh error:', error)
        localStorage.removeItem('techfolks_auth_token')
        localStorage.removeItem('techfolks_refresh_token')
        logout()
      }
    }

    initAuth()
  }, [login, logout, setLoading, setInitialized, setTheme, theme])

  return (
    <EliteLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={
              isAuthenticated && !switchAccount
                ? <Navigate to={
                    user?.role === 'super_admin'
                      ? '/super-admin'
                      : user?.role === 'admin'
                        ? '/admin'
                        : user?.role === 'manager'
                          ? '/manager/students'
                          : '/leaderboard'
                  } replace />
                : <LoginPage />
            }
          />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/leaderboard" /> : <RegisterPage />} />
          <Route path="/assessments" element={<AssessmentPage />} />
          <Route path="/problems" element={<ProblemsPage />} />
          <Route path="/problems/:id" element={<ProblemDetailPage />} />
          <Route path="/problems/:code/solve" element={<ProblemSolvingPage />} />
          <Route path="/problems/:code/contest/:contestId" element={<ProblemSolvingPage />} />
          <Route path="/contests" element={<ContestsPage />} />
          <Route path="/contests/:id" element={<ContestDetailPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/join" element={<JoinGroupPage />} />
          <Route path="/groups/:id" element={<GroupDetailPage />} />

          {/* Leaderboard - Main dashboard replacement for students */}
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/dashboard" element={<Navigate to="/leaderboard" replace />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<EliteDashboard />} />
            <Route path="/submissions" element={<SubmissionsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* Certificate, Employee & Payroll Routes */}
            <Route path="/certificates" element={<EliteCertificatesPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/bank-details" element={<BankDetailsPage />} />

            {/* Payment Test Route */}
            <Route path="/payment-test" element={<PaymentTestPage />} />

            {/* Subscription Management Route */}
            <Route path="/subscription" element={<SubscriptionManagementPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<EliteAdminDashboard />} />
          <Route path="/admin/console" element={<AdminConsolePage />} />
          <Route path="/admin/managers" element={<AdminManagersPage />} />
          <Route path="/admin/create-problem" element={<CreateProblemPage />} />
          <Route path="/admin/edit-problem/:id" element={<EditProblemPage />} />
          <Route path="/admin/create-contest" element={<CreateContestPage />} />
          <Route path="/admin/edit-contest/:id" element={<EditContestPage />} />
          <Route path="/admin/certificates" element={<AdminCertificatesPage />} />
          <Route path="/admin/hr" element={<AdminHRPage />} />
          
          {/* Super Admin Route */}
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
            
            {/* Manager Routes */}
            <Route path="/manager/students" element={<ManagerStudentsPage />} />
            
            {/* Group Management Routes */}
            <Route path="/groups/create" element={<CreateGroupPage />} />
            <Route path="/groups/:id/edit" element={<EditGroupPage />} />
            <Route path="/groups/:id/manage" element={<GroupManagePage />} />
            <Route path="/groups/:id/moderate" element={<GroupModeratePage />} />
            <Route path="/groups/:id/members" element={<GroupMembersPage />} />
            <Route path="/groups/:id/contests" element={<GroupContestsPage />} />
            <Route path="/groups/:id/contests/create" element={<CreateGroupContestPage />} />
            <Route path="/groups/:id/forum" element={<GroupForumPage />} />
          </Route>

          {/* Catch all - 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </EliteLayout>
  )
}

export default App
