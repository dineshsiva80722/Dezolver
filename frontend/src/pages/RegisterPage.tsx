import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { authAPI } from '@services/api'
import { config } from '@/config'
import toast from 'react-hot-toast'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register: registerUser } = useAuthStore()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)

  const reservedUsernames = ['admin', 'administrator', 'root', 'system', 'support', 'help', 'api', 'www', 'mail', 'ftp']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.username || !formData.email || !formData.fullName || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.username.length < 3 || formData.username.length > 30) {
      toast.error('Username must be between 3 and 30 characters')
      return
    }

    if (reservedUsernames.includes(formData.username.toLowerCase())) {
      toast.error('This username is reserved and cannot be used')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast.error('Username can only contain letters, numbers, and underscores')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (formData.fullName.length < 2 || formData.fullName.length > 100) {
      toast.error('Full name must be between 2 and 100 characters')
      return
    }

    // Validate phone number format only if provided
    if (formData.phoneNumber && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(formData.phoneNumber)) {
      toast.error('Please enter a valid phone number')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      toast.error('Password must contain at least one uppercase letter, one lowercase letter, and one number')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setLoading(true)

      // Call the backend API to register
      const response = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || undefined
      })

      // The response is already the data object from axios interceptor
      if (response?.data?.user && response?.data?.token) {
        const refreshToken = response?.data?.refreshToken
        registerUser(response.data.user, response.data.token, refreshToken)
        toast.success('Registration successful! Please check your email to verify your account.')
        navigate('/profile')
      } else {
        throw new Error('Invalid registration response')
      }

    } catch (error: any) {
      console.error('Registration error:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Registration failed. Please try again.'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground">Create Account</h2>
          <p className="text-muted-foreground mt-2">
            Join {config.app.name} and start coding!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className="input w-full"
              placeholder="Enter your username"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              3-30 characters, letters, numbers, and underscores only
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="input w-full"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              className="input w-full"
              placeholder="Enter your full name"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground mb-2">
              Phone Number <span className="text-muted-foreground text-xs">(Optional)</span>
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="input w-full"
              placeholder="+1234567890 or 1234567890"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter with country code (supports +, spaces, dots, hyphens)
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="input w-full"
              placeholder="Enter your password"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Min 8 chars with uppercase, lowercase, and number
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input w-full"
              placeholder="Confirm your password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary/80">
              Sign in
            </Link>
          </p>
        </div>

        {/* Registration Requirements */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">Requirements:</p>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
            <li>Username: 3-30 characters, only letters, numbers, and underscores</li>
            <li>Password: Minimum 8 characters with at least one uppercase, one lowercase, and one number</li>
            <li>Phone (Optional): If provided, must be valid format with country code (+1234567890)</li>
            <li>Reserved usernames (admin, administrator, root, etc.) cannot be used</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage