import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ViewColumnsIcon,
  CubeIcon,
  ClockIcon,
  FireIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon,
  CloudIcon,
  UserGroupIcon,
  MapPinIcon,
  AdjustmentsHorizontalIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  PhotoIcon,
  ChartBarIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  HeartIcon,
  StarIcon,
  TagIcon,
  FunnelIcon,
  GlobeAltIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek, isSameDay, addDays, addWeeks, addYears } from 'date-fns';
import Header from '../../components/layout/Header';
import { useEvents } from '../../hooks/useEvents';
import useAuthStore from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

// Color palette for events
const EVENT_COLORS = {
  academic: 'from-blue-500 to-indigo-600',
  sports: 'from-green-500 to-emerald-600',
  arts: 'from-purple-500 to-pink-600',
  social: 'from-amber-500 to-orange-600',
  fundraiser: 'from-teal-500 to-cyan-600',
  other: 'from-gray-500 to-gray-600'
};

// View modes
const VIEW_MODES = {
  '3D': { icon: CubeIcon, label: '3D View' },
  'timeline': { icon: ClockIcon, label: 'Timeline' },
  'month': { icon: CalendarDaysIcon, label: 'Month' },
  'week': { icon: ViewColumnsIcon, label: 'Week' },
  'year': { icon: GlobeAltIcon, label: 'Year' },
  'heatmap': { icon: FireIcon, label: 'Heatmap' }
};

