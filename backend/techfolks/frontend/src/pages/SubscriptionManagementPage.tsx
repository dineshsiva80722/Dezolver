import { useEffect, useState } from 'react'
import { useAuthStore } from '@store/authStore'
import DashboardCard from '@components/common/DashboardCard'
import LoadingSpinner from '@components/common/LoadingSpinner'

const SubscriptionManagementPage = () => {
  const { user } = useAuthStore()
  const [subscriptionData, setSubscriptionData] = useState({
    currentPlan: 'professional',
    status: 'active',
    userLimit: 100,
    currentUsers: 2,
    monthlyPrice: 9999,
    billingCycle: 'monthly',
    nextBillingDate: '2024-10-11',
    daysUntilRenewal: 25
  })
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('enterprise')
  const [loading, setLoading] = useState(false)

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 2999,
      users: 25,
      managers: 1,
      features: ['HR Management', 'Certificate Automation', 'Basic Analytics'],
      color: 'blue',
      description: 'Perfect for small teams starting their HR journey'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 9999,
      users: 100,
      managers: 3,
      features: ['All Starter features', 'Payroll Processing', 'Advanced Analytics', 'Priority Support'],
      color: 'green',
      popular: true,
      description: 'Most popular for growing companies'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 24999,
      users: 500,
      managers: 10,
      features: ['All Professional features', 'API Access', 'Custom Branding', 'SSO Integration', 'Bulk Operations'],
      color: 'purple',
      description: 'Advanced features for large organizations'
    },
    {
      id: 'unlimited',
      name: 'Unlimited',
      price: 49999,
      users: -1,
      managers: -1,
      features: ['Everything Included', 'Unlimited Users', 'White-label Solution', 'Dedicated Support'],
      color: 'orange',
      description: 'Complete solution for enterprises'
    }
  ]

  const handleUpgradePlan = async () => {
    setLoading(true)
    try {
      // This would call the upgrade API
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      setSubscriptionData(prev => ({ ...prev, currentPlan: selectedPlan }))
      setShowUpgrade(false)
    } catch (error) {
      console.error('Failed to upgrade plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentPlan = () => plans.find(plan => plan.id === subscriptionData.currentPlan)

  const isUpgrade = (planId: string) => {
    const planOrder = ['starter', 'professional', 'enterprise', 'unlimited']
    const currentIndex = planOrder.indexOf(subscriptionData.currentPlan)
    const targetIndex = planOrder.indexOf(planId)
    return targetIndex > currentIndex
  }

  // Only managers and platform admins can access
  if (user?.tier !== 'manager' && user?.tier !== 'platform') {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">Only organization managers can access subscription management.</p>
      </div>
    )
  }

  const currentPlan = getCurrentPlan()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <span className="mr-3">💳</span>
            Subscription Management
          </h1>
          <p className="text-indigo-100 text-lg">
            Manage your organization's plan and billing
          </p>
          
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold capitalize">{currentPlan?.name}</div>
              <div className="text-sm text-indigo-100">Current Plan</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">{subscriptionData.currentUsers}/{subscriptionData.userLimit}</div>
              <div className="text-sm text-indigo-100">Users</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">₹{subscriptionData.monthlyPrice.toLocaleString()}</div>
              <div className="text-sm text-indigo-100">Monthly</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-xl font-bold">{subscriptionData.daysUntilRenewal}</div>
              <div className="text-sm text-indigo-100">Days Left</div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Subscription */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Current Subscription</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold capitalize">{currentPlan?.name} Plan</h3>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Active</span>
              </div>
              <div className="text-3xl font-bold mb-2">₹{subscriptionData.monthlyPrice.toLocaleString()}</div>
              <div className="text-green-100 mb-4">per month</div>
              
              <div className="space-y-2">
                {currentPlan?.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-green-100">
                    <span className="text-white">✅</span>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => setShowUpgrade(true)}
              className="w-full btn btn-primary"
            >
              🚀 Upgrade Plan
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Usage Overview</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>User Capacity</span>
                    <span>{subscriptionData.currentUsers}/{subscriptionData.userLimit} users</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${(subscriptionData.currentUsers / subscriptionData.userLimit) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {subscriptionData.userLimit - subscriptionData.currentUsers} slots remaining
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="text-lg font-bold text-blue-600">5</div>
                    <div className="text-xs text-blue-700 dark:text-blue-400">Certificates This Month</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <div className="text-lg font-bold text-purple-600">3</div>
                    <div className="text-xs text-purple-700 dark:text-purple-400">Payroll Cycles</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Billing Information</h4>
              <div className="space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
                <div>Next billing: {subscriptionData.nextBillingDate}</div>
                <div>Billing cycle: {subscriptionData.billingCycle}</div>
                <div>Auto-renewal: Enabled</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Upgrade Your Plan
                </h3>
                <button
                  onClick={() => setShowUpgrade(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative rounded-xl p-6 border-2 transition-all duration-200 cursor-pointer ${
                      selectedPlan === plan.id
                        ? 'border-primary bg-primary/5'
                        : plan.id === subscriptionData.currentPlan
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    {plan.id === subscriptionData.currentPlan && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                          Current
                        </span>
                      </div>
                    )}

                    <div className="text-center">
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {plan.name}
                      </h4>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        ₹{plan.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        per month
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        <div className="text-sm">
                          <span className="font-semibold">{plan.users === -1 ? 'Unlimited' : plan.users}</span> users
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold">{plan.managers === -1 ? 'Unlimited' : plan.managers}</span> managers
                        </div>
                      </div>

                      <div className="space-y-2 text-left mb-6">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <span className="text-green-500">✅</span>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      {plan.id !== subscriptionData.currentPlan && (
                        <div className="text-xs text-gray-500 mb-4">
                          {isUpgrade(plan.id) ? '⬆️ Upgrade' : '⬇️ Downgrade'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedPlan !== subscriptionData.currentPlan && (
                <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-4">
                    Plan Change Summary
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span>Current Plan:</span>
                          <span className="font-medium capitalize">{subscriptionData.currentPlan}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>New Plan:</span>
                          <span className="font-medium capitalize">{selectedPlan}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price Change:</span>
                          <span className="font-medium">
                            ₹{(plans.find(p => p.id === selectedPlan)?.price || 0) - subscriptionData.monthlyPrice > 0 ? '+' : ''}
                            {((plans.find(p => p.id === selectedPlan)?.price || 0) - subscriptionData.monthlyPrice).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span>User Limit:</span>
                          <span className="font-medium">
                            {subscriptionData.userLimit} → {plans.find(p => p.id === selectedPlan)?.users === -1 ? 'Unlimited' : plans.find(p => p.id === selectedPlan)?.users}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Effective Date:</span>
                          <span className="font-medium">Immediately</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Next Billing:</span>
                          <span className="font-medium">{subscriptionData.nextBillingDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={() => setShowUpgrade(false)}
                  className="btn btn-outline"
                  disabled={loading}
                >
                  Cancel
                </button>
                {selectedPlan !== subscriptionData.currentPlan && (
                  <button
                    onClick={handleUpgradePlan}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Processing...' : `${isUpgrade(selectedPlan) ? 'Upgrade' : 'Change'} to ${plans.find(p => p.id === selectedPlan)?.name}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          title="User Utilization"
          subtitle="License usage tracking"
          value={`${Math.round((subscriptionData.currentUsers / subscriptionData.userLimit) * 100)}%`}
          icon="👥"
          gradient="blue"
        >
          <div className="space-y-2">
            <div className="text-xs">
              {subscriptionData.currentUsers} of {subscriptionData.userLimit} users active
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${(subscriptionData.currentUsers / subscriptionData.userLimit) * 100}%` }}
              />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Billing Status"
          subtitle="Payment and renewal"
          value={subscriptionData.status.toUpperCase()}
          icon="💳"
          gradient="green"
        >
          <div className="space-y-1">
            <div className="text-xs">Next billing: {subscriptionData.nextBillingDate}</div>
            <div className="text-xs">Auto-renewal: Enabled</div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Feature Usage"
          subtitle="Monthly consumption"
          value="24 Actions"
          icon="📊"
          gradient="purple"
        >
          <div className="space-y-1">
            <div className="text-xs">Certificates: 5 generated</div>
            <div className="text-xs">Payroll: 3 cycles processed</div>
          </div>
        </DashboardCard>
      </div>

      {/* Billing History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Billing History</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 text-sm">Sep 11, 2024</td>
                <td className="px-6 py-4 text-sm">Professional Plan - Monthly</td>
                <td className="px-6 py-4 text-sm font-medium">₹9,999</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Paid
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-blue-600 hover:text-blue-800">Download</button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 text-sm">Aug 11, 2024</td>
                <td className="px-6 py-4 text-sm">Professional Plan - Monthly</td>
                <td className="px-6 py-4 text-sm font-medium">₹9,999</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Paid
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-blue-600 hover:text-blue-800">Download</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Support & Contact */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">📞</span>
          Support & Billing Contact
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-lg font-semibold mb-2">Billing Support</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div>📧 billing@techfolks.com</div>
              <div>📞 +91-9876543210</div>
              <div>🕒 Mon-Fri, 9 AM - 6 PM IST</div>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-lg font-semibold mb-2">Technical Support</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div>📧 support@techfolks.com</div>
              <div>💬 Live Chat (Available)</div>
              <div>📚 Help Center</div>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-lg font-semibold mb-2">Account Manager</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div>👤 Dedicated for Enterprise+</div>
              <div>📧 success@techfolks.com</div>
              <div>🎯 Business growth consultation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionManagementPage