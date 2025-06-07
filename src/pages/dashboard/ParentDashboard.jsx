import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CalendarDaysIcon,
  TicketIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import StatCard from '../../components/common/StatCard'
import EventCard from '../../components/common/EventCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Header from '../../components/layout/Header'
import { useSavedEvents } from '../../hooks/useSavedEvents'

export default function ParentDashboard() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    pastEvents: 0,
    totalRsvps: 0,
    savedEvents: 0
  })
  const [myRsvps, setMyRsvps] = useState([])
  const [recommendedEvents, setRecommendedEvents] = useState([])
  const { savedEvents, loading: savedEventsLoading } = useSavedEvents()
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    fetchDashboardData()
  }, [user?.id])

  async function fetchDashboardData() {
    if (!user?.id) return

    try {
      setLoading(true)

      // Fetch user's RSVPs with event details
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('event_attendees')
        .select(`
          *,
          event:events(
            *,
            school:schools(name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (rsvpError) throw rsvpError

      const now = new Date()
      const upcomingRsvps = rsvpData?.filter(r => new Date(r.event.start_time) > now) || []
      const pastRsvps = rsvpData?.filter(r => new Date(r.event.start_time) <= now) || []

      setMyRsvps(upcomingRsvps)
      setStats({
        upcomingEvents: upcomingRsvps.length,
        pastEvents: pastRsvps.length,
        totalRsvps: rsvpData?.length || 0,
        savedEvents: savedEvents.length
      })

      // Fetch recommended events (upcoming events not yet RSVP'd)
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          school:schools(name),
          event_attendees(id)
        `)
        .gte('start_time', now.toISOString())
        .eq('status', 'active')
        .order('start_time', { ascending: true })
        .limit(6)

      if (eventsError) throw eventsError

      // Filter out events user already RSVP'd to
      const rsvpEventIds = rsvpData?.map(r => r.event_id) || []
      const filteredEvents = eventsData?.filter(e => !rsvpEventIds.includes(e.id)) || []
      
      setRecommendedEvents(filteredEvents)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading your dashboard..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Welcome Section */}
      <section className="bg-white border-b pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name || 'Parent'}!
          </h1>
          <p className="text-lg text-gray-600">
            Stay connected with your child's school activities and events.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            icon={CalendarDaysIcon}
            color="indigo"
          />
          <StatCard
            title="Past Events"
            value={stats.pastEvents}
            icon={ClockIcon}
            color="green"
          />
          <StatCard
            title="Total RSVPs"
            value={stats.totalRsvps}
            icon={TicketIcon}
            color="purple"
          />
          <StatCard
            title="Saved Events"
            value={stats.savedEvents}
            icon={UserGroupIcon}
            color="orange"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Upcoming Events
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'saved'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Saved Events ({stats.savedEvents})
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'upcoming' ? (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Upcoming Events</h2>
            <button
              onClick={() => navigate('/explore')}
              className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
            >
              Browse All Events
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>

          {myRsvps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRsvps.map((rsvp) => (
                <div key={rsvp.id} className="relative">
                  <EventCard
                    event={rsvp.event}
                    onClick={() => navigate(`/events/${rsvp.event.id}`)}
                    showActions={false}
                  />
                  <div className="absolute top-4 right-4 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                    RSVP'd
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDaysIcon}
              title="No upcoming events"
              description="You haven't RSVP'd to any upcoming events yet."
              action={() => navigate('/explore')}
              actionLabel="Explore Events"
            />
          )}
          </section>
        ) : (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Saved Events</h2>
              <button
                onClick={() => navigate('/explore')}
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
              >
                Browse All Events
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>

            {savedEventsLoading ? (
              <div className="text-center py-8">
                <LoadingSpinner />
              </div>
            ) : savedEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedEvents.map((savedEvent) => (
                  <EventCard
                    key={savedEvent.id}
                    event={savedEvent.events}
                    onClick={() => navigate(`/events/${savedEvent.events.id}`)}
                    showSaveButton={true}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarDaysIcon}
                title="No saved events"
                description="Save events you're interested in to easily find them later."
                action={() => navigate('/explore')}
                actionLabel="Explore Events"
              />
            )}
          </section>
        )}

        {/* Recommended Events */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recommended Events</h2>
          </div>

          {recommendedEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => navigate(`/events/${event.id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDaysIcon}
              title="No new events"
              description="Check back later for new events from your school."
            />
          )}
        </section>
      </main>
    </div>
  )
}