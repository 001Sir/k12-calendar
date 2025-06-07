import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useRSVPs(userId) {
  const [rsvps, setRSVPs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    fetchRSVPs()
  }, [userId])

  const fetchRSVPs = async () => {
    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          *,
          event:events(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRSVPs(data || [])
    } catch (err) {
      console.error('Error fetching RSVPs:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createRSVP = async (eventId, status = 'confirmed', numberOfGuests = 1) => {
    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: eventId,
          user_id: userId,
          status,
          number_of_guests: numberOfGuests
        })
        .select()
        .single()

      if (error) throw error
      
      // Refresh RSVPs
      await fetchRSVPs()
      
      return { data, error: null }
    } catch (err) {
      console.error('Error creating RSVP:', err)
      return { data: null, error: err.message }
    }
  }

  const updateRSVP = async (rsvpId, updates) => {
    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .update(updates)
        .eq('id', rsvpId)
        .select()
        .single()

      if (error) throw error
      
      // Refresh RSVPs
      await fetchRSVPs()
      
      return { data, error: null }
    } catch (err) {
      console.error('Error updating RSVP:', err)
      return { data: null, error: err.message }
    }
  }

  const deleteRSVP = async (rsvpId) => {
    try {
      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('id', rsvpId)

      if (error) throw error
      
      // Refresh RSVPs
      await fetchRSVPs()
      
      return { error: null }
    } catch (err) {
      console.error('Error deleting RSVP:', err)
      return { error: err.message }
    }
  }

  return {
    rsvps,
    loading,
    error,
    createRSVP,
    updateRSVP,
    deleteRSVP,
    refetch: fetchRSVPs
  }
}