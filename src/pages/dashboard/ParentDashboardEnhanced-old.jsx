import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CalendarDaysIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  HandRaisedIcon,
  UserIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  HomeIcon,
  ChartBarIcon,
  BookOpenIcon,
  SparklesIcon,
  ShieldCheckIcon,
  HeartIcon,
  TruckIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  MegaphoneIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolidIcon, StarIcon } from '@heroicons/react/24/solid'
import SophisticatedHeader from '../../components/layout/SophisticatedHeader'
import useAuthStore from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { format, addDays, isToday, isTomorrow, parseISO } from 'date-fns'

// Mock data for children (in real app, this would come from database)
const mockChildren = [
  {
    id: '1',
    full_name: 'Emma Johnson',
    grade_level: '5',
    classroom: '5B',
    teacher_name: 'Mrs. Smith',
    school_name: 'Lincoln Elementary',
    attendance_rate: 96,
    gpa: 3.8,
    avatar_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=150&h=150&fit=crop'
  },
  {
    id: '2',
    full_name: 'Michael Johnson',
    grade_level: '3',
    classroom: '3A',
    teacher_name: 'Mr. Davis',
    school_name: 'Lincoln Elementary',
    attendance_rate: 98,
    gpa: 3.9,
    avatar_url: 'https://images.unsplash.com/photo-1576828831024-aa8a97d8a6d7?w=150&h=150&fit=crop'
  }
]

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
  const trendColor = trend === 'low' ? 'text-red-600' : trend > 0 ? 'text-green-600' : 'text-gray-600'
  
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 bg-${color}-50 rounded-lg`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trendColor}`}>
            {trend === 'low' ? 'Low Balance' : trend}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  )
}

// Child Selector Component
const ChildSelector = ({ children, selectedChild, onSelectChild }) => {
  return (
    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm">
      <label className="text-sm font-medium text-gray-700">Viewing:</label>
      <select 
        value={selectedChild?.id || 'all'} 
        onChange={(e) => {
          const child = e.target.value === 'all' ? null : children.find(c => c.id === e.target.value)
          onSelectChild(child)
        }}
        className="rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        <option value="all">All Children</option>
        {children.map(child => (
          <option key={child.id} value={child.id}>
            {child.full_name} - Grade {child.grade_level}
          </option>
        ))}
      </select>
      {selectedChild && (
        <div className="flex items-center gap-2 ml-4">
          <img 
            src={selectedChild.avatar_url} 
            alt={selectedChild.full_name}
            className="w-8 h-8 rounded-full"
          />
          <div className="text-sm">
            <p className="font-medium">{selectedChild.teacher_name}</p>
            <p className="text-gray-500">Room {selectedChild.classroom}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Quick Actions Component
const QuickActions = ({ onAction }) => {
  const actions = [
    { id: 'absence', label: 'Report Absence', icon: CalendarDaysIcon, color: 'red' },
    { id: 'payment', label: 'Make Payment', icon: CreditCardIcon, color: 'green' },
    { id: 'permission', label: 'Sign Form', icon: DocumentCheckIcon, color: 'blue' },
    { id: 'lunch', label: 'Add Lunch Money', icon: BanknotesIcon, color: 'yellow' },
    { id: 'contact', label: 'Update Info', icon: UserIcon, color: 'purple' },
    { id: 'volunteer', label: 'Volunteer', icon: HandRaisedIcon, color: 'pink' }
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

// Communication Hub Component
const CommunicationHub = ({ communications, onRespond }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Important Communications</h3>
        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
          {communications.filter(c => c.requires_response).length} need response
        </span>
      </div>
      <div className="space-y-3">
        {communications.map(comm => (
          <div key={comm.id} className={`p-4 rounded-lg border-2 ${
            comm.requires_response && comm.response_status === 'pending' 
              ? 'border-amber-400 bg-amber-50' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {comm.type === 'announcement' && <MegaphoneIcon className="h-4 w-4 text-blue-600" />}
                  {comm.type === 'permission_slip' && <DocumentCheckIcon className="h-4 w-4 text-amber-600" />}
                  {comm.type === 'message' && <EnvelopeIcon className="h-4 w-4 text-gray-600" />}
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {comm.type.replace('_', ' ')}
                  </span>
                  {comm.requires_response && (
                    <span className="text-xs text-amber-600">
                      • Due {format(parseISO(comm.response_deadline), 'MMM d')}
                    </span>
                  )}
                </div>
                <h4 className="font-medium mt-1">{comm.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{comm.content}</p>
                <p className="text-xs text-gray-500 mt-2">From: {comm.sender}</p>
              </div>
              {comm.requires_response && comm.response_status === 'pending' && (
                <button 
                  onClick={() => onRespond(comm)}
                  className="ml-4 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                >
                  Respond
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <button className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
        View all communications →
      </button>
    </div>
  )
}

// Academic Overview Component
const AcademicOverview = ({ selectedChild, records }) => {
  const recentGrades = records.filter(r => r.type === 'grade').slice(0, 5)
  const attendance = records.filter(r => r.type === 'attendance')
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Academic Overview</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700">View Full Report →</button>
      </div>
      
      {selectedChild ? (
        <div className="space-y-4">
          {/* Grade Summary */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <AcademicCapIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Current GPA</p>
                <p className="text-2xl font-bold text-green-600">{selectedChild.gpa}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Attendance Rate</p>
              <p className="text-lg font-bold">{selectedChild.attendance_rate}%</p>
            </div>
          </div>
          
          {/* Recent Grades */}
          <div>
            <h4 className="font-medium mb-2">Recent Grades</h4>
            <div className="space-y-2">
              {recentGrades.map((grade, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{grade.subject}</p>
                    <p className="text-sm text-gray-600">{grade.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{grade.grade}</p>
                    <p className="text-xs text-gray-500">{grade.points_earned}/{grade.points_possible}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {mockChildren.map(child => (
            <div key={child.id} className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <img 
                  src={child.avatar_url} 
                  alt={child.full_name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{child.full_name}</p>
                  <p className="text-sm text-gray-600">Grade {child.grade_level}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">GPA</p>
                  <p className="font-bold">{child.gpa}</p>
                </div>
                <div>
                  <p className="text-gray-500">Attendance</p>
                  <p className="font-bold">{child.attendance_rate}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Upcoming Events Component
const UpcomingEventsCard = ({ events, selectedChild }) => {
  const navigate = useNavigate()
  const childEvents = selectedChild 
    ? events.filter(e => e.student_ids?.includes(selectedChild.id))
    : events
    
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Upcoming Events</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700">View Calendar →</button>
      </div>
      
      <div className="space-y-3">
        {childEvents.slice(0, 5).map((event) => {
          const eventDate = parseISO(event.start_time)
          const isUrgent = event.requires_rsvp && !event.rsvp_status
          
          return (
            <div 
              key={event.id}
              className={`p-4 rounded-lg border-2 ${
                isUrgent ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
              } hover:shadow-md transition-all cursor-pointer`}
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {event.type === 'field_trip' && <TruckIcon className="h-4 w-4 text-green-600" />}
                    {event.type === 'performance' && <SparklesIcon className="h-4 w-4 text-purple-600" />}
                    {event.type === 'sports' && <TrophyIcon className="h-4 w-4 text-blue-600" />}
                    {event.type === 'meeting' && <UserGroupIcon className="h-4 w-4 text-gray-600" />}
                    <h4 className="font-medium">{event.title}</h4>
                    {isUrgent && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        RSVP Required
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <CalendarDaysIcon className="h-4 w-4" />
                      {isToday(eventDate) && 'Today, '}
                      {isTomorrow(eventDate) && 'Tomorrow, '}
                      {format(eventDate, 'MMM d, h:mm a')}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4" />
                      {event.location}
                    </span>
                  </div>
                  {event.cost > 0 && (
                    <p className="text-sm mt-1">
                      <span className="font-medium text-green-600">${event.cost}</span> per student
                    </p>
                  )}
                </div>
                {event.requires_rsvp && (
                  <button className="ml-4 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    RSVP
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Lunch Account Card
const LunchAccountCard = ({ accounts, onAddFunds }) => {
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
  const lowBalanceAccounts = accounts.filter(acc => acc.balance < acc.low_balance_threshold)
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Lunch Accounts</h3>
        <button 
          onClick={onAddFunds}
          className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
        >
          Add Funds
        </button>
      </div>
      
      <div className="space-y-3">
        {accounts.map((account) => (
          <div key={account.id} className={`p-4 rounded-lg border-2 ${
            account.balance < account.low_balance_threshold 
              ? 'border-red-400 bg-red-50' 
              : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={account.student.avatar_url} 
                  alt={account.student.full_name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{account.student.full_name}</p>
                  <p className="text-sm text-gray-600">Grade {account.student.grade_level}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold ${
                  account.balance < account.low_balance_threshold ? 'text-red-600' : 'text-green-600'
                }`}>
                  ${account.balance.toFixed(2)}
                </p>
                {account.balance < account.low_balance_threshold && (
                  <p className="text-xs text-red-600">Low balance</p>
                )}
              </div>
            </div>
            {account.auto_reload_enabled && (
              <p className="text-xs text-gray-500 mt-2">
                Auto-reload: ${account.auto_reload_amount} when below ${account.low_balance_threshold}
              </p>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <p className="font-medium">Total Balance</p>
          <p className="text-xl font-bold">${totalBalance.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}

// Emergency Info Component
const EmergencyInfo = ({ school }) => {
  return (
    <div className="bg-red-50 rounded-xl p-6 shadow-sm border-2 border-red-200">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheckIcon className="h-6 w-6 text-red-600" />
        <h3 className="text-lg font-semibold">Emergency Information</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <PhoneIcon className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm text-gray-600">Emergency Hotline</p>
            <p className="font-bold">(555) 123-4567</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <MapPinIcon className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm text-gray-600">Safe Pickup Location</p>
            <p className="font-medium">Main parking lot - North entrance</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <BellIcon className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm text-gray-600">Alert Status</p>
            <p className="font-medium text-green-600">All Clear</p>
          </div>
        </div>
      </div>
      
      <button className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium">
        View Emergency Procedures →
      </button>
    </div>
  )
}

export default function ParentDashboardEnhanced() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const [selectedChild, setSelectedChild] = useState(null)
  const [activeView, setActiveView] = useState('overview')
  const [loading, setLoading] = useState(true)
  
  // State for various data
  const [children, setChildren] = useState(mockChildren)
  const [communications, setCommunications] = useState([])
  const [events, setEvents] = useState([])
  const [academicRecords, setAcademicRecords] = useState([])
  const [lunchAccounts, setLunchAccounts] = useState([])
  const [volunteerOpportunities, setVolunteerOpportunities] = useState([])
  
  // Mock data loading
  useEffect(() => {
    loadDashboardData()
  }, [selectedChild])
  
  const loadDashboardData = async () => {
    setLoading(true)
    
    // Mock communications
    setCommunications([
      {
        id: '1',
        type: 'permission_slip',
        title: 'Field Trip Permission - Science Museum',
        content: 'Your child\'s class is planning a field trip to the Science Museum on March 15th. Please review and sign the permission slip.',
        requires_response: true,
        response_deadline: addDays(new Date(), 5).toISOString(),
        response_status: 'pending',
        sender: 'Mrs. Smith'
      },
      {
        id: '2',
        type: 'announcement',
        title: 'Parent-Teacher Conferences Next Week',
        content: 'Sign up for your conference slot. Available times are filling up quickly.',
        requires_response: true,
        response_deadline: addDays(new Date(), 3).toISOString(),
        response_status: 'pending',
        sender: 'Lincoln Elementary'
      },
      {
        id: '3',
        type: 'message',
        title: 'Excellent Progress in Math',
        content: 'Just wanted to share that Emma has been doing wonderfully in our advanced math unit!',
        requires_response: false,
        sender: 'Mrs. Smith'
      }
    ])
    
    // Mock events
    setEvents([
      {
        id: '1',
        title: 'Science Museum Field Trip',
        type: 'field_trip',
        start_time: addDays(new Date(), 10).toISOString(),
        location: 'City Science Museum',
        cost: 15,
        requires_rsvp: true,
        rsvp_status: null,
        student_ids: ['1']
      },
      {
        id: '2',
        title: 'Spring Concert',
        type: 'performance',
        start_time: addDays(new Date(), 15).toISOString(),
        location: 'School Auditorium',
        cost: 0,
        requires_rsvp: false,
        student_ids: ['1', '2']
      },
      {
        id: '3',
        title: 'Basketball Game vs. Madison',
        type: 'sports',
        start_time: addDays(new Date(), 3).toISOString(),
        location: 'School Gymnasium',
        cost: 0,
        requires_rsvp: false,
        student_ids: ['1']
      }
    ])
    
    // Mock academic records
    setAcademicRecords([
      {
        type: 'grade',
        subject: 'Mathematics',
        title: 'Fractions Test',
        grade: 'A',
        points_earned: 95,
        points_possible: 100,
        date: new Date().toISOString()
      },
      {
        type: 'grade',
        subject: 'Science',
        title: 'Solar System Project',
        grade: 'A+',
        points_earned: 48,
        points_possible: 50,
        date: new Date().toISOString()
      },
      {
        type: 'attendance',
        date: new Date().toISOString(),
        status: 'present'
      }
    ])
    
    // Mock lunch accounts
    setLunchAccounts([
      {
        id: '1',
        student: mockChildren[0],
        balance: 12.50,
        low_balance_threshold: 10.00,
        auto_reload_enabled: true,
        auto_reload_amount: 25.00
      },
      {
        id: '2',
        student: mockChildren[1],
        balance: 5.75,
        low_balance_threshold: 10.00,
        auto_reload_enabled: false
      }
    ])
    
    setLoading(false)
  }
  
  const handleQuickAction = async (actionId) => {
    switch (actionId) {
      case 'absence':
        navigate('/forms/absence-report')
        break
      case 'payment':
        navigate('/payments')
        break
      case 'permission':
        navigate('/forms/permissions')
        break
      case 'lunch':
        navigate('/lunch/add-funds')
        break
      case 'contact':
        navigate('/profile/edit')
        break
      case 'volunteer':
        navigate('/volunteer/opportunities')
        break
      default:
        toast.success(`${actionId} action triggered`)
    }
  }
  
  const handleRespond = (communication) => {
    navigate(`/communications/${communication.id}/respond`)
  }
  
  const handleAddLunchFunds = () => {
    navigate('/lunch/add-funds')
  }
  
  // Calculate metrics
  const metrics = {
    totalChildren: children.length,
    upcomingEvents: events.filter(e => new Date(e.start_time) > new Date()).length,
    pendingActions: communications.filter(c => c.requires_response && c.response_status === 'pending').length,
    totalLunchBalance: lunchAccounts.reduce((sum, acc) => sum + acc.balance, 0),
    averageAttendance: children.reduce((sum, child) => sum + child.attendance_rate, 0) / children.length,
    averageGPA: children.reduce((sum, child) => sum + child.gpa, 0) / children.length
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <SophisticatedHeader />
      
      {/* Child Selector Bar */}
      <div className="bg-white shadow-sm px-6 py-4 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <ChildSelector 
            children={children}
            selectedChild={selectedChild}
            onSelectChild={setSelectedChild}
          />
          <div className="flex gap-2">
            {['overview', 'academic', 'events', 'communications', 'financial'].map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === view 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {activeView === 'overview' && (
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column - Main Content */}
              <div className="col-span-8 space-y-6">
                {/* Welcome Message */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                  <h1 className="text-2xl font-bold mb-2">
                    Welcome back, {profile?.full_name || 'Parent'}!
                  </h1>
                  <p className="text-indigo-100">
                    You have {metrics.pendingActions} items requiring your attention today.
                  </p>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <StatCard
                    title="Average Attendance"
                    value={`${metrics.averageAttendance.toFixed(0)}%`}
                    subtitle="All children"
                    icon={CheckCircleIcon}
                    trend="+2%"
                    color="green"
                  />
                  <StatCard
                    title="Upcoming Events"
                    value={metrics.upcomingEvents}
                    subtitle="Next 30 days"
                    icon={CalendarDaysIcon}
                    color="blue"
                  />
                  <StatCard
                    title="Lunch Balance"
                    value={`$${metrics.totalLunchBalance.toFixed(2)}`}
                    subtitle="All accounts"
                    icon={CurrencyDollarIcon}
                    trend={metrics.totalLunchBalance < 20 ? 'low' : null}
                    color="yellow"
                  />
                  <StatCard
                    title="Average GPA"
                    value={metrics.averageGPA.toFixed(1)}
                    subtitle="All children"
                    icon={AcademicCapIcon}
                    trend="+0.1"
                    color="purple"
                  />
                </div>
                
                {/* Quick Actions */}
                <QuickActions onAction={handleQuickAction} />
                
                {/* Academic Overview */}
                <AcademicOverview 
                  selectedChild={selectedChild}
                  records={academicRecords}
                />
                
                {/* Upcoming Events */}
                <UpcomingEventsCard 
                  events={events}
                  selectedChild={selectedChild}
                />
              </div>
              
              {/* Right Column - Secondary Content */}
              <div className="col-span-4 space-y-6">
                {/* Important Communications */}
                <CommunicationHub 
                  communications={communications}
                  onRespond={handleRespond}
                />
                
                {/* Lunch Accounts */}
                <LunchAccountCard 
                  accounts={lunchAccounts}
                  onAddFunds={handleAddLunchFunds}
                />
                
                {/* Emergency Information */}
                <EmergencyInfo 
                  school={{ name: 'Lincoln Elementary' }}
                />
              </div>
            </div>
          )}
          
          {/* Other views would go here */}
          {activeView === 'academic' && (
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Academic Details</h2>
              <p className="text-gray-600">Detailed academic information for your children...</p>
            </div>
          )}
          
          {activeView === 'events' && (
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">All Events</h2>
              <p className="text-gray-600">Complete calendar of school events...</p>
            </div>
          )}
          
          {activeView === 'communications' && (
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">All Communications</h2>
              <p className="text-gray-600">Message center for all school communications...</p>
            </div>
          )}
          
          {activeView === 'financial' && (
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Financial Overview</h2>
              <p className="text-gray-600">Manage lunch accounts, fees, and payments...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}