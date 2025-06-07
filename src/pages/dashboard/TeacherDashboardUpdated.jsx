import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CalendarDaysIcon,
  AcademicCapIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  PlusIcon,
  EnvelopeIcon,
  ClockIcon,
  MapPinIcon,
  BookOpenIcon,
  HandRaisedIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid'
import Header from '../../components/layout/Header'
import useAuthStore from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from 'date-fns'
import { useClassroom } from '../../hooks/useClassroom'
import { useTeacherEvents } from '../../hooks/useTeacherEvents'
import LoadingSpinner from '../../components/common/LoadingSpinner'

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 bg-${color}-50 rounded-lg`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  )
}

// Student List Component
const StudentList = ({ students, onStudentClick }) => {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredStudents = students.filter(student =>
    student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">My Students</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserGroupIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No students found</p>
          </div>
        ) : (
          filteredStudents.map(student => (
            <div
              key={student.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onStudentClick(student)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600">
                    {student.first_name?.[0]}{student.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {student.first_name} {student.last_name}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>GPA: {student.current_gpa?.toFixed(2) || 'N/A'}</span>
                    <span>Attendance: {student.attendance_rate || 0}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {student.attendance_rate < 90 && (
                  <ExclamationCircleIcon className="h-4 w-4 text-amber-500" title="Low attendance" />
                )}
                {student.current_gpa && student.current_gpa >= 3.5 && (
                  <AcademicCapIcon className="h-4 w-4 text-green-500" title="Honor roll" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Quick Actions Component
const QuickActions = ({ onAction }) => {
  const actions = [
    { id: 'attendance', label: 'Take Attendance', icon: ClipboardDocumentCheckIcon, color: 'blue' },
    { id: 'grades', label: 'Enter Grades', icon: BookOpenIcon, color: 'green' },
    { id: 'message', label: 'Message Parents', icon: EnvelopeIcon, color: 'purple' },
    { id: 'event', label: 'Create Event', icon: CalendarDaysIcon, color: 'indigo' },
    { id: 'announcement', label: 'Post Update', icon: BellIcon, color: 'yellow' },
    { id: 'resources', label: 'Share Resources', icon: DocumentCheckIcon, color: 'pink' }
  ]
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-3">
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

// Calendar Component
const MiniCalendar = ({ events, selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  const eventDates = events.reduce((acc, event) => {
    const date = format(parseISO(event.start_time), 'yyyy-MM-dd')
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})
  
  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  }
  
  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  }
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const hasEvents = eventDates[dateStr] > 0
          const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr
          
          return (
            <button
              key={day.toString()}
              onClick={() => onDateSelect(day)}
              className={`
                aspect-square p-2 text-sm rounded-lg transition-all
                ${!isSameMonth(day, currentMonth) ? 'text-gray-300' : ''}
                ${isToday(day) ? 'bg-indigo-100 text-indigo-600 font-bold' : ''}
                ${isSelected ? 'bg-indigo-600 text-white' : ''}
                ${hasEvents && !isSelected ? 'bg-indigo-50' : ''}
                hover:bg-gray-100
              `}
            >
              <div className="relative">
                {format(day, 'd')}
                {hasEvents && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className="w-1 h-1 bg-indigo-600 rounded-full"></div>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function TeacherDashboardUpdated() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedStudent, setSelectedStudent] = useState(null)
  
  // Real data hooks
  const { classroom, students, classStats, loading: classLoading } = useClassroom()
  const { events, eventStats, loading: eventsLoading, createEvent } = useTeacherEvents()
  
  const loading = classLoading || eventsLoading
  
  const handleQuickAction = (actionId) => {
    switch(actionId) {
      case 'attendance':
        navigate('/attendance')
        break
      case 'grades':
        navigate('/grades')
        break
      case 'message':
        toast.info('Opening parent messaging...')
        break
      case 'event':
        navigate('/events/create')
        break
      case 'announcement':
        toast.info('Announcement feature coming soon!')
        break
      case 'resources':
        toast.info('Resource sharing coming soon!')
        break
    }
  }
  
  const handleStudentClick = (student) => {
    setSelectedStudent(student)
    navigate(`/students/${student.id}`)
  }
  
  if (loading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />
  }
  
  if (!classroom) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 px-6 max-w-7xl mx-auto">
          <div className="bg-white rounded-xl p-8 text-center">
            <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Classroom Assigned</h2>
            <p className="text-gray-600 mb-6">Please contact your school administrator to be assigned to a classroom.</p>
            <button
              onClick={() => navigate('/help')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Get Help
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Get today's events
  const todayEvents = events.filter(event => {
    const eventDate = format(parseISO(event.start_time), 'yyyy-MM-dd')
    const today = format(new Date(), 'yyyy-MM-dd')
    return eventDate === today
  })
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-24 px-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 mt-1">
            {classroom.name} • Grade {classroom.grade_level} • {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Total Students" 
            value={classStats.totalStudents} 
            subtitle={`Grade ${classStats.gradeLevel}`}
            icon={UsersIcon}
            color="indigo"
          />
          <StatCard 
            title="Class Average GPA" 
            value={classStats.averageGPA.toFixed(2)} 
            subtitle="Current term"
            icon={AcademicCapIcon}
            trend={classStats.averageGPA > 3.0 ? 5 : -2}
            color="green"
          />
          <StatCard 
            title="Attendance Rate" 
            value={`${Math.round(classStats.averageAttendance)}%`} 
            subtitle="This month"
            icon={CheckCircleIcon}
            color="blue"
          />
          <StatCard 
            title="Upcoming Events" 
            value={eventStats.upcomingEvents} 
            subtitle={`${todayEvents.length} today`}
            icon={CalendarDaysIcon}
            color="purple"
          />
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Students & Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <StudentList 
              students={students} 
              onStudentClick={handleStudentClick}
            />
            <QuickActions onAction={handleQuickAction} />
          </div>
          
          {/* Right Column - Calendar & Today's Schedule */}
          <div className="space-y-6">
            <MiniCalendar 
              events={events}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
            
            {/* Today's Schedule */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Today's Schedule</h3>
              <div className="space-y-3">
                {todayEvents.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No events scheduled for today</p>
                ) : (
                  todayEvents.map(event => (
                    <div 
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          <ClockIcon className="h-3 w-3 inline mr-1" />
                          {format(parseISO(event.start_time), 'h:mm a')}
                        </p>
                        {event.location && (
                          <p className="text-xs text-gray-500 mt-1">
                            <MapPinIcon className="h-3 w-3 inline mr-1" />
                            {event.location}
                          </p>
                        )}
                      </div>
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  ))
                )}
              </div>
              
              <button
                onClick={() => navigate('/events/create')}
                className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Create New Event
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}