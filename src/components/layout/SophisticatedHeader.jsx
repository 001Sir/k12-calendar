import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  CalendarDaysIcon,
  BellIcon,
  UserCircleIcon,
  PlusIcon,
  SparklesIcon,
  MicrophoneIcon,
  CommandLineIcon,
  SunIcon,
  MoonIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  AcademicCapIcon,
  HeartIcon,
  ClockIcon,
  UserGroupIcon,
  TicketIcon,
  ChartBarIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon,
  XMarkIcon,
  CheckIcon,
  FireIcon,
  StarIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import useAuthStore from '../../store/authStore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const WEATHER_ICONS = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️'
};

const SEARCH_SUGGESTIONS = [
  { type: 'quick', icon: FireIcon, text: "Today's events", query: 'today' },
  { type: 'quick', icon: StarIcon, text: 'Popular this week', query: 'popular' },
  { type: 'quick', icon: AcademicCapIcon, text: 'Academic events', query: 'academic' },
  { type: 'quick', icon: HeartIcon, text: 'Saved events', query: 'saved' }
];

const GREETINGS = {
  morning: ['Good morning', 'Rise and shine', 'Morning'],
  afternoon: ['Good afternoon', 'Hello', 'Hey there'],
  evening: ['Good evening', 'Evening', 'Hello']
};

