import { useEffect, useState } from 'react'
import { useCertificatesStore } from '@store/certificatesStore'
import { useAuthStore } from '@store/authStore'
import LoadingSpinner from '@components/common/LoadingSpinner'
import { formatDate } from '@utils/formatters'

const AdminCertificatesPage = () => {
  const { user } = useAuthStore()
  const { 
    certificates,
    templates,
    loading,
    error,
    fetchTemplates,
    searchCertificates,
    revokeCertificate,
    reissueCertificate,
    setDefaultTemplate,
    createTemplate,
    uploadTemplateAssets,
    clearError
  } = useCertificatesStore()

  const [activeTab, setActiveTab] = useState<'certificates' | 'templates'>('certificates')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [revokeReason, setRevokeReason] = useState('')
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    template_config: null
  })
  const [templateFiles, setTemplateFiles] = useState({
    background: null as File | null,
    logo: null as File | null,
    watermark: null as File | null
  })
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const [showEditTemplate, setShowEditTemplate] = useState(false)

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates()
    } else {
      handleSearchCertificates()
    }
  }, [activeTab])

  const handleSearchCertificates = async () => {
    await searchCertificates({
      learnerUsername: searchQuery || undefined,
      limit: 50
    })
    // Results are automatically stored in the store
  }

  const handleRevokeCertificate = async () => {
    if (selectedCertificate && revokeReason.trim()) {
      await revokeCertificate(selectedCertificate.id, revokeReason)
      setShowRevokeModal(false)
      setSelectedCertificate(null)
      setRevokeReason('')
      handleSearchCertificates()
    }
  }

  const handleReissueCertificate = async (certificateId: string) => {
    await reissueCertificate(certificateId)
    handleSearchCertificates()
  }

  const handleSetDefaultTemplate = async (templateId: string) => {
    await setDefaultTemplate(templateId)
  }

  const handleFileChange = (type: 'background' | 'logo' | 'watermark', file: File | null) => {
    setTemplateFiles(prev => ({ ...prev, [type]: file }))
  }

  const handleCreateTemplate = async () => {
    if (newTemplate.name.trim()) {
      try {
        setUploadingFiles(true)
        
        // First upload files if any
        let uploadedUrls = {}
        if (templateFiles.background || templateFiles.logo || templateFiles.watermark) {
          const formData = new FormData()
          
          if (templateFiles.background) {
            formData.append('background', templateFiles.background)
          }
          if (templateFiles.logo) {
            formData.append('logo', templateFiles.logo)
          }
          if (templateFiles.watermark) {
            formData.append('watermark', templateFiles.watermark)
          }
          
          const uploadResponse = await uploadTemplateAssets(formData)
          uploadedUrls = uploadResponse.data
        }

        const defaultConfig = {
          layout: {
            width: 800,
            height: 600,
            orientation: 'landscape'
          },
          placeholders: {
            learnerName: { x: 400, y: 200, fontSize: 36, fontFamily: 'Arial', color: '#000000' },
            courseName: { x: 400, y: 280, fontSize: 24, fontFamily: 'Arial', color: '#333333' },
            completionDate: { x: 400, y: 350, fontSize: 18, fontFamily: 'Arial', color: '#666666' },
            instructorName: { x: 200, y: 500, fontSize: 16, fontFamily: 'Arial', color: '#666666' },
            certificateId: { x: 600, y: 500, fontSize: 12, fontFamily: 'Arial', color: '#999999' },
            qrCode: { x: 700, y: 450, size: 80 }
          },
          fonts: ['Arial', 'Times New Roman', 'Helvetica'],
          language: 'en',
          colors: {
            primary: '#007bff',
            secondary: '#6c757d',
            text: '#000000'
          }
        }

        await createTemplate({
          ...newTemplate,
          ...uploadedUrls,
          template_config: newTemplate.template_config || defaultConfig
        })
        
        setShowCreateTemplate(false)
        setNewTemplate({ name: '', description: '', template_config: null })
        setTemplateFiles({ background: null, logo: null, watermark: null })
      } catch (error) {
        console.error('Template creation error:', error)
      } finally {
        setUploadingFiles(false)
      }
    }
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Certificate Administration</h1>
        <p className="text-muted-foreground">
          Manage certificates, templates, and certificate settings
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'certificates'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          Certificate Management
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'templates'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          Template Management
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

      {/* Certificate Management Tab */}
      {activeTab === 'certificates' && (
        <div>
          {/* Search */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by learner username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearchCertificates}
                className="btn btn-primary"
              >
                Search
              </button>
            </div>
          </div>

          {/* Certificate List */}
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Certificate ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Learner
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Course
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Issued
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {certificates.map((certificate) => (
                      <tr key={certificate.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono">
                          {certificate.certificate_id}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {certificate.learner?.full_name || certificate.learner?.username}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {certificate.course_name}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            certificate.is_revoked
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {certificate.is_revoked ? 'Revoked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(certificate.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex space-x-2">
                            {!certificate.is_revoked && (
                              <button
                                onClick={() => {
                                  setSelectedCertificate(certificate)
                                  setShowRevokeModal(true)
                                }}
                                className="text-red-600 hover:text-red-900 text-sm"
                              >
                                Revoke
                              </button>
                            )}
                            <button
                              onClick={() => handleReissueCertificate(certificate.id)}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                            >
                              Reissue
                            </button>
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

      {/* Template Management Tab */}
      {activeTab === 'templates' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">Certificate Templates</h2>
            <button
              onClick={() => setShowCreateTemplate(true)}
              className="btn btn-primary"
            >
              Create Template
            </button>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {template.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {template.is_default && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          Default
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground mb-4">
                    <div>Created: {formatDate(template.created_at)}</div>
                  </div>

                  <div className="flex space-x-2">
                    {!template.is_default && template.is_active && (
                      <button
                        onClick={() => handleSetDefaultTemplate(template.id)}
                        className="flex-1 btn btn-outline btn-sm"
                      >
                        Set Default
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setEditingTemplate(template)
                        setShowEditTemplate(true)
                      }}
                      className="flex-1 btn btn-primary btn-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Revoke Certificate Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Revoke Certificate
            </h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to revoke this certificate? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Reason for revocation
              </label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
                placeholder="Enter reason for revoking this certificate..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRevokeModal(false)
                  setSelectedCertificate(null)
                  setRevokeReason('')
                }}
                className="flex-1 btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeCertificate}
                disabled={!revokeReason.trim()}
                className="flex-1 btn btn-destructive"
              >
                Revoke Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Create New Certificate Template
            </h3>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Basic Information</h4>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter template name..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={2}
                    placeholder="Enter template description..."
                  />
                </div>
              </div>

              {/* File Uploads */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Template Assets (Optional)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Background Image */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Background Image
                    </label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('background', e.target.files?.[0] || null)}
                        className="hidden"
                        id="background-upload"
                      />
                      <label
                        htmlFor="background-upload"
                        className="cursor-pointer block"
                      >
                        {templateFiles.background ? (
                          <div>
                            <div className="text-sm text-green-600 font-medium">
                              ✓ {templateFiles.background.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Click to change
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-2xl mb-2">🖼️</div>
                            <div className="text-sm text-muted-foreground">
                              Click to upload background
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Logo Image */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Logo Image
                    </label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('logo', e.target.files?.[0] || null)}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer block"
                      >
                        {templateFiles.logo ? (
                          <div>
                            <div className="text-sm text-green-600 font-medium">
                              ✓ {templateFiles.logo.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Click to change
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-2xl mb-2">🏢</div>
                            <div className="text-sm text-muted-foreground">
                              Click to upload logo
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Watermark Image */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Watermark Image
                    </label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('watermark', e.target.files?.[0] || null)}
                        className="hidden"
                        id="watermark-upload"
                      />
                      <label
                        htmlFor="watermark-upload"
                        className="cursor-pointer block"
                      >
                        {templateFiles.watermark ? (
                          <div>
                            <div className="text-sm text-green-600 font-medium">
                              ✓ {templateFiles.watermark.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Click to change
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-2xl mb-2">💧</div>
                            <div className="text-sm text-muted-foreground">
                              Click to upload watermark
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Supported formats: JPG, PNG, GIF. Maximum size: 10MB per file.
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateTemplate(false)
                  setNewTemplate({ name: '', description: '', template_config: null })
                  setTemplateFiles({ background: null, logo: null, watermark: null })
                }}
                className="flex-1 btn btn-outline"
                disabled={uploadingFiles}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={!newTemplate.name.trim() || uploadingFiles}
                className="flex-1 btn btn-primary"
              >
                {uploadingFiles ? 'Uploading...' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCertificatesPage