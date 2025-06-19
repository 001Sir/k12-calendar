// import React, { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import {
//   CalendarDaysIcon,
//   AcademicCapIcon,
//   CurrencyDollarIcon,
//   CreditCardIcon,
//   UsersIcon,
//   ChevronLeftIcon,
//   ChevronRightIcon,
//   BellIcon,
//   CheckCircleIcon,
//   ExclamationTriangleIcon,
//   DocumentCheckIcon,
//   HandRaisedIcon,
//   UserIcon,
//   ClockIcon,
//   MapPinIcon,
//   PhoneIcon,
//   EnvelopeIcon,
//   HomeIcon,
//   ChartBarIcon,
//   BookOpenIcon,
//   SparklesIcon,
//   ShieldCheckIcon,
//   HeartIcon,
//   TruckIcon,
//   BanknotesIcon,
//   ClipboardDocumentCheckIcon,
//   MegaphoneIcon,
//   UserGroupIcon,
//   ArrowTrendingUpIcon,
//   ArrowTrendingDownIcon,
//   TrophyIcon
// } from '@heroicons/react/24/outline'
// import { CheckCircleIcon as CheckCircleSolidIcon, StarIcon } from '@heroicons/react/24/solid'
// import SophisticatedHeader from '../../components/layout/SophisticatedHeader'
// import useAuthStore from '../../store/authStore'
// import { supabase } from '../../lib/supabase'
// import toast from 'react-hot-toast'
// import { format, addDays, isToday, isTomorrow, parseISO } from 'date-fns'
// import { useStudents } from '../../hooks/useStudents'
// import { useCommunications } from '../../hooks/useCommunications'
// import { useAcademicRecords } from '../../hooks/useAcademicRecords'
// import { useLunchAccounts } from '../../hooks/useLunchAccounts'
// import LoadingSpinner from '../../components/common/LoadingSpinner'

// // Stat Card Component
// const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
//   const trendColor = trend === 'low' ? 'text-red-600' : trend > 0 ? 'text-green-600' : 'text-gray-600'

//   return (
//     <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
//       <div className="flex items-start justify-between mb-3">
//         <div className={`p-2 bg-${color}-50 rounded-lg`}>
//           <Icon className={`h-5 w-5 text-${color}-600`} />
//         </div>
//         {trend && (
//           <span className={`text-xs font-medium ${trendColor}`}>
//             {trend === 'low' ? 'Low Balance' : trend}
//           </span>
//         )}
//       </div>
//       <p className="text-sm text-gray-500 mb-1">{title}</p>
//       <p className="text-2xl font-bold text-gray-900">{value}</p>
//       <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
//     </div>
//   )
// }

// // Child Selector Component
// const ChildSelector = ({ children, selectedChild, onSelectChild }) => {
//   return (
//     <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm">
//       <label className="text-sm font-medium text-gray-700">Viewing:</label>
//       <select
//         value={selectedChild?.id || 'all'}
//         onChange={(e) => {
//           const child = e.target.value === 'all' ? null : children.find(c => c.id === e.target.value)
//           onSelectChild(child)
//         }}
//         className="rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
//       >
//         <option value="all">All Children</option>
//         {children.map(child => (
//           <option key={child.id} value={child.id}>
//             {child.first_name} {child.last_name} - Grade {child.grade_level}
//           </option>
//         ))}
//       </select>
//       {selectedChild && (
//         <div className="flex items-center gap-2 ml-4">
//           <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
//             <span className="text-sm font-bold text-indigo-600">
//               {selectedChild.first_name[0]}
//             </span>
//           </div>
//           <div className="text-sm">
//             <p className="font-medium">{selectedChild.school?.name}</p>
//             <p className="text-gray-500">Grade {selectedChild.grade_level}</p>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// // Quick Actions Component
// const QuickActions = ({ onAction }) => {
//   const actions = [
//     { id: 'absence', label: 'Report Absence', icon: CalendarDaysIcon, color: 'red' },
//     { id: 'payment', label: 'Make Payment', icon: CreditCardIcon, color: 'green' },
//     { id: 'permission', label: 'Sign Form', icon: DocumentCheckIcon, color: 'blue' },
//     { id: 'lunch', label: 'Add Lunch Money', icon: BanknotesIcon, color: 'yellow' },
//     { id: 'contact', label: 'Update Info', icon: UserIcon, color: 'purple' },
//     { id: 'volunteer', label: 'Volunteer', icon: HandRaisedIcon, color: 'pink' }
//   ]

