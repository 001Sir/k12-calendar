import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CalendarDaysIcon,
  UsersIcon,
  PlusIcon,
  ClockIcon,
  AcademicCapIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import { useSchool } from '../../hooks/useSchool'
import { useEvents } from '../../hooks/useEvents'
import StatCard from '../../components/common/StatCard'
import EventCard from '../../components/common/EventCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Header from '../../components/layout/Header'

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { school } = useSchool()
  const [myEvents, setMyEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalStudents: 0,
    completedEvents: 0
  })

  // Fetch all school events
  const { events: schoolEvents } = useEvents({
    school_id: school?.id,
    status: 'active'
  })

  useEffect(() => {
    if (user?.id && schoolEvents) {
      fetchTeacherData()
    }
  }, [user?.id, schoolEvents])

  async function fetchTeacherData() {
    try {
      setLoading(true)

      // Filter events created by this teacher
      const teacherEvents = schoolEvents.filter(event => event.created_by === user.id)
      const now = new Date()
      const upcoming = teacherEvents.filter(e => new Date(e.start_time) > now)
      const completed = teacherEvents.filter(e => new Date(e.start_time) <= now)

      setMyEvents(upcoming.slice(0, 6))
      
      // Calculate total students from all events
      const totalStudents = teacherEvents.reduce((sum, event) => sum + (event.event_attendees?.length || 0), 0)

      setStats({
        totalEvents: teacherEvents.length,
        upcomingEvents: upcoming.length,
        totalStudents,
        completedEvents: completed.length
      })
    } catch (error) {
      console.error('Error fetching teacher data:', error)
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Teacher Dashboard
              </h1>
              <p className="text-lg text-gray-600">
                {school?.name} • Manage your classroom events and activities
              </p>
            </div>
            <button
              onClick={() => navigate('/events/create')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Create Event
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="My Events"
            value={stats.totalEvents}
            subValue="total created"
            icon={CalendarDaysIcon}
            color="indigo"
          />
          <StatCard
            title="Upcoming"
            value={stats.upcomingEvents}
            subValue="events scheduled"
            icon={ClockIcon}
            color="blue"
          />
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            subValue="participants"
            icon={UsersIcon}
            color="green"
          />
          <StatCard
            title="Completed"
            value={stats.completedEvents}
            subValue="events finished"
            icon={AcademicCapIcon}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <section className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/events/create')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center group"
              >
                <CalendarDaysIcon className="h-8 w-8 text-gray-400 group-hover:text-indigo-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">
                  Schedule Class Event
                </span>
              </button>
              
              <button
                onClick={() => navigate('/events/create')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center group"
              >
                <UsersIcon className="h-8 w-8 text-gray-400 group-hover:text-green-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">
                  Parent-Teacher Meeting
                </span>
              </button>
              
              <button
                onClick={() => navigate('/events')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-center group"
              >
                <ChartBarIcon className="h-8 w-8 text-gray-400 group-hover:text-purple-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600">
                  View Analytics
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* My Upcoming Events */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Upcoming Events</h2>
            <button
              onClick={() => navigate('/events')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All →
            </button>
          </div>

          {myEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.map((event) => (
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
              title="No upcoming events"
              description="Create your first event to engage with students and parents."
              action={() => navigate('/events/create')}
              actionLabel="Create Event"
            />
          )}
        </section>

        {/* Recent School Events */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">School Events</h2>
          </div>

          {schoolEvents && schoolEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schoolEvents
                .filter(event => event.created_by !== user.id)
                .slice(0, 3)
                .map((event) => (
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
              title="No school events"
              description="Check back later for events from other teachers."
            />
          )}
        </section>
      </main>
    </div>
  )
}