import { useEffect, useState } from 'react'
import { useEmployeeStore } from '@store/employeeStore'
import { useAuthStore } from '@store/authStore'
import LoadingSpinner from '@components/common/LoadingSpinner'
import { formatDate } from '@utils/formatters'

const EmployeesPage = () => {
  const { user } = useAuthStore()
  const { 
    employees,
    myEmployee,
    departments,
    loading,
    error,
    fetchEmployees,
    fetchMyEmployee,
    fetchDepartments,
    searchEmployees,
    clearError
  } = useEmployeeStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [activeTab, setActiveTab] = useState<'my-profile' | 'directory'>('my-profile')
  const [searchResults, setSearchResults] = useState<any[]>([])

  useEffect(() => {
    fetchMyEmployee()
    fetchDepartments()
    if (user?.role === 'admin') {
      fetchEmployees()
    }
  }, [fetchMyEmployee, fetchDepartments, fetchEmployees, user?.role])

  const handleSearch = async () => {
    if (!searchQuery.trim() && !selectedDepartment) {
      setSearchResults([])
      return
    }

    const results = await searchEmployees({
      query: searchQuery.trim() || undefined,
      department: selectedDepartment || undefined,
      is_active: true,
      limit: 20
    })
    setSearchResults(results)
  }

  useEffect(() => {
    if (activeTab === 'directory') {
      handleSearch()
    }
  }, [searchQuery, selectedDepartment, activeTab])

  const getEmploymentTypeBadge = (type: string) => {
    const colors = {
      full_time: 'bg-green-100 text-green-800',
      part_time: 'bg-blue-100 text-blue-800',
      contract: 'bg-purple-100 text-purple-800',
      intern: 'bg-yellow-100 text-yellow-800'
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {type.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Employees</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Manage employee records and directory' : 'View your employee profile and company directory'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('my-profile')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'my-profile'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          My Profile
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'directory'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          Employee Directory
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
          <button onClick={clearError} className="ml-2 underline text-sm">
            Dismiss
          </button>
        </div>
      )}

      {/* My Profile Tab */}
      {activeTab === 'my-profile' && (
        <div>
          {loading ? (
            <LoadingSpinner />
          ) : myEmployee ? (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-1">
                    {myEmployee.user?.full_name || myEmployee.user?.username}
                  </h2>
                  <p className="text-lg text-muted-foreground">{myEmployee.job_title}</p>
                  <p className="text-sm text-muted-foreground">ID: {myEmployee.employee_id}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getEmploymentTypeBadge(myEmployee.employment_type)}
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    myEmployee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {myEmployee.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Employment Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Department:</span>
                        <span className="font-medium">{myEmployee.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hire Date:</span>
                        <span className="font-medium">{formatDate(myEmployee.hire_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Employment Type:</span>
                        <span className="font-medium">{myEmployee.employment_type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Frequency:</span>
                        <span className="font-medium">{myEmployee.payment_frequency}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{myEmployee.user?.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Username:</span>
                        <span className="font-medium">{myEmployee.user?.username}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Compensation</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Basic Salary:</span>
                        <span className="font-medium">₹{myEmployee.basic_salary?.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Work Hours/Week:</span>
                        <span className="font-medium">{myEmployee.work_hours_per_week} hours</span>
                      </div>
                    </div>
                  </div>

                  {myEmployee.manager && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Reporting</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reports to:</span>
                          <span className="font-medium">
                            {myEmployee.manager.user?.full_name || myEmployee.manager.user?.username}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👤</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No employee profile found
              </h3>
              <p className="text-muted-foreground">
                You don't have an employee record in the system yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Employee Directory Tab */}
      {activeTab === 'directory' && (
        <div>
          {/* Search Filters */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search employees by name, title, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="md:w-48">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(searchResults.length > 0 ? searchResults : employees).map((employee) => (
                <div
                  key={employee.id}
                  className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {employee.user?.full_name || employee.user?.username}
                      </h3>
                      <p className="text-sm text-muted-foreground">{employee.job_title}</p>
                      <p className="text-xs text-muted-foreground">ID: {employee.employee_id}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {getEmploymentTypeBadge(employee.employment_type)}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department:</span>
                      <span className="font-medium">{employee.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hire Date:</span>
                      <span className="font-medium">{formatDate(employee.hire_date)}</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="mt-4 pt-3 border-t border-border">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            // Navigate to employee details page
                            window.location.href = `/employees/${employee.id}`
                          }}
                          className="flex-1 btn btn-outline btn-sm"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => {
                            // Navigate to employee edit page
                            window.location.href = `/employees/${employee.id}/edit`
                          }}
                          className="flex-1 btn btn-primary btn-sm"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && searchResults.length === 0 && employees.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No employees found
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedDepartment ? 'Try adjusting your search criteria.' : 'No employee records available.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EmployeesPage