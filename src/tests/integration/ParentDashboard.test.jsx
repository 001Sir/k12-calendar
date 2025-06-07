import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import ParentDashboardEnhanced from '../../pages/dashboard/ParentDashboardEnhanced'
import useAuthStore from '../../store/authStore'
import { supabase } from '../../lib/supabase'

// Mock hooks
vi.mock('../../store/authStore')
vi.mock('../../hooks/useStudents', () => ({
  useStudents: () => ({
    students: [
      {
        id: 'student-1',
        first_name: 'Emma',
        last_name: 'Johnson',
        grade_level: '5',
        school_id: 'school-1',
        current_gpa: 3.8,
        attendance_rate: 96,
      },
      {
        id: 'student-2',
        first_name: 'Michael',
        last_name: 'Johnson',
        grade_level: '3',
        school_id: 'school-1',
        current_gpa: 3.9,
        attendance_rate: 98,
      },
    ],
    loading: false,
    error: null,
  }),
}))

vi.mock('../../hooks/useCommunications', () => ({
  useCommunications: () => ({
    communications: [
      {
        id: 'comm-1',
        subject: 'Field Trip Permission',
        message: 'Please sign the permission slip',
        priority: 'urgent',
        category: 'permission',
        read_at: null,
        created_at: '2024-02-10T10:00:00Z',
        sender: { full_name: 'Mrs. Smith' },
      },
    ],
    unreadCount: 1,
    loading: false,
    markAsRead: vi.fn(),
  }),
}))

vi.mock('../../hooks/useAcademicRecords', () => ({
  useAcademicRecords: () => ({
    records: [],
    summary: {
      currentGpa: 3.8,
      averageGpa: 3.75,
      currentAttendance: 96,
      averageAttendance: 95,
    },
  }),
}))

vi.mock('../../hooks/useLunchAccounts', () => ({
  useLunchAccounts: () => ({
    accounts: [
      { student_id: 'student-1', balance: 25.50 },
      { student_id: 'student-2', balance: 3.25 },
    ],
    totalBalance: 28.75,
    lowBalanceAccounts: [{ student_id: 'student-2', balance: 3.25 }],
    addFunds: vi.fn(),
  }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Parent Dashboard Integration', () => {
  const mockUser = { id: 'user-123' }
  const mockProfile = { 
    id: 'user-123',
    full_name: 'John Johnson',
    role: 'parent',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.mockReturnValue({ user: mockUser, profile: mockProfile })
    
    // Mock supabase events query
    supabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ 
                data: [
                  {
                    id: 'event-1',
                    title: 'Science Fair',
                    start_time: '2024-02-20T10:00:00Z',
                    location: 'School Gym',
                  },
                ], 
                error: null 
              })),
            })),
          })),
        })),
      })),
    }))
  })

  const renderDashboard = () => {
    return act(() => render(
      <BrowserRouter>
        <ParentDashboardEnhanced />
      </BrowserRouter>
    ))
  }

  it('should render dashboard with user greeting', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('Welcome back, John!')).toBeInTheDocument()
    })
  })

  it('should display student statistics', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('Total Children')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('Average GPA')).toBeInTheDocument()
      expect(screen.getByText('3.85')).toBeInTheDocument()
      expect(screen.getByText('Lunch Balance')).toBeInTheDocument()
      expect(screen.getByText('$28.75')).toBeInTheDocument()
      expect(screen.getByText('1 account low')).toBeInTheDocument()
    })
  })

  it('should allow child selection', async () => {
    renderDashboard()

    await waitFor(() => {
      const selector = screen.getByRole('combobox')
      expect(selector).toBeInTheDocument()
    })

    const selector = screen.getByRole('combobox')
    fireEvent.change(selector, { target: { value: 'student-1' } })

    await waitFor(() => {
      expect(screen.getByText('Emma')).toBeInTheDocument()
    })
  })

  it('should display urgent communications', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('Important Communications')).toBeInTheDocument()
      expect(screen.getByText('1 urgent')).toBeInTheDocument()
      expect(screen.getByText('Field Trip Permission')).toBeInTheDocument()
      expect(screen.getByText('Please sign the permission slip')).toBeInTheDocument()
    })
  })

  it('should display upcoming events', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('Upcoming Events')).toBeInTheDocument()
      expect(screen.getByText('Science Fair')).toBeInTheDocument()
      expect(screen.getByText(/School Gym/)).toBeInTheDocument()
    })
  })

  it('should navigate to event details when event is clicked', async () => {
    renderDashboard()

    await waitFor(() => {
      const event = screen.getByText('Science Fair').closest('div[role="button"]') || 
                    screen.getByText('Science Fair').closest('div.cursor-pointer')
      expect(event).toBeInTheDocument()
      fireEvent.click(event)
    })

    expect(mockNavigate).toHaveBeenCalledWith('/events/event-1')
  })

  it('should handle quick actions', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    })

    // Test Report Absence action
    const absenceButton = screen.getByText('Report Absence')
    await act(async () => {
      fireEvent.click(absenceButton)
    })

    // Test Update Info action
    const updateButton = screen.getByText('Update Info')
    await act(async () => {
      fireEvent.click(updateButton)
    })
    expect(mockNavigate).toHaveBeenCalledWith('/profile')
  })

  it('should show calendar navigation', async () => {
    renderDashboard()

    await waitFor(() => {
      const calendarButton = screen.getByText('View Calendar →')
      expect(calendarButton).toBeInTheDocument()
      fireEvent.click(calendarButton)
    })

    expect(mockNavigate).toHaveBeenCalledWith('/calendar')
  })

  it('should show empty state when no students', async () => {
    // Override the mock for this test
    vi.doMock('../../hooks/useStudents', () => ({
      useStudents: () => ({
        students: [],
        loading: false,
        error: null,
      }),
    }))

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('No Children Found')).toBeInTheDocument()
      expect(screen.getByText('Add your children to start using the parent dashboard.')).toBeInTheDocument()
    })
  })

  it('should display loading state', async () => {
    // Override the mock for this test
    vi.doMock('../../hooks/useStudents', () => ({
      useStudents: () => ({
        students: [],
        loading: true,
        error: null,
      }),
    }))

    renderDashboard()

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
  })
})