//   return (
//     <div className="bg-white rounded-xl p-6 shadow-sm">
//       <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
//       <div className="grid grid-cols-3 gap-3">
//         {actions.map(action => (
//           <button
//             key={action.id}
//             onClick={() => onAction(action.id)}
//             className={`p-4 rounded-lg border-2 hover:shadow-md transition-all hover:scale-105 hover:border-${action.color}-500`}
//           >
//             <action.icon className={`h-6 w-6 mx-auto mb-2 text-${action.color}-600`} />
//             <span className="text-sm font-medium">{action.label}</span>
//           </button>
//         ))}
//       </div>
//     </div>
//   )
// }

// // Communication Hub Component
// const CommunicationHub = ({ communications, onRespond, onMarkAsRead }) => {
//   const urgentComms = communications.filter(c => c.priority === 'urgent' && !c.read_at)

//   return (
//     <div className="bg-white rounded-xl p-6 shadow-sm">
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-lg font-semibold">Important Communications</h3>
//         <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
//           {urgentComms.length} urgent
//         </span>
//       </div>
//       <div className="space-y-3">
//         {communications.slice(0, 5).map(comm => (
//           <div
//             key={comm.id}
//             className={`p-4 rounded-lg border-2 ${
//               comm.priority === 'urgent' && !comm.read_at
//                 ? 'border-amber-400 bg-amber-50'
//                 : 'border-gray-200 bg-gray-50'
//             }`}
//             onClick={() => !comm.read_at && onMarkAsRead(comm.id)}
//           >
//             <div className="flex items-start justify-between">
//               <div className="flex-1">
//                 <div className="flex items-center gap-2">
//                   {comm.category === 'announcement' && <MegaphoneIcon className="h-4 w-4 text-blue-600" />}
//                   {comm.category === 'permission' && <DocumentCheckIcon className="h-4 w-4 text-amber-600" />}
//                   {comm.category === 'academic' && <AcademicCapIcon className="h-4 w-4 text-green-600" />}
//                   <span className="text-xs font-medium text-gray-500 uppercase">
//                     {comm.category}
//                   </span>
//                   {comm.priority === 'urgent' && (
//                     <span className="text-xs text-amber-600">
//                       • Urgent
//                     </span>
//                   )}
//                 </div>
//                 <h4 className="font-medium mt-1">{comm.subject}</h4>
//                 <p className="text-sm text-gray-600 mt-1">{comm.message}</p>
//                 <p className="text-xs text-gray-500 mt-2">
//                   From: {comm.sender?.full_name} • {format(parseISO(comm.created_at), 'MMM d')}
//                 </p>
//               </div>
//               {comm.priority === 'urgent' && !comm.read_at && (
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     onRespond(comm)
//                   }}
//                   className="ml-4 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
//                 >
//                   Respond
//                 </button>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }

// export default function ParentDashboardEnhanced() {
//   const navigate = useNavigate()
//   const { user, profile } = useAuthStore()
//   const [selectedChild, setSelectedChild] = useState(null)
//   const [activeView, setActiveView] = useState('overview')
//   const [events, setEvents] = useState([])

//   // Real data hooks
//   const { students, loading: studentsLoading } = useStudents()
//   const { communications, unreadCount, loading: commsLoading, markAsRead } = useCommunications()
//   const { records: academicRecords, summary: academicSummary } = useAcademicRecords(selectedChild?.id)
//   const { accounts: lunchAccounts, totalBalance, lowBalanceAccounts, addFunds } = useLunchAccounts()

