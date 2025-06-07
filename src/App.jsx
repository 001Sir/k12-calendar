import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './i18n/config'
import useAuthStore from './store/authStore'
import ErrorBoundary from './components/common/ErrorBoundary'
import RoleBasedRoute from './components/auth/RoleBasedRoute'

// Public Pages
import Homepage from './pages/public/Homepage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import EventsExplore from './pages/events/EnhancedEventsExplore'
import ResetPassword from './pages/auth/ResetPassword'
import AuthCallback from './pages/auth/AuthCallback'

// Dashboard Pages
import SchoolDashboard from './pages/dashboard/SchoolDashboardUpdated'
import ParentDashboard from './pages/dashboard/ParentDashboardEnhanced'
import TeacherDashboard from './pages/dashboard/TeacherDashboardUpdated'

// Event Pages
import EventCreate from './pages/events/SophisticatedEventCreate'
import EventDetails from './pages/events/AdvancedEventDetails'
import EventEdit from './pages/events/EventEdit'
import EventCheckIn from './pages/events/EventCheckIn'

// Feature Pages
import Profile from './pages/profile/EnhancedProfile'
import Tickets from './pages/tickets/RichTicketsPage'
import CalendarPage from './pages/calendar/RevolutionaryCalendar'
import Settings from './pages/settings/AdvancedSettingsSimple'
import Help from './pages/help/AIHelpCenter'

// Public Route Component - Redirects to dashboard if already logged in
function PublicRoute({ children }) {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Redirect to dashboard if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Role-based Dashboard Router
function DashboardRouter() {
  const { profile, loading } = useAuthStore()

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Route to appropriate dashboard based on role
  switch (profile.role) {
    case 'school_admin':
    case 'district_admin':
      return <SchoolDashboard />
    case 'teacher':
      return <TeacherDashboard />
    case 'parent':
    case 'student':
      return <ParentDashboard />
    default:
      return <Navigate to="/" replace />
  }
}

function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Homepage />} />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } 
          />
          <Route path="/explore" element={<EventsExplore />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Event Details - Public route */}
          <Route path="/events/:id" element={<EventDetails />} />
          
          {/* Protected Routes - Require Authentication */}
          <Route
            path="/dashboard"
            element={
              <RoleBasedRoute>
                <DashboardRouter />
              </RoleBasedRoute>
            }
          />
          
          {/* Event Management - School Admin & Teachers Only */}
          <Route
            path="/events/create"
            element={
              <RoleBasedRoute allowedRoles={['school_admin', 'district_admin', 'teacher']}>
                <EventCreate />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/events/:id/edit"
            element={
              <RoleBasedRoute allowedRoles={['school_admin', 'district_admin', 'teacher']}>
                <EventEdit />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/events/:id/checkin"
            element={
              <RoleBasedRoute allowedRoles={['school_admin', 'district_admin', 'teacher']}>
                <EventCheckIn />
              </RoleBasedRoute>
            }
          />
          
          {/* User Features - All Authenticated Users */}
          <Route
            path="/profile"
            element={
              <RoleBasedRoute>
                <Profile />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <RoleBasedRoute>
                <Profile />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <RoleBasedRoute>
                <Tickets />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <RoleBasedRoute>
                <CalendarPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <RoleBasedRoute>
                <Settings />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/help"
            element={
              <RoleBasedRoute>
                <Help />
              </RoleBasedRoute>
            }
          />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App