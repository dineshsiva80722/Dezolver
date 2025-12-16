import { useState, useEffect } from 'react'
import { useAuthStore } from '@store/authStore'
import { Navigate } from 'react-router-dom'
import { config } from '@/config'
import toast from 'react-hot-toast'

interface Assessment {
  id: string
  title: string
  description?: string
  type: string
  difficulty: string
  duration_minutes?: number
  passing_percentage: number
  total_marks: number
  is_published: boolean
  is_public: boolean
  created_at: string
  questions?: Question[]
}

interface Question {
  id: string
  question_text: string
  type: string
  marks: number
  order_index: number
  options?: QuestionOption[]
}

interface QuestionOption {
  id?: string
  option_text: string
  is_correct: boolean
  order_index: number
}

const AssessmentPage = () => {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'map-questions'>('list')
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state for creating assessment
  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    description: '',
    type: 'quiz',
    difficulty: 'medium',
    duration_minutes: 30,
    passing_percentage: 60,
    total_marks: 100,
    is_public: false,
  })

  // Question mapping state
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    type: 'multiple_choice',
    marks: 1,
    order_index: 0,
    explanation: '',
    options: [
      { option_text: '', is_correct: false, order_index: 0 },
      { option_text: '', is_correct: false, order_index: 1 },
    ],
  })

  // Redirect if not admin or problem setter
  if (!user || (user.role !== 'admin' && user.role !== 'problem_setter' && user.role !== 'super_admin')) {
    return <Navigate to="/" replace />
  }

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${config.API_URL}/api/assessments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAssessments(data.data?.assessments || [])
      } else {
        toast.error('Failed to fetch assessments')
      }
    } catch (error) {
      console.error('Error fetching assessments:', error)
      toast.error('Error loading assessments')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${config.API_URL}/api/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(assessmentForm),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Assessment created successfully')
        setAssessments([data.data, ...assessments])
        setAssessmentForm({
          title: '',
          description: '',
          type: 'quiz',
          difficulty: 'medium',
          duration_minutes: 30,
          passing_percentage: 60,
          total_marks: 100,
          is_public: false,
        })
        setActiveTab('list')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create assessment')
      }
    } catch (error) {
      console.error('Error creating assessment:', error)
      toast.error('Error creating assessment')
    }
  }

  const handleMapQuestions = async () => {
    if (!selectedAssessment) {
      toast.error('Please select an assessment first')
      return
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${config.API_URL}/api/assessments/${selectedAssessment.id}/questions/bulk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ questions }),
        }
      )

      if (response.ok) {
        toast.success(`${questions.length} questions mapped successfully`)
        setQuestions([])
        setActiveTab('list')
        fetchAssessments()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to map questions')
      }
    } catch (error) {
      console.error('Error mapping questions:', error)
      toast.error('Error mapping questions')
    }
  }

  const handleAddQuestion = () => {
    setQuestions([...questions, { ...newQuestion, order_index: questions.length }])
    setNewQuestion({
      question_text: '',
      type: 'multiple_choice',
      marks: 1,
      order_index: 0,
      explanation: '',
      options: [
        { option_text: '', is_correct: false, order_index: 0 },
        { option_text: '', is_correct: false, order_index: 1 },
      ],
    })
    toast.success('Question added to queue')
  }

  const handleAddOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [
        ...newQuestion.options,
        { option_text: '', is_correct: false, order_index: newQuestion.options.length },
      ],
    })
  }

  const handleRemoveOption = (index: number) => {
    const updatedOptions = newQuestion.options.filter((_, i) => i !== index)
    setNewQuestion({ ...newQuestion, options: updatedOptions })
  }

  const handleUpdateOption = (index: number, field: string, value: any) => {
    const updatedOptions = newQuestion.options.map((opt, i) =>
      i === index ? { ...opt, [field]: value } : opt
    )
    setNewQuestion({ ...newQuestion, options: updatedOptions })
  }

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${config.API_URL}/api/assessments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success('Assessment deleted successfully')
        setAssessments(assessments.filter((a) => a.id !== id))
      } else {
        toast.error('Failed to delete assessment')
      }
    } catch (error) {
      console.error('Error deleting assessment:', error)
      toast.error('Error deleting assessment')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assessment Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Create and manage assessments with questions</p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'list'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Assessments ({assessments.length})
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'create'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Create Assessment
              </button>
              <button
                onClick={() => setActiveTab('map-questions')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'map-questions'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Map Questions
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {/* Assessments List */}
          {activeTab === 'list' && (
            <div>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : assessments.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No assessments found. Create one to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {assessment.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {assessment.description || 'No description'}
                      </p>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Type:</span>
                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {assessment.type}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Difficulty:</span>
                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {assessment.difficulty}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Questions:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {assessment.questions?.length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Total Marks:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {assessment.total_marks}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedAssessment(assessment)
                            setActiveTab('map-questions')
                          }}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Add Questions
                        </button>
                        <button
                          onClick={() => handleDeleteAssessment(assessment.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create Assessment Form */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateAssessment} className="max-w-2xl space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={assessmentForm.title}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter assessment title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={assessmentForm.description}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter assessment description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={assessmentForm.type}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="quiz">Quiz</option>
                    <option value="test">Test</option>
                    <option value="exam">Exam</option>
                    <option value="practice">Practice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={assessmentForm.difficulty}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, difficulty: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    value={assessmentForm.duration_minutes}
                    onChange={(e) =>
                      setAssessmentForm({ ...assessmentForm, duration_minutes: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Passing %
                  </label>
                  <input
                    type="number"
                    value={assessmentForm.passing_percentage}
                    onChange={(e) =>
                      setAssessmentForm({ ...assessmentForm, passing_percentage: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={assessmentForm.total_marks}
                    onChange={(e) =>
                      setAssessmentForm({ ...assessmentForm, total_marks: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={assessmentForm.is_public}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, is_public: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Make this assessment public
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Assessment
              </button>
            </form>
          )}

          {/* Map Questions */}
          {activeTab === 'map-questions' && (
            <div className="space-y-6">
              {/* Assessment Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Assessment
                </label>
                <select
                  value={selectedAssessment?.id || ''}
                  onChange={(e) => {
                    const assessment = assessments.find((a) => a.id === e.target.value)
                    setSelectedAssessment(assessment || null)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Choose an assessment...</option>
                  {assessments.map((assessment) => (
                    <option key={assessment.id} value={assessment.id}>
                      {assessment.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAssessment && (
                <>
                  {/* New Question Form */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Add New Question
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Question Text
                        </label>
                        <textarea
                          value={newQuestion.question_text}
                          onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter question text"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Question Type
                          </label>
                          <select
                            value={newQuestion.type}
                            onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="multiple_select">Multiple Select</option>
                            <option value="true_false">True/False</option>
                            <option value="short_answer">Short Answer</option>
                            <option value="long_answer">Long Answer</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Marks
                          </label>
                          <input
                            type="number"
                            value={newQuestion.marks}
                            onChange={(e) =>
                              setNewQuestion({ ...newQuestion, marks: parseInt(e.target.value) || 1 })
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Options */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Options
                          </label>
                          <button
                            type="button"
                            onClick={handleAddOption}
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            + Add Option
                          </button>
                        </div>
                        <div className="space-y-2">
                          {newQuestion.options.map((option, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={option.option_text}
                                onChange={(e) => handleUpdateOption(index, 'option_text', e.target.value)}
                                placeholder={`Option ${index + 1}`}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              />
                              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                                <input
                                  type="checkbox"
                                  checked={option.is_correct}
                                  onChange={(e) => handleUpdateOption(index, 'is_correct', e.target.checked)}
                                  className="h-4 w-4 text-blue-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Correct</span>
                              </label>
                              {newQuestion.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(index)}
                                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddQuestion}
                        disabled={!newQuestion.question_text}
                        className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add to Queue ({questions.length} questions)
                      </button>
                    </div>
                  </div>

                  {/* Questions Queue */}
                  {questions.length > 0 && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Questions Queue ({questions.length})
                      </h3>
                      <div className="space-y-4 mb-4">
                        {questions.map((q, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white mb-2">
                                  {index + 1}. {q.question_text}
                                </p>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Type: {q.type} | Marks: {q.marks}
                                </div>
                              </div>
                              <button
                                onClick={() => setQuestions(questions.filter((_, i) => i !== index))}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleMapQuestions}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                      >
                        Map All Questions to Assessment
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AssessmentPage
