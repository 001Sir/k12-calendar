import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export function useTeacherEvents() {
  const { user, profile } = useAuthStore()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.id && ['teacher', 'school_admin'].includes(profile?.role)) {
      fetchEvents()
      subscribeToEvents()
    }
  }, [user?.id, profile?.role])

  async function fetchEvents() {
    try {
      setLoading(true)
      
      // Get events created by teacher or all school events for admin
      let query = supabase
        .from('events')
        .select(`
          *,
          event_attendees(count),
          school:schools(name)
        `)
        .order('start_time', { ascending: true })

      if (profile?.role === 'teacher') {
        query = query.eq('created_by', user.id)
      } else if (profile?.school_id) {
        query = query.eq('school_id', profile.school_id)
      }

      const { data, error } = await query

      if (error) throw error

      // Process events to include attendee count
      const processedEvents = data?.map(event => ({
        ...event,
        attendee_count: event.event_attendees?.[0]?.count || 0,
      })) || []

      setEvents(processedEvents)
    } catch (err) {
      console.error('Error fetching events:', err)
      setError(err.message)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  function subscribeToEvents() {
    const channel = supabase
      .channel('teacher-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: profile?.role === 'teacher' 
            ? `created_by=eq.${user.id}`
            : `school_id=eq.${profile?.school_id}`,
        },
        () => {
          fetchEvents()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  async function createEvent(eventData) {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          ...eventData,
          created_by: user.id,
          school_id: profile?.school_id,
          status: 'upcoming',
        }])
        .select()
        .single()

      if (error) throw error
      
      await fetchEvents()
      toast.success('Event created successfully')
      return { success: true, data }
    } catch (err) {
      console.error('Error creating event:', err)
      toast.error('Failed to create event')
      return { success: false, error: err.message }
    }
  }

  async function updateEvent(eventId, updates) {
    try {
      // Check permission
      const event = events.find(e => e.id === eventId)
      if (!event) throw new Error('Event not found')
      
      const canEdit = profile?.role === 'school_admin' || 
                     (profile?.role === 'teacher' && event.created_by === user.id)
      
      if (!canEdit) {
        throw new Error('You do not have permission to edit this event')
      }

      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId)
        .select()
        .single()

      if (error) throw error
      
      await fetchEvents()
      toast.success('Event updated successfully')
      return { success: true, data }
    } catch (err) {
      console.error('Error updating event:', err)
      toast.error(err.message || 'Failed to update event')
      return { success: false, error: err.message }
    }
  }

  async function cancelEvent(eventId, reason) {
    try {
      const result = await updateEvent(eventId, {
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
      })

      if (result.success) {
        // Notify attendees
        await notifyEventCancellation(eventId, reason)
      }

      return result
    } catch (err) {
      console.error('Error cancelling event:', err)
      return { success: false, error: err.message }
    }
  }

  async function notifyEventCancellation(eventId, reason) {
    try {
      // Get all attendees
      const { data: attendees, error } = await supabase
        .from('event_attendees')
        .select('user_id')
        .eq('event_id', eventId)

      if (error) throw error

      // Send notifications (implement based on your notification system)
      console.log(`Notifying ${attendees?.length || 0} attendees about event cancellation`)
      
      return { success: true }
    } catch (err) {
      console.error('Error notifying attendees:', err)
      return { success: false, error: err.message }
    }
  }

  async function getEventAttendees(eventId) {
    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          *,
          user:profiles(full_name, email, phone)
        `)
        .eq('event_id', eventId)
        .order('created_at')

      if (error) throw error
      
      return { success: true, data: data || [] }
    } catch (err) {
      console.error('Error fetching attendees:', err)
      return { success: false, error: err.message, data: [] }
    }
  }

  async function exportAttendeeList(eventId) {
    try {
      const { data: attendees } = await getEventAttendees(eventId)
      const event = events.find(e => e.id === eventId)
      
      if (!attendees || attendees.length === 0) {
        toast.info('No attendees to export')
        return
      }

      // Create CSV
      const csvContent = [
        ['Name', 'Email', 'Phone', 'RSVP Status', 'Attendees', 'Date Registered'].join(','),
        ...attendees.map(a => [
          a.user?.full_name || 'N/A',
          a.user?.email || 'N/A',
          a.user?.phone || 'N/A',
          a.status || 'N/A',
          a.attendee_count || 1,
          new Date(a.created_at).toLocaleDateString(),
        ].join(','))
      ].join('\n')

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${event?.title || 'event'}-attendees-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success('Attendee list exported')
    } catch (err) {
      console.error('Error exporting attendees:', err)
      toast.error('Failed to export attendee list')
    }
  }

  // Calculate event statistics
  const eventStats = {
    totalEvents: events.length,
    upcomingEvents: events.filter(e => e.status === 'upcoming').length,
    pastEvents: events.filter(e => e.status === 'completed').length,
    cancelledEvents: events.filter(e => e.status === 'cancelled').length,
    totalAttendees: events.reduce((sum, e) => sum + (e.attendee_count || 0), 0),
  }

  return {
    events,
    eventStats,
    loading,
    error,
    refetch: fetchEvents,
    createEvent,
    updateEvent,
    cancelEvent,
    getEventAttendees,
    exportAttendeeList,
  }
}