import { create } from 'zustand'
import { certificatesAPI } from '@services/api'
import toast from 'react-hot-toast'

export interface Certificate {
  id: string
  certificate_id: string
  learner_id: string
  instructor_id?: string
  course_name: string
  trigger_type: string
  status: 'generated' | 'sent' | 'downloaded' | 'revoked'
  pdf_url?: string
  image_url?: string
  verification_url: string
  completion_date: string
  is_revoked: boolean
  download_count: number
  created_at: string
  learner?: {
    id: string
    username: string
    full_name?: string
  }
}

export interface CertificateTemplate {
  id: string
  name: string
  description?: string
  background_url?: string
  logo_url?: string
  watermark_url?: string
  template_config: any
  is_default: boolean
  is_active: boolean
  created_at: string
}

interface CertificatesState {
  // State
  certificates: Certificate[]
  templates: CertificateTemplate[]
  selectedCertificate: Certificate | null
  selectedTemplate: CertificateTemplate | null
  loading: boolean
  error: string | null

  // Actions - Certificates
  fetchMyCertificates: () => Promise<void>
  fetchUserCertificates: (userId: string) => Promise<void>
  generateCertificate: (data: any) => Promise<void>
  batchGenerateCertificates: (data: any) => Promise<void>
  verifyCertificate: (certificateId: string) => Promise<any>
  downloadCertificate: (certificateId: string) => Promise<void>
  revokeCertificate: (certificateId: string, reason: string) => Promise<void>
  reissueCertificate: (certificateId: string) => Promise<void>
  searchCertificates: (params: any) => Promise<Certificate[]>

  // Actions - Templates
  fetchTemplates: () => Promise<void>
  createTemplate: (data: any) => Promise<void>
  updateTemplate: (templateId: string, data: any) => Promise<void>
  setDefaultTemplate: (templateId: string) => Promise<void>
  uploadTemplateAssets: (formData: FormData) => Promise<any>

  // UI Actions
  setSelectedCertificate: (certificate: Certificate | null) => void
  setSelectedTemplate: (template: CertificateTemplate | null) => void
  clearError: () => void
}

export const useCertificatesStore = create<CertificatesState>((set, get) => ({
  // Initial State
  certificates: [],
  templates: [],
  selectedCertificate: null,
  selectedTemplate: null,
  loading: false,
  error: null,

  // Certificate Actions
  fetchMyCertificates: async () => {
    set({ loading: true, error: null })
    try {
      const response = await certificatesAPI.getMyCertificates() as any
      set({ certificates: response.data, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch certificates', 
        loading: false 
      })
      toast.error('Failed to fetch certificates')
    }
  },

  fetchUserCertificates: async (userId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await certificatesAPI.getUserCertificates(userId) as any
      set({ certificates: response.data, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch certificates', 
        loading: false 
      })
      toast.error('Failed to fetch certificates')
    }
  },

  generateCertificate: async (data: any) => {
    set({ loading: true, error: null })
    try {
      await certificatesAPI.generate(data)
      toast.success('Certificate generated successfully!')
      // Refresh certificates list
      await get().fetchMyCertificates()
      set({ loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to generate certificate', 
        loading: false 
      })
      toast.error('Failed to generate certificate')
    }
  },

  batchGenerateCertificates: async (data: any) => {
    set({ loading: true, error: null })
    try {
      await certificatesAPI.batchGenerate(data)
      toast.success('Certificates generated successfully!')
      await get().fetchMyCertificates()
      set({ loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to generate certificates', 
        loading: false 
      })
      toast.error('Failed to generate certificates')
    }
  },

  verifyCertificate: async (certificateId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await certificatesAPI.verifyCertificate(certificateId) as any
      set({ loading: false })
      return response
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to verify certificate', 
        loading: false 
      })
      throw error
    }
  },

  downloadCertificate: async (certificateId: string) => {
    try {
      const response = await certificatesAPI.downloadCertificate(certificateId) as any
      if (response.data.pdf_url) {
        window.open(response.data.pdf_url, '_blank')
        toast.success('Certificate downloaded!')
      }
    } catch (error: any) {
      toast.error('Failed to download certificate')
    }
  },

  revokeCertificate: async (certificateId: string, reason: string) => {
    set({ loading: true, error: null })
    try {
      await certificatesAPI.revokeCertificate(certificateId, reason)
      toast.success('Certificate revoked successfully')
      await get().fetchMyCertificates()
      set({ loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to revoke certificate', 
        loading: false 
      })
      toast.error('Failed to revoke certificate')
    }
  },

  reissueCertificate: async (certificateId: string) => {
    set({ loading: true, error: null })
    try {
      await certificatesAPI.reissueCertificate(certificateId)
      toast.success('Certificate reissued successfully')
      await get().fetchMyCertificates()
      set({ loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to reissue certificate', 
        loading: false 
      })
      toast.error('Failed to reissue certificate')
    }
  },

  searchCertificates: async (params: any) => {
    set({ loading: true, error: null })
    try {
      const response = await certificatesAPI.searchCertificates(params) as any
      set({ loading: false })
      return response.data.certificates
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to search certificates', 
        loading: false 
      })
      toast.error('Failed to search certificates')
      return []
    }
  },

  // Template Actions
  fetchTemplates: async () => {
    set({ loading: true, error: null })
    try {
      const response = await certificatesAPI.getTemplates() as any
      set({ templates: response.data, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch templates', 
        loading: false 
      })
      toast.error('Failed to fetch templates')
    }
  },

  createTemplate: async (data: any) => {
    set({ loading: true, error: null })
    try {
      await certificatesAPI.createTemplate(data)
      toast.success('Template created successfully!')
      await get().fetchTemplates()
      set({ loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to create template', 
        loading: false 
      })
      toast.error('Failed to create template')
    }
  },

  updateTemplate: async (templateId: string, data: any) => {
    set({ loading: true, error: null })
    try {
      await certificatesAPI.updateTemplate(templateId, data)
      toast.success('Template updated successfully!')
      await get().fetchTemplates()
      set({ loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to update template', 
        loading: false 
      })
      toast.error('Failed to update template')
    }
  },

  setDefaultTemplate: async (templateId: string) => {
    set({ loading: true, error: null })
    try {
      await certificatesAPI.setDefaultTemplate(templateId)
      toast.success('Default template set successfully!')
      await get().fetchTemplates()
      set({ loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to set default template', 
        loading: false 
      })
      toast.error('Failed to set default template')
    }
  },

  uploadTemplateAssets: async (formData: FormData) => {
    try {
      const response = await certificatesAPI.uploadTemplateAssets(formData) as any
      return response
    } catch (error: any) {
      toast.error('Failed to upload template assets')
      throw error
    }
  },

  // UI Actions
  setSelectedCertificate: (certificate: Certificate | null) => {
    set({ selectedCertificate: certificate })
  },

  setSelectedTemplate: (template: CertificateTemplate | null) => {
    set({ selectedTemplate: template })
  },

  clearError: () => {
    set({ error: null })
  },
}))