import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  CalendarDaysIcon,
  UsersIcon,
  TagIcon,
  CurrencyDollarIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  HeartIcon,
  ShareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon,
  FireIcon,
  AcademicCapIcon,
  TrophyIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  BeakerIcon,
  BookOpenIcon,
  GlobeAltIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import Header from '../../components/layout/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useEvents } from '../../hooks/useEvents';
import { useSavedEvents } from '../../hooks/useSavedEvents';
import useAuthStore from '../../store/authStore';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'academic', name: 'Academic', icon: AcademicCapIcon, color: 'blue', gradient: 'from-blue-500 to-indigo-600' },
  { id: 'sports', name: 'Sports', icon: TrophyIcon, color: 'green', gradient: 'from-green-500 to-emerald-600' },
  { id: 'arts', name: 'Arts & Culture', icon: PaintBrushIcon, color: 'purple', gradient: 'from-purple-500 to-pink-600' },
  { id: 'music', name: 'Music', icon: MusicalNoteIcon, color: 'yellow', gradient: 'from-yellow-500 to-orange-600' },
  { id: 'science', name: 'Science', icon: BeakerIcon, color: 'teal', gradient: 'from-teal-500 to-cyan-600' },
  { id: 'fundraiser', name: 'Fundraising', icon: CurrencyDollarIcon, color: 'emerald', gradient: 'from-emerald-500 to-green-600' },
  { id: 'social', name: 'Social', icon: UsersIcon, color: 'pink', gradient: 'from-pink-500 to-rose-600' },
  { id: 'volunteer', name: 'Volunteer', icon: HandRaisedIcon, color: 'amber', gradient: 'from-amber-500 to-yellow-600' }
];

const FEATURED_EVENTS = [
  {
    title: "Annual Science Fair",
    subtitle: "Discover Amazing Student Projects",
    description: "Join us for an exciting showcase of student innovation and creativity",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop",
    cta: "Register Now",
    badge: "Featured"
  },
  {
    title: "Spring Musical: Hamilton Jr.",
    subtitle: "Student Theater Production",
    description: "Experience the incredible talent of our drama department",
    image: "https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800&h=400&fit=crop",
    cta: "Get Tickets",
    badge: "Popular"
  },
  {
    title: "Parent-Teacher Conference Week",
    subtitle: "Connect with Your Child's Teachers",
    description: "Schedule your meetings and discuss your child's progress",
    image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&h=400&fit=crop",
    cta: "Schedule Meeting",
    badge: "Important"
  }
];

