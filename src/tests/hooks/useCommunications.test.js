import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCommunications } from '../../hooks/useCommunications'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'

vi.mock('../../store/authStore')

describe('useCommunications Hook', () => {
  const mockUser = { id: 'user-123' }
  const mockCommunications = [
    {
      id: 'comm-1',
      parent_id: 'user-123',
      sender_id: 'teacher-1',
      subject: 'Field Trip Permission',
      message: 'Please sign the permission slip',
      priority: 'urgent',
      category: 'permission',
      read_at: null,
      created_at: '2024-02-10T10:00:00Z',
      sender: { full_name: 'Mrs. Smith', avatar_url: null, role: 'teacher' },
      student: { first_name: 'Emma', last_name: 'Johnson' },
    },
    {
      id: 'comm-2',
      parent_id: 'user-123',
      sender_id: 'school-1',
      subject: 'School Closed',
      message: 'School will be closed on Monday',
      priority: 'normal',
      category: 'announcement',
      read_at: '2024-02-09T10:00:00Z',
      created_at: '2024-02-08T10:00:00Z',
      sender: { full_name: 'Lincoln Elementary', avatar_url: null, role: 'school_admin' },
      student: null,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.mockReturnValue({ user: mockUser })
  })

  it('should fetch communications on mount', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: mockCommunications, error: null })),
        })),
      })),
    }))
    supabase.from = mockFrom
    supabase.channel = vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    }))

    const { result } = renderHook(() => useCommunications())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.communications).toHaveLength(2)
    expect(result.current.unreadCount).toBe(1)
    expect(mockFrom).toHaveBeenCalledWith('parent_communications')
  })

  it('should mark a communication as read', async () => {
    const mockFrom = vi.fn()
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockCommunications, error: null })),
          })),
        })),
      })
      .mockReturnValueOnce({
        update: vi.fn(() => ({
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
                data: [
                  { ...mockCommunications[0], read_at: new Date().toISOString() },
                  mockCommunications[1]
                ], 
                error: null 
              })
            ),
          })),
        })),
      })

    supabase.from = mockFrom
    supabase.channel = vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    }))

    const { result } = renderHook(() => useCommunications())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.markAsRead('comm-1')
    })

    expect(result.current.unreadCount).toBe(0)
  })

  it('should mark all communications as read', async () => {
    const mockFrom = vi.fn()
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockCommunications, error: null })),
          })),
        })),
      })
      .mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => 
              Promise.resolve({ 
                data: mockCommunications.map(c => ({ ...c, read_at: new Date().toISOString() })), 
                error: null 
              })
            ),
          })),
        })),
      })

    supabase.from = mockFrom
    supabase.channel = vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    }))

    const { result } = renderHook(() => useCommunications())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.markAllAsRead()
    })

    expect(result.current.unreadCount).toBe(0)
  })

  it('should send a reply', async () => {
    const mockFrom = vi.fn()
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockCommunications, error: null })),
          })),
        })),
      })
      .mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => 
              Promise.resolve({ 
                data: {
                  id: 'comm-3',
                  parent_id: 'teacher-1',
                  sender_id: 'user-123',
                  subject: 'Re: Field Trip Permission',
                  message: 'Permission granted',
                  priority: 'medium',
                  category: 'permission',
                  related_to: 'comm-1',
                }, 
                error: null 
              })
            ),
          })),
        })),
      })

    supabase.from = mockFrom
    supabase.channel = vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    }))

    const { result } = renderHook(() => useCommunications())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const replyResult = await result.current.sendReply('comm-1', 'Permission granted')

    expect(replyResult.success).toBe(true)
    expect(replyResult.data.subject).toBe('Re: Field Trip Permission')
  })

  it('should archive a communication', async () => {
    const mockFrom = vi.fn()
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockCommunications, error: null })),
          })),
        })),
      })
      .mockReturnValueOnce({
        update: vi.fn(() => ({
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
                data: [mockCommunications[1]], // Only non-archived
                error: null 
              })
            ),
          })),
        })),
      })

    supabase.from = mockFrom
    supabase.channel = vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    }))

    const { result } = renderHook(() => useCommunications())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.archiveCommunication('comm-1')
    })

    expect(result.current.communications).toHaveLength(1)
  })

  it('should subscribe to real-time updates', async () => {
    const mockChannel = {
      on: vi.fn(() => mockChannel),
      subscribe: vi.fn(),
    }
    supabase.channel = vi.fn(() => mockChannel)
    supabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: mockCommunications, error: null })),
        })),
      })),
    }))

    renderHook(() => useCommunications())

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('parent-communications')
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'INSERT',
          schema: 'public',
          table: 'parent_communications',
          filter: `parent_id=eq.${mockUser.id}`,
        }),
        expect.any(Function)
      )
    })
  })
})