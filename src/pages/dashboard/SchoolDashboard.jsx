import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  CalendarDaysIcon,
  TicketIcon,
  CurrencyDollarIcon,
  UsersIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EllipsisVerticalIcon,
  CalendarDaysIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import useAuthStore from '../../store/authStore'
import { cn } from '../../utils/cn'
import { useSchool } from '../../hooks/useSchool'
import { useEvents, useEventStats } from '../../hooks/useEvents'
import StatCard from '../../components/common/StatCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Header from '../../components/layout/Header'


export default function SchoolDashboard() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { school, loading: schoolLoading } = useSchool()
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // Date range for filtering (last 30 days by default)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  })

  // Fetch events and stats
  const { events, loading: eventsLoading } = useEvents({
    school_id: school?.id,
    start_date: dateRange.start.toISOString(),
    end_date: dateRange.end.toISOString(),
    event_type: selectedCategory === 'all' ? null : selectedCategory
  })

  const { stats, loading: statsLoading } = useEventStats(school?.id)

  // Calculate upcoming events
  const upcomingEvents = events
    .filter(event => new Date(event.start_time) > new Date())
    .slice(0, 5)

  // Calculate metrics
  const totalCapacity = events.reduce((sum, event) => sum + (event.capacity || 0), 0)
  const totalAttendees = events.reduce((sum, event) => sum + (event.event_attendees?.length || 0), 0)
  const ticketsAvailable = totalCapacity - totalAttendees

  // Generate sales data from events
  const salesData = []
  const today = new Date()
  for (let i = 9; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.start_time)
      return eventDate.toDateString() === date.toDateString()
    })
    
    const daySold = dayEvents.reduce((sum, event) => sum + (event.event_attendees?.length || 0), 0)
    const dayCapacity = dayEvents.reduce((sum, event) => sum + (event.capacity || 0), 0)
    
    salesData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sold: daySold,
      available: dayCapacity - daySold
    })
  }

  // Convert events to calendar format
  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    date: event.start_time,
    color: {
      academic: '#6366f1',
      sports: '#10b981',
      arts: '#a855f7',
      fundraiser: '#f59e0b',
      meeting: '#6b7280',
      other: '#3b82f6'
    }[event.event_type] || '#3b82f6'
  }))

  // Loading state
  if (schoolLoading) {
    return <LoadingSpinner fullScreen text="Loading school data..." />
  }

  // No school found
  if (!school) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 pt-32">
          <EmptyState
            icon={CalendarDaysIcon}
            title="No School Associated"
            description="Your profile needs to be linked to a school. Please contact your administrator or update your profile."
            action={() => navigate('/debug/dashboard')}
            actionLabel="View Debug Info"
          />
          
          {/* Show SQL to fix */}
          <div className="mt-8 p-6 bg-yellow-50 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">For Administrators:</h3>
            <p className="text-sm text-yellow-700 mb-3">Run this SQL in your Supabase dashboard to fix this issue:</p>
            <pre className="text-xs bg-yellow-100 p-3 rounded overflow-auto">
{`UPDATE profiles 
SET school_id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
    role = 'school_admin'
WHERE user_id = '${user?.id}';`}
            </pre>
          </div>
        </div>
      </div>
    )
  }
  
  // Continue loading other data
  if (eventsLoading || statsLoading) {
    return <LoadingSpinner fullScreen text="Loading dashboard data..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <CalendarDaysIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Event Monitoring Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {school?.name} • {events.length} events this month
              </span>
              <button 
                onClick={() => navigate('/events/create')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Event
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Selector */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
              <span className="text-sm text-gray-600">Period</span>
              <p className="font-medium">Last 30 Days</p>
            </div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Event Types</option>
              <option value="academic">Academic</option>
              <option value="sports">Sports</option>
              <option value="arts">Arts & Culture</option>
              <option value="fundraiser">Fundraiser</option>
              <option value="meeting">Meeting</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Showing data for</span>
            <span className="font-medium text-gray-900">{school?.name}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            subValue="this month"
            icon={CalendarDaysIcon}
            color="indigo"
          />
          <StatCard
            title="Total Attendees"
            value={stats.totalAttendees.toLocaleString()}
            subValue={`avg ${stats.averageAttendance}/event`}
            icon={UsersIcon}
            trend={totalAttendees > 0 ? 'up' : null}
            trendValue={totalAttendees > 0 ? '+12%' : null}
            color="green"
          />
          <StatCard
            title="Tickets Available"
            value={ticketsAvailable.toLocaleString()}
            subValue={`of ${totalCapacity.toLocaleString()} total`}
            icon={TicketIcon}
            color="blue"
          />
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            subValue="all time"
            icon={CurrencyDollarIcon}
            trend={stats.totalRevenue > 0 ? 'up' : null}
            trendValue={stats.totalRevenue > 0 ? '+8.5%' : null}
            color="purple"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sales Overview Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">SALES OVERVIEW (All Events)</h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-indigo-600 rounded-full mr-2"></div>
                  <span>Tickets Sold</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full mr-2"></div>
                  <span>Tickets Available</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="sold"
                  stackId="1"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="available"
                  stackId="1"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Calendar Widget */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">EVENT CALENDAR</h3>
            <div className="calendar-widget">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev',
                  center: 'title',
                  right: 'next'
                }}
                events={calendarEvents}
                height="auto"
                dayMaxEvents={2}
              />
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Types Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">EVENT TYPES</h3>
            <div className="space-y-4">
              {stats.popularEventTypes.map((type, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {type.type || 'Other'}
                    </span>
                    <span className="text-sm text-gray-500">{type.count} events</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${(type.count / stats.totalEvents) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
              <p className="text-sm text-gray-500">Total Events</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">QUICK STATS</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-sm text-gray-600">Upcoming Events</span>
                <span className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-sm text-gray-600">Avg. Attendance</span>
                <span className="text-2xl font-bold text-gray-900">{stats.averageAttendance}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="text-2xl font-bold text-green-600">
                  {totalCapacity > 0 ? Math.round((totalAttendees / totalCapacity) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
              <button 
                onClick={() => navigate('/events/create')}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View All →
              </button>
            </div>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => {
                  const eventDate = new Date(event.start_time)
                  const eventTime = eventDate.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })
                  const dateStr = eventDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })
                  
                  return (
                    <div key={event.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1 hover:text-indigo-600 cursor-pointer"
                              onClick={() => navigate(`/events/${event.id}`)}>
                            {event.title}
                          </h4>
                          <div className="flex items-center text-sm text-gray-500 mb-1">
                            <CalendarDaysIcon className="h-4 w-4 mr-1" />
                            {dateStr} at {eventTime}
                          </div>
                          {event.location && (
                            <div className="flex items-center text-sm text-gray-500 mb-2">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              {event.location}
                            </div>
                          )}
                          {event.capacity && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-indigo-600 h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(((event.event_attendees?.length || 0) / event.capacity) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {event.event_attendees?.length || 0}/{event.capacity}
                              </span>
                            </div>
                          )}
                        </div>
                        <button className="ml-4 text-gray-400 hover:text-gray-600">
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                icon={CalendarDaysIcon}
                title="No upcoming events"
                description="Create your first event to get started"
                action={() => navigate('/events/create')}
                actionLabel="Create Event"
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}