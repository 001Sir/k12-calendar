import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RoleBasedRoute from '../../components/auth/RoleBasedRoute'
import useAuthStore from '../../store/authStore'

vi.mock('../../store/authStore')

// Mock components for testing
const PublicComponent = () => <div>Public Content</div>
const ProtectedComponent = () => <div>Protected Content</div>
const TeacherOnlyComponent = () => <div>Teacher Only Content</div>
const AdminOnlyComponent = () => <div>Admin Only Content</div>
const LoginPage = () => <div>Login Page</div>
const DashboardPage = () => <div>Dashboard Page</div>

describe('Route Protection', () => {
  const renderWithRouter = (initialEntries = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/public" element={<PublicComponent />} />
          <Route
            path="/protected"
            element={
              <RoleBasedRoute>
                <ProtectedComponent />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/teacher-only"
            element={
              <RoleBasedRoute allowedRoles={['teacher', 'school_admin']}>
                <TeacherOnlyComponent />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin-only"
            element={
              <RoleBasedRoute allowedRoles={['school_admin', 'district_admin']}>
                <AdminOnlyComponent />
              </RoleBasedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Unauthenticated Users', () => {
    beforeEach(() => {
      useAuthStore.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
      })
    })

    it('should access public routes', () => {
      renderWithRouter(['/public'])
      expect(screen.getByText('Public Content')).toBeInTheDocument()
    })

    it('should redirect to login from protected routes', async () => {
      renderWithRouter(['/protected'])
      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument()
      })
    })

    it('should redirect to login from role-specific routes', async () => {
      renderWithRouter(['/teacher-only'])
      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument()
      })
    })
  })

  describe('Parent Users', () => {
    beforeEach(() => {
      useAuthStore.mockReturnValue({
        user: { id: 'user-123' },
        profile: { id: 'user-123', role: 'parent' },
        loading: false,
      })
    })

    it('should access general protected routes', () => {
      renderWithRouter(['/protected'])
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should be redirected from teacher-only routes', async () => {
      renderWithRouter(['/teacher-only'])
      await waitFor(() => {
        expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
      })
    })

    it('should be redirected from admin-only routes', async () => {
      renderWithRouter(['/admin-only'])
      await waitFor(() => {
        expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
      })
    })
  })

  describe('Teacher Users', () => {
    beforeEach(() => {
      useAuthStore.mockReturnValue({
        user: { id: 'teacher-123' },
        profile: { id: 'teacher-123', role: 'teacher' },
        loading: false,
      })
    })

    it('should access teacher routes', () => {
      renderWithRouter(['/teacher-only'])
      expect(screen.getByText('Teacher Only Content')).toBeInTheDocument()
    })

    it('should be redirected from admin-only routes', async () => {
      renderWithRouter(['/admin-only'])
      await waitFor(() => {
        expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
      })
    })
  })

  describe('School Admin Users', () => {
    beforeEach(() => {
      useAuthStore.mockReturnValue({
        user: { id: 'admin-123' },
        profile: { id: 'admin-123', role: 'school_admin' },
        loading: false,
      })
    })

    it('should access all routes', () => {
      renderWithRouter(['/teacher-only'])
      expect(screen.getByText('Teacher Only Content')).toBeInTheDocument()

      renderWithRouter(['/admin-only'])
      expect(screen.getByText('Admin Only Content')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner while checking auth', () => {
      useAuthStore.mockReturnValue({
        user: null,
        profile: null,
        loading: true,
      })

      renderWithRouter(['/protected'])
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('usePermissions Hook', () => {
    it('should return correct permissions for parent', () => {
      const { usePermissions } = require('../../components/auth/RoleBasedRoute')
      
      useAuthStore.mockReturnValue({
        profile: { role: 'parent' },
      })

      const permissions = usePermissions()
      
      expect(permissions.canCreateEvents).toBe(false)
      expect(permissions.canEditAllEvents).toBe(false)
      expect(permissions.canManageSchool).toBe(false)
      expect(permissions.isParent).toBe(true)
      expect(permissions.isTeacher).toBe(false)
    })

    it('should return correct permissions for teacher', () => {
      const { usePermissions } = require('../../components/auth/RoleBasedRoute')
      
      useAuthStore.mockReturnValue({
        profile: { role: 'teacher' },
      })

      const permissions = usePermissions()
      
      expect(permissions.canCreateEvents).toBe(true)
      expect(permissions.canEditAllEvents).toBe(false)
      expect(permissions.canManageStudents).toBe(true)
      expect(permissions.isTeacher).toBe(true)
      expect(permissions.isSchoolAdmin).toBe(false)
    })

    it('should return correct permissions for school admin', () => {
      const { usePermissions } = require('../../components/auth/RoleBasedRoute')
      
      useAuthStore.mockReturnValue({
        profile: { role: 'school_admin' },
      })

      const permissions = usePermissions()
      
      expect(permissions.canCreateEvents).toBe(true)
      expect(permissions.canEditAllEvents).toBe(true)
      expect(permissions.canManageSchool).toBe(true)
      expect(permissions.canViewAnalytics).toBe(true)
      expect(permissions.isSchoolAdmin).toBe(true)
    })
  })
})