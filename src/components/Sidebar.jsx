import React, { useState, useCallback, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  DocumentTextIcon, 
  ArrowLeftOnRectangleIcon,
  CircleStackIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline'
import { validatePassword, hasDBAccess, grantDBAccess } from '../utils/authUtils'

const Sidebar = ({ isOpen }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Memoize navigation items to prevent recreation
  const navigationItems = useMemo(() => [
    {
      name: 'Offer Preparation',
      path: '/offer/single-offer',
      icon: CalculatorIcon
    },
    {
      name: 'Review Offers',
      path: '/offer/review-offers/general',
      icon: DocumentTextIcon
    },
    {
      name: 'Database',
      path: '/database',
      icon: CircleStackIcon,
      requiresAuth: true
    },
    {
      name: 'Logout',
      path: '/logout',
      icon: ArrowLeftOnRectangleIcon,
      requiresAuth: true
    }
  ], [])
  
  // Memoize active page calculation
  const activePage = useMemo(() => {
    const path = location.pathname
    if (path.includes('/offer/single-offer')) return 'offer preparation'
    if (path.includes('/offer/review-offers')) return 'review offers'
    if (path.includes('/database')) return 'database'
    return 'offer preparation'
  }, [location.pathname])
  
  // Handle database access with improved security
  const handleDatabaseAccess = useCallback(async (e) => {
    e.preventDefault()
    
    if (isSubmitting) return
    setIsSubmitting(true)
    
    try {
      const validation = validatePassword(password, 'database-access')
      
      if (validation.success) {
        grantDBAccess()
        setShowPasswordModal(false)
        setPassword("")
        setErrorMessage("")
        navigate('/database')
      } else {
        setErrorMessage(validation.error)
        if (!validation.rateLimited) {
          setPassword("")
        }
      }
    } catch (error) {
      setErrorMessage("Authentication error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }, [password, navigate, isSubmitting])

  const handleDatabaseClick = useCallback((e) => {
    e.preventDefault()
    if (hasDBAccess()) {
      navigate('/database')
    } else {
      setShowPasswordModal(true)
      setPassword("")
      setErrorMessage("")
    }
  }, [navigate])

  const handleModalClose = useCallback(() => {
    setShowPasswordModal(false)
    setPassword("")
    setErrorMessage("")
  }, [])

  // Memoize rendered navigation items
  const renderedNavigationItems = useMemo(() => navigationItems.map((item) => {
    const isActive = item.name.toLowerCase() === activePage
    const Icon = item.icon
    
    if (item.name === 'Database') {
      return (
        <button
          key={item.name}
          onClick={handleDatabaseClick}
          className={`w-full text-left flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
            isActive
              ? 'bg-accent text-white shadow-md'
              : 'text-neutral-700 hover:bg-neutral-100 hover:text-primary'
          }`}
        >
          <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
          {item.name}
        </button>
      )
    }
    
    if (item.name === 'Logout') {
      return (
        <button
          key={item.name}
          onClick={() => navigate('/logout')}
          className="w-full text-left flex items-center px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-danger-50 hover:text-danger rounded-lg transition-all duration-200"
        >
          <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
          {item.name}
        </button>
      )
    }
    
    return (
      <Link
        key={item.name}
        to={item.path}
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
          isActive
            ? 'bg-accent text-white shadow-md'
            : 'text-neutral-700 hover:bg-neutral-100 hover:text-primary'
        }`}
      >
        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
        {item.name}
      </Link>
    )
  }), [navigationItems, activePage, handleDatabaseClick, navigate])

  return (
    <>
      <div className={`sidebar-container fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl border-r border-neutral-200 transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-center h-16 px-6 bg-primary border-b border-primary-700">
            <h1 className="text-xl font-semibold text-white tracking-wide">
              Logistics System
            </h1>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 mt-6 overflow-y-auto">
            <div className="px-3">
              <div className="space-y-1">
                {renderedNavigationItems}
              </div>
            </div>
          </nav>
          
          {/* Footer */}
          <div className="flex-shrink-0 border-t border-neutral-200 bg-neutral-50 p-4">
            <div className="text-xs text-neutral-500 text-center font-medium">
              © 2025 Logistics System
            </div>
          </div>
        </div>
      </div>

      {/* Database Access Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-80 max-w-md border border-neutral-200">
            <h3 className="text-lg font-semibold text-primary mb-3">Database Access</h3>
            <p className="text-sm text-neutral-600 mb-4">Please enter the access code to continue.</p>
            
            <form onSubmit={handleDatabaseAccess}>
              <div className="mb-4">
                <input
                  type="password"
                  placeholder="Enter access code"
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="off"
                  autoFocus
                />
                {errorMessage && (
                  <p className="text-danger text-xs mt-1" role="alert">{errorMessage}</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                  onClick={handleModalClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-700 transition-colors disabled:opacity-50 shadow-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Verifying...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar 