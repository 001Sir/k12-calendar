import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  CalendarDaysIcon,
  MapPinIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ShareIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Header from '../../components/layout/Header'
import { cn } from '../../utils/cn'

export default function EventDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  
  const [event, setEvent] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [userRsvp, setUserRsvp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [showRsvpForm, setShowRsvpForm] = useState(false)
  
  // RSVP form state
  const [rsvpData, setRsvpData] = useState({
    attendee_name: profile?.full_name || '',
    attendee_email: user?.email || '',
    attendee_phone: '',
    number_of_guests: 1,
    notes: ''
  })

  useEffect(() => {
    fetchEventDetails()
  }, [id])

  async function fetchEventDetails() {
    try {
      setLoading(true)
      
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          school:schools(id, name, address)
        `)
        .eq('id', id)
        .single()

      if (eventError) throw eventError
      
      // Fetch creator's name if needed
      let creatorName = null
      if (eventData.created_by) {
        const { data: creatorData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', eventData.created_by)
          .single()
        
        creatorName = creatorData?.full_name
      }
      
      setEvent({ ...eventData, creator: { full_name: creatorName } })

      // Fetch attendees
      const { data: attendeesData, error: attendeesError } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', id)
        .eq('rsvp_status', 'confirmed')

      if (attendeesError) throw attendeesError
      setAttendees(attendeesData || [])

      // Check if user has RSVP'd
      if (user) {
        const { data: rsvpData } = await supabase
          .from('event_attendees')
          .select('*')
          .eq('event_id', id)
          .eq('user_id', user.id)
          .single()

        setUserRsvp(rsvpData)
      }
    } catch (error) {
      console.error('Error fetching event:', error)
      toast.error('Failed to load event details')
    } finally {
      setLoading(false)
    }
  }

  async function handleRsvp(e) {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }

    setRsvpLoading(true)
    try {
      const totalAttendees = parseInt(rsvpData.number_of_guests)
      
      // Check capacity
      if (event.capacity) {
        const currentTotal = attendees.reduce((sum, a) => sum + (a.number_of_guests || 1), 0)
        if (currentTotal + totalAttendees > event.capacity) {
          throw new Error('Not enough spots available')
        }
      }

      // Create RSVP
      const { error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: id,
          user_id: user.id,
          guests_count: totalAttendees - 1, // guests_count doesn't include the main attendee
          notes: rsvpData.notes,
          rsvp_status: 'confirmed',
          payment_status: event.requires_payment ? 'pending' : null
        })

      if (error) throw error

      toast.success('RSVP successful!')
      setShowRsvpForm(false)
      fetchEventDetails() // Refresh data
    } catch (error) {
      console.error('Error creating RSVP:', error)
      toast.error(error.message || 'Failed to RSVP')
    } finally {
      setRsvpLoading(false)
    }
  }

  async function cancelRsvp() {
    if (!userRsvp || !window.confirm('Are you sure you want to cancel your RSVP?')) return

    try {
      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('id', userRsvp.id)

      if (error) throw error

      toast.success('RSVP cancelled')
      setUserRsvp(null)
      fetchEventDetails()
    } catch (error) {
      console.error('Error cancelling RSVP:', error)
      toast.error('Failed to cancel RSVP')
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading event details..." />
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <EmptyState
            icon={CalendarDaysIcon}
            title="Event not found"
            description="This event may have been removed or you don't have permission to view it."
            action={() => navigate('/explore')}
            actionLabel="Browse Events"
          />
        </div>
      </div>
    )
  }

  const eventDate = new Date(event.start_time)
  const eventEndDate = new Date(event.end_time)
  const isPastEvent = eventDate < new Date()
  const totalAttendees = attendees.reduce((sum, a) => sum + (a.guests_count || 0) + 1, 0) // +1 for the attendee themselves
  const spotsLeft = event.capacity ? event.capacity - totalAttendees : null
  const isFull = event.capacity && totalAttendees >= event.capacity
  const canEdit = user && (user.id === event.created_by || profile?.role === 'school_admin')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white border-b pt-20">
        {event.image_url && (
          <div className="h-64 sm:h-96 w-full">
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Event Type Badge */}
              <span className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4",
                {
                  'bg-blue-100 text-blue-700': event.event_type === 'academic',
                  'bg-green-100 text-green-700': event.event_type === 'sports',
                  'bg-purple-100 text-purple-700': event.event_type === 'arts',
                  'bg-orange-100 text-orange-700': event.event_type === 'fundraiser',
                  'bg-gray-100 text-gray-700': event.event_type === 'meeting',
                  'bg-indigo-100 text-indigo-700': event.event_type === 'other' || !event.event_type,
                }
              )}>
                {event.event_type || 'Other'}
              </span>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
              <p className="text-lg text-gray-600 mb-4">Hosted by {event.school?.name}</p>
              
              {/* Key Details */}
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <span>
                    {eventDate.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <span>
                    {eventDate.toLocaleTimeString('en-US', { 
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                    {' - '}
                    {eventEndDate.toLocaleTimeString('en-US', { 
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
                
                {event.location && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span>{event.location}</span>
                  </div>
                )}
                
                {event.capacity && (
                  <div className="flex items-center">
                    <UsersIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span>{totalAttendees} / {event.capacity} attending</span>
                  </div>
                )}
                
                {event.requires_payment && event.price > 0 && (
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span>${event.price.toFixed(2)} per ticket</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 ml-6">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  toast.success('Link copied!')
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ShareIcon className="h-5 w-5" />
              </button>
              
              {canEdit && (
                <>
                  <button
                    onClick={() => navigate(`/events/${id}/edit`)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this event?')) {
                        // Handle delete
                      }
                    }}
                    className="p-2 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* RSVP Section */}
          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            {isPastEvent ? (
              <p className="text-center text-gray-600">This event has already ended.</p>
            ) : userRsvp ? (
              <div className="text-center">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-semibold text-gray-900 mb-2">You're registered!</p>
                <p className="text-gray-600 mb-4">
                  {userRsvp.guests_count > 0 
                    ? `${userRsvp.guests_count + 1} spots reserved (you + ${userRsvp.guests_count} guests)`
                    : 'Your spot is reserved'}
                </p>
                <button
                  onClick={cancelRsvp}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Cancel RSVP
                </button>
              </div>
            ) : isFull ? (
              <p className="text-center text-gray-600">This event is full.</p>
            ) : (
              <div className="text-center">
                {spotsLeft && (
                  <p className="text-sm text-gray-600 mb-4">
                    Only {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left!
                  </p>
                )}
                <button
                  onClick={() => setShowRsvpForm(true)}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  RSVP Now
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Event Description */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About this event</h2>
            <p className="text-gray-600 whitespace-pre-wrap">
              {event.description || 'No description provided.'}
            </p>
          </div>
        </div>
      </section>

      {/* RSVP Modal */}
      {showRsvpForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">RSVP for {event.title}</h3>
            
            <form onSubmit={handleRsvp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={rsvpData.attendee_name}
                  onChange={(e) => setRsvpData(prev => ({ ...prev, attendee_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={rsvpData.attendee_email}
                  onChange={(e) => setRsvpData(prev => ({ ...prev, attendee_email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={rsvpData.attendee_phone}
                  onChange={(e) => setRsvpData(prev => ({ ...prev, attendee_phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Attendees *
                </label>
                <select
                  value={rsvpData.number_of_guests}
                  onChange={(e) => setRsvpData(prev => ({ ...prev, number_of_guests: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 4, 5].map(num => {
                    const wouldExceedCapacity = spotsLeft && num > spotsLeft
                    return (
                      <option key={num} value={num} disabled={wouldExceedCapacity}>
                        {num} {num === 1 ? 'person' : 'people'}
                        {wouldExceedCapacity && ' (exceeds capacity)'}
                      </option>
                    )
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={rsvpData.notes}
                  onChange={(e) => setRsvpData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Any special requirements or questions?"
                />
              </div>
              
              {event.requires_payment && event.price > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Total: ${(event.price * rsvpData.number_of_guests).toFixed(2)}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Payment will be collected at the event
                  </p>
                </div>
              )}
              
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRsvpForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rsvpLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rsvpLoading ? 'Processing...' : 'Confirm RSVP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}