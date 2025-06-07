import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useStudents } from '../../hooks/useStudents'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'

// Mock the auth store
vi.mock('../../store/authStore')

describe('useStudents Hook', () => {
  const mockUser = { id: 'user-123' }
  const mockStudents = [
    {
      id: 'student-1',
      parent_id: 'user-123',
      first_name: 'Emma',
      last_name: 'Johnson',
      grade_level: '5',
      school_id: 'school-1',
      school: { name: 'Lincoln Elementary', logo_url: null },
      grade_info: [{ grade_level: '5', gpa: 3.8, attendance_rate: 96 }],
    },
    {
      id: 'student-2',
      parent_id: 'user-123',
      first_name: 'Michael',
      last_name: 'Johnson',
      grade_level: '3',
      school_id: 'school-1',
      school: { name: 'Lincoln Elementary', logo_url: null },
      grade_info: [{ grade_level: '3', gpa: 3.9, attendance_rate: 98 }],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.mockReturnValue({ user: mockUser })
  })

  it('should fetch students on mount', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: mockStudents, error: null })),
        })),
      })),
    }))
    supabase.from = mockFrom

    const { result } = renderHook(() => useStudents())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.students).toHaveLength(2)
    expect(result.current.students[0].current_grade).toBe('5')
    expect(result.current.students[0].current_gpa).toBe(3.8)
    expect(result.current.students[0].attendance_rate).toBe(96)
    expect(mockFrom).toHaveBeenCalledWith('students')
  })

  it('should handle fetch error gracefully', async () => {
    const mockError = new Error('Failed to fetch')
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: null, error: mockError })),
        })),
      })),
    }))
    supabase.from = mockFrom

    const { result } = renderHook(() => useStudents())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.students).toEqual([])
    expect(result.current.error).toBe('Failed to fetch')
  })

  it('should add a new student', async () => {
    const newStudent = {
      first_name: 'Sophie',
      last_name: 'Johnson',
      grade_level: '1',
      school_id: 'school-1',
    }

    const mockFrom = vi.fn()
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockStudents, error: null })),
          })),
        })),
      })
      .mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => 
              Promise.resolve({ 
                data: { ...newStudent, id: 'student-3', parent_id: 'user-123' }, 
                error: null 
              })
            ),
          })),
        })),
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => 
              Promise.resolve({ 
                data: [...mockStudents, { ...newStudent, id: 'student-3', parent_id: 'user-123' }], 
                error: null 
              })
            ),
          })),
        })),
      })

    supabase.from = mockFrom

    const { result } = renderHook(() => useStudents())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let addResult
    await act(async () => {
      addResult = await result.current.addStudent(newStudent)
    })

    expect(addResult.success).toBe(true)
    expect(addResult.data.first_name).toBe('Sophie')
  })

  it('should update a student', async () => {
    const updates = { grade_level: '6', school_id: 'school-2' }

    const mockFrom = vi.fn()
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockStudents, error: null })),
          })),
        })),
      })
      .mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => 
                  Promise.resolve({ 
                    data: { ...mockStudents[0], ...updates }, 
                    error: null 
                  })
                ),
              })),
            })),
          })),
        })),
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => 
              Promise.resolve({ 
                data: [{ ...mockStudents[0], ...updates }, mockStudents[1]], 
                error: null 
              })
            ),
          })),
        })),
      })

    supabase.from = mockFrom

    const { result } = renderHook(() => useStudents())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let updateResult
    await act(async () => {
      updateResult = await result.current.updateStudent('student-1', updates)
    })

    expect(updateResult.success).toBe(true)
    expect(updateResult.data.grade_level).toBe('6')
  })

  it('should remove a student', async () => {
    const mockFrom = vi.fn()
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockStudents, error: null })),
          })),
        })),
      })
      .mockReturnValueOnce({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => 
              Promise.resolve({ 
                data: [mockStudents[1]], 
                error: null 
              })
            ),
          })),
        })),
      })

    supabase.from = mockFrom

    const { result } = renderHook(() => useStudents())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let removeResult
    await act(async () => {
      removeResult = await result.current.removeStudent('student-1')
    })

    expect(removeResult.success).toBe(true)
  })

  it('should not fetch students when user is not logged in', () => {
    useAuthStore.mockReturnValue({ user: null })

    const mockFrom = vi.fn()
    supabase.from = mockFrom

    renderHook(() => useStudents())

    expect(mockFrom).not.toHaveBeenCalled()
  })
})