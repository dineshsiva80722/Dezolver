import { useState, useEffect, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNavbar from './TopNavbar'
import GenerateCertificateModal from '@components/certificates/GenerateCertificateModal'
import { config } from '@/config'
import { cn } from '@utils/cn'

interface EliteLayoutProps {
  children: ReactNode
}

const EliteLayout = ({ children }: EliteLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false) // Start with sidebar closed on mobile, will check screen size
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // For desktop collapse
  const [showGenerateCert, setShowGenerateCert] = useState(false)

  // Close sidebar when clicking outside on mobile
  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  // Toggle sidebar for mobile
  const handleSidebarToggle = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }
  const location = useLocation()

  // Set initial sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    
    handleResize() // Set initial state
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Don't show sidebar on auth pages
  const isAuthPage = ['/login', '/register'].includes(location.pathname)

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        {children}
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        isCollapsed={sidebarCollapsed}
        onClose={handleSidebarClose} 
        onToggle={handleSidebarToggle} 
      />

      {/* Main content area */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-72"
      )}>
        {/* Top navbar */}
        <TopNavbar onMenuClick={handleSidebarToggle} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} {config.app.name}. Elite Platform v{config.app.version}
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <span>🟢 All systems operational</span>
              <span>•</span>
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Generate Certificate Modal */}
      <GenerateCertificateModal 
        isOpen={showGenerateCert} 
        onClose={() => setShowGenerateCert(false)} 
      />
    </div>
  )
}

export default EliteLayout