export default function SophisticatedHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, logout } = useAuthStore();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [weather, setWeather] = useState({ temp: 72, condition: 'sunny' });
  const [greeting, setGreeting] = useState('');
  const [unreadCount, setUnreadCount] = useState(3);
  const [recentSearches, setRecentSearches] = useState(['Science Fair', 'Basketball game', 'Parent meeting']);
  const [liveTicker, setLiveTicker] = useState(0);
  
  // Refs
  const searchRef = useRef(null);
  const commandPaletteRef = useRef(null);

  // Live event ticker data
  const LIVE_EVENTS = [
    "🎭 Drama Club Auditions starting in 30 min",
    "🏀 Varsity Basketball vs. Lincoln High - 6 PM",
    "📚 Book Fair ends tomorrow - Don't miss out!",
    "🎨 Student Art Exhibition now open in Gallery",
    "🔬 Science Olympiad registration closing soon"
  ];

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    const greetings = GREETINGS[period];
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
  }, []);

  // Rotate live ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTicker((prev) => (prev + 1) % LIVE_EVENTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Command palette shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setSearchFocused(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Voice search functionality
  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        toast('Listening... Say something like "Show me science events this week"', {
          icon: '🎤'
        });
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        handleSmartSearch(transcript);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
        toast.error('Voice search failed. Please try again.');
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
    } else {
      toast.error('Voice search is not supported in your browser');
    }
  };

  // Smart search with NLP
  const handleSmartSearch = (query) => {
    const lowerQuery = query.toLowerCase();
    
    // Parse natural language queries
    if (lowerQuery.includes('today') || lowerQuery.includes('tonight')) {
      navigate('/explore?date=today');
    } else if (lowerQuery.includes('tomorrow')) {
      navigate('/explore?date=tomorrow');
    } else if (lowerQuery.includes('this week') || lowerQuery.includes('weekend')) {
      navigate('/explore?date=this_week');
    } else if (lowerQuery.includes('free')) {
      navigate('/explore?price=free');
    } else if (lowerQuery.includes('science') || lowerQuery.includes('academic')) {
      navigate('/explore?category=academic');
    } else if (lowerQuery.includes('sports') || lowerQuery.includes('game')) {
      navigate('/explore?category=sports');
    } else if (lowerQuery.includes('music') || lowerQuery.includes('concert')) {
      navigate('/explore?category=music');
    } else {
      navigate(`/explore?q=${encodeURIComponent(query)}`);
    }
    
    // Save to recent searches
    setRecentSearches(prev => [query, ...prev.filter(s => s !== query)].slice(0, 5));
    setSearchQuery('');
    setSearchFocused(false);
  };

  // Handle regular search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleSmartSearch(searchQuery);
    }
  };

  // Get role-specific quick actions
  const getQuickActions = () => {
    switch (profile?.role) {
      case 'school_admin':
        return [
          { icon: PlusIcon, label: 'Create Event', action: () => navigate('/events/create') },
          { icon: ChartBarIcon, label: 'Analytics', action: () => navigate('/analytics') },
          { icon: UserGroupIcon, label: 'Manage Users', action: () => navigate('/users') }
        ];
      case 'teacher':
        return [
          { icon: PlusIcon, label: 'Create Event', action: () => navigate('/events/create') },
          { icon: CalendarDaysIcon, label: 'My Events', action: () => navigate('/my-events') },
          { icon: UserGroupIcon, label: 'My Classes', action: () => navigate('/classes') }
        ];
      case 'parent':
        return [
          { icon: CalendarDaysIcon, label: 'Upcoming', action: () => navigate('/dashboard') },
          { icon: HeartIcon, label: 'Saved', action: () => navigate('/saved') },
          { icon: TicketIcon, label: 'Tickets', action: () => navigate('/tickets') }
        ];
      default:
        return [];
    }
  };

  const notifications = [
    {
      id: 1,
      type: 'event',
      title: 'Science Fair Tomorrow',
      message: "Don't forget! The Science Fair starts at 9 AM",
      time: '2 hours ago',
      unread: true,
      icon: '🔬'
    },
    {
      id: 2,
      type: 'reminder',
      title: 'Basketball Game Tonight',
      message: 'Varsity vs Lincoln High at 6 PM',
      time: '3 hours ago',
      unread: true,
      icon: '🏀'
    },
    {
      id: 3,
      type: 'update',
      title: 'New Event: Spring Musical',
      message: 'Tickets now available for Hamilton Jr.',
      time: '1 day ago',
      unread: true,
      icon: '🎭'
    }
  ];

  return (
    <>
      {/* Main Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        darkMode ? 'bg-gray-900/95' : 'bg-white/95'
      } backdrop-blur-xl border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        {/* Live Event Ticker */}
        <div className={`${darkMode ? 'bg-gradient-to-r from-purple-900 to-indigo-900' : 'bg-gradient-to-r from-purple-600 to-indigo-600'} text-white py-1.5 px-4 text-sm`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <SparklesIcon className="h-4 w-4 animate-pulse" />
              <span className="font-medium">Live:</span>
              <div className="overflow-hidden flex-1">
                <p className="animate-slide-left whitespace-nowrap">
                  {LIVE_EVENTS[liveTicker]}
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/explore')}
              className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
            >
              View All Events
              <ArrowRightIcon className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Greeting */}
            <div className="flex items-center gap-6">
              <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-3 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2.5 rounded-xl">
                    <AcademicCapIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    K12 Calendar
                  </h1>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} -mt-0.5`}>
                    {greeting}, {profile?.full_name?.split(' ')[0] || 'there'}! {WEATHER_ICONS[weather.condition]} {weather.temp}°
                  </p>
                </div>
              </button>
            </div>

            {/* Center - Smart Search */}
            <div className="flex-1 max-w-2xl mx-6">
              <form onSubmit={handleSearch} className="relative">
                <div className={`relative flex items-center ${
                  searchFocused ? 'ring-2 ring-indigo-500' : ''
                } ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl transition-all duration-300`}>
                  <MagnifyingGlassIcon className={`h-5 w-5 absolute left-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search events, activities, or ask me anything..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                    className={`w-full pl-12 pr-20 py-3 bg-transparent ${
                      darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                    } focus:outline-none`}
                  />
                  
                  {/* Voice Search */}
                  <button
                    type="button"
                    onClick={startVoiceSearch}
                    className={`absolute right-12 p-1.5 rounded-lg ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : darkMode 
                          ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                          : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                    } transition-all`}
                  >
                    <MicrophoneIcon className="h-4 w-4" />
                  </button>

                  {/* Command Palette Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowCommandPalette(true)}
                    className={`absolute right-3 px-2 py-1 rounded text-xs font-medium ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    } transition-colors`}
                  >
                    ⌘K
                  </button>
                </div>

                {/* Search Suggestions Dropdown */}
                {searchFocused && (
                  <div className={`absolute top-full mt-2 w-full ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  } rounded-2xl shadow-2xl border ${
                    darkMode ? 'border-gray-700' : 'border-gray-200'
                  } overflow-hidden transition-all duration-300 transform origin-top`}>
                    {searchQuery ? (
                      <div className="p-4">
                        <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
                          SEARCH RESULTS
                        </p>
                        {/* AI-powered suggestions would go here */}
                        <div className="space-y-2">
                          <button className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          } transition-colors text-left`}>
                            <CalendarDaysIcon className="h-5 w-5 text-indigo-500" />
                            <div>
                              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Events matching "{searchQuery}"
                              </p>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                12 results found
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
                              RECENT SEARCHES
                            </p>
                            <div className="space-y-1">
                              {recentSearches.map((search, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setSearchQuery(search);
                                    handleSmartSearch(search);
                                  }}
                                  className={`w-full flex items-center gap-3 p-2 rounded-lg ${
                                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                  } transition-colors text-left`}
                                >
                                  <ClockIcon className="h-4 w-4 text-gray-400" />
                                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                    {search}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="p-4">
                          <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
                            QUICK ACTIONS
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {SEARCH_SUGGESTIONS.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleSmartSearch(suggestion.query)}
                                className={`flex items-center gap-3 p-3 rounded-lg ${
                                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                } transition-colors text-left`}
                              >
                                <suggestion.icon className="h-5 w-5 text-indigo-500" />
                                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {suggestion.text}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center gap-3">
              {/* Quick Actions for Logged In Users */}
              {user && (
                <>
                  {getQuickActions().map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl ${
                        darkMode 
                          ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
                          : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                      } transition-all`}
                    >
                      <action.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{action.label}</span>
                    </button>
                  ))}

                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className={`relative p-2 rounded-xl ${
                        darkMode 
                          ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
                          : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                      } transition-all`}
                    >
                      {unreadCount > 0 ? (
                        <BellSolidIcon className="h-6 w-6 text-indigo-600" />
                      ) : (
                        <BellIcon className="h-6 w-6" />
                      )}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                      <div className={`absolute right-0 mt-2 w-96 ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                      } rounded-2xl shadow-2xl border ${
                        darkMode ? 'border-gray-700' : 'border-gray-200'
                      } overflow-hidden`}>
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              Notifications
                            </h3>
                            <button
                              onClick={() => setUnreadCount(0)}
                              className="text-sm text-indigo-600 hover:text-indigo-700"
                            >
                              Mark all as read
                            </button>
                          </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 border-b ${
                                darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
                              } cursor-pointer transition-colors`}
                            >
                              <div className="flex gap-3">
                                <div className="text-2xl">{notification.icon}</div>
                                <div className="flex-1">
                                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {notification.title}
                                  </p>
                                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                                    {notification.message}
                                  </p>
                                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-2`}>
                                    {notification.time}
                                  </p>
                                </div>
                                {notification.unread && (
                                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700">
                          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                            View all notifications
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                        darkMode 
                          ? 'hover:bg-gray-800' 
                          : 'hover:bg-gray-100'
                      } transition-all`}
                    >
                      <div className="hidden sm:block text-right">
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {profile?.full_name || 'User'}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {profile?.role ? profile.role.replace('_', ' ').charAt(0).toUpperCase() + profile.role.slice(1).replace('_', ' ') : 'User'}
                        </p>
                      </div>
                      <div className="relative">
                        <UserCircleIcon className={`h-8 w-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                    </button>

                    {/* User Dropdown */}
                    {showUserMenu && (
                      <div className={`absolute right-0 mt-2 w-64 ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                      } rounded-2xl shadow-2xl border ${
                        darkMode ? 'border-gray-700' : 'border-gray-200'
                      } overflow-hidden`}>
                        <div className={`p-4 ${darkMode ? 'bg-gradient-to-r from-purple-900 to-indigo-900' : 'bg-gradient-to-r from-purple-600 to-indigo-600'} text-white`}>
                          <p className="font-semibold">{profile?.full_name}</p>
                          <p className="text-sm opacity-90">{user?.email}</p>
                        </div>
                        <div className="p-2">
                          <button
                            onClick={() => navigate('/profile')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            } transition-colors text-left`}
                          >
                            <UserCircleIcon className="h-5 w-5 text-gray-400" />
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>My Profile</span>
                          </button>
                          <button
                            onClick={() => navigate('/settings')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            } transition-colors text-left`}
                          >
                            <CogIcon className="h-5 w-5 text-gray-400" />
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Settings</span>
                          </button>
                          <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            } transition-colors text-left`}
                          >
                            {darkMode ? (
                              <SunIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <MoonIcon className="h-5 w-5 text-gray-400" />
                            )}
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                              {darkMode ? 'Light Mode' : 'Dark Mode'}
                            </span>
                          </button>
                          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                          <button
                            onClick={() => navigate('/help')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            } transition-colors text-left`}
                          >
                            <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" />
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Help Center</span>
                          </button>
                          <button
                            onClick={async () => {
                              await logout();
                              navigate('/');
                              toast.success('Signed out successfully');
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                              darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'
                            } transition-colors text-left`}
                          >
                            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Login/Signup for Guests */}
              {!user && (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className={`px-4 py-2 rounded-xl font-medium ${
                      darkMode 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    } transition-all`}
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mega Menu Navigation */}
        <nav className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-8 h-12">
              {[
                { id: 'events', label: 'Events', icon: CalendarDaysIcon },
                { id: 'calendar', label: 'Calendar', icon: CalendarDaysIcon },
                { id: 'tickets', label: 'Tickets', icon: TicketIcon },
                { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
                { id: 'help', label: 'Help', icon: QuestionMarkCircleIcon }
              ].map((item) => (
                <button
                  key={item.id}
                  onMouseEnter={() => setShowMegaMenu(item.id)}
                  onMouseLeave={() => setShowMegaMenu(null)}
                  onClick={() => navigate(`/${item.id === 'events' ? 'explore' : item.id}`)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    location.pathname.includes(item.id)
                      ? darkMode 
                        ? 'text-indigo-400 bg-indigo-900/20' 
                        : 'text-indigo-600 bg-indigo-50'
                      : darkMode 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  } transition-all`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.id === 'events' && <ChevronDownIcon className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* Mega Menu Content */}
          {showMegaMenu === 'events' && (
            <div 
              onMouseEnter={() => setShowMegaMenu('events')}
              onMouseLeave={() => setShowMegaMenu(null)}
              className={`absolute left-0 right-0 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-2xl border-t ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-4 gap-8">
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                      Browse Events
                    </h3>
                    <div className="space-y-2">
                      {['All Events', 'Today', 'This Week', 'This Month', 'Popular'].map((link) => (
                        <button
                          key={link}
                          className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                            darkMode 
                              ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          } transition-colors`}
                        >
                          {link}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                      Categories
                    </h3>
                    <div className="space-y-2">
                      {['Academic', 'Sports', 'Arts & Music', 'Fundraising', 'Social'].map((category) => (
                        <button
                          key={category}
                          className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                            darkMode 
                              ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          } transition-colors`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                      Featured Events
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2].map((i) => (
                        <div key={i} className={`${
                          darkMode ? 'bg-gray-700' : 'bg-gray-100'
                        } rounded-lg p-4`}>
                          <div className="h-24 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg mb-3"></div>
                          <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Science Fair 2024
                          </h4>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                            March 15, 2024 • 9:00 AM
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Command Palette Modal */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen pt-24 px-4">
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCommandPalette(false)}
            ></div>
            
            <div className={`relative w-full max-w-2xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } rounded-2xl shadow-2xl`}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CommandLineIcon className="h-6 w-6 text-indigo-600" />
                  <input
                    ref={commandPaletteRef}
                    type="text"
                    placeholder="Type a command or search..."
                    className={`flex-1 text-lg ${
                      darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                    } px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    autoFocus
                  />
                  <button
                    onClick={() => setShowCommandPalette(false)}
                    className={`p-2 rounded-lg ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    } transition-colors`}
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                      QUICK ACTIONS
                    </p>
                    <div className="space-y-1">
                      {[
                        { icon: PlusIcon, label: 'Create New Event', shortcut: '⌘N' },
                        { icon: CalendarDaysIcon, label: 'View Calendar', shortcut: '⌘C' },
                        { icon: MagnifyingGlassIcon, label: 'Search Events', shortcut: '⌘S' },
                        { icon: TicketIcon, label: 'My Tickets', shortcut: '⌘T' }
                      ].map((action, index) => (
                        <button
                          key={index}
                          className={`w-full flex items-center justify-between p-3 rounded-lg ${
                            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          } transition-colors`}
                        >
                          <div className="flex items-center gap-3">
                            <action.icon className="h-5 w-5 text-indigo-600" />
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                              {action.label}
                            </span>
                          </div>
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {action.shortcut}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="h-32"></div>
    </>
  );
}