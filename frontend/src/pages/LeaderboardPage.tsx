import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { leaderboardAPI, userAPI, submissionsAPI } from '@services/api'
import toast from 'react-hot-toast'
import { 
  TrendingUp, TrendingDown, Award, Target, Code, Trophy, 
  Medal, Star, Calendar, Activity, Zap, Users, ChevronUp, ChevronDown 
} from 'lucide-react'

interface LeaderboardUser {
  id: number
  username: string
  rating: number
  max_rating: number
  problems_solved: number
  contests_participated: number
  rank: number
  profile_picture?: string
  country?: string
  badge?: string
  achievements: string[]
  last_active: string
}

interface UserStats {
  problemsSolved: number
  totalSubmissions: number
  acceptedSubmissions: number
  currentRating: number
  maxRating: number
  contestsParticipated: number
  weeklyActivity: number
  monthlyActivity: number
  recentSubmissions: any[]
  difficultyBreakdown: {
    easy: number
    medium: number
    hard: number
  }
}

const LeaderboardPage = () => {
  const { user } = useAuthStore()
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [timeFrame, setTimeFrame] = useState<'all-time' | 'monthly' | 'weekly'>('all-time')
  const [category, setCategory] = useState<'rating' | 'problems' | 'contests'>('rating')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [userPosition, setUserPosition] = useState<any>(null)

  useEffect(() => {
    fetchLeaderboard()
    if (user) {
      fetchUserStats()
      fetchUserPosition()
    }
  }, [timeFrame, category, user])

  const fetchUserStats = async () => {
    try {
      const stats = await userAPI.getStats()
      setUserStats(stats)
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const fetchUserPosition = async () => {
    try {
      if (user?.id) {
        const position = await leaderboardAPI.getUserPosition(user.id.toString())
        setUserPosition(position)
      }
    } catch (error) {
      console.error('Error fetching user position:', error)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      
      let apiCall;
      const params = {
        timeFrame,
        category,
        search: searchQuery || undefined,
        limit: 100
      };
      
      switch (timeFrame) {
        case 'weekly':
          apiCall = leaderboardAPI.getWeekly(params)
          break
        case 'monthly':
          apiCall = leaderboardAPI.getMonthly(params)
          break
        default:
          apiCall = leaderboardAPI.getGlobal(params)
      }
      
      const response = await apiCall
      
      // Map API response to our interface
      const mappedUsers: LeaderboardUser[] = response.users.map((user: any, index: number) => ({
        id: user.id,
        username: user.username,
        rating: user.rating || 1200,
        max_rating: user.max_rating || user.rating || 1200,
        problems_solved: user.problems_solved || 0,
        contests_participated: user.contests_participated || 0,
        rank: user.rank || index + 1,
        country: user.country,
        badge: user.badge || getRatingBadge(user.rating || 1200),
        achievements: user.achievements || [],
        last_active: user.last_active || new Date().toISOString(),
        profile_picture: user.avatar_url
      }))
      
      setLeaderboard(mappedUsers)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      toast.error('Failed to load leaderboard')
      setLeaderboard([])
    } finally {
      setLoading(false)
    }
  }
  
  const getRatingBadge = (rating: number): string => {
    if (rating >= 2400) return 'Grandmaster'
    if (rating >= 2100) return 'Master'
    if (rating >= 1900) return 'Candidate Master'
    if (rating >= 1600) return 'Expert'
    if (rating >= 1400) return 'Specialist'
    if (rating >= 1200) return 'Pupil'
    return 'Newbie'
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 2400) return 'text-red-600 dark:text-red-400'
    if (rating >= 2100) return 'text-orange-600 dark:text-orange-400'
    if (rating >= 1900) return 'text-purple-600 dark:text-purple-400'
    if (rating >= 1600) return 'text-blue-600 dark:text-blue-400'
    if (rating >= 1400) return 'text-green-600 dark:text-green-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Grandmaster': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'Master': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'Candidate Master': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'Expert': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'Specialist': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getRatingChange = (current: number, max: number) => {
    const change = current - max + 100 // Simulated change
    return change
  }

  const getAccuracyRate = () => {
    if (!userStats) return 0
    return userStats.totalSubmissions > 0 
      ? Math.round((userStats.acceptedSubmissions / userStats.totalSubmissions) * 100)
      : 0
  }

  const filteredLeaderboard = leaderboard.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentUserRank = leaderboard.find(u => u.username === user?.username)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section with Performance Overview */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Performance Leaderboard</h1>
              <p className="text-blue-100">Track your progress and compete with peers worldwide</p>
            </div>
            <Trophy className="w-16 h-16 opacity-80" />
          </div>

          {/* Current User Performance Stats */}
          {currentUserRank && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                    {user?.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{user?.username}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getBadgeColor(currentUserRank.badge || 'Pupil')}`}>
                        {currentUserRank.badge || 'Pupil'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1">{getRankIcon(currentUserRank.rank)}</div>
                  <div className="text-sm opacity-90">Global Rank</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="w-5 h-5 mr-1" />
                  </div>
                  <div className="text-3xl font-bold">{currentUserRank.rating}</div>
                  <div className="text-sm opacity-90 mt-1">Rating</div>
                  <div className="text-xs opacity-75 mt-1">Max: {currentUserRank.max_rating}</div>
                </div>

                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Code className="w-5 h-5 mr-1" />
                  </div>
                  <div className="text-3xl font-bold">{currentUserRank.problems_solved}</div>
                  <div className="text-sm opacity-90 mt-1">Problems Solved</div>
                  <div className="text-xs opacity-75 mt-1">
                    {userStats && `${getAccuracyRate()}% accuracy`}
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Trophy className="w-5 h-5 mr-1" />
                  </div>
                  <div className="text-3xl font-bold">{currentUserRank.contests_participated}</div>
                  <div className="text-sm opacity-90 mt-1">Contests</div>
                  {userStats && userStats.contestsParticipated > 0 && (
                    <div className="text-xs opacity-75 mt-1">Active participant</div>
                  )}
                </div>

                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Activity className="w-5 h-5 mr-1" />
                  </div>
                  <div className="text-3xl font-bold">
                    {userStats ? userStats.totalSubmissions : 0}
                  </div>
                  <div className="text-sm opacity-90 mt-1">Total Submissions</div>
                  <div className="text-xs opacity-75 mt-1">
                    {userStats && `${userStats.acceptedSubmissions} accepted`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!currentUserRank && user && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-80" />
              <h3 className="text-xl font-semibold mb-2">Start Your Journey!</h3>
              <p className="opacity-90 mb-4">Solve problems to appear on the leaderboard</p>
              <Link 
                to="/problems" 
                className="inline-flex items-center px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 transition"
              >
                <Code className="w-5 h-5 mr-2" />
                Browse Problems
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Performance Insights */}
      {userStats && currentUserRank && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Difficulty Breakdown</h3>
              <Target className="w-6 h-6 text-blue-500" />
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-600 dark:text-green-400 font-medium">Easy</span>
                  <span className="font-semibold">{userStats.difficultyBreakdown?.easy || 0}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (userStats.difficultyBreakdown?.easy || 0) * 2)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">Medium</span>
                  <span className="font-semibold">{userStats.difficultyBreakdown?.medium || 0}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (userStats.difficultyBreakdown?.medium || 0) * 3)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-600 dark:text-red-400 font-medium">Hard</span>
                  <span className="font-semibold">{userStats.difficultyBreakdown?.hard || 0}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (userStats.difficultyBreakdown?.hard || 0) * 5)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Success Rate</h3>
              <Zap className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - getAccuracyRate() / 100)}`}
                    className="text-green-500 transition-all duration-1000"
                  />
                </svg>
                <span className="absolute text-3xl font-bold">{getAccuracyRate()}%</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {userStats.acceptedSubmissions} of {userStats.totalSubmissions} submissions accepted
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <Calendar className="w-6 h-6 text-purple-500" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-sm font-medium">This Week</span>
                </div>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {userStats.weeklyActivity || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-purple-500 mr-2" />
                  <span className="text-sm font-medium">This Month</span>
                </div>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {userStats.monthlyActivity || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center">
                  <Zap className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium">All Time</span>
                </div>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {userStats.problemsSolved || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Time Frame
              </label>
              <select
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all-time">All Time</option>
                <option value="monthly">This Month</option>
                <option value="weekly">This Week</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 flex items-center">
                <Medal className="w-4 h-4 mr-1" />
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="rating">Rating</option>
                <option value="problems">Problems Solved</option>
                <option value="contests">Contests Participated</option>
              </select>
            </div>
          </div>
          <div className="w-full lg:w-96">
            <label className="text-sm font-medium mb-2 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Search User
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Problems
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Contests
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Badge
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                      <div className="text-gray-500">Loading leaderboard...</div>
                    </div>
                  </td>
                </tr>
              ) : filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <div className="text-gray-500">No users found</div>
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((leaderUser) => (
                  <tr 
                    key={leaderUser.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      leaderUser.username === user?.username 
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-l-4 border-blue-500' 
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-2xl font-bold">
                        {getRankIcon(leaderUser.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 font-semibold text-lg ${
                          leaderUser.rank <= 3 
                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' 
                            : 'bg-gradient-to-br from-blue-400 to-purple-500 text-white'
                        }`}>
                          {leaderUser.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white text-lg">
                            {leaderUser.username}
                            {leaderUser.username === user?.username && (
                              <span className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded-full">You</span>
                            )}
                          </div>
                          {leaderUser.country && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {leaderUser.country}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className={`text-xl font-bold ${getRatingColor(leaderUser.rating)}`}>
                            {leaderUser.rating}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                            Max: {leaderUser.max_rating}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Code className="w-5 h-5 text-blue-500 mr-2" />
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {leaderUser.problems_solved}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {leaderUser.contests_participated}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {leaderUser.badge && (
                        <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${getBadgeColor(leaderUser.badge)}`}>
                          {leaderUser.badge}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {new Date(leaderUser.last_active).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rating System Legend */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center">
          <Award className="w-6 h-6 mr-2 text-yellow-500" />
          Rating System & Badges
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-2">
              <Medal className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-red-600 dark:text-red-400">Grandmaster</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">2400+</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-2">
              <Award className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">Master</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">2100+</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-2">
              <Star className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">Candidate</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">1900+</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-2">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Expert</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">1600+</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">Specialist</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">1400+</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border-2 border-gray-200 dark:border-gray-800">
            <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center mb-2">
              <Code className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Pupil</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">&lt;1400</span>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-center text-white">
        <h3 className="text-2xl font-bold mb-3">Ready to Climb the Ranks?</h3>
        <p className="mb-6 text-blue-100">
          Practice daily, participate in contests, and watch your rating soar!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/problems" 
            className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            <Code className="w-5 h-5 mr-2" />
            Solve Problems
          </Link>
          <Link 
            to="/contests" 
            className="inline-flex items-center justify-center px-8 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition border-2 border-white/30"
          >
            <Trophy className="w-5 h-5 mr-2" />
            Join Contests
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage
