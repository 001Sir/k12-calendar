import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDaysIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  ClockIcon,
  TrophyIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  FunnelIcon,
  CogIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  PresentationChartLineIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  BellIcon,
  MapPinIcon,
  AcademicCapIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  TicketIcon,
  HeartIcon,
  StarIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import Header from '../../components/layout/Header';
import EventCard from '../../components/common/EventCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useSchool } from '../../hooks/useSchool';
import { useEvents } from '../../hooks/useEvents';
import { useMetrics } from '../../hooks/useMetrics';
import useAuthStore from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { format, subDays, startOfDay, endOfDay, isToday, isTomorrow } from 'date-fns';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function RichSchoolDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { school, loading: schoolLoading } = useSchool();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState(30);
  const [loading, setLoading] = useState(true);
  
  // Rich dashboard state
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      totalEvents: 0,
      totalRevenue: 0,
      totalAttendees: 0,
      averageAttendance: 0,
      growthMetrics: {
        events: 0,
        revenue: 0,
        attendees: 0,
        engagement: 0
      }
    },
    recentEvents: [],
    upcomingEvents: [],
    topPerformingEvents: [],
    recentActivity: [],
    alerts: [],
    quickStats: [],
    chartData: {
      revenue: [],
      attendance: [],
      eventTypes: []
    }
  });

  const [weatherWidget, setWeatherWidget] = useState(null);
  const [schoolStats, setSchoolStats] = useState({
    totalStudents: 1245,
    totalTeachers: 78,
    totalParents: 2100,
    activeUsers: 892
  });

  useEffect(() => {
    if (school?.id) {
      fetchRichDashboardData();
      fetchWeatherData();
    }
  }, [school?.id, dateRange]);

  const fetchRichDashboardData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = subDays(endDate, dateRange);
      const previousStartDate = subDays(startDate, dateRange);

      // Fetch comprehensive data
      await Promise.all([
        fetchMainMetrics(startDate, endDate, previousStartDate),
        fetchRecentEvents(),
        fetchUpcomingEvents(),
        fetchTopPerformingEvents(),
        fetchRecentActivity(),
        fetchAlertsAndInsights(),
        fetchChartData(startDate, endDate)
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMainMetrics = async (startDate, endDate, previousStartDate) => {
    // Current period metrics
    const { data: currentEvents, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        start_time,
        price,
        capacity,
        event_type,
        event_attendees(*)
      `)
      .eq('school_id', school.id)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString());

    if (error) throw error;

    // Previous period for comparison
    const { data: previousEvents } = await supabase
      .from('events')
      .select(`
        id,
        event_attendees(*)
      `)
      .eq('school_id', school.id)
      .gte('start_time', previousStartDate.toISOString())
      .lte('start_time', startDate.toISOString());

    // Calculate metrics (simplified for now)
    const currentRevenue = currentEvents.reduce((sum, event) => 
      sum + ((event.price || 0) * (event.event_attendees?.length || 0)), 0
    );

    const currentAttendees = currentEvents.reduce((sum, event) => 
      sum + (event.event_attendees?.length || 0), 0
    );

    const previousRevenue = previousEvents?.reduce((sum, event) => 
      sum + ((event.price || 0) * (event.event_attendees?.length || 0)), 0
    ) || 0;

    const previousAttendees = previousEvents?.reduce((sum, event) => 
      sum + (event.event_attendees?.length || 0), 0
    ) || 0;

    // Calculate growth rates
    const eventsGrowth = previousEvents?.length > 0 ? 
      ((currentEvents.length - previousEvents.length) / previousEvents.length) * 100 : 0;
    const revenueGrowth = previousRevenue > 0 ? 
      ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const attendeesGrowth = previousAttendees > 0 ? 
      ((currentAttendees - previousAttendees) / previousAttendees) * 100 : 0;

    const totalCapacity = currentEvents.reduce((sum, event) => sum + (event.capacity || 0), 0);
    const averageAttendance = totalCapacity > 0 ? (currentAttendees / totalCapacity) * 100 : 0;

    setDashboardData(prev => ({
      ...prev,
      metrics: {
        totalEvents: currentEvents.length,
        totalRevenue: currentRevenue,
        totalAttendees: currentAttendees,
        averageAttendance: Math.round(averageAttendance),
        growthMetrics: {
          events: Math.round(eventsGrowth * 10) / 10,
          revenue: Math.round(revenueGrowth * 10) / 10,
          attendees: Math.round(attendeesGrowth * 10) / 10,
          engagement: Math.round((averageAttendance - 70) * 10) / 10
        }
      }
    }));

    // Set quick stats
    const quickStats = [
      { 
        label: 'Event Views', 
        value: '2,456', 
        change: '+12.5%', 
        color: 'blue',
        icon: EyeIcon 
      },
      { 
        label: 'Conversion Rate', 
        value: '8.2%', 
        change: '+1.3%', 
        color: 'green',
        icon: ArrowTrendingUpIcon 
      },
      { 
        label: 'Avg. Ticket Price', 
        value: '$' + (currentRevenue / Math.max(currentAttendees, 1)).toFixed(0), 
        change: revenueGrowth > 0 ? '+$2' : '-$1', 
        color: 'purple',
        icon: TicketIcon 
      },
      { 
        label: 'Customer Rating', 
        value: '4.8/5', 
        change: '+0.2', 
        color: 'yellow',
        icon: StarIcon 
      }
    ];

    setDashboardData(prev => ({
      ...prev,
      quickStats
    }));
  };

  const fetchRecentEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        school:schools(name),
        event_attendees(*)
      `)
      .eq('school_id', school.id)
      .lte('start_time', new Date().toISOString())
      .order('start_time', { ascending: false })
      .limit(5);

    if (error) throw error;

    setDashboardData(prev => ({
      ...prev,
      recentEvents: data || []
    }));
  };

  const fetchUpcomingEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        school:schools(name),
        event_attendees(*)
      `)
      .eq('school_id', school.id)
      .eq('status', 'active')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(8);

    if (error) throw error;

    setDashboardData(prev => ({
      ...prev,
      upcomingEvents: data || []
    }));
  };

  const fetchTopPerformingEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_attendees(*)
      `)
      .eq('school_id', school.id)
      .eq('status', 'active')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(3);

    if (error) throw error;

    setDashboardData(prev => ({
      ...prev,
      topPerformingEvents: data || []
    }));
  };

  const fetchRecentActivity = async () => {
    const { data, error } = await supabase
      .from('event_attendees')
      .select(`
        created_at,
        event:events(title),
        user_id
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    setDashboardData(prev => ({
      ...prev,
      recentActivity: data || []
    }));
  };

  const fetchAlertsAndInsights = async () => {
    const alerts = [
      {
        type: 'success',
        title: 'Revenue Milestone',
        message: 'You\'ve reached $5,000 in monthly revenue!',
        action: 'View Details',
        urgent: false,
        icon: TrophyIcon
      },
      {
        type: 'warning',
        title: 'Low Attendance Alert',
        message: 'Science Fair has only 30% capacity filled',
        action: 'Send Reminders',
        urgent: true,
        icon: ExclamationTriangleIcon
      },
      {
        type: 'info',
        title: 'Peak Performance',
        message: 'Thursday 7 PM shows highest engagement',
        action: 'Schedule More',
        urgent: false,
        icon: SparklesIcon
      }
    ];

    setDashboardData(prev => ({
      ...prev,
      alerts
    }));
  };

  const fetchChartData = async (startDate, endDate) => {
    // Revenue chart data
    const revenueData = [];
    for (let i = 0; i < 30; i++) {
      const date = subDays(new Date(), i);
      revenueData.unshift({
        date: format(date, 'MMM d'),
        revenue: Math.floor(Math.random() * 500) + 100,
        events: Math.floor(Math.random() * 5) + 1
      });
    }

    // Event types data
    const eventTypesData = [
      { name: 'Academic', value: 35, color: '#6366f1' },
      { name: 'Sports', value: 25, color: '#8b5cf6' },
      { name: 'Arts', value: 20, color: '#ec4899' },
      { name: 'Fundraiser', value: 15, color: '#f59e0b' },
      { name: 'Other', value: 5, color: '#10b981' }
    ];

    // Attendance data
    const attendanceData = [];
    for (let i = 0; i < 7; i++) {
      const date = subDays(new Date(), i);
      attendanceData.unshift({
        day: format(date, 'EEE'),
        attendance: Math.floor(Math.random() * 100) + 50,
        capacity: 150
      });
    }

    setDashboardData(prev => ({
      ...prev,
      chartData: {
        revenue: revenueData,
        attendance: attendanceData,
        eventTypes: eventTypesData
      }
    }));
  };

  const fetchWeatherData = async () => {
    // Mock weather data (in real app, use weather API)
    setWeatherWidget({
      temperature: 72,
      condition: 'Sunny',
      icon: '☀️',
      recommendation: 'Perfect weather for outdoor events!'
    });
  };

  const getEventBadge = (event) => {
    const eventDate = new Date(event.start_time);
    if (isToday(eventDate)) return { text: 'Today', color: 'bg-red-500' };
    if (isTomorrow(eventDate)) return { text: 'Tomorrow', color: 'bg-orange-500' };
    return null;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (schoolLoading || loading) {
    return <LoadingSpinner fullScreen text="Loading rich dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Welcome Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent">
              Welcome back! 👋
            </h1>
            <p className="text-gray-600 mt-2">Here's what's happening at {school?.name}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {weatherWidget && (
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{weatherWidget.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{weatherWidget.temperature}°F</div>
                    <div className="text-xs text-gray-600">{weatherWidget.condition}</div>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={() => navigate('/events/create')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Create Event
            </button>
          </div>
        </div>

        {/* Alert Banner */}
        {dashboardData.alerts.length > 0 && (
          <div className="mb-8">
            {dashboardData.alerts.slice(0, 1).map((alert, index) => (
              <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${
                alert.type === 'success' ? 'bg-green-50 border border-green-200' :
                alert.type === 'warning' ? 'bg-amber-50 border border-amber-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-center gap-3">
                  <alert.icon className={`h-6 w-6 ${
                    alert.type === 'success' ? 'text-green-600' :
                    alert.type === 'warning' ? 'text-amber-600' :
                    'text-blue-600'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{alert.title}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  {alert.action}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <CalendarDaysIcon className="h-8 w-8 opacity-80" />
              <span className={`flex items-center text-sm ${
                dashboardData.metrics.growthMetrics.events >= 0 ? 'text-green-200' : 'text-red-200'
              }`}>
                {dashboardData.metrics.growthMetrics.events >= 0 ? 
                  <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4"
                />}
                {Math.abs(dashboardData.metrics.growthMetrics.events)}%
              </span>
            </div>
            <p className="text-3xl font-bold">{dashboardData.metrics.totalEvents}</p>
            <p className="text-indigo-100 text-sm">Total Events</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <CurrencyDollarIcon className="h-8 w-8 opacity-80" />
              <span className={`flex items-center text-sm ${
                dashboardData.metrics.growthMetrics.revenue >= 0 ? 'text-green-200' : 'text-red-200'
              }`}>
                {dashboardData.metrics.growthMetrics.revenue >= 0 ? 
                  <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4"
                />}
                {Math.abs(dashboardData.metrics.growthMetrics.revenue)}%
              </span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(dashboardData.metrics.totalRevenue)}</p>
            <p className="text-emerald-100 text-sm">Total Revenue</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <UsersIcon className="h-8 w-8 opacity-80" />
              <span className={`flex items-center text-sm ${
                dashboardData.metrics.growthMetrics.attendees >= 0 ? 'text-green-200' : 'text-red-200'
              }`}>
                {dashboardData.metrics.growthMetrics.attendees >= 0 ? 
                  <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4"
                />}
                {Math.abs(dashboardData.metrics.growthMetrics.attendees)}%
              </span>
            </div>
            <p className="text-3xl font-bold">{dashboardData.metrics.totalAttendees.toLocaleString()}</p>
            <p className="text-amber-100 text-sm">Total Attendees</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <ChartBarIcon className="h-8 w-8 opacity-80" />
              <span className={`flex items-center text-sm ${
                dashboardData.metrics.averageAttendance >= 70 ? 'text-green-200' : 'text-red-200'
              }`}>
                <BoltIcon className="h-4 w-4" />
                {dashboardData.metrics.averageAttendance >= 70 ? 'Good' : 'Low'}
              </span>
            </div>
            <p className="text-3xl font-bold">{dashboardData.metrics.averageAttendance}%</p>
            <p className="text-pink-100 text-sm">Avg. Attendance</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {dashboardData.quickStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <div className="flex flex-col items-end">
                  <stat.icon className={`h-5 w-5 text-${stat.color}-600`} />
                  <span className={`text-xs mt-1 ${
                    stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Revenue Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
                <button
                  onClick={() => navigate('/analytics')}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View Advanced Analytics →
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.chartData.revenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Top Performing Events */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">🏆 Top Performing Events</h3>
                <button
                  onClick={() => navigate('/analytics')}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {dashboardData.topPerformingEvents.map((event, index) => (
                  <div key={event.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <p className="text-sm text-gray-600">
                        {event.event_attendees?.length || 0} attendees • {format(new Date(event.start_time), 'MMM d')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {Math.round(((event.event_attendees?.length || 0) / (event.capacity || 100)) * 100)}% full
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">📅 Upcoming Events</h3>
                <button
                  onClick={() => navigate('/explore')}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All Events
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData.upcomingEvents.slice(0, 4).map((event) => {
                  const badge = getEventBadge(event);
                  return (
                    <div key={event.id} className="relative border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                         onClick={() => navigate(`/events/${event.id}`)}>
                      {badge && (
                        <div className={`absolute top-2 right-2 ${badge.color} text-white px-2 py-1 rounded-full text-xs font-medium`}>
                          {badge.text}
                        </div>
                      )}
                      <h4 className="font-medium text-gray-900 mb-2">{event.title}</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <CalendarDaysIcon className="h-4 w-4" />
                          {format(new Date(event.start_time), 'MMM d, h:mm a')}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="h-4 w-4" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <UsersIcon className="h-4 w-4" />
                          {event.event_attendees?.length || 0} attending
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* School Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏫 School Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AcademicCapIcon className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-gray-600">Students</span>
                  </div>
                  <span className="font-medium">{schoolStats.totalStudents.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-600">Teachers</span>
                  </div>
                  <span className="font-medium">{schoolStats.totalTeachers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartIcon className="h-5 w-5 text-pink-600" />
                    <span className="text-sm text-gray-600">Parents</span>
                  </div>
                  <span className="font-medium">{schoolStats.totalParents.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BoltIcon className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm text-gray-600">Active Users</span>
                  </div>
                  <span className="font-medium text-green-600">{schoolStats.activeUsers}</span>
                </div>
              </div>
            </div>

            {/* Event Types Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Event Types</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={dashboardData.chartData.eventTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dashboardData.chartData.eventTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {dashboardData.chartData.eventTypes.map((type, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }}></div>
                      <span className="text-gray-600">{type.name}</span>
                    </div>
                    <span className="font-medium">{type.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Recent Activity</h3>
              <div className="space-y-3">
                {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        New RSVP for <span className="font-medium">{activity.event?.title}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">🚀 Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/events/create')}
                  className="w-full bg-white/10 hover:bg-white/20 rounded-lg p-3 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <PlusIcon className="h-5 w-5" />
                    <span className="font-medium">Create New Event</span>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/analytics')}
                  className="w-full bg-white/10 hover:bg-white/20 rounded-lg p-3 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ChartBarIcon className="h-5 w-5" />
                    <span className="font-medium">View Analytics</span>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/tickets')}
                  className="w-full bg-white/10 hover:bg-white/20 rounded-lg p-3 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <TicketIcon className="h-5 w-5" />
                    <span className="font-medium">Manage Tickets</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}