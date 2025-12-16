import { useState, useEffect } from 'react'
import { useAuthStore } from '@store/authStore'
import { Navigate } from 'react-router-dom'
import { config } from '@/config'
import toast from 'react-hot-toast'

interface Admin {
  id: string
  username: string
  email: string
  full_name?: string
  phone_number?: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  last_login?: string
  contribution_points: number
  managedStudents: number
}

interface AdminStats {
  totalAdmins: number
  activeAdmins: number
  verifiedAdmins: number
  inactiveAdmins: number
}

interface SuperAdmin {
  id: string
  username: string
  email: string
  full_name?: string
  is_active: boolean
  created_at: string
  last_login?: string
}

const SuperAdminDashboard = () => {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'admins' | 'super-admins' | 'stats'>('admins')
  const [admins, setAdmins] = useState<Admin[]>([])
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if not super admin
  if (!user || user.role !== 'super_admin') {
    return <Navigate to="/" replace />
  }

  useEffect(() => {
    fetchAdmins()
    fetchAdminStats()
  }, [])

  const fetchAdmins = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem(config.auth.tokenKey)
      const response = await fetch(`${config.api.baseUrl}/super-admin/admins`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAdmins(data.data?.admins || [])
      } else {
        toast.error('Failed to fetch admins')
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
      toast.error('Error loading admins')
    } finally {
      setLoading(false)
    }
  }

  const fetchSuperAdmins = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem(config.auth.tokenKey)
      const response = await fetch(`${config.api.baseUrl}/super-admin/super-admins`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSuperAdmins(data.data?.superAdmins || [])
      } else {
        toast.error('Failed to fetch super admins')
      }
    } catch (error) {
      console.error('Error fetching super admins:', error)
      toast.error('Error loading super admins')
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem(config.auth.tokenKey)
      const response = await fetch(`${config.api.baseUrl}/super-admin/admins/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    }
  }

  const handlePromoteToSuperAdmin = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to promote ${username} to Super Admin?`)) {
      return
    }

    try {
      const token = localStorage.getItem(config.auth.tokenKey)
      const response = await fetch(`${config.api.baseUrl}/super-admin/users/${userId}/promote-super-admin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success(`${username} promoted to Super Admin`)
        fetchAdmins()
        fetchSuperAdmins()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to promote user')
      }
    } catch (error) {
      console.error('Error promoting user:', error)
      toast.error('Error promoting user to Super Admin')
    }
  }

  const handleDemoteToAdmin = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to demote ${username} from Super Admin to Admin?`)) {
      return
    }

    try {
      const token = localStorage.getItem(config.auth.tokenKey)
      const response = await fetch(`${config.api.baseUrl}/super-admin/users/${userId}/demote-to-admin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success(`${username} demoted to Admin`)
        fetchAdmins()
        fetchSuperAdmins()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to demote user')
      }
    } catch (error) {
      console.error('Error demoting user:', error)
      toast.error('Error demoting Super Admin')
    }
  }

  const filteredAdmins = admins.filter(admin =>
    admin.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSuperAdmins = superAdmins.filter(sa =>
    sa.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sa.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sa.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Super Admin Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage admins and super admins</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Admins</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalAdmins}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Admins</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.activeAdmins}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Verified Admins</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.verifiedAdmins}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Inactive Admins</h3>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{stats.inactiveAdmins}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => {
                  setActiveTab('admins')
                  fetchAdmins()
                }}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'admins'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Admins ({admins.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('super-admins')
                  fetchSuperAdmins()
                }}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'super-admins'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Super Admins ({superAdmins.length})
              </button>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search by username, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            ) : (
              <>
                {/* Admins Table */}
                {activeTab === 'admins' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Admin
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Students Managed
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredAdmins.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                              No admins found
                            </td>
                          </tr>
                        ) : (
                          filteredAdmins.map(admin => (
                            <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {admin.username}
                                    </div>
                                    {admin.full_name && (
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {admin.full_name}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {admin.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    admin.is_active
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                  }`}>
                                    {admin.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                  {admin.is_verified && (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                      Verified
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {admin.managedStudents}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handlePromoteToSuperAdmin(admin.id, admin.username)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  Promote to Super Admin
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Super Admins Table */}
                {activeTab === 'super-admins' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Super Admin
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Last Login
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredSuperAdmins.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                              No super admins found
                            </td>
                          </tr>
                        ) : (
                          filteredSuperAdmins.map(sa => (
                            <tr key={sa.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {sa.username}
                                    </div>
                                    {sa.full_name && (
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {sa.full_name}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {sa.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  sa.is_active
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                }`}>
                                  {sa.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {sa.last_login ? new Date(sa.last_login).toLocaleString() : 'Never'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleDemoteToAdmin(sa.id, sa.username)}
                                  className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                                  disabled={sa.id === user.id}
                                >
                                  {sa.id === user.id ? 'You' : 'Demote to Admin'}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuperAdminDashboard
