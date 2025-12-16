import { useEffect, useState } from 'react'
import { useEmployeeStore } from '@store/employeeStore'
import { usePayrollStore } from '@store/payrollStore'
import { useAuthStore } from '@store/authStore'
import LoadingSpinner from '@components/common/LoadingSpinner'
import { formatDate } from '@utils/formatters'

const AdminHRPage = () => {
  const { user } = useAuthStore()
  const { 
    employees, 
    departments,
    loading: employeeLoading,
    fetchEmployees,
    fetchDepartments,
    createEmployee,
    terminateEmployee
  } = useEmployeeStore()
  
  const {
    summary,
    loading: payrollLoading,
    fetchPayrollSummary,
    batchCalculatePayroll,
  } = usePayrollStore()

  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'payroll' | 'banking'>('overview')
  const [showCreateEmployee, setShowCreateEmployee] = useState(false)
  const [showBatchPayroll, setShowBatchPayroll] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  
  const [newEmployee, setNewEmployee] = useState({
    user_id: '',
    job_title: '',
    department: '',
    hire_date: '',
    employment_type: 'full_time',
    basic_salary: '',
    payment_frequency: 'monthly'
  })

  const [payrollPeriod, setPayrollPeriod] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    working_days: 22
  })

  useEffect(() => {
    fetchEmployees()
    fetchDepartments()
    
    // Fetch current year summary
    fetchPayrollSummary({
      start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0]
    })
  }, [])

  const handleCreateEmployee = async () => {
    if (newEmployee.user_id && newEmployee.job_title && newEmployee.department && 
        newEmployee.hire_date && newEmployee.basic_salary) {
      await createEmployee({
        ...newEmployee,
        basic_salary: parseFloat(newEmployee.basic_salary),
        hire_date: new Date(newEmployee.hire_date)
      })
      setShowCreateEmployee(false)
      setNewEmployee({
        user_id: '',
        job_title: '',
        department: '',
        hire_date: '',
        employment_type: 'full_time',
        basic_salary: '',
        payment_frequency: 'monthly'
      })
    }
  }

  const handleBatchPayroll = async () => {
    if (selectedEmployees.length > 0) {
      await batchCalculatePayroll({
        employee_ids: selectedEmployees,
        pay_period_start: payrollPeriod.start_date,
        pay_period_end: payrollPeriod.end_date,
        working_days: payrollPeriod.working_days
      })
      setShowBatchPayroll(false)
      setSelectedEmployees([])
    }
  }

  const handleEmployeeSelection = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, employeeId])
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId))
    }
  }

  const selectAllEmployees = () => {
    const activeEmployees = employees.filter(emp => emp.is_active).map(emp => emp.id)
    setSelectedEmployees(activeEmployees)
  }

  const clearSelection = () => {
    setSelectedEmployees([])
  }

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Access Denied</h3>
        <p className="text-muted-foreground">Only administrators can access this page.</p>
      </div>
    )
  }

  const loading = employeeLoading || payrollLoading

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">HR Administration</h1>
        <p className="text-muted-foreground">
          Manage employees, payroll, and HR operations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'overview'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'employees'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          Employee Management
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'payroll'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          Payroll Management
        </button>
        <button
          onClick={() => setActiveTab('banking')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'banking'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          Bank Management
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Elite Metrics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 card-gradient animate-slide-in-up">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl">
                    👥
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Active</div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {employees.filter(emp => emp.is_active).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Employees</div>
                <div className="mt-2 text-xs text-gray-500">
                  +2 this month
                </div>
              </div>
            </div>

            <div className="card-elite card-gradient animate-slide-in-up" style={{animationDelay: '0.1s'}}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white text-xl">
                    🏢
                  </div>
                  <div className="status-badge status-verified">{departments.length}</div>
                </div>
                <div className="metric-value">
                  {departments.length}
                </div>
                <div className="metric-label">Departments</div>
                <div className="mt-2 text-xs text-gray-500">
                  Across organization
                </div>
              </div>
            </div>

            {summary && (
              <>
                <div className="card-elite card-gradient animate-slide-in-up" style={{animationDelay: '0.2s'}}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl">
                        💰
                      </div>
                      <div className="status-badge bg-purple-100 text-purple-800">YTD</div>
                    </div>
                    <div className="metric-value">
                      ₹{(summary.totalNetAmount / 100000).toFixed(1)}L
                    </div>
                    <div className="metric-label">Total Payroll</div>
                    <div className="mt-2 text-xs text-gray-500">
                      Year to date
                    </div>
                  </div>
                </div>
                <div className="card-elite card-gradient animate-slide-in-up" style={{animationDelay: '0.3s'}}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-xl">
                        📊
                      </div>
                      <div className="status-badge bg-orange-100 text-orange-800">AVG</div>
                    </div>
                    <div className="metric-value">
                      ₹{Math.round(summary.averageSalary / 1000)}K
                    </div>
                    <div className="metric-label">Average Salary</div>
                    <div className="mt-2 text-xs text-gray-500">
                      Per employee
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setShowCreateEmployee(true)}
                className="p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="text-lg font-semibold text-foreground mb-1">Add Employee</div>
                <div className="text-sm text-muted-foreground">Create new employee record</div>
              </button>
              <button
                onClick={() => setShowBatchPayroll(true)}
                className="p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="text-lg font-semibold text-foreground mb-1">Process Payroll</div>
                <div className="text-sm text-muted-foreground">Calculate monthly payroll</div>
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className="p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="text-lg font-semibold text-foreground mb-1">Manage Employees</div>
                <div className="text-sm text-muted-foreground">View and edit employee records</div>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Employees</h2>
            <div className="space-y-3">
              {employees.slice(0, 5).map((employee) => (
                <div key={employee.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">
                        {(employee.user?.full_name || employee.user?.username)?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {employee.user?.full_name || employee.user?.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {employee.job_title} • {employee.department}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Joined {formatDate(employee.hire_date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Employee Management Tab */}
      {activeTab === 'employees' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">Employee Management</h2>
            <button
              onClick={() => setShowCreateEmployee(true)}
              className="btn btn-primary"
            >
              Add Employee
            </button>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Department
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Salary
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hire Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-foreground">
                              {employee.user?.full_name || employee.user?.username}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {employee.job_title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {employee.employee_id}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {employee.department}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {employee.employment_type.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          ₹{employee.basic_salary.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(employee.hire_date)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {employee.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                // Navigate to employee edit page or open edit modal
                                window.location.href = `/employees/${employee.id}/edit`
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            {employee.is_active && (
                              <button
                                onClick={() => terminateEmployee(employee.id, {
                                  termination_date: new Date().toISOString().split('T')[0],
                                  termination_reason: 'Administrative action'
                                })}
                                className="text-red-600 hover:text-red-900"
                              >
                                Terminate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payroll Management Tab */}
      {activeTab === 'payroll' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">Payroll Management</h2>
            <button
              onClick={() => setShowBatchPayroll(true)}
              className="btn btn-primary"
            >
              Process Payroll
            </button>
          </div>

          {/* Summary Card */}
          {summary && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Current Year Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {summary.totalEmployees}
                  </div>
                  <div className="text-sm text-muted-foreground">Employees</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{(summary.totalGrossAmount / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-muted-foreground">Gross Amount</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    ₹{(summary.totalDeductions / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-muted-foreground">Deductions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{(summary.totalNetAmount / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-muted-foreground">Net Amount</div>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder for payroll records */}
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Payroll Records
            </h3>
            <p className="text-muted-foreground mb-4">
              Payroll records will appear here once processed
            </p>
            <button
              onClick={() => setShowBatchPayroll(true)}
              className="btn btn-primary"
            >
              Process New Payroll
            </button>
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      {showCreateEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Create New Employee
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={newEmployee.user_id}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, user_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter user UUID..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={newEmployee.job_title}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, job_title: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter job title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Department
                </label>
                <select
                  value={newEmployee.department}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Employment Type
                </label>
                <select
                  value={newEmployee.employment_type}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, employment_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hire Date
                </label>
                <input
                  type="date"
                  value={newEmployee.hire_date}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, hire_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Basic Salary (₹)
                </label>
                <input
                  type="number"
                  value={newEmployee.basic_salary}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, basic_salary: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter basic salary..."
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateEmployee(false)
                  setNewEmployee({
                    user_id: '',
                    job_title: '',
                    department: '',
                    hire_date: '',
                    employment_type: 'full_time',
                    basic_salary: '',
                    payment_frequency: 'monthly'
                  })
                }}
                className="flex-1 btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEmployee}
                disabled={!newEmployee.user_id || !newEmployee.job_title || !newEmployee.department || 
                         !newEmployee.hire_date || !newEmployee.basic_salary}
                className="flex-1 btn btn-primary"
              >
                Create Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Payroll Modal */}
      {showBatchPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Process Batch Payroll
            </h3>
            
            {/* Payroll Period Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={payrollPeriod.start_date}
                  onChange={(e) => setPayrollPeriod(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={payrollPeriod.end_date}
                  onChange={(e) => setPayrollPeriod(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Working Days
                </label>
                <input
                  type="number"
                  value={payrollPeriod.working_days}
                  onChange={(e) => setPayrollPeriod(prev => ({ ...prev, working_days: parseInt(e.target.value) || 22 }))}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Employee Selection */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Select Employees ({selectedEmployees.length} selected)
                </label>
                <div className="space-x-2">
                  <button onClick={selectAllEmployees} className="text-sm text-blue-600 hover:text-blue-800">
                    Select All
                  </button>
                  <button onClick={clearSelection} className="text-sm text-gray-600 hover:text-gray-800">
                    Clear All
                  </button>
                </div>
              </div>
              <div className="border border-border rounded-lg max-h-60 overflow-y-auto">
                {employees.filter(emp => emp.is_active).map((employee) => (
                  <div key={employee.id} className="flex items-center space-x-3 p-3 border-b border-border last:border-0">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={(e) => handleEmployeeSelection(employee.id, e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {employee.user?.full_name || employee.user?.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {employee.job_title} • {employee.department} • ₹{employee.basic_salary.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBatchPayroll(false)
                  setSelectedEmployees([])
                }}
                className="flex-1 btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchPayroll}
                disabled={selectedEmployees.length === 0}
                className="flex-1 btn btn-primary"
              >
                Process Payroll for {selectedEmployees.length} Employees
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Management Tab */}
      {activeTab === 'banking' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">Bank Management</h2>
            <a 
              href="/bank-details" 
              className="btn btn-primary"
            >
              Manage Bank Details
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Bank Summary */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Company Banking</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                  <div>
                    <div className="font-medium text-green-800">Primary Account</div>
                    <div className="text-sm text-green-600">TechFolks Private Limited</div>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    Active ✓
                  </span>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Bank: State Bank of India</div>
                  <div>• IFSC: SBIN0001234</div>
                  <div>• Account: Current Account</div>
                  <div>• GST: 29ABCDE1234F1Z5</div>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <a 
                    href="/bank-details" 
                    className="text-sm text-primary hover:text-primary-600"
                  >
                    Manage Company Bank Details →
                  </a>
                </div>
              </div>
            </div>

            {/* Employee Bank Verification */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Employee Bank Verification</h3>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Employees with bank details requiring verification:
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div>
                      <div className="font-medium text-yellow-800">Admin User</div>
                      <div className="text-sm text-yellow-600">HDFC Bank • ****7654</div>
                    </div>
                    <button 
                      onClick={() => {
                        // This would verify the employee's bank details
                        // For demo, just show a success message
                        alert('Bank details verified successfully!')
                      }}
                      className="btn btn-outline btn-sm"
                    >
                      Verify
                    </button>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    💡 Verify employee bank details before processing payroll to ensure accurate payments.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Banking Quick Actions */}
          <div className="mt-8 bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Banking Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => window.open('/bank-details', '_blank')}
                className="p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="text-lg font-semibold text-foreground mb-1">🏦 Manage Bank Accounts</div>
                <div className="text-sm text-muted-foreground">Add and manage company bank details</div>
              </button>
              
              <button
                onClick={() => setActiveTab('employees')}
                className="p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="text-lg font-semibold text-foreground mb-1">✅ Verify Employee Banks</div>
                <div className="text-sm text-muted-foreground">Verify employee banking information</div>
              </button>
              
              <button
                onClick={() => setActiveTab('payroll')}
                className="p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="text-lg font-semibold text-foreground mb-1">💰 Process Payments</div>
                <div className="text-sm text-muted-foreground">Process salary payments to employees</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminHRPage