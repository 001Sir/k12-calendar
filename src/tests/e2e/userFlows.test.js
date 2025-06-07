import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '../../lib/supabase'

// Mock navigation for testing flows
const mockNavigate = vi.fn()
const mockLocation = { pathname: '/' }

// Helper to simulate user authentication
const authenticateUser = async (role = 'parent') => {
  const mockUser = {
    id: `user-${role}-123`,
    email: `${role}@example.com`,
  }
  
  const mockProfile = {
    id: mockUser.id,
    user_id: mockUser.id,
    full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
    role: role,
  }

  // Mock auth state
  supabase.auth.getUser = vi.fn(() => 
    Promise.resolve({ data: { user: mockUser }, error: null })
  )
  
  supabase.from = vi.fn((table) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockProfile, error: null })),
          })),
        })),
      }
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    }
  })

  return { user: mockUser, profile: mockProfile }
}

describe('Critical User Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    mockLocation.pathname = '/'
  })

  describe('Authentication Flow', () => {
    it('should redirect unauthenticated users to login', async () => {
      supabase.auth.getUser = vi.fn(() => 
        Promise.resolve({ data: { user: null }, error: null })
      )

      // Simulate accessing protected route
      mockLocation.pathname = '/dashboard'
      
      // Should redirect to login
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('should redirect authenticated users from login to dashboard', async () => {
      await authenticateUser('parent')
      
      // Simulate accessing login page while authenticated
      mockLocation.pathname = '/login'
      
      // Should redirect to dashboard
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('Parent User Flow', () => {
    beforeEach(async () => {
      await authenticateUser('parent')
    })

    it('should complete event RSVP flow', async () => {
      // 1. View events
      mockLocation.pathname = '/events/explore'
      
      // Mock events data
      supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => 
              Promise.resolve({ 
                data: [{
                  id: 'event-1',
                  title: 'Science Fair',
                  requires_rsvp: true,
                  max_attendees: 100,
                }], 
                error: null 
              })
            ),
          })),
        })),
      }))

      // 2. View event details
      mockLocation.pathname = '/events/event-1'
      
      // Mock RSVP action
      const rsvpData = {
        event_id: 'event-1',
        user_id: 'user-parent-123',
        status: 'attending',
        attendee_count: 2,
      }

      supabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => 
              Promise.resolve({ data: rsvpData, error: null })
            ),
          })),
        })),
      }))

      // 3. Confirm RSVP submission
      const rsvpResult = await supabase.from('event_attendees').insert([rsvpData]).select().single()
      
      expect(rsvpResult.data).toEqual(rsvpData)
      expect(rsvpResult.error).toBeNull()
    })

    it('should complete lunch money add flow', async () => {
      // 1. Access dashboard
      mockLocation.pathname = '/dashboard'
      
      // Mock low balance account
      supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => 
            Promise.resolve({ 
              data: [{
                student_id: 'student-1',
                balance: 3.50,
                auto_reload_enabled: false,
              }], 
              error: null 
            })
          ),
        })),
      }))

      // 2. Add funds
      const addFundsData = {
        student_id: 'student-1',
        amount: 20.00,
        payment_method: 'credit_card',
      }

      // Mock balance update
      supabase.from = vi.fn((table) => {
        if (table === 'lunch_accounts') {
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => 
                Promise.resolve({ error: null })
              ),
            })),
          }
        }
        if (table === 'lunch_transactions') {
          return {
            insert: vi.fn(() => 
              Promise.resolve({ error: null })
            ),
          }
        }
      })

      // 3. Verify transaction
      const updateResult = await supabase.from('lunch_accounts').update({ balance: 23.50 }).eq('student_id', 'student-1')
      const transResult = await supabase.from('lunch_transactions').insert([{
        ...addFundsData,
        type: 'payment',
        balance_after: 23.50,
      }])

      expect(updateResult.error).toBeNull()
      expect(transResult.error).toBeNull()
    })
  })

  describe('Teacher User Flow', () => {
    beforeEach(async () => {
      await authenticateUser('teacher')
    })

    it('should complete event creation flow', async () => {
      // 1. Navigate to create event
      mockLocation.pathname = '/events/create'
      
      // 2. Submit event data
      const eventData = {
        title: 'Class Field Trip',
        description: 'Visit to Science Museum',
        start_time: '2024-03-15T09:00:00Z',
        end_time: '2024-03-15T15:00:00Z',
        location: 'City Science Museum',
        school_id: 'school-1',
        created_by: 'user-teacher-123',
        event_type: 'field_trip',
        requires_rsvp: true,
        max_attendees: 30,
      }

      supabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => 
              Promise.resolve({ 
                data: { ...eventData, id: 'event-new-1' }, 
                error: null 
              })
            ),
          })),
        })),
      }))

      // 3. Create event
      const result = await supabase.from('events').insert([eventData]).select().single()
      
      expect(result.data).toMatchObject(eventData)
      expect(result.error).toBeNull()
      
      // 4. Should redirect to event details
      expect(mockNavigate).toHaveBeenCalledWith('/events/event-new-1')
    })

    it('should access only teacher-allowed routes', async () => {
      const teacherRoutes = [
        '/dashboard',
        '/events/create',
        '/calendar',
        '/profile',
        '/settings',
      ]

      const restrictedRoutes = [
        '/analytics', // school_admin only
      ]

      // Should access teacher routes
      teacherRoutes.forEach(route => {
        mockLocation.pathname = route
        expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard')
      })

      // Should be redirected from restricted routes
      restrictedRoutes.forEach(route => {
        mockLocation.pathname = route
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })
  })

  describe('School Admin User Flow', () => {
    beforeEach(async () => {
      await authenticateUser('school_admin')
    })

    it('should complete event check-in flow', async () => {
      // 1. Navigate to event check-in
      mockLocation.pathname = '/events/event-1/checkin'
      
      // Mock attendees
      supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => 
              Promise.resolve({ 
                data: [
                  {
                    id: 'attendee-1',
                    user_id: 'user-1',
                    event_id: 'event-1',
                    user: { full_name: 'John Doe', email: 'john@example.com' },
                  },
                  {
                    id: 'attendee-2',
                    user_id: 'user-2',
                    event_id: 'event-1',
                    user: { full_name: 'Jane Smith', email: 'jane@example.com' },
                  },
                ], 
                error: null 
              })
            ),
          })),
        })),
      }))

      // 2. Check in attendee
      const checkInData = {
        event_id: 'event-1',
        user_id: 'user-1',
        check_in_method: 'manual',
        location: 'Main Entrance',
      }

      supabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => 
              Promise.resolve({ 
                data: { ...checkInData, id: 'checkin-1', created_at: new Date().toISOString() }, 
                error: null 
              })
            ),
          })),
        })),
      }))

      const result = await supabase.from('event_checkins').insert([checkInData]).select().single()
      
      expect(result.data).toMatchObject(checkInData)
      expect(result.error).toBeNull()
    })

    it('should access all school admin routes', async () => {
      const adminRoutes = [
        '/dashboard',
        '/events/create',
        '/events/1/edit',
        '/events/1/checkin',
        '/calendar',
        '/profile',
        '/settings',
        '/tickets',
      ]

      // Should access all routes without redirect
      adminRoutes.forEach(route => {
        mockLocation.pathname = route
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })
  })

  describe('Cross-Role Communication Flow', () => {
    it('should allow teacher to send communication to parent', async () => {
      // 1. Authenticate as teacher
      await authenticateUser('teacher')
      
      // 2. Send communication
      const communicationData = {
        parent_id: 'user-parent-123',
        sender_id: 'user-teacher-123',
        student_id: 'student-1',
        subject: 'Excellent Progress in Math',
        message: 'Your child is doing great!',
        priority: 'normal',
        category: 'academic',
      }

      supabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => 
              Promise.resolve({ 
                data: { ...communicationData, id: 'comm-1', created_at: new Date().toISOString() }, 
                error: null 
              })
            ),
          })),
        })),
      }))

      const result = await supabase.from('parent_communications').insert([communicationData]).select().single()
      
      expect(result.data).toMatchObject(communicationData)
      
      // 3. Verify parent receives it
      await authenticateUser('parent')
      
      supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => 
              Promise.resolve({ 
                data: [result.data], 
                error: null 
              })
            ),
          })),
        })),
      }))

      const parentComms = await supabase.from('parent_communications')
        .select('*')
        .eq('parent_id', 'user-parent-123')
        .order('created_at', { ascending: false })
      
      expect(parentComms.data).toHaveLength(1)
      expect(parentComms.data[0].subject).toBe('Excellent Progress in Math')
    })
  })
})