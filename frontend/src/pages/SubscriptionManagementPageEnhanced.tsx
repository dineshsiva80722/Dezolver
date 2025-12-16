import { useEffect, useState } from 'react'
import { useAuthStore } from '@store/authStore'
import { paymentService } from '@/services/payment.service'
import DashboardCard from '@components/common/DashboardCard'
import LoadingSpinner from '@components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import axios from 'axios'
import { config } from '@/config'

interface PaymentHistory {
  id: string
  transaction_id: string
  amount: number
  currency: string
  status: string
  description: string
  payment_date: string
  invoice_url?: string
}

const SubscriptionManagementPageEnhanced = () => {
  const { user } = useAuthStore()
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('enterprise')
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)

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

  useEffect(() => {
    fetchSubscriptionData()
    fetchPaymentHistory()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      const token = localStorage.getItem('techfolks_auth_token')
      const response = await axios.get(`${config.api.baseUrl}/organizations/my`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success && response.data.data.subscription) {
        const sub = response.data.data.subscription
        setSubscriptionData({
          id: sub.id,
          currentPlan: sub.plan,
          status: sub.status,
          userLimit: sub.user_limit,
          currentUsers: response.data.data.stats?.active_users || 0,
          monthlyPrice: Number(sub.total_amount),
          billingCycle: sub.billing_cycle,
          nextBillingDate: new Date(sub.next_billing_date).toLocaleDateString(),
          daysUntilRenewal: Math.ceil((new Date(sub.next_billing_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        })
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
      toast.error('Failed to load subscription data')
    } finally {
      setFetchingData(false)
    }
  }

  const fetchPaymentHistory = async () => {
    try {
      if (!user?.organization_id) return

      const payments = await paymentService.getOrganizationPayments(user.organization_id)
      setPaymentHistory(payments)
    } catch (error) {
      console.error('Failed to fetch payment history:', error)
    }
  }

  const handleUpgradePlan = async () => {
    if (!subscriptionData?.id) {
      toast.error('Subscription ID not found')
      return
    }

    setLoading(true)
    try {
      // Initiate payment for subscription
      await paymentService.processSubscriptionPayment(
        subscriptionData.id,
        {
          name: user?.full_name,
          email: user?.email,
          contact: '9999999999' // You can add phone number to user profile
        },
        {
          onSuccess: (data) => {
            toast.success('Payment successful! Subscription upgraded')
            setShowUpgrade(false)
            // Refresh data
            fetchSubscriptionData()
            fetchPaymentHistory()
          },
          onFailure: (error) => {
            toast.error(error.message || 'Payment failed')
          }
        }
      )
    } catch (error: any) {
      console.error('Failed to process payment:', error)
      toast.error(error.message || 'Failed to initiate payment')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentPlan = () => plans.find(plan => plan.id === subscriptionData?.currentPlan)

  const isUpgrade = (planId: string) => {
    const planOrder = ['starter', 'professional', 'enterprise', 'unlimited']
    const currentIndex = planOrder.indexOf(subscriptionData?.currentPlan || 'starter')
    const targetIndex = planOrder.indexOf(planId)
    return targetIndex > currentIndex
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    }
    return badges[status as keyof typeof badges] || badges.pending
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

  if (fetchingData) {
    return <LoadingSpinner />
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
            Manage your organization's plan and billing with Razorpay
          </p>

          {subscriptionData && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-xl font-bold capitalize">{currentPlan?.name || 'N/A'}</div>
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
          )}
        </div>
      </div>

      {/* Current Subscription */}
      {subscriptionData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Current Subscription</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold capitalize">{currentPlan?.name} Plan</h3>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm capitalize">{subscriptionData.status}</span>
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
                🚀 Upgrade Plan (Pay with Razorpay)
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
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Billing Information</h4>
                <div className="space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
                  <div>Next billing: {subscriptionData.nextBillingDate}</div>
                  <div>Billing cycle: {subscriptionData.billingCycle}</div>
                  <div>Payment gateway: Razorpay</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Upgrade Your Plan (Razorpay Payment)
                </h3>
                <button
                  onClick={() => setShowUpgrade(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  disabled={loading}
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
                        : plan.id === subscriptionData?.currentPlan
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => !loading && setSelectedPlan(plan.id)}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}

                    {plan.id === subscriptionData?.currentPlan && (
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

                      {plan.id !== subscriptionData?.currentPlan && (
                        <div className="text-xs text-gray-500 mb-4">
                          {isUpgrade(plan.id) ? '⬆️ Upgrade' : '⬇️ Downgrade'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedPlan !== subscriptionData?.currentPlan && (
                <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-4">
                    Payment Summary
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span>Current Plan:</span>
                          <span className="font-medium capitalize">{subscriptionData?.currentPlan}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>New Plan:</span>
                          <span className="font-medium capitalize">{selectedPlan}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price Change:</span>
                          <span className="font-medium">
                            ₹{(plans.find(p => p.id === selectedPlan)?.price || 0) - (subscriptionData?.monthlyPrice || 0) > 0 ? '+' : ''}
                            {((plans.find(p => p.id === selectedPlan)?.price || 0) - (subscriptionData?.monthlyPrice || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span>Payment Gateway:</span>
                          <span className="font-medium">Razorpay</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Secure Payment:</span>
                          <span className="font-medium">🔒 SSL Encrypted</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payment Methods:</span>
                          <span className="font-medium text-xs">Cards, UPI, Wallets</span>
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
                {selectedPlan !== subscriptionData?.currentPlan && (
                  <button
                    onClick={handleUpgradePlan}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Processing Payment...' : `💳 Pay with Razorpay - ₹${plans.find(p => p.id === selectedPlan)?.price.toLocaleString()}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Payment History (Razorpay)</h2>

        {paymentHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Transaction ID
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-xs">
                      {payment.transaction_id.substring(0, 20)}...
                    </td>
                    <td className="px-6 py-4 text-sm">{payment.description}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      ₹{Number(payment.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">💳</div>
            <p>No payment history yet</p>
          </div>
        )}
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
            <div className="text-lg font-semibold mb-2">Payment Gateway</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div>💳 Powered by Razorpay</div>
              <div>🔒 PCI DSS Compliant</div>
              <div>🌐 razorpay.com/support</div>
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

export default SubscriptionManagementPageEnhanced