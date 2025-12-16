import { useState, useEffect } from 'react'
import { useAuthStore } from '@store/authStore'
import toast from 'react-hot-toast'
import { Users, Plus, Mail, Phone, Award, Code, Trophy, Calendar, UserCheck, UserX } from 'lucide-react'

interface Student {
  id: string
  username: string
  email: string
  full_name: string
  phone_number: string
  rating: number
  max_rating: number
  problems_solved: number
  contests_participated_count: number
  is_active: boolean
  created_at: string
  last_login: string
}

interface ManagerStats {
  totalStudents: number
  activeStudents: number
  inactiveStudents: number
  totalProblemsSolved: number
  averageRating: number
  totalContests: number
}

const ManagerStudentsPage = () => {
  const { user } = useAuthStore()
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<ManagerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone_number: ''
  })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (user?.role === 'manager') {
      fetchStudents()
      fetchStats()
    }
  }, [user])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('techfolks_auth_token')
      
      const response = await fetch('http://localhost:8000/api/managers/students', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        setStudents(result.data.students)
      } else {
        toast.error('Failed to load students')
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Error loading students')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('techfolks_auth_token')
      
      const response = await fetch('http://localhost:8000/api/managers/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setAdding(true)
      const token = localStorage.getItem('techfolks_auth_token')
      
      const response = await fetch('http://localhost:8000/api/managers/students', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Student added successfully!')
        setShowAddModal(false)
        setFormData({
          username: '',
          email: '',
          password: '',
          full_name: '',
          phone_number: ''
        })
        fetchStudents()
        fetchStats()
      } else {
        toast.error(result.message || 'Failed to add student')
      }
    } catch (error) {
      console.error('Error adding student:', error)
      toast.error('Error adding student')
    } finally {
      setAdding(false)
    }
  }

  const handleToggleActive = async (studentId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('techfolks_auth_token')
      const endpoint = isActive ? 'deactivate' : 'reactivate'
      
      const response = await fetch(`http://localhost:8000/api/managers/students/${studentId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(`Student ${isActive ? 'deactivated' : 'reactivated'} successfully`)
        fetchStudents()
        fetchStats()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Error updating student status')
    }
  }

  if (user?.role !== 'manager') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600 mt-2">Only managers can access this page</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Students</h1>
              <p className="text-blue-100">Manage and track your students' progress</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Student
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total</p>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold">{stats.totalStudents}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Active</p>
              <UserCheck className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.activeStudents}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Rating</p>
              <Award className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats.averageRating}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Problems</p>
              <Code className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold">{stats.totalProblemsSolved}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Contests</p>
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold">{stats.totalContests}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Inactive</p>
              <UserX className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.inactiveStudents}</p>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Student List</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Problems
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Contests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-gray-500">Loading students...</p>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500 mb-4">No students added yet</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Your First Student
                    </button>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                          {student.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {student.full_name || student.username}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            @{student.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4 mr-2" />
                          {student.email}
                        </div>
                        {student.phone_number && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4 mr-2" />
                            {student.phone_number}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {student.rating}
                        </div>
                        <div className="text-xs text-gray-500">Max: {student.max_rating}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Code className="w-5 h-5 text-blue-500 mr-2" />
                        <span className="font-semibold">{student.problems_solved}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                        <span className="font-semibold">{student.contests_participated_count}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {student.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                          <UserX className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(student.id, student.is_active)}
                        className={`text-sm px-3 py-1 rounded-lg transition ${
                          student.is_active
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {student.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Add New Student</h2>
            
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username *</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="student_username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="student@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Alice Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1234567890"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {adding ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerStudentsPage

