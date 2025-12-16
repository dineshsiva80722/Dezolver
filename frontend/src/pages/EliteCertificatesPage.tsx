import { useEffect, useState } from 'react'
import { useCertificatesStore } from '@store/certificatesStore'
import { useAuthStore } from '@store/authStore'
import DashboardCard from '@components/common/DashboardCard'
import LoadingSpinner from '@components/common/LoadingSpinner'
import { formatDate } from '@utils/formatters'

const EliteCertificatesPage = () => {
  const { user } = useAuthStore()
  const { 
    certificates, 
    loading, 
    error, 
    fetchMyCertificates,
    fetchUserCertificates,
    downloadCertificate,
    verifyCertificate,
    clearError 
  } = useCertificatesStore()
  
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'course' | 'contest' | 'problem'>('all')
  const [verificationId, setVerificationId] = useState('')
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (user?.role === 'super_admin' && user?.id) {
      fetchUserCertificates(user.id)
    } else {
      fetchMyCertificates()
    }
  }, [fetchMyCertificates, fetchUserCertificates, user?.id, user?.role])

  const handleDownload = (certificateId: string) => {
    downloadCertificate(certificateId)
  }

  const handleVerify = async () => {
    if (!verificationId.trim()) return
    
    setVerifying(true)
    setVerificationResult(null)
    
    try {
      const result = await verifyCertificate(verificationId)
      setVerificationResult(result)
    } catch (error: any) {
      setVerificationResult({ 
        isValid: false, 
        error: error.response?.data?.message || 'Certificate not found' 
      })
    } finally {
      setVerifying(false)
    }
  }

  const filteredCertificates = certificates.filter(cert => {
    if (selectedCategory === 'all') return true
    return cert.trigger_type.includes(selectedCategory)
  })

  const getGradientByType = (triggerType: string) => {
    switch (triggerType) {
      case 'course_completion':
        return 'from-blue-500 to-blue-600'
      case 'contest_completion':
        return 'from-purple-500 to-purple-600'
      case 'problem_solved':
        return 'from-green-500 to-green-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getCertificateIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'course_completion':
        return '📚'
      case 'contest_completion':
        return '🏆'
      case 'problem_solved':
        return '🧩'
      default:
        return '🎓'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Certificates"
          value={certificates.length}
          icon="🎓"
          gradient="blue"
        />
        <DashboardCard
          title="Course Certificates"
          value={certificates.filter(c => c.trigger_type === 'course_completion').length}
          icon="📚"
          gradient="green"
        />
        <DashboardCard
          title="Contest Wins"
          value={certificates.filter(c => c.trigger_type === 'contest_completion').length}
          icon="🏆"
          gradient="purple"
        />
        <DashboardCard
          title="Problem Achievements"
          value={certificates.filter(c => c.trigger_type === 'problem_solved').length}
          icon="🧩"
          gradient="orange"
        />
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by:</div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Certificates</option>
              <option value="course">Course Completions</option>
              <option value="contest">Contest Achievements</option>
              <option value="problem">Problem Solving</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">View:</span>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveView('grid')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  activeView === 'grid'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setActiveView('list')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  activeView === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-red-800 dark:text-red-200">{error}</div>
            <button onClick={clearError} className="text-red-600 hover:text-red-800 text-sm">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Certificates Display */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredCertificates.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4">🎓</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {selectedCategory === 'all' ? 'No certificates yet' : `No ${selectedCategory} certificates`}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {selectedCategory === 'all' 
              ? 'Complete courses, solve problems, or participate in contests to earn certificates!'
              : `Complete ${selectedCategory === 'course' ? 'courses' : selectedCategory === 'contest' ? 'contests' : 'challenging problems'} to earn certificates in this category.`
            }
          </p>
          <a href="/problems" className="btn btn-primary">
            Start Learning
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Grid View */}
          {activeView === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCertificates.map((certificate) => (
                <div
                  key={certificate.id}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-200"
                >
                  {/* Certificate Header */}
                  <div className={`bg-gradient-to-r ${getGradientByType(certificate.trigger_type)} p-4 text-white relative`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getCertificateIcon(certificate.trigger_type)}</span>
                        <div>
                          <div className="font-semibold text-sm">Certificate</div>
                          <div className="text-xs opacity-90">{certificate.certificate_id}</div>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        certificate.is_revoked
                          ? 'bg-red-500 text-white'
                          : 'bg-white/20 text-white'
                      }`}>
                        {certificate.is_revoked ? 'Revoked' : 'Active'}
                      </div>
                    </div>
                  </div>

                  {/* Certificate Content */}
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {certificate.course_name}
                    </h3>
                    
                    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center justify-between">
                        <span>Completed:</span>
                        <span className="font-medium">{formatDate(certificate.completion_date)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Issued:</span>
                        <span className="font-medium">{formatDate(certificate.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Downloads:</span>
                        <span className="font-medium">{certificate.download_count}</span>
                      </div>
                    </div>

                    {!certificate.is_revoked && (
                      <div className="mt-6 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleDownload(certificate.certificate_id)}
                          className="btn btn-primary btn-sm"
                        >
                          📄 Download
                        </button>
                        <button
                          onClick={() => window.open(certificate.verification_url, '_blank')}
                          className="btn btn-outline btn-sm"
                        >
                          🔍 Verify
                        </button>
                      </div>
                    )}

                    {certificate.is_revoked && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="text-xs text-red-700 dark:text-red-300">
                          ⚠️ This certificate has been revoked and is no longer valid.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {activeView === 'list' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Certificate
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Course/Achievement
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Completed
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredCertificates.map((certificate) => (
                      <tr key={certificate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{getCertificateIcon(certificate.trigger_type)}</div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white text-sm">
                                {certificate.certificate_id}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {certificate.trigger_type.replace('_', ' ')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {certificate.course_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(certificate.completion_date)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            certificate.is_revoked
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          }`}>
                            {certificate.is_revoked ? '❌ Revoked' : '✅ Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            {!certificate.is_revoked && (
                              <>
                                <button
                                  onClick={() => handleDownload(certificate.certificate_id)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  Download
                                </button>
                                <button
                                  onClick={() => window.open(certificate.verification_url, '_blank')}
                                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                                >
                                  Verify
                                </button>
                              </>
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

      {/* Certificate Verification Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <span className="mr-2">🔍</span>
          Certificate Verification
        </h2>
        
        <div className="max-w-2xl">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Verify any certificate by entering its unique ID below. This verification system ensures authenticity and prevents fraud.
          </p>

          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={verificationId}
                onChange={(e) => setVerificationId(e.target.value)}
                placeholder="Enter Certificate ID (e.g., CERT-XXXXXXXX-XXXXXX)"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={verifying || !verificationId.trim()}
              className="btn btn-primary px-6"
            >
              {verifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>

          {verificationResult && (
            <div className={`mt-4 p-4 rounded-lg border ${
              verificationResult.isValid 
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            }`}>
              {verificationResult.isValid ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                      Certificate is Valid ✓
                    </h3>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Learner:</span>
                        <span className="font-medium">{verificationResult.certificate.learner_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Course:</span>
                        <span className="font-medium">{verificationResult.certificate.course_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                        <span className="font-medium">{formatDate(verificationResult.certificate.completion_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Issued:</span>
                        <span className="font-medium">{formatDate(verificationResult.certificate.issued_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-1">
                      Certificate Invalid ✗
                    </h3>
                    <p className="text-red-700 dark:text-red-400">{verificationResult.error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center">
          <span className="mr-2">ℹ️</span>
          About Certificate System
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-300">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">🔒</span>
              <span>Each certificate has a unique, unbreakable ID</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">📱</span>
              <span>QR codes for instant mobile verification</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">🔍</span>
              <span>Public verification system for employers</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">🛡️</span>
              <span>Tamper-proof and blockchain-ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EliteCertificatesPage