export default function RevolutionaryCalendar() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { events, loading } = useEvents();
  
  // State - MUST be declared before any returns
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('3D');
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [threeDRotation, setThreeDRotation] = useState({ x: 20, y: -30 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showConflicts, setShowConflicts] = useState(true);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [weather, setWeather] = useState({});
  
  // Refs
  const calendarRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  // Show loading state while fetching events
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading calendar events...</h2>
          <p className="text-gray-600">Fetching your events from the database</p>
        </div>
      </div>
    );
  }
  
  // Log events to verify data is being fetched
  console.log('Calendar loaded with events:', events.length, 'events');
  if (events.length > 0) {
    console.log('Sample event:', events[0]);
  }

  // Fetch weather data for the month
  useEffect(() => {
    // Mock weather data - in real app, use weather API
    const weatherData = {};
    const days = eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    });
    
    days.forEach(day => {
      const rand = Math.random();
      weatherData[format(day, 'yyyy-MM-dd')] = {
        condition: rand > 0.7 ? 'rainy' : rand > 0.4 ? 'cloudy' : 'sunny',
        temp: Math.floor(Math.random() * 30) + 50,
        icon: rand > 0.7 ? '🌧️' : rand > 0.4 ? '☁️' : '☀️'
      };
    });
    
    setWeather(weatherData);
  }, [currentDate]);

  // Filter events based on search and category
  const getFilteredEvents = () => {
    return events.filter(event => {
      // Category filter
      if (filterCategory !== 'all' && event.event_type !== filterCategory) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return event.title?.toLowerCase().includes(query) ||
               event.description?.toLowerCase().includes(query) ||
               event.location?.toLowerCase().includes(query);
      }
      
      return true;
    });
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    return getFilteredEvents().filter(event => 
      isSameDay(new Date(event.start_time), date)
    );
  };

  // Get heat intensity for a date (for heatmap view)
  const getHeatIntensity = (date) => {
    const dayEvents = getEventsForDate(date);
    return Math.min(dayEvents.length / 5, 1); // Max intensity at 5 events
  };

  // Check for conflicts
  const getConflicts = (date) => {
    const dayEvents = getEventsForDate(date);
    const conflicts = [];
    
    for (let i = 0; i < dayEvents.length; i++) {
      for (let j = i + 1; j < dayEvents.length; j++) {
        const start1 = new Date(dayEvents[i].start_time);
        const end1 = new Date(dayEvents[i].end_time);
        const start2 = new Date(dayEvents[j].start_time);
        const end2 = new Date(dayEvents[j].end_time);
        
        if ((start1 <= start2 && end1 > start2) || (start2 <= start1 && end2 > start1)) {
          conflicts.push({ event1: dayEvents[i], event2: dayEvents[j] });
        }
      }
    }
    
    return conflicts;
  };

  // AI Suggestions (mock implementation)
  const getAISuggestions = () => {
    return [
      {
        icon: SparklesIcon,
        title: "Best time for Science Fair",
        description: "Based on past attendance, Thursday 2-4 PM shows highest engagement",
        action: () => navigate('/events/create?suggested=science-fair')
      },
      {
        icon: BoltIcon,
        title: "Avoid scheduling conflicts",
        description: "3 events already scheduled for Friday afternoon",
        action: () => setSelectedDate(addDays(new Date(), 5))
      },
      {
        icon: StarIcon,
        title: "Popular time slot available",
        description: "Tuesday 6 PM slot has historically high attendance",
        action: () => navigate('/events/create?time=tuesday-6pm')
      }
    ];
  };

  // Handle 3D rotation
  const handle3DRotation = (e) => {
    if (!isDragging.current || viewMode !== '3D') return;
    
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    
    setThreeDRotation({
      x: Math.max(-45, Math.min(45, threeDRotation.x + deltaY * 0.5)),
      y: threeDRotation.y + deltaX * 0.5
    });
    
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  // Month view days
  const monthDays = () => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  };

  // Render 3D Calendar View
  const render3DView = () => (
    <div 
      className="relative h-[600px] perspective-1000"
      onMouseDown={(e) => {
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
      }}
      onMouseMove={handle3DRotation}
      onMouseUp={() => isDragging.current = false}
      onMouseLeave={() => isDragging.current = false}
    >
      <div 
        className="absolute inset-0 preserve-3d transition-transform duration-300 cursor-grab active:cursor-grabbing"
        style={{
          transform: `rotateX(${threeDRotation.x}deg) rotateY(${threeDRotation.y}deg) scale(${zoomLevel})`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 p-8">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <div 
              key={day} 
              className="text-center font-bold text-gray-700 mb-2"
              style={{
                transform: `translateZ(${20 + i * 5}px)`
              }}
            >
              {day}
            </div>
          ))}
          
          {monthDays().map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isHovered = hoveredDate && isSameDay(day, hoveredDate);
            const intensity = getHeatIntensity(day);
            const conflicts = getConflicts(day);
            const weatherData = weather[format(day, 'yyyy-MM-dd')];
            
            return (
              <div
                key={day.toString()}
                onMouseEnter={() => setHoveredDate(day)}
                onMouseLeave={() => setHoveredDate(null)}
                onClick={() => setSelectedDate(day)}
                className={`
                  relative h-24 p-2 rounded-xl border-2 transition-all duration-300 cursor-pointer
                  ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 opacity-60'}
                  ${isToday(day) ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'}
                  ${isHovered ? 'shadow-2xl scale-110 z-20' : 'shadow-lg'}
                  ${selectedDate && isSameDay(day, selectedDate) ? 'ring-2 ring-purple-400' : ''}
                `}
                style={{
                  transform: `translateZ(${isHovered ? 100 : 20 + dayEvents.length * 10}px)`,
                  background: intensity > 0 ? `rgba(239, 68, 68, ${intensity * 0.2})` : undefined
                }}
              >
                {/* Date Number */}
                <div className="flex items-start justify-between mb-1">
                  <span className={`text-sm font-bold ${
                    isToday(day) ? 'text-indigo-600' : 'text-gray-700'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Weather Icon */}
                  {weatherData && (
                    <span className="text-xs" title={`${weatherData.temp}°F`}>
                      {weatherData.icon}
                    </span>
                  )}
                </div>
                
                {/* Event Indicators */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <div
                      key={event.id}
                      className={`h-1.5 rounded-full bg-gradient-to-r ${
                        EVENT_COLORS[event.event_type] || EVENT_COLORS.other
                      }`}
                      style={{
                        transform: `translateZ(${5 + i * 5}px)`
                      }}
                    />
                  ))}
                  
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
                
                {/* Conflict Indicator */}
                {showConflicts && conflicts.length > 0 && (
                  <div className="absolute top-1 right-1">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Floating Event Preview */}
        {hoveredDate && getEventsForDate(hoveredDate).length > 0 && (
          <div 
            className="absolute bg-white rounded-xl shadow-2xl p-4 z-50 max-w-xs"
            style={{
              transform: 'translateZ(150px)',
              top: '50%',
              left: '50%',
              marginLeft: '-150px',
              marginTop: '-100px'
            }}
          >
            <h3 className="font-bold text-gray-900 mb-2">
              {format(hoveredDate, 'MMMM d, yyyy')}
            </h3>
            <div className="space-y-2">
              {getEventsForDate(hoveredDate).map(event => (
                <div key={event.id} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                    EVENT_COLORS[event.event_type] || EVENT_COLORS.other
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(event.start_time), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render Timeline View
  const renderTimelineView = () => {
    const days = eachDayOfInterval({
      start: startOfWeek(currentDate),
      end: endOfWeek(currentDate)
    });
    
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-4 text-sm font-medium text-gray-500">Time</div>
          {days.map(day => (
            <div key={day.toString()} className="p-4 text-center border-l border-gray-200">
              <div className="text-sm font-medium text-gray-900">
                {format(day, 'EEE')}
              </div>
              <div className={`text-2xl font-bold ${
                isToday(day) ? 'text-indigo-600' : 'text-gray-700'
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        
        <div className="relative h-[600px] overflow-y-auto">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
              <div className="p-4 text-sm text-gray-500">
                {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
              </div>
              {days.map(day => {
                const cellEvents = events.filter(event => {
                  const eventDate = new Date(event.start_time);
                  return isSameDay(eventDate, day) && eventDate.getHours() === hour;
                });
                
                return (
                  <div 
                    key={`${day}-${hour}`}
                    className="relative p-2 border-l border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedDate(day);
                      setSelectedTimeSlot(hour);
                      navigate(`/events/create?date=${format(day, 'yyyy-MM-dd')}&time=${hour}`);
                    }}
                  >
                    {cellEvents.map((event, i) => (
                      <div
                        key={event.id}
                        className={`absolute inset-x-2 p-2 rounded-lg text-xs font-medium text-white bg-gradient-to-r ${
                          EVENT_COLORS[event.event_type] || EVENT_COLORS.other
                        }`}
                        style={{
                          top: `${i * 30}px`,
                          height: `${(new Date(event.end_time) - new Date(event.start_time)) / (1000 * 60 * 60) * 60}px`
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                          setShowEventDetails(true);
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Heatmap View
  const renderHeatmapView = () => {
    const weeks = [];
    let currentWeek = [];
    const days = eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    });
    
    // Group days into weeks
    days.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === days.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Activity Heatmap</h3>
          <p className="text-sm text-gray-600">
            Visualize busy periods and plan events during quieter times
          </p>
        </div>
        
        <div className="space-y-2">
          {/* Day labels */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map(day => {
                const intensity = getHeatIntensity(day);
                const dayEvents = getEventsForDate(day);
                
                return (
                  <div
                    key={day.toString()}
                    className="aspect-square rounded-lg border-2 border-gray-200 flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                    style={{
                      backgroundColor: intensity > 0 
                        ? `rgba(99, 102, 241, ${intensity})` 
                        : '#f3f4f6',
                      borderColor: isToday(day) ? '#4f46e5' : '#e5e7eb'
                    }}
                    onClick={() => setSelectedDate(day)}
                    title={`${format(day, 'MMM d')} - ${dayEvents.length} events`}
                  >
                    <span className={`text-xs font-bold ${
                      intensity > 0.5 ? 'text-white' : 'text-gray-700'
                    }`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex items-center gap-4">
          <span className="text-sm text-gray-600">Less busy</span>
          <div className="flex gap-1">
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map(intensity => (
              <div
                key={intensity}
                className="w-6 h-6 rounded"
                style={{
                  backgroundColor: `rgba(99, 102, 241, ${intensity})`
                }}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">More busy</span>
        </div>
      </div>
    );
  };

  // Render Year View
  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => 
      new Date(currentDate.getFullYear(), i, 1)
    );
    
    return (
      <div className="grid grid-cols-3 md:grid-cols-4 gap-6">
        {months.map(month => {
          const monthEvents = events.filter(event => {
            const eventDate = new Date(event.start_time);
            return eventDate.getMonth() === month.getMonth() && 
                   eventDate.getFullYear() === month.getFullYear();
          });
          
          return (
            <div
              key={month.toString()}
              className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => setCurrentDate(month)}
            >
              <h4 className="font-bold text-gray-900 mb-3">
                {format(month, 'MMMM')}
              </h4>
              
              {/* Mini calendar */}
              <div className="grid grid-cols-7 gap-1 text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                  <div key={day} className="text-center text-gray-500 font-medium">
                    {day}
                  </div>
                ))}
                
                {eachDayOfInterval({
                  start: startOfMonth(month),
                  end: endOfMonth(month)
                }).map(day => {
                  const hasEvents = getEventsForDate(day).length > 0;
                  
                  return (
                    <div
                      key={day.toString()}
                      className={`aspect-square flex items-center justify-center rounded ${
                        hasEvents ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-400'
                      } ${isToday(day) ? 'ring-2 ring-indigo-500' : ''}`}
                    >
                      {format(day, 'd')}
                    </div>
                  );
                })}
              </div>
              
              {/* Event count */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {monthEvents.length} events
                </span>
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isFullscreen ? 'fixed inset-0 z-50' : ''} bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50`}>
      {!isFullscreen && <Header />}
      
      <div className={`${isFullscreen ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24'}`}>
        {/* Calendar Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              
              <h2 className="text-2xl font-bold text-gray-900">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors"
              >
                Today
              </button>
              
              {/* Event count indicator */}
              <div className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                {getFilteredEvents().length} events
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              {/* View Mode Selector */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {Object.entries(VIEW_MODES).map(([mode, config]) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      viewMode === mode 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <config.icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{config.label}</span>
                  </button>
                ))}
              </div>
              
              {/* AI Suggestions Toggle */}
              <button
                onClick={() => setShowAISuggestions(!showAISuggestions)}
                className={`p-2 rounded-lg transition-colors ${
                  showAISuggestions 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <SparklesIcon className="h-5 w-5" />
              </button>
              
              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="h-5 w-5" />
                ) : (
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                )}
              </button>
              
              {/* Create Event */}
              <button
                onClick={() => navigate('/events/create')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all"
              >
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Create Event</span>
              </button>
            </div>
          </div>
          
          {/* Filter Pills */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Filter:</span>
            {['all', 'academic', 'sports', 'arts', 'social', 'fundraiser'].map(category => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  filterCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* AI Suggestions Panel */}
        {showAISuggestions && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <SparklesIcon className="h-6 w-6 text-purple-700" />
              <h3 className="text-lg font-bold text-gray-900">AI Scheduling Assistant</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getAISuggestions().map((suggestion, index) => (
                <button
                  key={index}
                  onClick={suggestion.action}
                  className="bg-white rounded-xl p-4 hover:shadow-lg transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <suggestion.icon className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Calendar View */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden">
          {/* No events message */}
          {events.length === 0 && (
            <div className="p-12 text-center">
              <CalendarDaysIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Events Yet</h3>
              <p className="text-gray-500 mb-6">Start by creating your first event to see it appear on the calendar.</p>
              <button
                onClick={() => navigate('/events/create')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Create Your First Event
              </button>
            </div>
          )}
          
          {/* Calendar views */}
          {events.length > 0 && viewMode === '3D' && (
            <div className="p-4">
              {/* 3D Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Zoom:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                    className="w-32"
                  />
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    Reset
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showConflicts}
                      onChange={(e) => setShowConflicts(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Show conflicts</span>
                  </label>
                </div>
              </div>
              
              {render3DView()}
              
              <div className="text-center text-sm text-gray-500 mt-4">
                Click and drag to rotate • Scroll to zoom • Click a date to select
              </div>
            </div>
          )}
          
          {events.length > 0 && viewMode === 'timeline' && renderTimelineView()}
          {events.length > 0 && viewMode === 'heatmap' && renderHeatmapView()}
          {events.length > 0 && viewMode === 'year' && renderYearView()}
          
          {events.length > 0 && viewMode === 'month' && (
            <div className="p-6">
              <div className="grid grid-cols-7 gap-4">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                  <div key={day} className="text-center font-semibold text-gray-700">
                    {day}
                  </div>
                ))}
                
                {monthDays().map(day => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  
                  return (
                    <div
                      key={day.toString()}
                      className={`min-h-[120px] p-3 rounded-lg border-2 ${
                        isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                      } ${isToday(day) ? 'border-indigo-500 ring-2 ring-indigo-200' : ''} 
                      hover:shadow-lg transition-all cursor-pointer`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-sm font-bold ${
                          isToday(day) ? 'text-indigo-600' : 'text-gray-700'
                        }`}>
                          {format(day, 'd')}
                        </span>
                        {weather[format(day, 'yyyy-MM-dd')] && (
                          <span className="text-xs">
                            {weather[format(day, 'yyyy-MM-dd')].icon}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded bg-gradient-to-r ${
                              EVENT_COLORS[event.event_type] || EVENT_COLORS.other
                            } text-white truncate cursor-pointer hover:shadow-md transition-shadow`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                              setShowEventDetails(true);
                            }}
                          >
                            {format(new Date(event.start_time), 'h:mm a')} - {event.title}
                          </div>
                        ))}
                        
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 font-medium text-center">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {events.length > 0 && viewMode === 'week' && (
            <div className="p-6">
              <div className="grid grid-cols-7 gap-4">
                {eachDayOfInterval({
                  start: startOfWeek(currentDate),
                  end: endOfWeek(currentDate)
                }).map(day => {
                  const dayEvents = getEventsForDate(day);
                  
                  return (
                    <div key={day.toString()} className="min-h-[400px]">
                      <div className={`text-center p-3 rounded-t-lg ${
                        isToday(day) ? 'bg-indigo-600 text-white' : 'bg-gray-100'
                      }`}>
                        <div className="text-sm font-medium">
                          {format(day, 'EEE')}
                        </div>
                        <div className="text-2xl font-bold">
                          {format(day, 'd')}
                        </div>
                      </div>
                      
                      <div className="bg-white border-2 border-t-0 border-gray-200 rounded-b-lg p-3 space-y-2">
                        {dayEvents.map(event => (
                          <div
                            key={event.id}
                            className={`p-2 rounded-lg bg-gradient-to-r ${
                              EVENT_COLORS[event.event_type] || EVENT_COLORS.other
                            } text-white text-sm cursor-pointer hover:shadow-lg transition-shadow`}
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowEventDetails(true);
                            }}
                          >
                            <div className="font-medium">{event.title}</div>
                            <div className="text-xs opacity-90">
                              {format(new Date(event.start_time), 'h:mm a')}
                            </div>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => navigate(`/events/create?date=${format(day, 'yyyy-MM-dd')}`)}
                          className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-colors text-sm"
                        >
                          <PlusIcon className="h-4 w-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Event Details Modal */}
        {showEventDetails && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h3>
                <button
                  onClick={() => {
                    setShowEventDetails(false);
                    setSelectedEvent(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <CalendarDaysIcon className="h-5 w-5" />
                  <span>{format(new Date(selectedEvent.start_time), 'MMMM d, yyyy')}</span>
                </div>
                
                <div className="flex items-center gap-3 text-gray-600">
                  <ClockIcon className="h-5 w-5" />
                  <span>
                    {format(new Date(selectedEvent.start_time), 'h:mm a')} - 
                    {format(new Date(selectedEvent.end_time), 'h:mm a')}
                  </span>
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPinIcon className="h-5 w-5" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                
                {selectedEvent.description && (
                  <p className="text-gray-600 mt-4">{selectedEvent.description}</p>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => navigate(`/events/${selectedEvent.id}`)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => navigate(`/events/${selectedEvent.id}/edit`)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
}