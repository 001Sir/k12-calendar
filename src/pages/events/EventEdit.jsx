import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  CalendarDaysIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'
import { useSchool } from '../../hooks/useSchool'
import useAuthStore from '../../store/authStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EventCreate from './SophisticatedEventCreate'

export default function EventEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { school } = useSchool()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvent()
  }, [id])

  async function fetchEvent() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // Check permissions
      const canEdit = user && (
        user.id === data.created_by || 
        profile?.role === 'school_admin' ||
        (profile?.role === 'teacher' && data.school_id === school?.id)
      )

      if (!canEdit) {
        toast.error('You do not have permission to edit this event')
        navigate(`/events/${id}`)
        return
      }

      // Format dates for form inputs
      const startDate = new Date(data.start_time)
      const endDate = new Date(data.end_time)

      setEvent({
        ...data,
        start_date: startDate.toISOString().split('T')[0],
        start_time: startDate.toTimeString().slice(0, 5),
        end_date: endDate.toISOString().split('T')[0],
        end_time: endDate.toTimeString().slice(0, 5),
      })
    } catch (error) {
      console.error('Error fetching event:', error)
      toast.error('Failed to load event')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading event..." />
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Event not found</h2>
          <p className="text-gray-600">This event may have been removed.</p>
        </div>
      </div>
    )
  }

  // Reuse EventCreate component with edit mode
  return <EventCreate editMode={true} existingEvent={event} />
}