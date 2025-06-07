import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CalendarDaysIcon,
  MapPinIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  XMarkIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
  TagIcon,
  ArrowsUpDownIcon,
  BookmarkIcon,
  ShareIcon,
  StarIcon,
  FireIcon,
  SparklesIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { HeartIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import Header from '../../components/layout/Header';
import EventCard from '../../components/common/EventCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useEvents } from '../../hooks/useEvents';
import { useSavedEvents } from '../../hooks/useSavedEvents';
import useAuthStore from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { format, isToday, isTomorrow, isThisWeek, parseISO, startOfDay, endOfDay } from 'date-fns';
import toast from 'react-hot-toast';

const EVENT_TYPES = ['academic', 'sports', 'arts', 'fundraiser', 'meeting', 'other'];
const PRICE_RANGES = [
  { label: 'Free', min: 0, max: 0 },
  { label: 'Under $10', min: 0, max: 10 },
  { label: '$10 - $25', min: 10, max: 25 },
  { label: '$25 - $50', min: 25, max: 50 },
  { label: '$50+', min: 50, max: Infinity }
];

const TIME_FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'custom', label: 'Custom Date' }
];

const SORT_OPTIONS = [
  { key: 'date_asc', label: 'Date (Earliest First)' },
  { key: 'date_desc', label: 'Date (Latest First)' },
  { key: 'popularity', label: 'Most Popular' },
  { key: 'price_asc', label: 'Price (Low to High)' },
  { key: 'price_desc', label: 'Price (High to Low)' },
  { key: 'capacity', label: 'Largest Events' },
  { key: 'recently_added', label: 'Recently Added' }
];

