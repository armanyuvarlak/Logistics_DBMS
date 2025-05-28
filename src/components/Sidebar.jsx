import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  HomeIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  ArrowLeftOnRectangleIcon,
  CircleStackIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline'

const Sidebar = ({ isOpen }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [expandedItems, setExpandedItems] = useState({
    offers: true,
    reviewOffers: false
  })
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
    if (path.includes('/offer')) return 'offers'
    if (path.includes('/database')) return 'database'
    return 'offers'
  }

  const getActiveSubPage = (path) => {
    if (path.includes('/single-offer')) return 'single-offer'
    if (path.includes('/multiple-offer')) return 'multiple-offer'
    if (path.includes('/review-offers')) return 'review-offers'
    return ''
  }
  
  const getActiveReviewTab = (path) => {
    if (path.includes('/review-offers/general')) return 'general'
    if (path.includes('/review-offers/client')) return 'client'
    if (path.includes('/review-offers/by-date')) return 'by-date'
    if (path.includes('/review-offers/approval')) return 'approval'
    if (path.includes('/review-offers/origin')) return 'origin'
    if (path.includes('/review-offers/destination')) return 'destination'
    if (path.includes('/review-offers/lane-pair')) return 'lane-pair'
    return 'general'
  }
  
  const activePage = getActivePage(location.pathname)
  const activeSubPage = getActiveSubPage(location.pathname)
  const activeReviewTab = getActiveReviewTab(location.pathname)

  const toggleExpand = (item) => {
    setExpandedItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }))
  }

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
      name: 'Home',
      path: '/',
      icon: HomeIcon,
      subItems: [
        {
          name: 'Single Offer',
          path: '/offer/single-offer',
          icon: CalculatorIcon
        },
        {
          name: 'Multiple Offer',
          path: '/offer/multiple-offer',
          icon: CalculatorIcon
        },
        {
          name: 'Review Offers',
          isDropdownOnly: true,
          subItems: [
            {
              name: 'General',
              path: '/offer/review-offers/general'
            },
            {
              name: 'Client',
              path: '/offer/review-offers/client'
            },
            {
              name: 'By Date',
              path: '/offer/review-offers/by-date'
            },
            {
              name: 'Approval',
              path: '/offer/review-offers/approval'
            },
            {
              name: 'Origin',
              path: '/offer/review-offers/origin'
            },
            {
              name: 'Destination',
              path: '/offer/review-offers/destination'
            },
            {
              name: 'Lane Pair',
              path: '/offer/review-offers/lane-pair'
            }
          ]
        }
      ]
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
                    {item.subItems ? (
                      <div 
                        className="flex items-center space-x-3 w-full"
                        onClick={() => toggleExpand(item.name.toLowerCase())}
                      >
                        <item.icon className="w-6 h-6" />
                        <span className="font-medium text-lg">{item.name}</span>
                      </div>
                    ) : (
                      item.name === 'Database' ? (
                        <div 
                          className="flex items-center space-x-3 w-full"
                          onClick={handleDatabaseClick}
                        >
                          <item.icon className="w-5 h-5" />
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
                      )
                    )}
                    
                    {item.subItems && (
                      <svg 
                        className={`w-5 h-5 transform transition-transform ${expandedItems[item.name.toLowerCase()] ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        onClick={() => toggleExpand(item.name.toLowerCase())}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                  
                  {item.subItems && expandedItems[item.name.toLowerCase()] && (
                    <div className="ml-4 mt-2 border-l-2 border-gray-700 pl-4 space-y-2">
                      {item.subItems.map(subItem => (
                        <div key={subItem.name} className="my-2">
                          {subItem.isDropdownOnly ? (
                            <div 
                              className={`flex items-center justify-between py-2 px-2 rounded text-sm transition-colors duration-200 cursor-pointer ${
                                activeSubPage === subItem.name.toLowerCase().replace(' ', '-')
                                  ? 'text-blue-400 bg-slate-700'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                              onClick={() => toggleExpand('reviewOffers')}
                            >
                              <span>{subItem.name}</span>
                              <svg 
                                className={`w-3 h-3 transform transition-transform ${expandedItems.reviewOffers ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          ) : (
                            <Link
                              to={subItem.path}
                              className={`flex items-center py-2 px-2 rounded text-sm transition-colors duration-200 ${
                                activeSubPage === subItem.name.toLowerCase().replace(' ', '-')
                                  ? 'text-blue-400 bg-slate-700'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              {subItem.name}
                            </Link>
                          )}
                          
                          {subItem.name === 'Review Offers' && expandedItems.reviewOffers && (
                            <div className="ml-4 mt-3 mb-3 border-l border-gray-700 pl-3 space-y-3">
                              {subItem.subItems.map(reviewTab => (
                                <Link
                                  key={reviewTab.name}
                                  to={reviewTab.path}
                                  className={`flex items-center py-2 px-2 rounded text-xs transition-colors duration-200 ${
                                    activeReviewTab === reviewTab.name.toLowerCase().replace(' ', '-')
                                      ? 'text-blue-400 bg-slate-700'
                                      : 'text-gray-500 hover:text-white'
                                  }`}
                                >
                                  {reviewTab.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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