//   useEffect(() => {
//     // Fetch events when students are loaded
//     if (students.length > 0) {
//       fetchEvents()
//     }
//   }, [students])

//   const fetchEvents = async () => {
//     try {
//       const schoolIds = [...new Set(students.map(s => s.school_id).filter(Boolean))]
//       if (schoolIds.length === 0) return

//       const { data, error } = await supabase
//         .from('events')
//         .select('*')
//         .in('school_id', schoolIds)
//         .gte('start_time', new Date().toISOString())
//         .order('start_time')
//         .limit(10)

//       if (error) throw error
//       setEvents(data || [])
//     } catch (err) {
//       console.error('Error fetching events:', err)
//     }
//   }

//   const handleQuickAction = (actionId) => {
//     switch(actionId) {
//       case 'absence':
//         toast.info('Report absence feature coming soon!')
//         break
//       case 'payment':
//         navigate('/payments')
//         break
//       case 'permission':
//         const urgentComm = communications.find(c => c.priority === 'urgent' && !c.read_at)
//         if (urgentComm) {
//           handleRespond(urgentComm)
//         } else {
//           toast.info('No forms require signature')
//         }
//         break
//       case 'lunch':
//         if (lowBalanceAccounts.length > 0) {
//           handleAddLunchMoney(lowBalanceAccounts[0].student_id)
//         } else {
//           toast.info('All lunch accounts have sufficient balance')
//         }
//         break
//       case 'contact':
//         navigate('/profile')
//         break
//       case 'volunteer':
//         navigate('/volunteer')
//         break
//     }
//   }

//   const handleRespond = (communication) => {
//     // Handle communication response
//     toast.success('Opening response form...')
//     // In a real app, this would open a modal or navigate to a response page
//   }

//   const handleAddLunchMoney = async (studentId) => {
//     const amount = parseFloat(prompt('Enter amount to add:', '20'))
//     if (amount && !isNaN(amount)) {
//       const result = await addFunds(studentId, amount)
//       if (result.success) {
//         toast.success(`$${amount.toFixed(2)} added to lunch account`)
//       }
//     }
//   }

//   if (studentsLoading || commsLoading) {
//     return <LoadingSpinner fullScreen text="Loading dashboard..." />
//   }

//   if (students.length === 0) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <SophisticatedHeader />
//         <div className="pt-24 px-6 max-w-7xl mx-auto">
//           <div className="bg-white rounded-xl p-8 text-center">
//             <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
//             <h2 className="text-2xl font-bold text-gray-900 mb-2">No Children Found</h2>
//             <p className="text-gray-600 mb-6">Add your children to start using the parent dashboard.</p>
//             <button
//               onClick={() => navigate('/settings')}
//               className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
//             >
//               Add Children
//             </button>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   // Calculate average GPA across all children if no child is selected
//   const overallGPA = selectedChild
//     ? academicSummary?.currentGpa
//     : students.reduce((sum, s) => sum + (s.current_gpa || 0), 0) / students.length

//   const overallAttendance = selectedChild
//     ? academicSummary?.currentAttendance
//     : students.reduce((sum, s) => sum + (s.attendance_rate || 0), 0) / students.length

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <SophisticatedHeader />

//       <div className="pt-24 px-6 max-w-7xl mx-auto">
//         {/* Header Section */}
//         <div className="flex items-center justify-between mb-6">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">
//               Welcome back, {profile?.full_name?.split(' ')[0]}!
//             </h1>
//             <p className="text-gray-600 mt-1">
//               {format(new Date(), 'EEEE, MMMM d, yyyy')}
//             </p>
//           </div>

//           <ChildSelector
//             children={students}
//             selectedChild={selectedChild}
//             onSelectChild={setSelectedChild}
//           />
//         </div>

