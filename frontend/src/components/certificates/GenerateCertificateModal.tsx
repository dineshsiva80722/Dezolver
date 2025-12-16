import { useState } from 'react'
import { useCertificatesStore } from '@store/certificatesStore'
import { useAuthStore } from '@store/authStore'

interface GenerateCertificateModalProps {
  isOpen: boolean
  onClose: () => void
}

const GenerateCertificateModal = ({ isOpen, onClose }: GenerateCertificateModalProps) => {
  const { user } = useAuthStore()
  const { generateCertificate, loading } = useCertificatesStore()
  
  const [formData, setFormData] = useState({
    learner_id: user?.id || '',
    course_name: '',
    trigger_type: 'course_completion',
    completion_date: new Date().toISOString().split('T')[0]
  })

  const handleSubmit = async () => {
    if (!formData.course_name || !formData.learner_id) {
      return
    }

    try {
      await generateCertificate({
        ...formData,
        completion_date: formData.completion_date
      })
      onClose()
      setFormData({
        learner_id: user?.id || '',
        course_name: '',
        trigger_type: 'course_completion',
        completion_date: new Date().toISOString().split('T')[0]
      })
    } catch (error) {
      // Error handled in store
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Generate Certificate
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create a new achievement certificate
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course/Achievement Name *
            </label>
            <input
              type="text"
              value={formData.course_name}
              onChange={(e) => setFormData(prev => ({ ...prev, course_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Full Stack Development Course"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Learner ID *
            </label>
            <input
              type="text"
              value={formData.learner_id}
              onChange={(e) => setFormData(prev => ({ ...prev, learner_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="User ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Achievement Type
            </label>
            <select
              value={formData.trigger_type}
              onChange={(e) => setFormData(prev => ({ ...prev, trigger_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="course_completion">Course Completion</option>
              <option value="contest_completion">Contest Winner</option>
              <option value="problem_solved">Problem Solving</option>
              <option value="assessment_pass">Assessment Pass</option>
              <option value="manual_approval">Manual Award</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Completion Date
            </label>
            <input
              type="date"
              value={formData.completion_date}
              onChange={(e) => setFormData(prev => ({ ...prev, completion_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn btn-outline"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.course_name || !formData.learner_id}
            className="btn btn-primary"
          >
            {loading ? 'Generating...' : 'Generate Certificate'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GenerateCertificateModal