import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { queryProfilesByIds } from '../utils/profileQueries'

export function useActivities({ schoolId, userId, role, limit = 10 } = {}) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (schoolId || userId) {
      fetchActivities()
    }
  }, [schoolId, userId, role, limit])

  async function fetchActivities() {
    try {
      setLoading(true)
      const activitiesList = []

      // Fetch recent events created
      let eventsQuery = supabase
        .from('events')
        .select(`
          id,
          title,
          created_at,
          created_by,
          event_type
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (role === 'school_admin' && schoolId) {
        eventsQuery = eventsQuery.eq('school_id', schoolId)
      } else if (role === 'teacher' && userId) {
        eventsQuery = eventsQuery.eq('created_by', userId)
      }

      const { data: events } = await eventsQuery

      // Fetch creator names for events
      const creatorIds = [...new Set(events?.map(e => e.created_by).filter(Boolean))]
      let creators = {}
      
      if (creatorIds.length > 0) {
        const { data: profiles } = await queryProfilesByIds(creatorIds)
        
        profiles?.forEach(profile => {
          const userId = profile.user_id || profile.id
          creators[userId] = profile.full_name
        })
      }

      events?.forEach(event => {
        activitiesList.push({
          id: `event-${event.id}`,
          type: 'event_created',
          user: creators[event.created_by] || 'Someone',
          action: 'created a new event:',
          target: event.title,
          time: new Date(event.created_at),
          icon: '📅',
          eventType: event.event_type
        })
      })

      // Fetch recent RSVPs
      let rsvpsQuery = supabase
        .from('event_attendees')
        .select(`
          id,
          created_at,
          rsvp_status,
          user_id,
          event:events(
            id,
            title,
            school_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (role === 'school_admin' && schoolId) {
        // Filter RSVPs for events in the school
        const { data: schoolEvents } = await supabase
          .from('events')
          .select('id')
          .eq('school_id', schoolId)
        
        const eventIds = schoolEvents?.map(e => e.id) || []
        if (eventIds.length > 0) {
          rsvpsQuery = rsvpsQuery.in('event_id', eventIds)
        }
      } else if (role === 'parent' && userId) {
        rsvpsQuery = rsvpsQuery.eq('user_id', userId)
      }

      const { data: rsvps } = await rsvpsQuery

      // Fetch user names for RSVPs
      const rsvpUserIds = [...new Set(rsvps?.map(r => r.user_id).filter(Boolean))]
      let rsvpUsers = {}
      
      if (rsvpUserIds.length > 0) {
        const { data: profiles } = await queryProfilesByIds(rsvpUserIds)
        
        profiles?.forEach(profile => {
          const userId = profile.user_id || profile.id
          rsvpUsers[userId] = profile.full_name
        })
      }

      rsvps?.forEach(rsvp => {
        if (rsvp.event) {
          let action = 'RSVP\'d to'
          let icon = '✅'
          if (rsvp.rsvp_status === 'declined') {
            action = 'declined'
            icon = '❌'
          } else if (rsvp.rsvp_status === 'cancelled') {
            action = 'cancelled RSVP for'
            icon = '🚫'
          }

          activitiesList.push({
            id: `rsvp-${rsvp.id}`,
            type: 'rsvp',
            user: rsvpUsers[rsvp.user_id] || 'Someone',
            action,
            target: rsvp.event.title,
            time: new Date(rsvp.created_at),
            icon
          })
        }
      })

      // For teachers, fetch volunteer signups
      if (role === 'teacher' && userId) {
        const { data: teacherEvents } = await supabase
          .from('events')
          .select('id, title')
          .eq('created_by', userId)

        const eventIds = teacherEvents?.map(e => e.id) || []
        
        if (eventIds.length > 0) {
          const { data: volunteers } = await supabase
            .from('event_attendees')
            .select(`
              id,
              created_at,
              notes,
              event_id,
              user_id
            `)
            .in('event_id', eventIds)
            .not('notes', 'is', null)
            .order('created_at', { ascending: false })
            .limit(5)

          // Fetch volunteer names
          const volunteerUserIds = [...new Set(volunteers?.map(v => v.user_id).filter(Boolean))]
          let volunteerUsers = {}
          
          if (volunteerUserIds.length > 0) {
            const { data: profiles } = await queryProfilesByIds(volunteerUserIds)
            
            profiles?.forEach(profile => {
              const userId = profile.user_id || profile.id
              volunteerUsers[userId] = profile.full_name
            })
          }

          volunteers?.forEach(volunteer => {
            const event = teacherEvents.find(e => e.id === volunteer.event_id)
            if (event && volunteer.notes?.includes('volunteer')) {
              activitiesList.push({
                id: `volunteer-${volunteer.id}`,
                type: 'volunteer',
                user: volunteerUsers[volunteer.user_id] || 'Someone',
                action: 'volunteered for',
                target: event.title,
                time: new Date(volunteer.created_at),
                icon: '🙋',
                badge: { text: '🙋', className: 'bg-orange-100 text-orange-600' }
              })
            }
          })
        }
      }

      // For parents, add school announcements (events marked as announcements)
      if (role === 'parent') {
        const { data: announcements } = await supabase
          .from('events')
          .select(`
            id,
            title,
            created_at,
            event_type,
            school:schools(name)
          `)
          .eq('event_type', 'announcement')
          .order('created_at', { ascending: false })
          .limit(5)

        announcements?.forEach(announcement => {
          activitiesList.push({
            id: `announcement-${announcement.id}`,
            type: 'announcement',
            user: announcement.school?.name || 'School',
            action: 'announced',
            target: announcement.title,
            time: new Date(announcement.created_at),
            icon: '📢',
            badge: { text: '🔔', className: 'bg-blue-100 text-blue-600' }
          })
        })
      }

      // Sort all activities by time
      activitiesList.sort((a, b) => b.time - a.time)

      // Format times and limit results
      const formattedActivities = activitiesList.slice(0, limit).map(activity => ({
        ...activity,
        time: formatActivityTime(activity.time),
        avatar: `https://i.pravatar.cc/150?u=${activity.user}`,
        created_at: activity.time,
        read: false, // Mark all as unread initially
        event_id: activity.target ? activity.id.split('-')[1] : null
      }))

      setActivities(formattedActivities)
    } catch (err) {
      console.error('Error fetching activities:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function formatActivityTime(date) {
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (days > 0) {
      return date.toLocaleDateString('en', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }

  return { activities, loading, error, refetch: fetchActivities }
}