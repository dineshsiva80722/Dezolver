import { useEffect, useState } from 'react'
import { usePayrollStore } from '@store/payrollStore'
import { useEmployeeStore } from '@store/employeeStore'
import { useAuthStore } from '@store/authStore'
import LoadingSpinner from '@components/common/LoadingSpinner'
import { formatDate } from '@utils/formatters'

const PayrollPage = () => {
  const { user } = useAuthStore()
  const { 
    myPayrolls,
    summary,
    loading,
    error,
    fetchMyPayrolls,
    fetchPayrollSummary,
    downloadSalarySlip,
    clearError
  } = usePayrollStore()

  const [activeTab, setActiveTab] = useState<'my-payrolls' | 'summary'>('my-payrolls')
  const [summaryPeriod, setSummaryPeriod] = useState({
    start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
    end_date: new Date().toISOString().split('T')[0] // Today
  })

  useEffect(() => {
    if (activeTab === 'my-payrolls') {
      fetchMyPayrolls()
    }
  }, [activeTab, fetchMyPayrolls])

  useEffect(() => {
    if (activeTab === 'summary' && user?.role === 'admin') {
      fetchPayrollSummary(summaryPeriod)
    }
  }, [activeTab, summaryPeriod, fetchPayrollSummary, user?.role])

  const handleDownloadSlip = (payrollId: string) => {
    downloadSalarySlip(payrollId)
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      processed: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Payroll</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Manage payroll records and view summaries' : 'View your salary history and download pay slips'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('my-payrolls')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'my-payrolls'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          My Payrolls
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'summary'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            Payroll Summary
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
          <button onClick={clearError} className="ml-2 underline text-sm">
            Dismiss
          </button>
        </div>
      )}

      {/* My Payrolls Tab */}
      {activeTab === 'my-payrolls' && (
        <div>
          {loading ? (
            <LoadingSpinner />
          ) : myPayrolls.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No payroll records yet
              </h3>
              <p className="text-muted-foreground">
                Your payroll records will appear here once processed by HR.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myPayrolls.map((payroll) => (
                <div
                  key={payroll.id}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {formatDate(payroll.pay_period_start)} - {formatDate(payroll.pay_period_end)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Payroll ID: {payroll.payroll_id}
                      </p>
                    </div>
                    {getStatusBadge(payroll.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm text-blue-600 mb-1">Gross Salary</div>
                      <div className="text-lg font-semibold text-blue-900">
                        ₹{payroll.gross_salary.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-sm text-red-600 mb-1">Deductions</div>
                      <div className="text-lg font-semibold text-red-900">
                        ₹{payroll.total_deductions.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm text-green-600 mb-1">Net Salary</div>
                      <div className="text-lg font-semibold text-green-900">
                        ₹{payroll.net_salary.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Days Worked</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {payroll.days_worked}/{payroll.working_days}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-4">
                    <div>
                      <strong>Basic Salary:</strong> ₹{payroll.basic_salary.toLocaleString('en-IN')}
                    </div>
                    {payroll.overtime_hours > 0 && (
                      <div>
                        <strong>Overtime Hours:</strong> {payroll.overtime_hours}
                      </div>
                    )}
                    {payroll.leave_days > 0 && (
                      <div>
                        <strong>Leave Days:</strong> {payroll.leave_days}
                      </div>
                    )}
                  </div>

                  {payroll.payment_date && (
                    <div className="text-sm text-muted-foreground mb-4">
                      <strong>Payment Date:</strong> {formatDate(payroll.payment_date)}
                      {payroll.payment_reference && (
                        <span className="ml-4">
                          <strong>Reference:</strong> {payroll.payment_reference}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {payroll.salary_slip_url ? (
                      <button
                        onClick={() => handleDownloadSlip(payroll.id)}
                        className="btn btn-primary"
                      >
                        Download Salary Slip
                      </button>
                    ) : (
                      <button
                        disabled
                        className="btn btn-outline opacity-50 cursor-not-allowed"
                      >
                        Salary Slip Not Ready
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        // Show detailed payroll breakdown
                        alert(`Payroll Details:\nGross: ₹${payroll.gross_salary.toLocaleString()}\nDeductions: ₹${payroll.total_deductions.toLocaleString()}\nNet: ₹${payroll.net_salary.toLocaleString()}`)
                      }}
                      className="btn btn-outline"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payroll Summary Tab (Admin Only) */}
      {activeTab === 'summary' && isAdmin && (
        <div>
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Filter Period</h2>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={summaryPeriod.start_date}
                  onChange={(e) => setSummaryPeriod(prev => ({ ...prev, start_date: e.target.value }))}
                  className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={summaryPeriod.end_date}
                  onChange={(e) => setSummaryPeriod(prev => ({ ...prev, end_date: e.target.value }))}
                  className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : summary ? (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="text-sm text-blue-600 mb-2">Total Employees</div>
                  <div className="text-3xl font-bold text-blue-900">{summary.totalEmployees}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="text-sm text-green-600 mb-2">Total Gross Amount</div>
                  <div className="text-3xl font-bold text-green-900">
                    ₹{summary.totalGrossAmount.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="text-sm text-red-600 mb-2">Total Deductions</div>
                  <div className="text-3xl font-bold text-red-900">
                    ₹{summary.totalDeductions.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="text-sm text-purple-600 mb-2">Total Net Amount</div>
                  <div className="text-3xl font-bold text-purple-900">
                    ₹{summary.totalNetAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Additional Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Average Salary:</span>
                    <span className="font-semibold">₹{summary.averageSalary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Avg. Deduction Rate:</span>
                    <span className="font-semibold">
                      {((summary.totalDeductions / summary.totalGrossAmount) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Department Breakdown */}
              {summary.departmentBreakdown && Object.keys(summary.departmentBreakdown).length > 0 && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Department Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(summary.departmentBreakdown).map(([dept, amount]) => (
                      <div key={dept} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                        <span className="text-muted-foreground">{dept}:</span>
                        <span className="font-semibold">₹{amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No payroll data available
              </h3>
              <p className="text-muted-foreground">
                Select a date range to view payroll summary.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PayrollPage