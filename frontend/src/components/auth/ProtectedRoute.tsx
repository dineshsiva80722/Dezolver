import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import LoadingSpinner from '@components/common/LoadingSpinner'

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore()

  // Wait for auth initialization to complete
  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute