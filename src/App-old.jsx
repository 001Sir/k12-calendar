import React, { useEffect, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './i18n/config'
import useAuthStore from './store/authStore'
import ErrorBoundary from './components/common/ErrorBoundary'

// Public Pages
import Homepage from './pages/public/Homepage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import EventsExplore from './pages/events/EnhancedEventsExplore'
import ResetPassword from './pages/auth/ResetPassword'
import AuthCallback from './pages/auth/AuthCallback'

// Dashboard Pages
import SchoolDashboard from './pages/dashboard/RichSchoolDashboard'
import ParentDashboard from './pages/dashboard/ParentDashboardEnhanced'
import TeacherDashboard from './pages/dashboard/TeacherDashboardNew'

// Event Pages
import EventCreate from './pages/events/SophisticatedEventCreate'
import EventDetails from './pages/events/AdvancedEventDetails'
import EventEdit from './pages/events/EventEdit'
import EventCheckIn from './pages/events/EventCheckIn'

// Profile Pages
import Profile from './pages/profile/EnhancedProfile'

// Additional Pages
import Tickets from './pages/tickets/RichTicketsPage'
import Settings from './pages/settings/AdvancedSettingsSimple'
import CalendarPage from './pages/calendar/RevolutionaryCalendar'
import Help from './pages/help/AIHelpCenter'

// Protected Route Component
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, profile, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Role-based Dashboard Router
function DashboardRouter() {
  const { profile } = useAuthStore()

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  switch (profile.role) {
    case 'school_admin':
      return <SchoolDashboard />
    case 'district_admin':
      return <SchoolDashboard /> // Using school dashboard for now
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/explore" element={<EventsExplore />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />
        
        {/* Event Routes */}
        <Route path="/events/:id" element={<EventDetails />} />
        <Route
          path="/events/create"
          element={
            <ProtectedRoute allowedRoles={['school_admin', 'teacher']}>
              <EventCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['school_admin', 'teacher']}>
              <EventEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/checkin"
          element={
            <ProtectedRoute allowedRoles={['school_admin', 'teacher']}>
              <EventCheckIn />
            </ProtectedRoute>
          }
        />
        
        {/* Profile Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        
        {/* Additional Protected Routes */}
        <Route
          path="/tickets"
          element={
            <ProtectedRoute>
              <Tickets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
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