//         {/* Main Content */}
//         <div>
//           {/* Stats Overview */}
//           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//             <StatCard
//               title="Total Children"
//               value={students.length}
//               subtitle="Active enrollments"
//               icon={UsersIcon}
//               color="indigo"
//             />
//             <StatCard
//               title="Average GPA"
//               value={overallGPA ? overallGPA.toFixed(2) : "N/A"}
//               subtitle={selectedChild ? selectedChild.first_name : "All children"}
//               icon={AcademicCapIcon}
//               trend={overallGPA > 3.5 ? "+0.2" : null}
//               color="green"
//             />
//             <StatCard
//               title="Lunch Balance"
//               value={`$${totalBalance.toFixed(2)}`}
//               subtitle={`${lowBalanceAccounts.length} account${lowBalanceAccounts.length !== 1 ? 's' : ''} low`}
//               icon={CurrencyDollarIcon}
//               trend={lowBalanceAccounts.length > 0 ? "low" : null}
//               color="yellow"
//             />
//             <StatCard
//               title="Attendance"
//               value={overallAttendance ? `${Math.round(overallAttendance)}%` : "N/A"}
//               subtitle={selectedChild ? selectedChild.first_name : "Average this term"}
//               icon={CheckCircleIcon}
//               color="blue"
//             />
//           </div>

//           {/* Quick Actions & Communications */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//             <QuickActions onAction={handleQuickAction} />
//             <CommunicationHub
//               communications={communications}
//               onRespond={handleRespond}
//               onMarkAsRead={markAsRead}
//             />
//           </div>

//           {/* Upcoming Events */}
//           <div className="bg-white rounded-xl p-6 shadow-sm">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-semibold">Upcoming Events</h3>
//               <button
//                 onClick={() => navigate('/calendar')}
//                 className="text-sm text-blue-600 hover:text-blue-700"
//               >
//                 View Calendar →
//               </button>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {events.length === 0 ? (
//                 <div className="col-span-full text-center py-8 text-gray-500">
//                   <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
//                   <p>No upcoming events</p>
//                 </div>
//               ) : (
//                 events.slice(0, 6).map(event => (
//                   <div
//                     key={event.id}
//                     className="p-4 rounded-lg border-2 border-gray-200 hover:shadow-md transition-all cursor-pointer"
//                     onClick={() => navigate(`/events/${event.id}`)}
//                   >
//                     <div className="flex items-start justify-between mb-2">
//                       <h4 className="font-medium text-sm">{event.title}</h4>
//                       <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
//                     </div>
//                     <p className="text-xs text-gray-600">
//                       {format(parseISO(event.start_time), 'MMM d, h:mm a')}
//                     </p>
//                     {event.location && (
//                       <p className="text-xs text-gray-500 mt-1">
//                         <MapPinIcon className="h-3 w-3 inline mr-1" />
//                         {event.location}
//                       </p>
//                     )}
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }


