import { create } from 'zustand'

interface User {
  id: string
  username: string
  email: string
  full_name?: string
  role: 'user' | 'admin' | 'hr_manager' | 'manager' | 'super_admin'
  tier?: 'platform' | 'manager' | 'hr_manager' | 'employee' | 'user'
  organization_id?: string
  avatar?: string
  createdAt: string
  problems_solved?: number
  solved_problems?: number[]
  rating?: number
  max_rating?: number
  contests_participated_count?: number
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  login: (user: User, token: string, refreshToken?: string) => void
  register: (user: User, token: string, refreshToken?: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  setToken: (token: string) => void
}

// Removed Zustand persist - all data will be fetched from database on each session
// Only auth tokens remain in localStorage for API authentication
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  login: (user, token, refreshToken) => {
    // Store only tokens in localStorage for API requests
    localStorage.setItem('techfolks_auth_token', token)
    if (refreshToken) {
      localStorage.setItem('techfolks_refresh_token', refreshToken)
    }
    set({ user, token, refreshToken: refreshToken || null, isAuthenticated: true, isLoading: false, isInitialized: true })
  },
  register: (user, token, refreshToken) => {
    // Store only tokens in localStorage for API requests
    localStorage.setItem('techfolks_auth_token', token)
    if (refreshToken) {
      localStorage.setItem('techfolks_refresh_token', refreshToken)
    }
    set({ user, token, refreshToken: refreshToken || null, isAuthenticated: true, isLoading: false, isInitialized: true })
  },
  logout: () => {
    // Clear tokens from localStorage
    localStorage.removeItem('techfolks_auth_token')
    localStorage.removeItem('techfolks_refresh_token')
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false, isInitialized: true })
  },
  updateUser: (userData) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  setToken: (token) => {
    localStorage.setItem('techfolks_auth_token', token)
    set({ token })
  },
}))
