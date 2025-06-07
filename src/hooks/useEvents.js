import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useEvents(filters = {}) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    
    const fetchData = async () => {
      if (!isMounted) return
      await fetchEvents()
    }
    
    fetchData()
    
    return () => {
      isMounted = false
    }
  }, [filters.school_id, filters.status, filters.start_date, filters.end_date, filters.event_type])

  async function fetchEvents() {
    try {
      setLoading(true)
      let query = supabase
        .from('events')
        .select(`
          *,
          school:schools(id, name, district_id),
          event_attendees(id)
        `)
        .order('start_time', { ascending: true })

      // Apply filters
      if (filters.school_id) {
        query = query.eq('school_id', filters.school_id)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.start_date) {
        query = query.gte('start_time', filters.start_date)
      }
      if (filters.end_date) {
        query = query.lte('start_time', filters.end_date)
      }
      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type)
      }

      const { data, error } = await query

      if (error) throw error

      // Process events to include attendee count
      const processedEvents = data?.map(event => ({
        ...event,
        attendees_count: event.event_attendees?.length || 0
      })) || []

      setEvents(processedEvents)
    } catch (err) {
      console.error('Error fetching events:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { events, loading, error, refetch: fetchEvents }
}

export function useEventStats(schoolId) {
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalAttendees: 0,
    totalRevenue: 0,
    averageAttendance: 0,
    popularEventTypes: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (schoolId) {
      fetchStats()
    }
  }, [schoolId])

  async function fetchStats() {
    try {
      setLoading(true)
      
      // Get all events for the school
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          event_attendees(id, payment_status)
        `)
        .eq('school_id', schoolId)

      if (eventsError) throw eventsError

      // Calculate stats
      const now = new Date()
      const upcoming = events?.filter(e => new Date(e.start_time) > now) || []
      
      let totalAttendees = 0
      let totalRevenue = 0
      const eventTypeCounts = {}

      events?.forEach(event => {
        const attendees = event.event_attendees || []
        totalAttendees += attendees.length
        
        // Calculate revenue
        if (event.requires_payment && event.price) {
          const paidAttendees = attendees.filter(a => a.payment_status === 'paid')
          totalRevenue += paidAttendees.length * event.price
        }

        // Count event types
        if (event.event_type) {
          eventTypeCounts[event.event_type] = (eventTypeCounts[event.event_type] || 0) + 1
        }
      })

      // Get popular event types
      const popularEventTypes = Object.entries(eventTypeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([type, count]) => ({ type, count }))

      setStats({
        totalEvents: events?.length || 0,
        upcomingEvents: upcoming.length,
        totalAttendees,
        totalRevenue,
        averageAttendance: events?.length ? Math.round(totalAttendees / events.length) : 0,
        popularEventTypes
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { stats, loading, error, refetch: fetchStats }
}