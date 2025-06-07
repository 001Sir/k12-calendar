import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  CalendarDaysIcon,
  TagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useEvents } from '../../hooks/useEvents'
import EventCard from '../../components/common/EventCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Header from '../../components/layout/Header'
import { cn } from '../../utils/cn'

export default function EventsExplore() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'all')
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || 'all')
  const [showFilters, setShowFilters] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  
  // Date range calculation
  const getDateRange = () => {
    const now = new Date()
    const start = new Date()
    const end = new Date()
    
    switch (selectedDate) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'week':
        start.setDate(now.getDate() - 7)
        end.setMonth(now.getMonth() + 1)
        break
      case 'month':
        start.setMonth(now.getMonth() - 1)
        end.setMonth(now.getMonth() + 2)
        break
      default: // 'all'
        start.setFullYear(now.getFullYear() - 1)
        end.setFullYear(now.getFullYear() + 1)
    }
    
    return { start, end }
  }

  const { start, end } = getDateRange()
  
  // Fetch events with filters
  const { events, loading, error } = useEvents({
    event_type: selectedType === 'all' ? null : selectedType,
    start_date: start.toISOString(),
    end_date: end.toISOString(),
    status: 'active'
  })
  
  // Track initial load
  useEffect(() => {
    if (!loading && initialLoad) {
      setInitialLoad(false)
    }
  }, [loading, initialLoad])

  // Filter events by search query
  const filteredEvents = events.filter(event => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      event.title?.toLowerCase().includes(query) ||
      event.description?.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query) ||
      event.school?.name?.toLowerCase().includes(query)
    )
  })

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (selectedType !== 'all') params.set('type', selectedType)
    if (selectedDate !== 'all') params.set('date', selectedDate)
    setSearchParams(params)
  }, [searchQuery, selectedType, selectedDate, setSearchParams])

  const eventTypes = [
    { value: 'all', label: 'All Events', icon: '🎉' },
    { value: 'academic', label: 'Academic', icon: '📚' },
    { value: 'sports', label: 'Sports', icon: '⚽' },
    { value: 'arts', label: 'Arts & Culture', icon: '🎨' },
    { value: 'fundraiser', label: 'Fundraiser', icon: '💰' },
    { value: 'meeting', label: 'Meetings', icon: '👥' },
    { value: 'other', label: 'Other', icon: '📌' },
  ]

  const dateFilters = [
    { value: 'all', label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white border-b pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Discover School Events
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Find and join exciting events happening in schools across your community
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events, schools, or locations..."
                  className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors",
                    showFilters ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <FunnelIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Event Type Tabs */}
          <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
            {eventTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all",
                  selectedType === type.value
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>

          {/* Additional Filters */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t py-4"
            >
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {dateFilters.map((filter) => (
                      <option key={filter.value} value={filter.value}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results Header */}
          {!loading && (
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
              </h2>
            </div>
          )}

          {/* Events Grid */}
          {(loading && initialLoad) ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Loading events..." />
            </div>
          ) : error ? (
            <EmptyState
              icon={XMarkIcon}
              title="Error loading events"
              description={error}
            />
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedType !== 'all' || selectedDate !== 'all' 
                  ? 'Try adjusting your filters or search query' 
                  : 'No events are currently scheduled. Check back soon!'}
              </p>
              {(searchQuery || selectedType !== 'all' || selectedDate !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedType('all')
                    setSelectedDate('all')
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={{
                    ...event,
                    event_attendees: event.event_attendees || []
                  }}
                  onClick={() => navigate(`/events/${event.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}