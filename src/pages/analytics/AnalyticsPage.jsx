import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeftIcon,
  ChartBarIcon,
  UsersIcon,
  TicketIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FireIcon,
  SparklesIcon,
  DocumentChartBarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import useAuthStore from '../../store/authStore'
import { useMetrics, useChartData } from '../../hooks/useMetrics'
import { useSchool } from '../../hooks/useSchool'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Logo from '../../components/common/Logo'
import { cn } from '../../utils/cn'

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { school } = useSchool()
  const [timeRange, setTimeRange] = useState('month')
  const [activeTab, setActiveTab] = useState('overview')
  
  const { metrics, loading: metricsLoading } = useMetrics({
    schoolId: school?.id,
    userId: user?.id,
    role: profile?.role,
    timeRange
  })

  const { chartData: revenueData } = useChartData({
    schoolId: school?.id,
    role: profile?.role,
    chartType: 'revenue',
    days: timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365
  })

  const { chartData: attendanceData } = useChartData({
    schoolId: school?.id,
    role: profile?.role,
    chartType: 'attendance',
    days: timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365
  })

  const { chartData: ticketData } = useChartData({
    schoolId: school?.id,
    role: profile?.role,
    chartType: 'tickets',
    days: timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365
  })

  // Category distribution data
  const categoryData = [
    { name: 'Academic', value: 35, events: 42, revenue: 15000 },
    { name: 'Sports', value: 25, events: 30, revenue: 12000 },
    { name: 'Arts', value: 20, events: 24, revenue: 8000 },
    { name: 'Social', value: 15, events: 18, revenue: 6000 },
    { name: 'Fundraiser', value: 5, events: 6, revenue: 25000 }
  ]

  // Performance data for radar chart
  const performanceData = [
    { metric: 'Attendance Rate', value: 85, fullMark: 100 },
    { metric: 'Revenue Goal', value: 92, fullMark: 100 },
    { metric: 'Event Success', value: 78, fullMark: 100 },
    { metric: 'Parent Engagement', value: 88, fullMark: 100 },
    { metric: 'Student Participation', value: 94, fullMark: 100 },
    { metric: 'Community Reach', value: 70, fullMark: 100 }
  ]

  // Trend data
  const trendData = {
    weekly: {
      events: '+12%',
      attendance: '+8%',
      revenue: '+15%',
      satisfaction: '+5%'
    },
    insights: [
      { type: 'success', message: 'Sports events are seeing 25% higher attendance than last month' },
      { type: 'warning', message: 'Academic events need more promotion - 15% below target' },
      { type: 'info', message: 'Friday events have 40% higher attendance than other days' },
      { type: 'success', message: 'Fundraisers exceeded revenue goals by 30%' }
    ]
  }

  const downloadReport = () => {
    // In a real app, this would generate a PDF report
    alert('Generating analytics report...')
  }

  if (metricsLoading) {
    return <LoadingSpinner fullScreen text="Loading analytics..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                <p className="text-sm text-gray-500">Deep insights into your event performance</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                {['week', 'month', 'year'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-all",
                      timeRange === range
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
              
              <button
                onClick={downloadReport}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <nav className="flex gap-8 -mb-px">
            {['overview', 'engagement', 'revenue', 'insights'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <CalendarDaysIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <span className={cn(
                      "flex items-center gap-1 text-sm font-medium",
                      metrics.eventGrowth > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {metrics.eventGrowth > 0 ? <ArrowTrendingUpIcon className="h-4 w-4" /> : <ArrowTrendingDownIcon className="h-4 w-4" />}
                      {Math.abs(metrics.eventGrowth)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Total Events</p>
                  <p className="text-3xl font-bold mt-1">{metrics.totalEvents}</p>
                  <p className="text-xs text-gray-500 mt-2">+{metrics.upcomingEvents} upcoming</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <UsersIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                      {metrics.attendeeGrowth}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Total Attendees</p>
                  <p className="text-3xl font-bold mt-1">{metrics.totalAttendees.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-2">{metrics.avgAttendanceRate}% avg rate</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
                    </div>
                    <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                      {metrics.revenueGrowth}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-3xl font-bold mt-1">${metrics.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-2">From paid events</p>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 shadow-sm text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur rounded-lg">
                      <FireIcon className="h-6 w-6 text-white" />
                    </div>
                    <SparklesIcon className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-white/80">Success Rate</p>
                  <p className="text-3xl font-bold mt-1">92%</p>
                  <p className="text-xs text-white/60 mt-2">Events meeting targets</p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem'
                        }}
                        formatter={(value) => [`$${value}`, 'Revenue']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Distribution */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Event Categories</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} ${value}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Performance Radar */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={performanceData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar 
                        name="Performance" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.6} 
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Key Insights</h4>
                    {trendData.insights.map((insight, index) => (
                      <div key={index} className={cn(
                        "p-4 rounded-lg border-l-4",
                        insight.type === 'success' && "bg-green-50 border-green-500",
                        insight.type === 'warning' && "bg-yellow-50 border-yellow-500",
                        insight.type === 'info' && "bg-blue-50 border-blue-500"
                      )}>
                        <p className="text-sm">{insight.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'engagement' && (
            <div className="space-y-6">
              {/* Engagement Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Attendance Patterns</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Peak Times</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Friday Evening</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }} />
                        </div>
                        <span className="text-sm text-gray-600">85%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Saturday Afternoon</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '72%' }} />
                        </div>
                        <span className="text-sm text-gray-600">72%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Weekday Morning</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }} />
                        </div>
                        <span className="text-sm text-gray-600">45%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Audience Demographics</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Parents</span>
                        <span className="font-medium">45%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Students</span>
                        <span className="font-medium">35%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-pink-500 h-2 rounded-full" style={{ width: '35%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Community</span>
                        <span className="font-medium">20%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '20%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="space-y-6">
              {/* Revenue Analysis */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Revenue by Category</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'revenue') return [`$${value}`, 'Revenue']
                        return [value, name.charAt(0).toUpperCase() + name.slice(1)]
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="events" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              {/* AI Insights */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <SparklesIcon className="h-8 w-8" />
                  <h3 className="text-2xl font-bold">AI-Powered Insights</h3>
                </div>
                <p className="text-white/80 mb-6">Based on your event data patterns</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <h4 className="font-semibold mb-2">🎯 Optimization Opportunity</h4>
                    <p className="text-sm text-white/80">Schedule more sports events on Fridays - they see 40% higher attendance</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <h4 className="font-semibold mb-2">💡 Revenue Insight</h4>
                    <p className="text-sm text-white/80">Fundraiser events generate 3x more revenue per attendee</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <h4 className="font-semibold mb-2">📈 Growth Potential</h4>
                    <p className="text-sm text-white/80">Arts events are underutilized - increase by 20% to meet demand</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <h4 className="font-semibold mb-2">⚡ Quick Win</h4>
                    <p className="text-sm text-white/80">Early bird pricing increases ticket sales by 35%</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}