import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CalendarDaysIcon,
  TicketIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  BellIcon,
  Cog6ToothIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import useAuthStore from '../../store/authStore'
import { useEvents } from '../../hooks/useEvents'
import { useActivities } from '../../hooks/useActivities'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { cn } from '../../utils/cn'
import { supabase } from '../../lib/supabase'

export default function TeacherDashboardNew() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const [myEvents, setMyEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  
  const { events } = useEvents({ status: 'active' })
  const { activities } = useActivities({
    userId: user?.id,
    role: 'teacher',
    limit: 10
  })

  useEffect(() => {
    if (user?.id) {
      fetchMyEvents()
    }
  }, [user])

  const fetchMyEvents = async () => {
    try {
      const { data } = await supabase
        .from('events')
        .select('*, event_attendees(count)')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
      
      setMyEvents(data || [])
    } catch (error) {
      console.error('Error fetching teacher events:', error)
    } finally {
      setLoading(false)
    }
  }

  // Teacher metrics
  const metrics = {
    totalEvents: myEvents.length,
    totalStudents: myEvents.reduce((sum, event) => sum + (event.event_attendees?.[0]?.count || 0), 0),
    upcomingEvents: myEvents.filter(e => new Date(e.start_time) > new Date()).length,
    totalRevenue: myEvents.reduce((sum, event) => sum + ((event.price || 0) * (event.event_attendees?.[0]?.count || 0)), 0)
  }

  // Chart data
  const chartData = {
    participation: Array.from({ length: 20 }, (_, i) => ({
      date: i + 1,
      count: Math.floor(Math.random() * 40) + 20,
    })),
    attendance: Array.from({ length: 12 }, (_, i) => ({
      date: i + 1,
      count: Math.floor(Math.random() * 50) + 10,
    }))
  }

  // Calendar data
  const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1)
  const eventDays = myEvents.reduce((acc, event) => {
    const day = new Date(event.start_time).getDate()
    if (new Date(event.start_time).getMonth() === selectedMonth.getMonth()) {
      acc[day] = true
    }
    return acc
  }, {})

  // Format upcoming events for display
  const upcomingEvents = myEvents.slice(0, 2).map(event => ({
    id: event.id,
    title: event.title,
    date: new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    location: event.location,
    price: event.price || 0,
    attendees: event.event_attendees?.[0]?.count || 0,
    avatar: event.image_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 20)}`
  }))

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate('/')}
              >
                <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Y</span>
                </div>
                <span className="text-xl font-medium">YowTix</span>
              </div>
              
              <nav className="flex items-center gap-1">
                <button 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => navigate('/explore')}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Events
                </button>
                <button 
                  onClick={() => navigate('/tickets')}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Tickets
                </button>
                <button 
                  onClick={() => navigate('/analytics')}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Analytics
                </button>
                <button 
                  onClick={() => navigate('/support')}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Support
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <BellIcon className="h-5 w-5 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
              </button>
              <div 
                className="flex items-center gap-3 cursor-pointer pl-3"
                onClick={() => navigate('/profile')}
              >
                <img 
                  src={profile?.avatar_url || `https://i.pravatar.cc/150?u=${user?.email}`}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'Teacher'}</p>
                  <p className="text-xs text-gray-500">Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="col-span-8 space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-1">Total Event</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold">{metrics.totalEvents}</p>
                  <span className="text-xs text-gray-500">↑ 8% vs last month</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <TicketIcon className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-1">Ticket Sold</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold">{metrics.totalStudents}</p>
                  <span className="text-xs text-gray-500">↓ 8% vs last month</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <UsersIcon className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-1">Upcoming Events</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold">{metrics.upcomingEvents}</p>
                  <span className="text-xs text-gray-500">↓ 8% vs last month</span>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Revenue Breakdown</h3>
                  <button className="text-sm text-gray-500 hover:text-gray-700">see details</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData.participation}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem'
                        }}
                      />
                      <Bar dataKey="count" fill="#86efac" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>● Total Revenue Summary</span>
                      <span>● Month-over-Month Change</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">YTD Revenue</p>
                        <p className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}.00</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">% Growth</p>
                        <p className="text-2xl font-bold text-red-500">VIP - 72%</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Top Source</p>
                      <p className="text-xl font-semibold">+12.5%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Top Month</p>
                      <p className="text-xl font-semibold">June - $10K</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Event List */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Event</h3>
                <button 
                  onClick={() => navigate('/events/create')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + create event
                </button>
              </div>
              
              <div className="space-y-3">
                {upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
                  <div 
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={event.avatar}
                        alt={event.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <ClockIcon className="h-4 w-4" />
                          <span>{event.date} • {event.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">${event.price}</p>
                        <p className="text-xs text-gray-500">ticket</p>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                        {event.attendees}
                      </span>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No events created yet</p>
                    <button 
                      onClick={() => navigate('/events/create')}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      Create your first event
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-4 space-y-6">
            {/* Recent Activities */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Recent Activities</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700">See Details</button>
              </div>
              
              <div className="flex gap-2 mb-4">
                <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                  Webinar
                </span>
                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                  Concert
                </span>
                <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">
                  Meetup
                </span>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Event Update</p>
                  <p className="text-sm font-medium">John created a new event: Music Fest</p>
                </div>

                {activities.slice(0, 4).map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {activity.badge ? (
                        <span className="text-2xl">{activity.badge.text}</span>
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>{' '}
                        <span className="text-gray-600">{activity.action}</span>{' '}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="mt-4 text-sm text-blue-600 hover:text-blue-700">
                view more activities
              </button>
            </div>

            {/* Ticket Sales Summary */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Ticket Sales Summary</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700">See Details</button>
              </div>
              
              <p className="text-3xl font-bold mb-1">
                {metrics.totalStudents}
              </p>
              <p className="text-sm text-gray-500 mb-4">Tickets Sold</p>

              <div className="flex gap-2 mb-4">
                <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium">
                  Top event
                </button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                  Ticket Type
                </button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                  Event Category
                </button>
              </div>

              {/* Top Class Events */}
              <div className="space-y-3 mb-6">
                {myEvents.slice(0, 3).map((event, index) => (
                  <div key={event.id} className="flex items-center gap-3">
                    <img 
                      src={event.image_url || `https://images.unsplash.com/photo-${
                        index === 0 ? '1493225457124-a3eb161ffa5f' :
                        index === 1 ? '1554475901-4538ddfbccc2' :
                        '1596495578065-6e0763fa1178'
                      }?w=100&h=100&fit=crop`}
                      alt={event.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {event.location} • {event.event_attendees?.[0]?.count || 0} ticket sold
                        </p>
                        <span className="text-xs font-medium">
                          {Math.min(90, Math.round(((event.event_attendees?.[0]?.count || 0) / 50) * 100))}%
                        </span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={cn(
                            "h-1.5 rounded-full",
                            index === 0 ? 'bg-green-500' : index === 1 ? 'bg-orange-500' : 'bg-blue-500'
                          )}
                          style={{ width: `${Math.min(90, Math.round(((event.event_attendees?.[0]?.count || 0) / 50) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Event Attendance Chart */}
              <div>
                <p className="text-sm text-gray-500 mb-3">Ticket Sales Overtime</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={chartData.attendance}>
                    <Bar dataKey="count" fill="#86efac" />
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-gray-600">VIP</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    <span className="text-xs text-gray-600">Student</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span className="text-xs text-gray-600">General</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500">Total Tickets Sold</p>
                    <p className="text-base font-semibold">{metrics.totalStudents}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Revenue</p>
                    <p className="text-base font-semibold">${metrics.totalRevenue}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Conversion Rate</p>
                    <p className="text-base font-semibold">10.5%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Engagement Calendar */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Event Engagement</h3>
                <button className="text-sm text-gray-500 hover:text-gray-700">See Report</button>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button 
                    onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)))}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeftIcon className="h-4 w-4 text-gray-400" />
                  </button>
                  <span className="text-sm font-medium">
                    {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)))}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} className="text-gray-500 font-medium py-1">{day}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => (
                    <div 
                      key={day}
                      className={cn(
                        "aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer transition-colors",
                        eventDays[day] 
                          ? "bg-orange-500 text-white hover:bg-orange-600" 
                          : "hover:bg-gray-100"
                      )}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}