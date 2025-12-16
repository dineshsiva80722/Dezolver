import { useEffect, useState } from 'react'
import { useAuthStore } from '@store/authStore'
import { useEmployeeStore } from '@store/employeeStore'
import LoadingSpinner from '@components/common/LoadingSpinner'

const BankDetailsPage = () => {
  const { user } = useAuthStore()
  const { myEmployee, fetchMyEmployee, fetchEmployeeByUserId, updateEmployee } = useEmployeeStore()
  
  const [activeTab, setActiveTab] = useState<'my-details' | 'company-details'>('my-details')
  const [editingMyDetails, setEditingMyDetails] = useState(false)
  const [companyBankDetails, setCompanyBankDetails] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const [myBankForm, setMyBankForm] = useState({
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    branch_name: '',
    branch_address: '',
    account_holder_name: '',
    account_type: 'savings',
    micr_code: '',
    upi_id: '',
    nominee_name: '',
    nominee_relation: ''
  })

  const [companyBankForm, setCompanyBankForm] = useState({
    company_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    branch_name: '',
    branch_address: '',
    account_type: 'current',
    gst_number: '',
    pan_number: '',
    swift_code: '',
    company_registration_number: ''
  })

  const [showAddCompanyBank, setShowAddCompanyBank] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (user?.role === 'super_admin' && user?.id) {
      fetchEmployeeByUserId(user.id)
    } else {
      fetchMyEmployee()
      if (user?.role === 'admin') {
        fetchCompanyBankDetails()
      }
    }
  }, [fetchMyEmployee, fetchEmployeeByUserId, user?.role, user?.id])

  useEffect(() => {
    if (myEmployee?.bank_details) {
      setMyBankForm({
        account_number: myEmployee.bank_details.account_number || '',
        ifsc_code: myEmployee.bank_details.ifsc_code || '',
        bank_name: myEmployee.bank_details.bank_name || '',
        branch_name: myEmployee.bank_details.branch_name || '',
        branch_address: myEmployee.bank_details.branch_address || '',
        account_holder_name: myEmployee.bank_details.account_holder_name || '',
        account_type: myEmployee.bank_details.account_type || 'savings',
        micr_code: myEmployee.bank_details.micr_code || '',
        upi_id: myEmployee.bank_details.upi_id || '',
        nominee_name: myEmployee.bank_details.nominee_name || '',
        nominee_relation: myEmployee.bank_details.nominee_relation || ''
      })
    }
  }, [myEmployee])

  const fetchCompanyBankDetails = async () => {
    try {
      setLoading(true)
      // This will be implemented with the API call
      setCompanyBankDetails([])
    } catch (error) {
      console.error('Failed to fetch company bank details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMyBankDetails = async () => {
    if (!myEmployee) return

    setLoading(true)
    setErrors([])

    try {
      await updateEmployee(myEmployee.id, {
        bank_details: myBankForm
      })
      setEditingMyDetails(false)
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      } else {
        setErrors(['Failed to update bank details'])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddCompanyBank = async () => {
    setLoading(true)
    setErrors([])

    try {
      // This will be implemented with the company bank API
      setShowAddCompanyBank(false)
      await fetchCompanyBankDetails()
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      } else {
        setErrors(['Failed to add company bank details'])
      }
    } finally {
      setLoading(false)
    }
  }

  const getBankStatusBadge = (bankDetails: any) => {
    if (bankDetails?.is_verified) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Verified ✓</span>
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending Verification</span>
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Bank Details Management</h1>
        <p className="text-muted-foreground">
          Manage employee and company banking information for payroll processing
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('my-details')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'my-details'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          My Bank Details
        </button>
        {user?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('company-details')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'company-details'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            Company Bank Details
          </button>
        )}
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-medium text-red-800 mb-2">Validation Errors:</h4>
          <ul className="text-sm text-red-700 list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          <button
            onClick={() => setErrors([])}
            className="mt-2 text-sm text-red-600 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* My Bank Details Tab */}
      {activeTab === 'my-details' && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">My Bank Details</h2>
            {myEmployee?.bank_details && !editingMyDetails && (
              <div className="flex items-center space-x-2">
                {getBankStatusBadge(myEmployee.bank_details)}
                <button
                  onClick={() => setEditingMyDetails(true)}
                  className="btn btn-outline btn-sm"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {!myEmployee ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👤</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Employee Profile</h3>
              <p className="text-muted-foreground">
                You need an employee profile to add bank details.
              </p>
            </div>
          ) : !myEmployee.bank_details && !editingMyDetails ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏦</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Bank Details</h3>
              <p className="text-muted-foreground mb-4">
                Add your bank details to receive salary payments.
              </p>
              <button
                onClick={() => setEditingMyDetails(true)}
                className="btn btn-primary"
              >
                Add Bank Details
              </button>
            </div>
          ) : editingMyDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    value={myBankForm.account_holder_name}
                    onChange={(e) => setMyBankForm(prev => ({ ...prev, account_holder_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Full name as per bank records"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={myBankForm.account_number}
                    onChange={(e) => setMyBankForm(prev => ({ ...prev, account_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Bank account number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    value={myBankForm.ifsc_code}
                    onChange={(e) => setMyBankForm(prev => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="SBIN0001234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    value={myBankForm.bank_name}
                    onChange={(e) => setMyBankForm(prev => ({ ...prev, bank_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="State Bank of India"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={myBankForm.branch_name}
                    onChange={(e) => setMyBankForm(prev => ({ ...prev, branch_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Main Branch"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Account Type
                  </label>
                  <select
                    value={myBankForm.account_type}
                    onChange={(e) => setMyBankForm(prev => ({ ...prev, account_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="savings">Savings Account</option>
                    <option value="current">Current Account</option>
                    <option value="salary">Salary Account</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    MICR Code
                  </label>
                  <input
                    type="text"
                    value={myBankForm.micr_code}
                    onChange={(e) => setMyBankForm(prev => ({ ...prev, micr_code: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="560002002"
                    maxLength={9}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={myBankForm.upi_id}
                    onChange={(e) => setMyBankForm(prev => ({ ...prev, upi_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="username@paytm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Branch Address
                  </label>
                  <textarea
                    value={myBankForm.branch_address}
                    onChange={(e) => setMyBankForm(prev => ({ ...prev, branch_address: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    placeholder="Complete branch address"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nominee Name
                    </label>
                    <input
                      type="text"
                      value={myBankForm.nominee_name}
                      onChange={(e) => setMyBankForm(prev => ({ ...prev, nominee_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Nominee full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nominee Relation
                    </label>
                    <select
                      value={myBankForm.nominee_relation}
                      onChange={(e) => setMyBankForm(prev => ({ ...prev, nominee_relation: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Relation</option>
                      <option value="spouse">Spouse</option>
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="son">Son</option>
                      <option value="daughter">Daughter</option>
                      <option value="brother">Brother</option>
                      <option value="sister">Sister</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setEditingMyDetails(false)
                    setErrors([])
                  }}
                  className="btn btn-outline"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateMyBankDetails}
                  disabled={loading || !myBankForm.account_number || !myBankForm.ifsc_code || 
                           !myBankForm.bank_name || !myBankForm.account_holder_name}
                  className="btn btn-primary"
                >
                  {loading ? 'Saving...' : 'Save Bank Details'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Account Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Holder:</span>
                      <span className="font-medium">{myEmployee.bank_details.account_holder_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Number:</span>
                      <span className="font-medium font-mono">
                        ****{myEmployee.bank_details.account_number?.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IFSC Code:</span>
                      <span className="font-medium">{myEmployee.bank_details.ifsc_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Type:</span>
                      <span className="font-medium capitalize">
                        {myEmployee.bank_details.account_type || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Bank Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank Name:</span>
                      <span className="font-medium">{myEmployee.bank_details.bank_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Branch:</span>
                      <span className="font-medium">{myEmployee.bank_details.branch_name || 'Not specified'}</span>
                    </div>
                    {myEmployee.bank_details.upi_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">UPI ID:</span>
                        <span className="font-medium">{myEmployee.bank_details.upi_id}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      {getBankStatusBadge(myEmployee.bank_details)}
                    </div>
                  </div>
                </div>
              </div>

              {myEmployee.bank_details.nominee_name && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Nominee Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nominee Name:</span>
                      <span className="font-medium">{myEmployee.bank_details.nominee_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Relation:</span>
                      <span className="font-medium capitalize">{myEmployee.bank_details.nominee_relation}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Company Bank Details Tab */}
      {activeTab === 'company-details' && user?.role === 'admin' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">Company Bank Details</h2>
            <button
              onClick={() => setShowAddCompanyBank(true)}
              className="btn btn-primary"
            >
              Add Bank Account
            </button>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : companyBankDetails.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Company Bank Details</h3>
              <p className="text-muted-foreground mb-4">
                Add company bank details for payroll processing and payments.
              </p>
              <button
                onClick={() => setShowAddCompanyBank(true)}
                className="btn btn-primary"
              >
                Add First Bank Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {companyBankDetails.map((bank) => (
                <div key={bank.id} className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{bank.company_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {bank.account_holder_name} • {bank.bank_name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {bank.is_primary && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          Primary
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        bank.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {bank.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Account:</span>
                      <span className="font-medium ml-2">****{bank.account_number?.slice(-4)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">IFSC:</span>
                      <span className="font-medium ml-2">{bank.ifsc_code}</span>
                    </div>
                    {bank.gst_number && (
                      <div>
                        <span className="text-muted-foreground">GST:</span>
                        <span className="font-medium ml-2">{bank.gst_number}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 mt-4">
                    {!bank.is_primary && (
                      <button className="btn btn-outline btn-sm">
                        Set as Primary
                      </button>
                    )}
                    <button className="btn btn-outline btn-sm">
                      Edit
                    </button>
                    <button className="btn btn-outline btn-sm">
                      Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Company Bank Modal */}
      {showAddCompanyBank && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Add Company Bank Details
            </h3>

            <div className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Company Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={companyBankForm.company_name}
                      onChange={(e) => setCompanyBankForm(prev => ({ ...prev, company_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="TechFolks Private Limited"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      value={companyBankForm.account_holder_name}
                      onChange={(e) => setCompanyBankForm(prev => ({ ...prev, account_holder_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Company name as per bank"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      value={companyBankForm.pan_number}
                      onChange={(e) => setCompanyBankForm(prev => ({ ...prev, pan_number: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      GST Number
                    </label>
                    <input
                      type="text"
                      value={companyBankForm.gst_number}
                      onChange={(e) => setCompanyBankForm(prev => ({ ...prev, gst_number: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="29ABCDE1234F1Z5"
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>

              {/* Bank Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Bank Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      value={companyBankForm.account_number}
                      onChange={(e) => setCompanyBankForm(prev => ({ ...prev, account_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Bank account number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      IFSC Code *
                    </label>
                    <input
                      type="text"
                      value={companyBankForm.ifsc_code}
                      onChange={(e) => setCompanyBankForm(prev => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="SBIN0001234"
                      maxLength={11}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      value={companyBankForm.bank_name}
                      onChange={(e) => setCompanyBankForm(prev => ({ ...prev, bank_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="State Bank of India"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      value={companyBankForm.branch_name}
                      onChange={(e) => setCompanyBankForm(prev => ({ ...prev, branch_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Main Branch"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Account Type
                    </label>
                    <select
                      value={companyBankForm.account_type}
                      onChange={(e) => setCompanyBankForm(prev => ({ ...prev, account_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="current">Current Account</option>
                      <option value="savings">Savings Account</option>
                      <option value="business">Business Account</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      SWIFT Code
                    </label>
                    <input
                      type="text"
                      value={companyBankForm.swift_code}
                      onChange={(e) => setCompanyBankForm(prev => ({ ...prev, swift_code: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="SBININBB123"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Branch Address
                  </label>
                  <textarea
                    value={companyBankForm.branch_address}
                    onChange={(e) => setCompanyBankForm(prev => ({ ...prev, branch_address: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    placeholder="Complete branch address"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddCompanyBank(false)
                  setErrors([])
                }}
                className="flex-1 btn btn-outline"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCompanyBank}
                disabled={loading || !companyBankForm.company_name || !companyBankForm.account_number || 
                         !companyBankForm.ifsc_code || !companyBankForm.bank_name}
                className="flex-1 btn btn-primary"
              >
                {loading ? 'Adding...' : 'Add Bank Details'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BankDetailsPage
