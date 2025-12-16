import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { cn } from '@utils/cn'
import { config } from '@/config'
import {
  getModuleVisibility,
  getUserDisplayName,
  getUserRoleDisplay
} from '@utils/permissions'

interface SidebarProps {
  isOpen: boolean
  isCollapsed?: boolean
  onClose: () => void
  onToggle?: () => void
}

const Sidebar = ({ isOpen, isCollapsed = false, onClose, onToggle }: SidebarProps) => {
  const location = useLocation()
  const { isAuthenticated, user } = useAuthStore()
  const moduleVisibility = getModuleVisibility(user)

  const navigation = [
    {
      name: 'Leaderboard',
      href: '/leaderboard',
      icon: '🏆',
      show: true, // Always show leaderboard for all users
      description: 'Rankings & Performance'
    },
    {
      name: 'Assessments',
      href: '/assessments',
      icon: '📝',
      show: isAuthenticated,
      description: 'Tests & Quizzes'
    },
    {
      name: 'Problems',
      href: '/problems',
      icon: '🧩',
      show: moduleVisibility.problems,
      description: 'Coding challenges'
    },
    {
      name: 'Contests',
      href: '/contests',
      icon: '🏅',
      show: moduleVisibility.contests && config.features.contests,
      description: 'Competitive events'
    },
    {
      name: 'Groups',
      href: '/groups',
      icon: '👥',
      show: moduleVisibility.groups && config.features.groups,
      description: 'Study groups'
    }
  ]

  const hrModules = [
    {
      name: 'Certificates',
      href: '/certificates',
      icon: '🎓',
      show: moduleVisibility.certificates,
      description: 'Achievement certificates'
    },
    {
      name: 'Employees',
      href: '/employees',
      icon: '👤',
      show: moduleVisibility.employees,
      description: 'Employee directory'
    },
    {
      name: 'Payroll',
      href: '/payroll',
      icon: '💰',
      show: moduleVisibility.payroll,
      description: 'Salary management'
    },
    {
      name: 'Bank Details',
      href: '/bank-details',
      icon: '🏦',
      show: moduleVisibility.bankDetails,
      description: 'Banking information'
    },
    {
      name: 'Subscription',
      href: '/subscription',
      icon: '💳',
      show: moduleVisibility.subscription,
      description: 'Plan & Billing'
    }
  ]

  const adminModules = [
    {
      name: 'Admin Console',
      href: '/admin',
      icon: '⚙️',
      show: moduleVisibility.adminConsole,
      description: 'System administration'
    },
    {
      name: 'Super Admin',
      href: '/super-admin',
      icon: '👑',
      show: user?.role === 'super_admin',
      description: 'Manage admins & platform'
    },
    {
      name: 'Manage Managers',
      href: '/admin/managers',
      icon: '👥',
      show: user?.role === 'admin',
      description: 'Create & manage managers'
    },
    {
      name: 'HR Management',
      href: '/admin/hr',
      icon: '🏢',
      show: moduleVisibility.hrAdmin,
      description: 'HR operations'
    },
    {
      name: 'Certificate Admin',
      href: '/admin/certificates',
      icon: '🎖️',
      show: moduleVisibility.certificateAdmin,
      description: 'Certificate management'
    }
  ]

  const managerModules = [
    {
      name: 'My Students',
      href: '/manager/students',
      icon: '🎓',
      show: user?.role === 'manager',
      description: 'Manage your students'
    }
  ]

  const isActive = (path: string) => location.pathname === path

  const NavSection = ({ title, items }: { title: string; items: typeof navigation }) => (
    <div className="mb-8">
      {!isCollapsed && (
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
          {title}
        </h3>
      )}
      <nav className="space-y-1">
        {items.map((item) => 
          item.show ? (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                'group flex items-center text-sm font-medium rounded-lg transition-all duration-200',
                isCollapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2',
                isActive(item.href)
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
              )}
            >
              <span className={cn("text-lg", !isCollapsed && "mr-3")}>{item.icon}</span>
              {!isCollapsed && (
                <>
                  <div className="flex-1">
                    <div>{item.name}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                  {isActive(item.href) && (
                    <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                  )}
                </>
              )}
            </Link>
          ) : null
        )}
      </nav>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-[70] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-72',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn(
            "flex items-center h-16 border-b border-gray-200 dark:border-gray-700",
            isCollapsed ? "justify-center px-2" : "justify-between px-6"
          )}>
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              {!isCollapsed && (
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">{config.app.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Elite Platform</div>
                </div>
              )}
            </Link>
            
            {/* Toggle button - always visible on desktop */}
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onToggle || onClose}
                  className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Collapse Sidebar"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <button
                  onClick={onClose}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Close Sidebar"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Expand button when collapsed */}
          {isCollapsed && (
            <div className="px-2 py-2">
              <button
                onClick={onToggle}
                className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Expand Sidebar"
              >
                <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Navigation */}
          <div className={cn(
            "flex-1 py-6 overflow-y-auto scrollbar-hide",
            isCollapsed ? "px-1" : "px-3"
          )}>
            <NavSection title="Platform" items={navigation} />
            {managerModules.some(item => item.show) && (
              <NavSection title="Manager" items={managerModules} />
            )}
            {hrModules.some(item => item.show) && (
              <NavSection title="HR & Finance" items={hrModules} />
            )}
            {adminModules.some(item => item.show) && (
              <NavSection title="Administration" items={adminModules} />
            )}
          </div>

          {/* User Profile */}
          {isAuthenticated && user && (
            <div className={cn(
              "border-t border-gray-200 dark:border-gray-700",
              isCollapsed ? "p-2" : "p-4"
            )}>
              <Link
                to="/profile"
                title={isCollapsed ? `${getUserDisplayName(user)} - ${getUserRoleDisplay(user)}` : undefined}
                className={cn(
                  "flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                  isCollapsed ? "justify-center p-2" : "space-x-3 p-3"
                )}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {getUserDisplayName(user).charAt(0).toUpperCase()}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {getUserDisplayName(user)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {getUserRoleDisplay(user)}
                    </div>
                  </div>
                )}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Sidebar