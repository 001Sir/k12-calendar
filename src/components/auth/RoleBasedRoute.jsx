import React from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import LoadingSpinner from '../common/LoadingSpinner'

/**
 * RoleBasedRoute - Protects routes based on user roles
 * @param {Array} allowedRoles - Array of allowed roles for this route
 * @param {React.Component} children - Component to render if authorized
 * @param {String} redirectTo - Path to redirect if unauthorized (default: /dashboard)
 */
export default function RoleBasedRoute({ allowedRoles = [], children, redirectTo = '/dashboard' }) {
  const { user, profile, loading } = useAuthStore()

  // Show loading spinner while checking auth
  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If no specific roles required, just need to be authenticated
  if (allowedRoles.length === 0) {
    return children
  }

  // Check if user has one of the allowed roles
  const hasAllowedRole = allowedRoles.includes(profile?.role)

  // Redirect if user doesn't have required role
  if (!hasAllowedRole) {
    console.warn(`Access denied: User role '${profile?.role}' not in allowed roles:`, allowedRoles)
    return <Navigate to={redirectTo} replace />
  }

  return children
}

// Helper function to check if user has permission for specific actions
export function usePermissions() {
  const { profile } = useAuthStore()
  
  return {
    canCreateEvents: ['school_admin', 'district_admin', 'teacher'].includes(profile?.role),
    canEditAllEvents: ['school_admin', 'district_admin'].includes(profile?.role),
    canManageSchool: ['school_admin', 'district_admin'].includes(profile?.role),
    canViewAnalytics: ['school_admin', 'district_admin'].includes(profile?.role),
    canManageStudents: ['school_admin', 'teacher'].includes(profile?.role),
    canViewAllStudents: ['school_admin', 'district_admin'].includes(profile?.role),
    isParent: profile?.role === 'parent',
    isTeacher: profile?.role === 'teacher',
    isSchoolAdmin: profile?.role === 'school_admin',
    isDistrictAdmin: profile?.role === 'district_admin',
  }
}