import React, { useState, useEffect, useMemo } from 'react'
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
import { useStudents } from '../../hooks/useStudents'
import { useCommunications } from '../../hooks/useCommunications'
import { useAcademicRecords } from '../../hooks/useAcademicRecords'
import { useLunchAccounts } from '../../hooks/useLunchAccounts'
import LoadingSpinner from '../../components/common/LoadingSpinner'

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
            {child.first_name} {child.last_name} - Grade {child.grade_level}
          </option>
        ))}
      </select>
      {selectedChild && (
        <div className="flex items-center gap-2 ml-4">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-sm font-bold text-indigo-600">
              {selectedChild.first_name[0]}
            </span>
          </div>
          <div className="text-sm">
            <p className="font-medium">{selectedChild.school?.name}</p>
            <p className="text-gray-500">Grade {selectedChild.grade_level}</p>
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
const CommunicationHub = ({ communications, onRespond, onMarkAsRead }) => {
  const urgentComms = communications.filter(c => c.priority === 'urgent' && !c.read_at)

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Important Communications</h3>
        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
          {urgentComms.length} urgent
        </span>
      </div>
      <div className="space-y-3">
        {communications.slice(0, 5).map(comm => (
          <div
            key={comm.id}
            className={`p-4 rounded-lg border-2 ${
              comm.priority === 'urgent' && !comm.read_at
                ? 'border-amber-400 bg-amber-50'
                : 'border-gray-200 bg-gray-50'
            }`}
            onClick={() => !comm.read_at && onMarkAsRead(comm.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {comm.category === 'announcement' && <MegaphoneIcon className="h-4 w-4 text-blue-600" />}
                  {comm.category === 'permission' && <DocumentCheckIcon className="h-4 w-4 text-amber-600" />}
                  {comm.category === 'academic' && <AcademicCapIcon className="h-4 w-4 text-green-600" />}
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {comm.category}
                  </span>
                  {comm.priority === 'urgent' && (
                    <span className="text-xs text-amber-600">
                      • Urgent
                    </span>
                  )}
                </div>
                <h4 className="font-medium mt-1">{comm.subject}</h4>
                <p className="text-sm text-gray-600 mt-1">{comm.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  From: {comm.sender?.full_name} • {format(parseISO(comm.created_at), 'MMM d')}
                </p>
              </div>
              {comm.priority === 'urgent' && !comm.read_at && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRespond(comm)
                  }}
                  className="ml-4 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                >
                  Respond
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ParentDashboardEnhanced() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const [selectedChild, setSelectedChild] = useState(null)
  const [activeView, setActiveView] = useState('overview')
  const [events, setEvents] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load students first
  const { students, loading: studentsLoading } = useStudents()

  // Only call other hooks after students are loaded to prevent simultaneous subscriptions
  const shouldLoadData = !studentsLoading && students.length > 0 && isInitialized

  const {
    communications = [],
    unreadCount = 0,
    loading: commsLoading = false,
    markAsRead = () => {}
  } = shouldLoadData ? useCommunications() : {}

  const {
    records: academicRecords = [],
    summary: academicSummary = null
  } = shouldLoadData ? useAcademicRecords(selectedChild?.id) : {}

  const {
    accounts: lunchAccounts = [],
    totalBalance = 0,
    lowBalanceAccounts = [],
    addFunds = async () => ({})
  } = shouldLoadData ? useLunchAccounts() : {}

  // Initialize after students load
  useEffect(() => {
    if (!studentsLoading && students.length > 0 && !isInitialized) {
      // Small delay to prevent simultaneous state updates
      setTimeout(() => {
        setIsInitialized(true)
      }, 100)
    }
  }, [studentsLoading, students.length, isInitialized])

  useEffect(() => {
    // Fetch events when students are loaded and initialized
    if (shouldLoadData) {
      fetchEvents()
    }
  }, [shouldLoadData])

  const fetchEvents = async () => {
    try {
      const schoolIds = [...new Set(students.map(s => s.school_id).filter(Boolean))]
      if (schoolIds.length === 0) return

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('school_id', schoolIds)
        .gte('start_time', new Date().toISOString())
        .order('start_time')
        .limit(10)

      if (error) throw error
      setEvents(data || [])
    } catch (err) {
      console.error('Error fetching events:', err)
    }
  }

  const handleQuickAction = (actionId) => {
    switch(actionId) {
      case 'absence':
        toast.info('Report absence feature coming soon!')
        break
      case 'payment':
        navigate('/payments')
        break
      case 'permission':
        const urgentComm = communications.find(c => c.priority === 'urgent' && !c.read_at)
        if (urgentComm) {
          handleRespond(urgentComm)
        } else {
          toast.info('No forms require signature')
        }
        break
      case 'lunch':
        if (lowBalanceAccounts.length > 0) {
          handleAddLunchMoney(lowBalanceAccounts[0].student_id)
        } else {
          toast.info('All lunch accounts have sufficient balance')
        }
        break
      case 'contact':
        navigate('/profile')
        break
      case 'volunteer':
        navigate('/volunteer')
        break
    }
  }

  const handleRespond = (communication) => {
    // Handle communication response
    toast.success('Opening response form...')
    // In a real app, this would open a modal or navigate to a response page
  }

  const handleAddLunchMoney = async (studentId) => {
    const amount = parseFloat(prompt('Enter amount to add:', '20'))
    if (amount && !isNaN(amount)) {
      const result = await addFunds(studentId, amount)
      if (result.success) {
        toast.success(`$${amount.toFixed(2)} added to lunch account`)
      }
    }
  }

  // Memoize calculated values to prevent recalculation on every render
  const calculatedStats = useMemo(() => {
    if (!shouldLoadData || students.length === 0) {
      return { overallGPA: 0, overallAttendance: 0 }
    }

    const overallGPA = selectedChild
      ? academicSummary?.currentGpa
      : students.reduce((sum, s) => sum + (s.current_gpa || 0), 0) / students.length

    const overallAttendance = selectedChild
      ? academicSummary?.currentAttendance
      : students.reduce((sum, s) => sum + (s.attendance_rate || 0), 0) / students.length

    return { overallGPA, overallAttendance }
  }, [selectedChild, academicSummary, students, shouldLoadData])

  if (studentsLoading || (shouldLoadData && commsLoading)) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />
  }

  if (students.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SophisticatedHeader />
        <div className="pt-24 px-6 max-w-7xl mx-auto">
          <div className="bg-white rounded-xl p-8 text-center">
            <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Children Found</h2>
            <p className="text-gray-600 mb-6">Add your children to start using the parent dashboard.</p>
            <button
              onClick={() => navigate('/settings')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add Children
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { overallGPA, overallAttendance } = calculatedStats

  return (
    <div className="min-h-screen bg-gray-50">
      <SophisticatedHeader />

      <div className="pt-24 px-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {profile?.full_name?.split(' ')[0]}!
            </h1>
            <p className="text-gray-600 mt-1">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          <ChildSelector
            children={students}
            selectedChild={selectedChild}
            onSelectChild={setSelectedChild}
          />
        </div>

        {/* Main Content */}
        <div>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Children"
              value={students.length}
              subtitle="Active enrollments"
              icon={UsersIcon}
              color="indigo"
            />
            <StatCard
              title="Average GPA"
              value={overallGPA ? overallGPA.toFixed(2) : "N/A"}
              subtitle={selectedChild ? selectedChild.first_name : "All children"}
              icon={AcademicCapIcon}
              trend={overallGPA > 3.5 ? "+0.2" : null}
              color="green"
            />
            <StatCard
              title="Lunch Balance"
              value={`$${totalBalance.toFixed(2)}`}
              subtitle={`${lowBalanceAccounts.length} account${lowBalanceAccounts.length !== 1 ? 's' : ''} low`}
              icon={CurrencyDollarIcon}
              trend={lowBalanceAccounts.length > 0 ? "low" : null}
              color="yellow"
            />
            <StatCard
              title="Attendance"
              value={overallAttendance ? `${Math.round(overallAttendance)}%` : "N/A"}
              subtitle={selectedChild ? selectedChild.first_name : "Average this term"}
              icon={CheckCircleIcon}
              color="blue"
            />
          </div>

          {/* Quick Actions & Communications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <QuickActions onAction={handleQuickAction} />
            <CommunicationHub
              communications={communications}
              onRespond={handleRespond}
              onMarkAsRead={markAsRead}
            />
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upcoming Events</h3>
              <button
                onClick={() => navigate('/calendar')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View Calendar →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No upcoming events</p>
                </div>
              ) : (
                events.slice(0, 6).map(event => (
                  <div
                    key={event.id}
                    className="p-4 rounded-lg border-2 border-gray-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-600">
                      {format(parseISO(event.start_time), 'MMM d, h:mm a')}
                    </p>
                    {event.location && (
                      <p className="text-xs text-gray-500 mt-1">
                        <MapPinIcon className="h-3 w-3 inline mr-1" />
                        {event.location}
                      </p>
                      )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
