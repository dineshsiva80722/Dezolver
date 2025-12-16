import { useEffect, useState } from 'react'
import { useCertificatesStore } from '@store/certificatesStore'
import LoadingSpinner from '@components/common/LoadingSpinner'
import { formatDate } from '@utils/formatters'

const CertificatesPage = () => {
  const { 
    certificates, 
    loading, 
    error, 
    fetchMyCertificates, 
    downloadCertificate,
    verifyCertificate,
    clearError 
  } = useCertificatesStore()
  const [activeTab, setActiveTab] = useState<'my-certificates' | 'verify'>('my-certificates')
  const [verificationId, setVerificationId] = useState('')
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (activeTab === 'my-certificates') {
      fetchMyCertificates()
    }
  }, [activeTab, fetchMyCertificates])

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

  const getStatusBadge = (status: string, isRevoked: boolean) => {
    if (isRevoked) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Revoked</span>
    }
    
    switch (status) {
      case 'generated':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
      case 'downloaded':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Downloaded</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Certificates</h1>
        <p className="text-muted-foreground">
          Manage your certificates and verify authenticity
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('my-certificates')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'my-certificates'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          My Certificates
        </button>
        <button
          onClick={() => setActiveTab('verify')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'verify'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          Verify Certificate
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

      {/* My Certificates Tab */}
      {activeTab === 'my-certificates' && (
        <div>
          {loading ? (
            <LoadingSpinner />
          ) : certificates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎓</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No certificates yet
              </h3>
              <p className="text-muted-foreground">
                Complete courses, solve problems, or participate in contests to earn certificates!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {certificates.map((certificate) => (
                <div
                  key={certificate.id}
                  className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {certificate.course_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        ID: {certificate.certificate_id}
                      </p>
                    </div>
                    {getStatusBadge(certificate.status, certificate.is_revoked)}
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div>
                      <strong>Completed:</strong> {formatDate(certificate.completion_date)}
                    </div>
                    <div>
                      <strong>Issued:</strong> {formatDate(certificate.created_at)}
                    </div>
                    <div>
                      <strong>Downloads:</strong> {certificate.download_count}
                    </div>
                  </div>

                  {!certificate.is_revoked && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDownload(certificate.certificate_id)}
                        className="flex-1 btn btn-primary py-2 text-sm"
                      >
                        Download PDF
                      </button>
                      <button
                        onClick={() => window.open(certificate.verification_url, '_blank')}
                        className="flex-1 btn btn-outline py-2 text-sm"
                      >
                        Verify
                      </button>
                    </div>
                  )}

                  {certificate.is_revoked && (
                    <div className="text-xs text-red-600 p-2 bg-red-50 rounded">
                      This certificate has been revoked and is no longer valid.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Verify Certificate Tab */}
      {activeTab === 'verify' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Verify Certificate
            </h2>
            <p className="text-muted-foreground mb-6">
              Enter a certificate ID to verify its authenticity
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="certificate-id" className="block text-sm font-medium text-foreground mb-2">
                  Certificate ID
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="certificate-id"
                    value={verificationId}
                    onChange={(e) => setVerificationId(e.target.value)}
                    placeholder="CERT-XXXXXXXX-XXXXXX"
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    onClick={handleVerify}
                    disabled={verifying || !verificationId.trim()}
                    className="btn btn-primary px-6"
                  >
                    {verifying ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>

              {verificationResult && (
                <div className={`p-4 rounded-lg ${
                  verificationResult.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {verificationResult.isValid ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-green-800">
                          Certificate is Valid ✓
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Learner:</strong> {verificationResult.certificate.learner_name}
                        </div>
                        <div>
                          <strong>Course:</strong> {verificationResult.certificate.course_name}
                        </div>
                        <div>
                          <strong>Completed:</strong> {formatDate(verificationResult.certificate.completion_date)}
                        </div>
                        <div>
                          <strong>Issued:</strong> {formatDate(verificationResult.certificate.issued_date)}
                        </div>
                        {verificationResult.certificate.instructor_name && (
                          <div>
                            <strong>Instructor:</strong> {verificationResult.certificate.instructor_name}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-red-800 mb-1">
                          Certificate Invalid ✗
                        </h3>
                        <p className="text-red-700">{verificationResult.error}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">About Certificate Verification</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Each certificate has a unique ID for verification</li>
              <li>• QR codes on certificates link to this verification page</li>
              <li>• Revoked certificates will show as invalid</li>
              <li>• All certificate data is cryptographically secured</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default CertificatesPage