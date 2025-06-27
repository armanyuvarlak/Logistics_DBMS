import React, { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import SingleOfferPage from './pages/SingleOfferPage'
import DatabasePage from './pages/DatabasePage'
import ResultsPage from './pages/ResultsPage'
import LoginPage from './pages/LoginPage'

import ReviewOffersPage from './pages/ReviewOffersPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isEmailVerified, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  // Check both authentication and email verification
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  // If user is authenticated but email is not verified, redirect to login
  if (!isEmailVerified) {
    return <Navigate to="/login" />
  }

  return children
}

// Layout component with sidebar
const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isAuthenticated } = useAuth()

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev)
  }, [])

  // Close sidebar when clicking outside
  useEffect(() => {
    if (!isSidebarOpen) return

    const handleClickOutside = (event) => {
      // Check if the clicked element is the menu button or any of its children
      if (event.target.closest('button.menu-button')) {
        return // Don't close if clicking the menu button
      }

      // Check if the clicked element is inside the sidebar
      if (event.target.closest('.sidebar-container')) {
        return // Don't close if clicking inside the sidebar
      }

      // Close the sidebar if clicking anywhere else
      setIsSidebarOpen(false)
    }

    // Add event listener after a small delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true)
    }, 50)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside, true)
    }
  }, [isSidebarOpen])

  if (!isAuthenticated) {
    return children
  }

  return (
    <div className="App flex h-screen bg-neutral-50">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-x-auto overflow-y-auto bg-neutral-100">
          {children}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Redirect root to offers page */}
          <Route
            path="/"
            element={<Navigate to="/offer/single-offer" />}
          />

          {/* Offer Preparation page */}
          <Route
            path="/offer/single-offer"
            element={
              <ProtectedRoute>
                <SingleOfferPage />
              </ProtectedRoute>
            }
          />

          {/* Results page for offers */}
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <ResultsPage />
              </ProtectedRoute>
            }
          />



          {/* Review Offers pages */}
          <Route
            path="/offer/review-offers/:tab"
            element={
              <ProtectedRoute>
                <ReviewOffersPage />
              </ProtectedRoute>
            }
          />

          {/* Database page */}
          <Route
            path="/database"
            element={
              <ProtectedRoute>
                <DatabasePage />
              </ProtectedRoute>
            }
          />


        </Routes>
      </Layout>
    </AuthProvider>
  )
}

export default App 
