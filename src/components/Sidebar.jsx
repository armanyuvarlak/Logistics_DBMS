import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  DocumentTextIcon, 
  ArrowLeftOnRectangleIcon,
  CircleStackIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline'

const Sidebar = ({ isOpen }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  
  // Check if database access is authorized
  const hasDBAccess = () => {
    const dbAccessTime = localStorage.getItem('dbAccessTime')
    const dbAccessExpiry = localStorage.getItem('dbAccessExpiry')
    
    if (!dbAccessTime || !dbAccessExpiry) return false
    
    const now = new Date().getTime()
    return now < parseInt(dbAccessExpiry)
  }
  
  // Generate a weekly password based on the current week
  const generateWeeklyPassword = () => {
    const today = new Date()
    
    // Get the first day of the current week (Sunday)
    const firstDayOfWeek = new Date(today)
    const dayOfWeek = today.getDay()
    firstDayOfWeek.setDate(today.getDate() - dayOfWeek)
    
    // Get year
    const year = firstDayOfWeek.getFullYear()
    
    // Calculate week number (1-52)
    const oneJan = new Date(year, 0, 1)
    const numberOfDays = Math.floor((firstDayOfWeek - oneJan) / (24 * 60 * 60 * 1000))
    const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7)
    
    // Reverse the year digits
    const reverseYear = year.toString().split('').reverse().join('')
    
    // Generate the final password: TRdb + week number + reverse year
    return `TRdb${weekNumber}${reverseYear}`
  }
  
  // Handle database access
  const handleDatabaseAccess = (e) => {
    e.preventDefault()
    
    if (password === generateWeeklyPassword()) {
      // Set access for one week
      const now = new Date().getTime()
      // 7 days in milliseconds
      const expiryTime = now + (7 * 24 * 60 * 60 * 1000)
      
      localStorage.setItem('dbAccessTime', now.toString())
      localStorage.setItem('dbAccessExpiry', expiryTime.toString())
      
      setShowPasswordModal(false)
      setPassword("")
      setErrorMessage("")
      navigate('/database')
    } else {
      setErrorMessage("Invalid password. Please try again.")
    }
  }
  
  const getActivePage = (path) => {
    if (path.includes('/offer/single-offer')) return 'offer preparation'
    if (path.includes('/offer/review-offers')) return 'review offers'
    if (path.includes('/database')) return 'database'
    return 'offer preparation'
  }


  

  
  const activePage = getActivePage(location.pathname)

  const handleDatabaseClick = (e) => {
    e.preventDefault()
    if (hasDBAccess()) {
      navigate('/database')
    } else {
      setShowPasswordModal(true)
    }
  }

  const navigationItems = [
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
  ]

  return (
    <>
      <aside 
        className={`sidebar-container bg-slate-800 text-white w-64 h-screen fixed transform transition-transform duration-200 ease-in-out z-20 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col overflow-hidden`}
      >
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 transparent' }}>
          <div className="p-4 pt-24 pb-16">
            <nav className="space-y-4 mb-16">
              {navigationItems.map((item) => (
                <div key={item.name} className="flex flex-col mb-5">
                  <div 
                    className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 cursor-pointer ${
                      activePage === item.name.toLowerCase()
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {item.name === 'Database' ? (
                      <div 
                        className="flex items-center space-x-3 w-full"
                        onClick={handleDatabaseClick}
                      >
                        <item.icon className="w-6 h-6" />
                        <span className="font-medium text-lg">{item.name}</span>
                      </div>
                    ) : (
                      <Link 
                        to={item.path}
                        className="flex items-center space-x-3 w-full"
                      >
                        <item.icon className="w-6 h-6" />
                        <span className="font-medium text-lg">{item.name}</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      </aside>
      
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-80 max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Database Access</h3>
            <p className="text-sm text-gray-600 mb-4">Please enter the access password to continue.</p>
            
            <form onSubmit={handleDatabaseAccess}>
              <div className="mb-4">
                <input
                  type="password"
                  placeholder="Enter password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {errorMessage && (
                  <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Submit
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