export default function AdvancedEventsExplore() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { isEventSaved, toggleSaveEvent } = useSavedEvents();

  // View and layout state
  const [viewMode, setViewMode] = useState('grid'); // grid, list, calendar, map
  const [showFilters, setShowFilters] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [activeFilters, setActiveFilters] = useState({
    types: searchParams.getAll('type') || [],
    priceRange: null,
    timeFilter: searchParams.get('time') || 'all',
    customDateRange: {
      start: searchParams.get('start_date') || '',
      end: searchParams.get('end_date') || ''
    },
    location: searchParams.get('location') || '',
    hasAvailability: searchParams.get('available') === 'true',
    schools: searchParams.getAll('school') || []
  });
  
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'date_asc');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [schools, setSchools] = useState([]);
  const [searchSuggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 12;

  useEffect(() => {
    fetchEvents();
    fetchSchools();
    if (user) {
      fetchRecommendations();
    }
  }, [activeFilters, sortBy, searchQuery]);

  useEffect(() => {
    updateURL();
  }, [activeFilters, sortBy, searchQuery]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      fetchSearchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('events')
        .select(`
          *,
          school:schools(id, name, address),
          event_attendees(count),
          event_analytics(views, conversions),
          revenue_tracking(amount, transaction_type)
        `)
        .eq('status', 'active')
        .gte('start_time', new Date().toISOString());

      // Apply filters
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (activeFilters.types.length > 0) {
        query = query.in('event_type', activeFilters.types);
      }

      if (activeFilters.schools.length > 0) {
        query = query.in('school_id', activeFilters.schools);
      }

      if (activeFilters.location) {
        query = query.ilike('location', `%${activeFilters.location}%`);
      }

      if (activeFilters.hasAvailability) {
        // This would need a more complex query to check capacity vs attendees
      }

      // Apply time filters
      if (activeFilters.timeFilter !== 'all') {
        const now = new Date();
        let startDate, endDate;

        switch (activeFilters.timeFilter) {
          case 'today':
            startDate = startOfDay(now);
            endDate = endOfDay(now);
            break;
          case 'tomorrow':
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            startDate = startOfDay(tomorrow);
            endDate = endOfDay(tomorrow);
            break;
          case 'this_week':
            startDate = startOfDay(now);
            endDate = new Date(now);
            endDate.setDate(endDate.getDate() + 7);
            break;
          case 'this_month':
            startDate = startOfDay(now);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
          case 'custom':
            if (activeFilters.customDateRange.start) {
              startDate = new Date(activeFilters.customDateRange.start);
            }
            if (activeFilters.customDateRange.end) {
              endDate = new Date(activeFilters.customDateRange.end);
            }
            break;
        }

        if (startDate) query = query.gte('start_time', startDate.toISOString());
        if (endDate) query = query.lte('start_time', endDate.toISOString());
      }

      // Apply sorting
      switch (sortBy) {
        case 'date_asc':
          query = query.order('start_time', { ascending: true });
          break;
        case 'date_desc':
          query = query.order('start_time', { ascending: false });
          break;
        case 'price_asc':
          query = query.order('price', { ascending: true, nullsFirst: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false, nullsLast: true });
          break;
        case 'recently_added':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('start_time', { ascending: true });
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;

      // Post-process for additional sorting options
      let processedEvents = data || [];
      
      if (sortBy === 'popularity') {
        processedEvents = processedEvents.sort((a, b) => {
          const aViews = a.event_analytics?.reduce((sum, analytics) => sum + (analytics.views || 0), 0) || 0;
          const bViews = b.event_analytics?.reduce((sum, analytics) => sum + (analytics.views || 0), 0) || 0;
          return bViews - aViews;
        });
      }

      if (sortBy === 'capacity') {
        processedEvents = processedEvents.sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
      }

      // Apply price range filter
      if (activeFilters.priceRange) {
        processedEvents = processedEvents.filter(event => {
          const price = event.price || 0;
          return price >= activeFilters.priceRange.min && 
                 (activeFilters.priceRange.max === Infinity || price <= activeFilters.priceRange.max);
        });
      }

      setEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      // Get user's event history for recommendations
      const { data: userEvents } = await supabase
        .from('event_attendees')
        .select('event:events(event_type)')
        .eq('user_id', user.id);

      const preferredTypes = userEvents?.map(ue => ue.event?.event_type).filter(Boolean) || [];
      
      // Fetch trending events
      const { data: trending } = await supabase
        .rpc('get_trending_events', { 
          p_school_id: null, // All schools
          p_limit: 3 
        });

      setRecommendations(trending || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const fetchSearchSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('title, event_type, school:schools(name)')
        .ilike('title', `%${searchQuery}%`)
        .limit(5);

      if (error) throw error;
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    activeFilters.types.forEach(type => params.append('type', type));
    if (activeFilters.timeFilter !== 'all') params.set('time', activeFilters.timeFilter);
    if (activeFilters.location) params.set('location', activeFilters.location);
    if (activeFilters.hasAvailability) params.set('available', 'true');
    activeFilters.schools.forEach(school => params.append('school', school));
    if (sortBy !== 'date_asc') params.set('sort', sortBy);

    setSearchParams(params);
  };

  const clearFilters = () => {
    setActiveFilters({
      types: [],
      priceRange: null,
      timeFilter: 'all',
      customDateRange: { start: '', end: '' },
      location: '',
      hasAvailability: false,
      schools: []
    });
    setSearchQuery('');
    setSortBy('date_asc');
  };

  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const toggleFilter = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  const exportEvents = () => {
    const csvData = events.map(event => ({
      title: event.title,
      type: event.event_type,
      date: format(new Date(event.start_time), 'yyyy-MM-dd'),
      time: format(new Date(event.start_time), 'HH:mm'),
      location: event.location,
      price: event.price || 0,
      capacity: event.capacity,
      school: event.school?.name
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Events exported successfully');
  };

  // Pagination
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * eventsPerPage;
    return events.slice(startIndex, startIndex + eventsPerPage);
  }, [events, currentPage, eventsPerPage]);

  const totalPages = Math.ceil(events.length / eventsPerPage);

  const getEventBadge = (event) => {
    const now = new Date();
    const eventDate = new Date(event.start_time);
    
    if (isToday(eventDate)) return { text: 'Today', color: 'bg-red-500' };
    if (isTomorrow(eventDate)) return { text: 'Tomorrow', color: 'bg-orange-500' };
    if (isThisWeek(eventDate)) return { text: 'This Week', color: 'bg-blue-500' };
    
    const views = event.event_analytics?.reduce((sum, a) => sum + (a.views || 0), 0) || 0;
    if (views > 100) return { text: 'Popular', color: 'bg-purple-500' };
    
    return null;
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading events..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent">
              Explore Events
            </h1>
            <p className="text-gray-600 mt-2">
              Discover amazing events happening in your community
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={exportEvents}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Search and Quick Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events, venues, or organizers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              
              {/* Search Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(suggestion.title);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div className="font-medium text-gray-900">{suggestion.title}</div>
                      <div className="text-sm text-gray-600">
                        {suggestion.event_type} • {suggestion.school?.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-2">
              {TIME_FILTERS.slice(0, 4).map(filter => (
                <button
                  key={filter.key}
                  onClick={() => handleFilterChange('timeFilter', filter.key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilters.timeFilter === filter.key
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4" />
              Filters
              <ChevronDownIcon className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Event Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Event Types</label>
                <div className="space-y-2">
                  {EVENT_TYPES.map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={activeFilters.types.includes(type)}
                        onChange={() => toggleFilter('types', type)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-900 capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Price Range</label>
                <div className="space-y-2">
                  {PRICE_RANGES.map((range, index) => (
                    <label key={index} className="flex items-center">
                      <input
                        type="radio"
                        name="priceRange"
                        checked={activeFilters.priceRange === range}
                        onChange={() => handleFilterChange('priceRange', range)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Schools */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Schools</label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {schools.slice(0, 8).map(school => (
                    <label key={school.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={activeFilters.schools.includes(school.id)}
                        onChange={() => toggleFilter('schools', school.id)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">{school.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Other Filters</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={activeFilters.hasAvailability}
                      onChange={(e) => handleFilterChange('hasAvailability', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-900">Has Availability</span>
                  </label>
                  
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Location..."
                      value={activeFilters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear all filters
              </button>
              <div className="text-sm text-gray-600">
                {events.length} events found
              </div>
            </div>
          </div>
        )}

        {/* View Controls and Sort */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg ${viewMode === 'calendar' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <CalendarDaysIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Recommended for You</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((event) => (
                <div key={event.event_id} className="relative">
                  <EventCard
                    event={event}
                    onClick={() => navigate(`/events/${event.event_id}`)}
                    className="border-2 border-purple-200"
                  />
                  <div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Recommended
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events Grid/List */}
        {events.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedEvents.map((event) => {
                  const badge = getEventBadge(event);
                  return (
                    <div key={event.id} className="relative">
                      <EventCard
                        event={event}
                        onClick={() => navigate(`/events/${event.id}`)}
                        showSaveButton={true}
                      />
                      {badge && (
                        <div className={`absolute top-4 left-4 ${badge.color} text-white px-2 py-1 rounded-full text-xs font-medium`}>
                          {badge.text}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="space-y-4">
                {paginatedEvents.map((event) => (
                  <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {event.image_url && (
                          <img src={event.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{event.title}</h3>
                          <p className="text-sm text-gray-600">{event.school?.name}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <ClockIcon className="h-4 w-4" />
                              {format(new Date(event.start_time), 'MMM d, h:mm a')}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPinIcon className="h-4 w-4" />
                              {event.location}
                            </span>
                            {event.price > 0 && (
                              <span className="flex items-center gap-1">
                                <CurrencyDollarIcon className="h-4 w-4" />
                                ${event.price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleSaveEvent(event.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          {isEventSaved(event.id) ? (
                            <HeartIcon className="h-5 w-5 text-red-500" />
                          ) : (
                            <HeartIcon className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => navigate(`/events/${event.id}`)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}