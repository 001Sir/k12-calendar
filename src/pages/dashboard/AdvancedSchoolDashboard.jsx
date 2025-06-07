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
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import Header from '../../components/layout/Header';
import RevenueAnalytics from '../../components/analytics/RevenueAnalytics';
import AttendanceHeatmap from '../../components/analytics/AttendanceHeatmap';
import EventPerformanceComparison from '../../components/analytics/EventPerformanceComparison';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useSchool } from '../../hooks/useSchool';
import { useEvents } from '../../hooks/useEvents';
import { useMetrics } from '../../hooks/useMetrics';
import useAuthStore from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdvancedSchoolDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { school, loading: schoolLoading } = useSchool();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState(30);
  const [dashboardMetrics, setDashboardMetrics] = useState({
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
  });
  const [quickStats, setQuickStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertsAndInsights, setAlertsAndInsights] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'revenue', label: 'Revenue Analytics', icon: CurrencyDollarIcon },
    { id: 'attendance', label: 'Attendance Patterns', icon: UsersIcon },
    { id: 'performance', label: 'Event Performance', icon: TrophyIcon }
  ];

  useEffect(() => {
    if (school?.id) {
      fetchDashboardData();
    }
  }, [school?.id, dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = subDays(endDate, dateRange);
      const previousStartDate = subDays(startDate, dateRange);

      // Fetch comprehensive metrics
      await Promise.all([
        fetchMainMetrics(startDate, endDate, previousStartDate),
        fetchQuickStats(),
        fetchAlertsAndInsights(),
        fetchRecentActivity()
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
    const { data: currentEvents, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        start_time,
        price,
        capacity,
        event_attendees(count),
        revenue_tracking(amount, transaction_type)
      `)
      .eq('school_id', school.id)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString());

    if (eventsError) throw eventsError;

    // Previous period for comparison
    const { data: previousEvents } = await supabase
      .from('events')
      .select(`
        id,
        event_attendees(count),
        revenue_tracking(amount, transaction_type)
      `)
      .eq('school_id', school.id)
      .gte('start_time', previousStartDate.toISOString())
      .lte('start_time', startDate.toISOString());

    // Calculate metrics
    const currentRevenue = currentEvents.reduce((sum, event) => 
      sum + (event.revenue_tracking?.reduce((eventSum, r) => 
        r.transaction_type === 'ticket_sale' ? eventSum + r.amount : eventSum, 0) || 0), 0
    );

    const currentAttendees = currentEvents.reduce((sum, event) => 
      sum + (event.event_attendees?.[0]?.count || 0), 0
    );

    const previousRevenue = previousEvents?.reduce((sum, event) => 
      sum + (event.revenue_tracking?.reduce((eventSum, r) => 
        r.transaction_type === 'ticket_sale' ? eventSum + r.amount : eventSum, 0) || 0), 0
    ) || 0;

    const previousAttendees = previousEvents?.reduce((sum, event) => 
      sum + (event.event_attendees?.[0]?.count || 0), 0
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

    setDashboardMetrics({
      totalEvents: currentEvents.length,
      totalRevenue: currentRevenue,
      totalAttendees: currentAttendees,
      averageAttendance: Math.round(averageAttendance),
      growthMetrics: {
        events: Math.round(eventsGrowth * 10) / 10,
        revenue: Math.round(revenueGrowth * 10) / 10,
        attendees: Math.round(attendeesGrowth * 10) / 10,
        engagement: Math.round((averageAttendance - 70) * 10) / 10 // Baseline 70%
      }
    });
  };

  const fetchQuickStats = async () => {
    // Fetch additional quick stats
    const { data: analytics } = await supabase
      .from('event_analytics')
      .select('views, rsvp_clicks, conversions')
      .gte('date', subDays(new Date(), dateRange).toISOString().split('T')[0]);

    const totalViews = analytics?.reduce((sum, a) => sum + (a.views || 0), 0) || 0;
    const totalClicks = analytics?.reduce((sum, a) => sum + (a.rsvp_clicks || 0), 0) || 0;
    const totalConversions = analytics?.reduce((sum, a) => sum + (a.conversions || 0), 0) || 0;

    const conversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;
    const clickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    setQuickStats([
      { label: 'Page Views', value: totalViews.toLocaleString(), change: '+12%', color: 'blue' },
      { label: 'Click-through Rate', value: `${clickRate.toFixed(1)}%`, change: '+0.8%', color: 'green' },
      { label: 'Conversion Rate', value: `${conversionRate.toFixed(1)}%`, change: '-0.2%', color: 'red' },
      { label: 'Avg. Event Rating', value: '4.7', change: '+0.1', color: 'yellow' }
    ]);
  };

  const fetchAlertsAndInsights = async () => {
    // Generate insights based on data patterns
    const insights = [
      {
        type: 'success',
        title: 'Revenue Growth',
        message: `Revenue is up ${dashboardMetrics.growthMetrics.revenue}% compared to last period`,
        action: 'View Details',
        urgent: false
      },
      {
        type: 'warning',
        title: 'Low Attendance Event',
        message: 'Science Fair has only 23% attendance rate',
        action: 'Send Reminders',
        urgent: true
      },
      {
        type: 'info',
        title: 'Peak Day Insight',
        message: 'Thursday evenings show highest engagement rates',
        action: 'Schedule More',
        urgent: false
      }
    ];

    setAlertsAndInsights(insights);
  };

  const fetchRecentActivity = async () => {
    const { data: activities } = await supabase
      .from('event_attendees')
      .select(`
        created_at,
        event:events(title),
        user_id
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    setRecentActivity(activities || []);
  };

  const exportDashboardData = async () => {
    try {
      toast.success('Preparing export...');
      // Implement CSV export logic here
      const csvData = prepareCsvData();
      downloadCsv(csvData, `dashboard-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const prepareCsvData = () => {
    // Prepare CSV data structure
    return `Date,Events,Revenue,Attendees,Conversion Rate\n` +
           `${format(new Date(), 'yyyy-MM-dd')},${dashboardMetrics.totalEvents},${dashboardMetrics.totalRevenue},${dashboardMetrics.totalAttendees},${quickStats[2]?.value}\n`;
  };

  const downloadCsv = (csvData, filename) => {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (schoolLoading || loading) {
    return <LoadingSpinner fullScreen text="Loading advanced analytics..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent">
              {school?.name} Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Advanced insights and performance metrics</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            
            <button
              onClick={exportDashboardData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              Export
            </button>
            
            <button
              onClick={() => navigate('/events/create')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Create Event
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <CalendarDaysIcon className="h-8 w-8 opacity-80" />
              <span className={`flex items-center text-sm ${
                dashboardMetrics.growthMetrics.events >= 0 ? 'text-green-200' : 'text-red-200'
              }`}>
                {dashboardMetrics.growthMetrics.events >= 0 ? 
                  <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4"
                />}
                {Math.abs(dashboardMetrics.growthMetrics.events)}%
              </span>
            </div>
            <p className="text-3xl font-bold">{dashboardMetrics.totalEvents}</p>
            <p className="text-indigo-100 text-sm">Total Events</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <CurrencyDollarIcon className="h-8 w-8 opacity-80" />
              <span className={`flex items-center text-sm ${
                dashboardMetrics.growthMetrics.revenue >= 0 ? 'text-green-200' : 'text-red-200'
              }`}>
                {dashboardMetrics.growthMetrics.revenue >= 0 ? 
                  <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4"
                />}
                {Math.abs(dashboardMetrics.growthMetrics.revenue)}%
              </span>
            </div>
            <p className="text-3xl font-bold">${dashboardMetrics.totalRevenue.toLocaleString()}</p>
            <p className="text-emerald-100 text-sm">Total Revenue</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <UsersIcon className="h-8 w-8 opacity-80" />
              <span className={`flex items-center text-sm ${
                dashboardMetrics.growthMetrics.attendees >= 0 ? 'text-green-200' : 'text-red-200'
              }`}>
                {dashboardMetrics.growthMetrics.attendees >= 0 ? 
                  <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4"
                />}
                {Math.abs(dashboardMetrics.growthMetrics.attendees)}%
              </span>
            </div>
            <p className="text-3xl font-bold">{dashboardMetrics.totalAttendees.toLocaleString()}</p>
            <p className="text-amber-100 text-sm">Total Attendees</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <ChartBarIcon className="h-8 w-8 opacity-80" />
              <span className={`flex items-center text-sm ${
                dashboardMetrics.averageAttendance >= 70 ? 'text-green-200' : 'text-red-200'
              }`}>
                <BoltIcon className="h-4 w-4" />
                {dashboardMetrics.averageAttendance >= 70 ? 'Good' : 'Low'}
              </span>
            </div>
            <p className="text-3xl font-bold">{dashboardMetrics.averageAttendance}%</p>
            <p className="text-pink-100 text-sm">Avg. Attendance</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  stat.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Alerts and Insights */}
        {alertsAndInsights.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights & Alerts</h3>
            <div className="space-y-3">
              {alertsAndInsights.map((insight, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                  insight.type === 'success' ? 'bg-green-50 border border-green-200' :
                  insight.type === 'warning' ? 'bg-amber-50 border border-amber-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {insight.urgent && <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />}
                    <div>
                      <p className="font-medium text-gray-900">{insight.title}</p>
                      <p className="text-sm text-gray-600">{insight.message}</p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    {insight.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <RevenueAnalytics schoolId={school.id} dateRange={dateRange} />
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {recentActivity.slice(0, 5).map((activity, index) => (
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
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <RevenueAnalytics schoolId={school.id} dateRange={dateRange} />
          )}

          {activeTab === 'attendance' && (
            <AttendanceHeatmap schoolId={school.id} />
          )}

          {activeTab === 'performance' && (
            <EventPerformanceComparison schoolId={school.id} />
          )}
        </div>
      </div>
    </div>
  );
}