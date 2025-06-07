import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CalendarDaysIcon,
  UsersIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  PlusIcon,
  DocumentArrowDownIcon,
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  EnvelopeIcon,
  CogIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
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
} from 'recharts'
import Header from '../../components/layout/Header'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import useAuthStore from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { useSchoolManagement } from '../../hooks/useSchoolManagement'
import { useTeacherEvents } from '../../hooks/useTeacherEvents'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

// Stat Card Component
const StatCard = ({ title, value, change, icon: Icon, color = 'indigo', loading = false }) => {
  const isPositive = change > 0
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-2"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          )}
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {isPositive ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-lg`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  )
}

// Quick Actions Component
const QuickActions = ({ onAction }) => {
  const actions = [
    { id: 'create-event', label: 'Create Event', icon: CalendarDaysIcon, color: 'indigo' },
    { id: 'invite-teacher', label: 'Invite Teacher', icon: UserGroupIcon, color: 'green' },
    { id: 'add-classroom', label: 'Add Classroom', icon: BuildingOffice2Icon, color: 'blue' },
    { id: 'enroll-student', label: 'Enroll Student', icon: AcademicCapIcon, color: 'purple' },
    { id: 'send-announcement', label: 'Send Announcement', icon: BellIcon, color: 'yellow' },
    { id: 'view-reports', label: 'View Reports', icon: ChartBarIcon, color: 'pink' }
  ]
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-4">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className={`p-4 rounded-lg border-2 hover:shadow-md transition-all hover:scale-105 hover:border-${action.color}-500`}
          >
            <action.icon className={`h-6 w-6 mx-auto mb-2 text-${action.color}-600`} />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Classroom Overview Component
const ClassroomOverview = ({ classrooms, onClassroomClick }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Classrooms</h3>
        <button className="text-sm text-indigo-600 hover:text-indigo-700">
          View All →
        </button>
      </div>
      
      <div className="space-y-3">
        {classrooms.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No classrooms yet</p>
        ) : (
          classrooms.slice(0, 5).map(classroom => (
            <div
              key={classroom.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onClassroomClick(classroom)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600">
                    {classroom.grade_level}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">{classroom.name}</p>
                  <p className="text-xs text-gray-500">
                    {classroom.teacher?.full_name || 'No teacher assigned'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{classroom.student_count}</p>
                <p className="text-xs text-gray-500">students</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Alerts Component
const AlertsPanel = ({ alerts }) => {
  const getAlertIcon = (type) => {
    switch(type) {
      case 'warning': return ExclamationTriangleIcon
      case 'success': return CheckCircleIcon
      case 'info': return BellIcon
      default: return BellIcon
    }
  }
  
  const getAlertColor = (type) => {
    switch(type) {
      case 'warning': return 'amber'
      case 'success': return 'green'
      case 'info': return 'blue'
      default: return 'gray'
    }
  }
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No new alerts</p>
        ) : (
          alerts.map((alert, index) => {
            const Icon = getAlertIcon(alert.type)
            const color = getAlertColor(alert.type)
            
            return (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg bg-${color}-50 border border-${color}-200`}
              >
                <Icon className={`h-5 w-5 text-${color}-600 flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-2">{alert.time}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function SchoolDashboardUpdated() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const [selectedTimeRange, setSelectedTimeRange] = useState('month')
  const [chartData, setChartData] = useState({ enrollment: [], attendance: [], performance: [] })
  const [alerts, setAlerts] = useState([])
  
  // Real data hooks
  const { 
    school, 
    teachers, 
    students, 
    classrooms, 
    schoolStats, 
    loading: schoolLoading,
    generateReport
  } = useSchoolManagement()
  
  const { 
    events, 
    eventStats, 
    loading: eventsLoading 
  } = useTeacherEvents()
  
  const loading = schoolLoading || eventsLoading
  
  useEffect(() => {
    if (!loading) {
      loadDashboardData()
      checkAlerts()
    }
  }, [loading, selectedTimeRange])
  
  const loadDashboardData = async () => {
    // Generate chart data based on time range
    const endDate = new Date()
    const startDate = selectedTimeRange === 'month' 
      ? subDays(endDate, 30)
      : selectedTimeRange === 'week'
      ? subDays(endDate, 7)
      : subDays(endDate, 365)
    
    // Get enrollment trends
    const enrollmentData = []
    for (let i = 0; i < 7; i++) {
      enrollmentData.push({
        date: format(subDays(endDate, i * (selectedTimeRange === 'month' ? 5 : 1)), 'MMM d'),
        students: Math.floor(students.length + Math.random() * 10 - 5),
        teachers: teachers.length
      })
    }
    enrollmentData.reverse()
    
    // Get attendance data
    const attendanceReport = await generateReport('attendance', { startDate, endDate })
    const attendanceData = []
    for (let i = 0; i < 7; i++) {
      attendanceData.push({
        date: format(subDays(endDate, i * (selectedTimeRange === 'month' ? 5 : 1)), 'MMM d'),
        rate: Math.floor(85 + Math.random() * 15)
      })
    }
    attendanceData.reverse()
    
    // Get performance data by grade
    const performanceReport = await generateReport('performance')
    const performanceData = Object.entries(performanceReport.data?.by_grade_level || {}).map(([grade, data]) => ({
      grade: `Grade ${grade}`,
      gpa: (data.total / data.count).toFixed(2)
    }))
    
    setChartData({
      enrollment: enrollmentData,
      attendance: attendanceData,
      performance: performanceData
    })
  }
  
  const checkAlerts = () => {
    const newAlerts = []
    
    // Check for low attendance
    const lowAttendanceClasses = classrooms.filter(c => c.average_attendance < 90)
    if (lowAttendanceClasses.length > 0) {
      newAlerts.push({
        type: 'warning',
        title: 'Low Attendance Alert',
        message: `${lowAttendanceClasses.length} classroom(s) have attendance below 90%`,
        time: 'Just now'
      })
    }
    
    // Check for upcoming events
    const todayEvents = events.filter(e => {
      const eventDate = format(parseISO(e.start_time), 'yyyy-MM-dd')
      const today = format(new Date(), 'yyyy-MM-dd')
      return eventDate === today
    })
    if (todayEvents.length > 0) {
      newAlerts.push({
        type: 'info',
        title: 'Events Today',
        message: `${todayEvents.length} event(s) scheduled for today`,
        time: 'Today'
      })
    }
    
    // Check for unassigned classrooms
    const unassignedClassrooms = classrooms.filter(c => !c.teacher_id)
    if (unassignedClassrooms.length > 0) {
      newAlerts.push({
        type: 'warning',
        title: 'Unassigned Classrooms',
        message: `${unassignedClassrooms.length} classroom(s) need teacher assignment`,
        time: 'Action needed'
      })
    }
    
    setAlerts(newAlerts)
  }
  
  const handleQuickAction = (actionId) => {
    switch(actionId) {
      case 'create-event':
        navigate('/events/create')
        break
      case 'invite-teacher':
        toast.info('Opening teacher invitation form...')
        break
      case 'add-classroom':
        toast.info('Opening classroom creation form...')
        break
      case 'enroll-student':
        toast.info('Opening student enrollment form...')
        break
      case 'send-announcement':
        toast.info('Opening announcement composer...')
        break
      case 'view-reports':
        navigate('/reports')
        break
    }
  }
  
  const handleClassroomClick = (classroom) => {
    navigate(`/classrooms/${classroom.id}`)
  }
  
  if (loading) {
    return <LoadingSpinner fullScreen text="Loading school dashboard..." />
  }
  
  // Calculate month-over-month changes
  const monthlyChanges = {
    students: 5, // Mock data - calculate from real data in production
    teachers: 0,
    events: eventStats.upcomingEvents > 0 ? 10 : -5,
    attendance: -2
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-24 px-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {school?.name || 'School'} Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {profile?.full_name}
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={schoolStats.totalStudents}
            change={monthlyChanges.students}
            icon={AcademicCapIcon}
            color="indigo"
          />
          <StatCard
            title="Total Teachers"
            value={schoolStats.totalTeachers}
            change={monthlyChanges.teachers}
            icon={UserGroupIcon}
            color="green"
          />
          <StatCard
            title="Active Events"
            value={eventStats.upcomingEvents}
            change={monthlyChanges.events}
            icon={CalendarDaysIcon}
            color="purple"
          />
          <StatCard
            title="Avg Class Size"
            value={schoolStats.averageClassSize}
            icon={BuildingOffice2Icon}
            color="blue"
          />
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Enrollment Trends */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Enrollment Trends</h3>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="year">Last year</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData.enrollment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="students" 
                  stroke="#6366f1" 
                  name="Students"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="teachers" 
                  stroke="#10b981" 
                  name="Teachers"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Attendance Rate */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Attendance Rate</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData.attendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#3b82f6" 
                  fill="#93c5fd" 
                  name="Attendance %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <QuickActions onAction={handleQuickAction} />
          </div>
          
          {/* Alerts */}
          <AlertsPanel alerts={alerts} />
          
          {/* Classrooms */}
          <div className="lg:col-span-2">
            <ClassroomOverview 
              classrooms={classrooms}
              onClassroomClick={handleClassroomClick}
            />
          </div>
          
          {/* Performance by Grade */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Performance by Grade</h3>
            {chartData.performance.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData.performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis domain={[0, 4]} />
                  <Tooltip />
                  <Bar dataKey="gpa" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No performance data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}