export default function EnhancedEventsExplore() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { events, loading } = useEvents();
  const { savedEvents, isEventSaved, toggleSaveEvent } = useSavedEvents();

  // Helper function to format location
  const formatLocation = (location) => {
    if (!location) return '';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      const { street, city, state, zip } = location;
      const parts = [];
      if (street) parts.push(street);
      if (city) parts.push(city);
      if (state) parts.push(state);
      if (zip) parts.push(zip);
      return parts.join(', ');
    }
    return '';
  };

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedDateFilter, setSelectedDateFilter] = useState(searchParams.get('date') || 'all');
  const [priceFilter, setPriceFilter] = useState(searchParams.get('price') || 'all');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  // Auto-rotate hero slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % FEATURED_EVENTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedDateFilter !== 'all') params.set('date', selectedDateFilter);
    if (priceFilter !== 'all') params.set('price', priceFilter);
    if (locationFilter) params.set('location', locationFilter);
    
    setSearchParams(params);
  }, [searchQuery, selectedCategory, selectedDateFilter, priceFilter, locationFilter, setSearchParams]);

  const filteredAndSortedEvents = () => {
    let filtered = events.filter(event => {
      // Search filter
      const formattedLocation = formatLocation(event.location);
      const matchesSearch = !searchQuery || 
        event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formattedLocation.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = !selectedCategory || event.event_type === selectedCategory;

      // Date filter
      const eventDate = new Date(event.start_time);
      const matchesDate = (() => {
        switch (selectedDateFilter) {
          case 'today': return isToday(eventDate);
          case 'tomorrow': return isTomorrow(eventDate);
          case 'this_week': return isThisWeek(eventDate);
          case 'this_month': 
            const now = new Date();
            return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
          default: return true;
        }
      })();

      // Price filter
      const matchesPrice = (() => {
        switch (priceFilter) {
          case 'free': return event.price === 0;
          case 'paid': return event.price > 0;
          case 'under_10': return event.price > 0 && event.price <= 10;
          case 'under_25': return event.price > 10 && event.price <= 25;
          case 'over_25': return event.price > 25;
          default: return true;
        }
      })();

      // Location filter
      const matchesLocation = !locationFilter || 
        formattedLocation.toLowerCase().includes(locationFilter.toLowerCase());

      return matchesSearch && matchesCategory && matchesDate && matchesPrice && matchesLocation;
    });

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.start_time) - new Date(b.start_time);
        case 'date_desc':
          return new Date(b.start_time) - new Date(a.start_time);
        case 'name':
          return a.title.localeCompare(b.title);
        case 'price_low':
          return (a.price || 0) - (b.price || 0);
        case 'price_high':
          return (b.price || 0) - (a.price || 0);
        case 'popularity':
          return (b.attendee_count || 0) - (a.attendee_count || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const handleSaveEvent = async (eventId, e) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please log in to save events');
      navigate('/login');
      return;
    }

    if (!toggleSaveEvent) {
      toast.error('Save feature is not available yet');
      return;
    }

    const result = await toggleSaveEvent(eventId);
    if (result.success) {
      toast.success(isEventSaved(eventId) ? 'Event removed from saved' : 'Event saved successfully');
    } else {
      toast.error(result.error || 'Failed to save event');
    }
  };

  const getEventBadge = (event) => {
    const eventDate = new Date(event.start_time);
    if (isToday(eventDate)) return { text: 'Today', color: 'bg-red-500', icon: FireIcon };
    if (isTomorrow(eventDate)) return { text: 'Tomorrow', color: 'bg-orange-500', icon: ClockIcon };
    if (event.attendee_count > 50) return { text: 'Popular', color: 'bg-purple-500', icon: StarIcon };
    if (event.price === 0) return { text: 'Free', color: 'bg-green-500', icon: TagIcon };
    return null;
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedDateFilter('all');
    setPriceFilter('all');
    setLocationFilter('');
    setSearchParams({});
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading events..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-96 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={FEATURED_EVENTS[currentHeroSlide].image}
            alt={FEATURED_EVENTS[currentHeroSlide].title}
            className="w-full h-full object-cover transition-opacity duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${
                currentHeroSlide === 0 ? 'from-blue-600 to-purple-600' :
                currentHeroSlide === 1 ? 'from-purple-600 to-pink-600' :
                'from-amber-600 to-orange-600'
              } text-white`}>
                {FEATURED_EVENTS[currentHeroSlide].badge}
              </span>
            </div>
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              {FEATURED_EVENTS[currentHeroSlide].title}
            </h1>
            <p className="text-xl text-gray-200 mb-2">
              {FEATURED_EVENTS[currentHeroSlide].subtitle}
            </p>
            <p className="text-lg text-gray-300 mb-8">
              {FEATURED_EVENTS[currentHeroSlide].description}
            </p>
            <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
              {FEATURED_EVENTS[currentHeroSlide].cta}
            </button>
          </div>
        </div>

        {/* Hero Navigation */}
        <button
          onClick={() => setCurrentHeroSlide((prev) => (prev - 1 + FEATURED_EVENTS.length) % FEATURED_EVENTS.length)}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <button
          onClick={() => setCurrentHeroSlide((prev) => (prev + 1) % FEATURED_EVENTS.length)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>

        {/* Hero Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
          {FEATURED_EVENTS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentHeroSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentHeroSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? '' : category.id)}
                className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory === category.id
                    ? `bg-gradient-to-br ${category.gradient} text-white shadow-lg`
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <category.icon className={`h-8 w-8 mb-3 ${
                    selectedCategory === category.id ? 'text-white' : `text-${category.color}-600`
                  }`} />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                
                {selectedCategory === category.id && (
                  <div className="absolute inset-0 rounded-2xl bg-white/10 backdrop-blur-sm"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="bg-white shadow-sm sticky top-20 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events, activities, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Events' },
                { key: 'today', label: 'Today' },
                { key: 'this_week', label: 'This Week' },
                { key: 'free', label: 'Free' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => {
                    if (filter.key === 'free') {
                      setPriceFilter(priceFilter === 'free' ? 'all' : 'free');
                    } else {
                      setSelectedDateFilter(selectedDateFilter === filter.key ? 'all' : filter.key);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    (filter.key === 'free' && priceFilter === 'free') ||
                    (filter.key !== 'free' && selectedDateFilter === filter.key)
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                More Filters
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={selectedDateFilter}
                    onChange={(e) => setSelectedDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Prices</option>
                    <option value="free">Free</option>
                    <option value="under_10">Under $10</option>
                    <option value="under_25">$10 - $25</option>
                    <option value="over_25">Over $25</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="Enter location..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="date">Date (Earliest)</option>
                    <option value="date_desc">Date (Latest)</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="price_low">Price (Low to High)</option>
                    <option value="price_high">Price (High to Low)</option>
                    <option value="popularity">Most Popular</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearAllFilters}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {(searchQuery || selectedCategory || selectedDateFilter !== 'all' || priceFilter !== 'all' || locationFilter) && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Active filters:</span>
              {searchQuery && <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">"{searchQuery}"</span>}
              {selectedCategory && <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">{CATEGORIES.find(c => c.id === selectedCategory)?.name}</span>}
              {selectedDateFilter !== 'all' && <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">{selectedDateFilter.replace('_', ' ')}</span>}
              {priceFilter !== 'all' && <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">{priceFilter === 'free' ? 'Free' : priceFilter.replace('_', ' ')}</span>}
              {locationFilter && <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">{locationFilter}</span>}
            </div>
          )}
        </div>
      </section>

      {/* Events Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {filteredAndSortedEvents().length} Events Found
            {selectedCategory && ` in ${CATEGORIES.find(c => c.id === selectedCategory)?.name}`}
          </h2>
        </div>

        {filteredAndSortedEvents().length === 0 ? (
          <EmptyState
            icon={CalendarDaysIcon}
            title="No events found"
            description="Try adjusting your search criteria or browse different categories."
            action={clearAllFilters}
            actionLabel="Clear All Filters"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedEvents().map((event) => {
              const badge = getEventBadge(event);
              const categoryInfo = CATEGORIES.find(c => c.id === event.event_type);
              
              return (
                <div
                  key={event.id}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-200 cursor-pointer"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  {/* Event Image */}
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${categoryInfo?.gradient || 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
                        {categoryInfo ? (
                          <categoryInfo.icon className="h-16 w-16 text-white opacity-80" />
                        ) : (
                          <CalendarDaysIcon className="h-16 w-16 text-white opacity-80" />
                        )}
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {badge && (
                        <span className={`flex items-center gap-1 ${badge.color} text-white px-2 py-1 rounded-full text-xs font-medium`}>
                          <badge.icon className="h-3 w-3" />
                          {badge.text}
                        </span>
                      )}
                      {categoryInfo && (
                        <span className={`bg-gradient-to-r ${categoryInfo.gradient} text-white px-2 py-1 rounded-full text-xs font-medium`}>
                          {categoryInfo.name}
                        </span>
                      )}
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={(e) => handleSaveEvent(event.id, e)}
                      className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-all transform hover:scale-110"
                    >
                      {isEventSaved && isEventSaved(event.id) ? (
                        <HeartSolidIcon className="h-5 w-5 text-red-500" />
                      ) : (
                        <HeartIcon className="h-5 w-5 text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* Event Details */}
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {event.title}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="h-4 w-4 text-indigo-500" />
                        <span>{format(new Date(event.start_time), 'MMM d, yyyy')}</span>
                        <ClockIcon className="h-4 w-4 text-indigo-500 ml-2" />
                        <span>{format(new Date(event.start_time), 'h:mm a')}</span>
                      </div>
                      
                      {formatLocation(event.location) && (
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="h-4 w-4 text-indigo-500" />
                          <span className="truncate">{formatLocation(event.location)}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4 text-indigo-500" />
                        <span>{event.attendee_count || 0} attending</span>
                        {event.capacity && (
                          <span className="text-gray-400">
                            / {event.capacity} capacity
                          </span>
                        )}
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {event.price > 0 ? (
                          <span className="text-lg font-bold text-gray-900">
                            ${event.price}
                          </span>
                        ) : (
                          <span className="text-lg font-bold text-green-600">
                            Free
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Share functionality
                            if (navigator.share) {
                              navigator.share({
                                title: event.title,
                                url: window.location.origin + `/events/${event.id}`
                              });
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          <ShareIcon className="h-4 w-4" />
                        </button>
                        
                        <div className="text-right">
                          <span className="text-xs text-gray-500">
                            {event.school?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}