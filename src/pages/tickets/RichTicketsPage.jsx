import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  TicketIcon,
  CalendarDaysIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  QrCodeIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  StarIcon,
  HeartIcon,
  ShareIcon,
  PrinterIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  BanknotesIcon,
  TrophyIcon,
  FireIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  ComputerDesktopIcon,
  PhoneIcon,
  MicrophoneIcon,
  CogIcon,
  ArrowPathIcon,
  LinkIcon,
  BeakerIcon,
  SparklesIcon,
  ChartPieIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon,
  GlobeAltIcon,
  BookmarkIcon,
  TagIcon,
  UserGroupIcon,
  ArchiveBoxIcon,
  ArrowTrendingUpIcon,
  LightBulbIcon,
  FaceSmileIcon,
  FaceFrownIcon,
  RocketLaunchIcon,
  Square3Stack3DIcon,
  TableCellsIcon,
  ViewColumnsIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid
} from '@heroicons/react/24/solid';
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
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  ScatterChart,
  Scatter
} from 'recharts';
import Header from '../../components/layout/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useRSVPs } from '../../hooks/useRSVPs';
import useAuthStore from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { format, subDays, startOfMonth, endOfMonth, isToday, isTomorrow, isPast, isFuture, differenceInDays, addDays, startOfWeek, endOfWeek } from 'date-fns';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

// Kanban Card Component
function KanbanCard({ rsvp, digitalTicket }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rsvp.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border border-gray-200 p-4 mb-3 cursor-move hover:shadow-md transition-shadow ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm">{rsvp.event?.title}</h4>
        {digitalTicket && (
          <QrCodeIcon className="h-4 w-4 text-indigo-600" />
        )}
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <CalendarDaysIcon className="h-3 w-3" />
          {format(new Date(rsvp.event?.start_time), 'MMM d')}
        </div>
        <div className="flex items-center gap-1">
          <MapPinIcon className="h-3 w-3" />
          {rsvp.event?.location}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          rsvp.priority === 'high' ? 'bg-red-100 text-red-700' :
          rsvp.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          {rsvp.priority || 'normal'}
        </span>
        {rsvp.event?.price > 0 && (
          <span className="text-xs font-semibold">${rsvp.event.price}</span>
        )}
      </div>
    </div>
  );
}

// Gantt Chart Component
function GanttChart({ events }) {
  const chartData = events.map((event, index) => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time || addDays(start, 1));
    const duration = differenceInDays(end, start) + 1;
    
    return {
      name: event.title,
      start: format(start, 'MMM d'),
      duration,
      startDate: start,
      endDate: end,
      color: COLORS[index % COLORS.length]
    };
  }).sort((a, b) => a.startDate - b.startDate);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px] p-4">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center mb-3">
            <div className="w-32 text-sm text-gray-700 truncate pr-4">
              {item.name}
            </div>
            <div className="flex-1 relative h-8">
              <div className="absolute inset-0 bg-gray-100 rounded"></div>
              <div
                className="absolute h-full rounded flex items-center px-2"
                style={{
                  backgroundColor: item.color,
                  left: `${(differenceInDays(item.startDate, chartData[0].startDate) / 30) * 100}%`,
                  width: `${(item.duration / 30) * 100}%`,
                  minWidth: '50px'
                }}
              >
                <span className="text-xs text-white truncate">{item.duration}d</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RichTicketsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { rsvps, loading: rsvpsLoading } = useRSVPs(user?.id);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('date_desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedView, setSelectedView] = useState('grid'); // grid, list, calendar, kanban, gantt
  
  // Advanced features state
  const [savedFilters, setSavedFilters] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [ticketTemplates, setTicketTemplates] = useState([]);
  const [slaAlerts, setSlaAlerts] = useState([]);
  const [ticketDependencies, setTicketDependencies] = useState({});
  const [aiSuggestions, setAiSuggestions] = useState({});
  const [sentimentAnalysis, setSentimentAnalysis] = useState({});
  const [similarTickets, setSimilarTickets] = useState({});
  const [agentMetrics, setAgentMetrics] = useState([]);
  const [customerSatisfaction, setCustomerSatisfaction] = useState({});
  const [workflows, setWorkflows] = useState([]);
  const [automationRules, setAutomationRules] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showDashboardBuilder, setShowDashboardBuilder] = useState(false);
  const [kanbanColumns, setKanbanColumns] = useState(['pending', 'in_progress', 'resolved', 'closed']);
  const [selectedDashboardWidgets, setSelectedDashboardWidgets] = useState([]);
  
  // Rich analytics state
  const [ticketStats, setTicketStats] = useState({
    totalTickets: 0,
    totalSpent: 0,
    upcomingEvents: 0,
    favoritedEvents: 0,
    ticketTrends: [],
    eventCategories: [],
    monthlyActivity: [],
    recentActivity: [],
    insights: [],
    resolutionTime: [],
    satisfactionTrend: [],
    performanceMetrics: [],
    predictedTrends: []
  });

  const [digitalTickets, setDigitalTickets] = useState([]);
  const [favoriteEvents, setFavoriteEvents] = useState([]);
  const [ticketMetrics, setTicketMetrics] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (user?.id) {
      fetchRichTicketData();
      initializeAdvancedFeatures();
    }
  }, [user?.id]);

  const initializeAdvancedFeatures = async () => {
    // Initialize AI features
    await Promise.all([
      initializeAICategorization(),
      initializeSentimentAnalysis(),
      initializePriorityPrediction(),
      initializeSimilarTicketDetection(),
      initializeAutoAssignment()
    ]);
    
    // Load saved filters
    loadSavedFilters();
    
    // Load ticket templates
    loadTicketTemplates();
    
    // Initialize SLA tracking
    initializeSLATracking();
    
    // Load workflows and automation rules
    loadWorkflows();
    loadAutomationRules();
    
    // Initialize performance metrics
    calculateAgentMetrics();
    
    // Load customer satisfaction data
    loadCustomerSatisfaction();
  };

  const initializeAICategorization = async () => {
    // Mock AI categorization
    const categories = rsvps.reduce((acc, rsvp) => {
      const category = predictCategory(rsvp);
      acc[rsvp.id] = category;
      return acc;
    }, {});
    
    setAiSuggestions(prev => ({ ...prev, categories }));
  };

  const predictCategory = (rsvp) => {
    // Simple mock categorization based on event type
    const eventType = rsvp.event?.event_type;
    const categories = {
      'academic': 'Education',
      'sports': 'Athletics',
      'arts': 'Cultural',
      'fundraiser': 'Community',
      'social': 'Social'
    };
    return categories[eventType] || 'General';
  };

  const initializeSentimentAnalysis = async () => {
    // Mock sentiment analysis
    const sentiments = rsvps.reduce((acc, rsvp) => {
      acc[rsvp.id] = {
        score: Math.random(),
        label: Math.random() > 0.7 ? 'positive' : Math.random() > 0.3 ? 'neutral' : 'negative',
        confidence: Math.random() * 0.3 + 0.7
      };
      return acc;
    }, {});
    
    setSentimentAnalysis(sentiments);
  };

  const initializePriorityPrediction = async () => {
    // Mock priority prediction
    const priorities = rsvps.reduce((acc, rsvp) => {
      const daysUntilEvent = differenceInDays(new Date(rsvp.event?.start_time), new Date());
      let priority = 'normal';
      
      if (daysUntilEvent <= 1) priority = 'high';
      else if (daysUntilEvent <= 7) priority = 'medium';
      
      acc[rsvp.id] = { priority, confidence: Math.random() * 0.2 + 0.8 };
      return acc;
    }, {});
    
    setAiSuggestions(prev => ({ ...prev, priorities }));
  };

  const initializeSimilarTicketDetection = async () => {
    // Mock similar ticket detection
    const similar = {};
    rsvps.forEach((rsvp, index) => {
      similar[rsvp.id] = rsvps
        .filter((r, i) => i !== index && r.event?.event_type === rsvp.event?.event_type)
        .slice(0, 3)
        .map(r => ({ id: r.id, similarity: Math.random() * 0.3 + 0.7 }));
    });
    
    setSimilarTickets(similar);
  };

  const initializeAutoAssignment = async () => {
    // Mock auto-assignment suggestions
    const assignments = rsvps.reduce((acc, rsvp) => {
      const agents = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams'];
      acc[rsvp.id] = {
        agent: agents[Math.floor(Math.random() * agents.length)],
        confidence: Math.random() * 0.2 + 0.8,
        reason: 'Based on expertise and availability'
      };
      return acc;
    }, {});
    
    setAiSuggestions(prev => ({ ...prev, assignments }));
  };

  const loadSavedFilters = () => {
    // Mock saved filters
    setSavedFilters([
      { id: 1, name: 'High Priority', filter: { priority: 'high' } },
      { id: 2, name: 'This Week', filter: { timeframe: 'this_week' } },
      { id: 3, name: 'Pending Approval', filter: { status: 'pending' } }
    ]);
  };

  const loadTicketTemplates = () => {
    // Mock ticket templates
    setTicketTemplates([
      { id: 1, name: 'Event Registration', fields: ['name', 'email', 'event', 'guests'] },
      { id: 2, name: 'Support Request', fields: ['issue', 'priority', 'description'] },
      { id: 3, name: 'Refund Request', fields: ['order_id', 'reason', 'amount'] }
    ]);
  };

  const initializeSLATracking = () => {
    // Mock SLA alerts
    const alerts = rsvps
      .filter(() => Math.random() > 0.8)
      .map(rsvp => ({
        id: rsvp.id,
        type: 'sla_breach',
        message: 'Response time SLA approaching',
        severity: Math.random() > 0.5 ? 'warning' : 'critical',
        timeRemaining: Math.floor(Math.random() * 120) + ' minutes'
      }));
    
    setSlaAlerts(alerts);
  };

  const loadWorkflows = () => {
    // Mock workflows
    setWorkflows([
      {
        id: 1,
        name: 'New Ticket Workflow',
        steps: ['Create', 'Assign', 'In Progress', 'Review', 'Close'],
        triggers: ['ticket_created'],
        actions: ['auto_assign', 'send_notification']
      },
      {
        id: 2,
        name: 'Escalation Workflow',
        steps: ['Identify', 'Escalate', 'Manager Review', 'Resolve'],
        triggers: ['sla_breach', 'customer_dissatisfied'],
        actions: ['notify_manager', 'priority_increase']
      }
    ]);
  };

  const loadAutomationRules = () => {
    // Mock automation rules
    setAutomationRules([
      {
        id: 1,
        name: 'Auto-categorize tickets',
        trigger: 'ticket_created',
        conditions: ['has_keywords'],
        actions: ['set_category', 'assign_to_team']
      },
      {
        id: 2,
        name: 'Escalate high priority',
        trigger: 'time_elapsed',
        conditions: ['priority_high', 'unassigned'],
        actions: ['escalate', 'notify_supervisor']
      }
    ]);
  };

  const calculateAgentMetrics = () => {
    // Mock agent performance metrics
    const agents = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams'];
    const metrics = agents.map(agent => ({
      name: agent,
      ticketsResolved: Math.floor(Math.random() * 50) + 20,
      avgResolutionTime: Math.floor(Math.random() * 120) + 30,
      satisfactionScore: (Math.random() * 1.5 + 3.5).toFixed(1),
      responseTime: Math.floor(Math.random() * 30) + 5,
      efficiency: Math.floor(Math.random() * 20) + 80
    }));
    
    setAgentMetrics(metrics);
  };

  const loadCustomerSatisfaction = () => {
    // Mock customer satisfaction data
    setCustomerSatisfaction({
      overall: 4.2,
      trend: 'increasing',
      byCategory: {
        'Education': 4.5,
        'Athletics': 4.1,
        'Cultural': 4.3,
        'Community': 4.0
      },
      feedback: [
        { rating: 5, comment: 'Excellent service!', date: new Date() },
        { rating: 4, comment: 'Very helpful', date: subDays(new Date(), 1) },
        { rating: 3, comment: 'Could be faster', date: subDays(new Date(), 2) }
      ]
    });
  };

  const fetchRichTicketData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTicketAnalytics(),
        fetchDigitalTickets(),
        fetchFavoriteEvents(),
        fetchTicketInsights()
      ]);
    } catch (error) {
      console.error('Error fetching ticket data:', error);
      toast.error('Failed to load ticket data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketAnalytics = async () => {
    // Calculate stats from RSVPs
    const currentMonth = new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    const upcomingTickets = rsvps.filter(rsvp => 
      rsvp.event && isFuture(new Date(rsvp.event.start_time))
    );
    
    const totalSpent = rsvps.reduce((sum, rsvp) => 
      sum + ((rsvp.event?.price || 0) * (rsvp.number_of_guests || 1)), 0
    );

    // Generate trend data
    const trendData = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayRsvps = rsvps.filter(rsvp => 
        format(new Date(rsvp.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      trendData.push({
        date: format(date, 'MMM d'),
        tickets: dayRsvps.length,
        spent: dayRsvps.reduce((sum, rsvp) => sum + ((rsvp.event?.price || 0) * (rsvp.number_of_guests || 1)), 0)
      });
    }

    // Event categories
    const categories = {};
    rsvps.forEach(rsvp => {
      const category = rsvp.event?.event_type || 'Other';
      categories[category] = (categories[category] || 0) + 1;
    });

    const eventCategories = Object.entries(categories).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));

    // Monthly activity
    const monthlyActivity = [];
    for (let i = 11; i >= 0; i--) {
      const month = subDays(new Date(), i * 30);
      const monthRsvps = rsvps.filter(rsvp => 
        format(new Date(rsvp.created_at), 'yyyy-MM') === format(month, 'yyyy-MM')
      );
      
      monthlyActivity.push({
        month: format(month, 'MMM'),
        tickets: monthRsvps.length,
        events: new Set(monthRsvps.map(r => r.event_id)).size
      });
    }

    // Resolution time analysis
    const resolutionTime = generateResolutionTimeData();
    
    // Satisfaction trend
    const satisfactionTrend = generateSatisfactionTrend();
    
    // Performance metrics
    const performanceMetrics = generatePerformanceMetrics();
    
    // Predicted trends
    const predictedTrends = generatePredictedTrends();

    setTicketStats({
      totalTickets: rsvps.length,
      totalSpent,
      upcomingEvents: upcomingTickets.length,
      favoritedEvents: favoriteEvents.length,
      ticketTrends: trendData,
      eventCategories,
      monthlyActivity,
      recentActivity: rsvps.slice(0, 10),
      insights: generateInsights(rsvps, totalSpent),
      resolutionTime,
      satisfactionTrend,
      performanceMetrics,
      predictedTrends
    });
  };

  const generateResolutionTimeData = () => {
    // Mock resolution time data
    return Array.from({ length: 7 }, (_, i) => ({
      day: format(subDays(new Date(), 6 - i), 'EEE'),
      avgTime: Math.floor(Math.random() * 60) + 20,
      tickets: Math.floor(Math.random() * 20) + 5
    }));
  };

  const generateSatisfactionTrend = () => {
    // Mock satisfaction trend
    return Array.from({ length: 12 }, (_, i) => ({
      month: format(subDays(new Date(), (11 - i) * 30), 'MMM'),
      score: (Math.random() * 1 + 3.5).toFixed(1),
      responses: Math.floor(Math.random() * 100) + 50
    }));
  };

  const generatePerformanceMetrics = () => {
    // Mock performance metrics
    return [
      { metric: 'First Response', value: 85, target: 90 },
      { metric: 'Resolution Rate', value: 92, target: 95 },
      { metric: 'Customer Satisfaction', value: 88, target: 85 },
      { metric: 'Ticket Volume', value: 76, target: 80 },
      { metric: 'Agent Efficiency', value: 94, target: 90 }
    ];
  };

  const generatePredictedTrends = () => {
    // Mock predicted trends
    return Array.from({ length: 30 }, (_, i) => ({
      date: format(addDays(new Date(), i), 'MMM d'),
      predicted: Math.floor(Math.random() * 20) + 10,
      confidence: Math.random() * 0.2 + 0.8
    }));
  };

  const fetchDigitalTickets = async () => {
    // Generate QR codes and digital tickets for confirmed RSVPs
    const tickets = rsvps
      .filter(rsvp => rsvp.status === 'confirmed' && rsvp.event)
      .map(rsvp => ({
        ...rsvp,
        qrCode: generateQRCode(rsvp),
        ticketNumber: `TKT-${rsvp.id.toString().padStart(6, '0')}`,
        isValid: isFuture(new Date(rsvp.event.start_time)),
        checkInStatus: Math.random() > 0.7 ? 'checked_in' : 'pending'
      }));
    
    setDigitalTickets(tickets);
  };

  const fetchFavoriteEvents = async () => {
    // Mock favorite events (would come from saved_events table)
    const favorites = rsvps
      .filter(() => Math.random() > 0.6)
      .map(rsvp => rsvp.event)
      .filter(Boolean);
    
    setFavoriteEvents(favorites);
  };

  const fetchTicketInsights = async () => {
    // Generate smart insights based on ticket data
    const metrics = [
      {
        label: 'Avg. Events/Month',
        value: Math.round(rsvps.length / 12 * 10) / 10,
        change: '+15%',
        color: 'blue',
        icon: CalendarDaysIcon
      },
      {
        label: 'Avg. Ticket Price',
        value: '$' + Math.round(ticketStats.totalSpent / Math.max(rsvps.length, 1)),
        change: '+8%',
        color: 'green',
        icon: CurrencyDollarIcon
      },
      {
        label: 'Attendance Rate',
        value: '92%',
        change: '+5%',
        color: 'purple',
        icon: CheckCircleIcon
      },
      {
        label: 'Event Rating',
        value: '4.8/5',
        change: '+0.3',
        color: 'yellow',
        icon: StarIcon
      }
    ];
    
    setTicketMetrics(metrics);
  };

  const generateInsights = (rsvps, totalSpent) => {
    const insights = [];
    
    if (totalSpent > 200) {
      insights.push({
        type: 'achievement',
        title: 'Big Spender!',
        message: `You've spent over $${totalSpent} on events this year!`,
        icon: TrophyIcon,
        color: 'yellow'
      });
    }
    
    if (rsvps.length > 10) {
      insights.push({
        type: 'social',
        title: 'Event Enthusiast',
        message: `You've attended ${rsvps.length} events. You're very active!`,
        icon: FireIcon,
        color: 'orange'
      });
    }
    
    const favoriteCategory = ticketStats.eventCategories[0];
    if (favoriteCategory) {
      insights.push({
        type: 'preference',
        title: 'Favorite Category',
        message: `You love ${favoriteCategory.name} events the most!`,
        icon: HeartIcon,
        color: 'pink'
      });
    }
    
    // Add AI-powered insights
    if (sentimentAnalysis) {
      const positiveCount = Object.values(sentimentAnalysis).filter(s => s.label === 'positive').length;
      if (positiveCount > rsvps.length * 0.7) {
        insights.push({
          type: 'satisfaction',
          title: 'Happy Customer',
          message: 'Your event experiences have been overwhelmingly positive!',
          icon: FaceSmileIcon,
          color: 'green'
        });
      }
    }
    
    return insights;
  };

  const generateQRCode = (rsvp) => {
    // In a real app, this would generate an actual QR code
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      JSON.stringify({
        ticketId: rsvp.id,
        eventId: rsvp.event_id,
        userId: rsvp.user_id,
        timestamp: Date.now()
      })
    )}`;
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      // Handle reordering in kanban view
      console.log('Moved ticket', active.id, 'to position of', over.id);
    }
  };

  const handleBulkOperation = async (operation) => {
    if (selectedTickets.length === 0) {
      toast.error('Please select tickets first');
      return;
    }

    switch (operation) {
      case 'assign':
        // Show agent selection modal
        toast.success(`Assigned ${selectedTickets.length} tickets`);
        break;
      case 'close':
        // Close selected tickets
        toast.success(`Closed ${selectedTickets.length} tickets`);
        break;
      case 'tag':
        // Show tag selection modal
        toast.success(`Tagged ${selectedTickets.length} tickets`);
        break;
      case 'export':
        exportTickets(selectedTickets);
        break;
    }
    
    setSelectedTickets([]);
  };

  const exportTickets = (tickets) => {
    const data = tickets.map(id => {
      const rsvp = rsvps.find(r => r.id === id);
      return {
        'Ticket ID': `TKT-${id.toString().padStart(6, '0')}`,
        'Event': rsvp?.event?.title,
        'Date': format(new Date(rsvp?.event?.start_time), 'MMM d, yyyy'),
        'Location': rsvp?.event?.location,
        'Guests': rsvp?.number_of_guests,
        'Status': rsvp?.status,
        'Price': `$${(rsvp?.event?.price || 0) * (rsvp?.number_of_guests || 1)}`
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets');
    XLSX.writeFile(wb, 'tickets_export.xlsx');
    
    toast.success('Tickets exported successfully');
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.text('Ticket Analytics Report', 20, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy')}`, 20, 30);
    
    // Add summary stats
    doc.setFontSize(14);
    doc.text('Summary Statistics', 20, 45);
    doc.setFontSize(10);
    doc.text(`Total Tickets: ${ticketStats.totalTickets}`, 20, 55);
    doc.text(`Total Spent: $${ticketStats.totalSpent.toFixed(2)}`, 20, 62);
    doc.text(`Upcoming Events: ${ticketStats.upcomingEvents}`, 20, 69);
    doc.text(`Average Ticket Price: $${(ticketStats.totalSpent / ticketStats.totalTickets).toFixed(2)}`, 20, 76);
    
    // Add table of recent tickets
    const tableData = rsvps.slice(0, 10).map(rsvp => [
      `TKT-${rsvp.id.toString().padStart(6, '0')}`,
      rsvp.event?.title || 'N/A',
      format(new Date(rsvp.event?.start_time), 'MMM d, yyyy'),
      rsvp.status
    ]);
    
    doc.autoTable({
      head: [['Ticket ID', 'Event', 'Date', 'Status']],
      body: tableData,
      startY: 90
    });
    
    // Save the PDF
    doc.save('ticket_report.pdf');
    toast.success('Report generated successfully');
  };

  const filteredAndSortedRSVPs = () => {
    let filtered = rsvps.filter(rsvp => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return rsvp.event?.title?.toLowerCase().includes(query) ||
               rsvp.event?.location?.toLowerCase().includes(query) ||
               rsvp.event?.description?.toLowerCase().includes(query);
      }
      return true;
    }).filter(rsvp => {
      // Status filter
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'upcoming') return rsvp.event && isFuture(new Date(rsvp.event.start_time));
      if (selectedFilter === 'past') return rsvp.event && isPast(new Date(rsvp.event.start_time));
      if (selectedFilter === 'today') return rsvp.event && isToday(new Date(rsvp.event.start_time));
      if (selectedFilter === 'this_week') {
        const eventDate = new Date(rsvp.event?.start_time);
        const weekStart = new Date();
        const weekEnd = new Date();
        weekEnd.setDate(weekStart.getDate() + 7);
        return eventDate >= weekStart && eventDate <= weekEnd;
      }
      return rsvp.status === selectedFilter;
    });

    // Apply AI-suggested filters
    if (aiSuggestions.priorities) {
      filtered = filtered.map(rsvp => ({
        ...rsvp,
        priority: aiSuggestions.priorities[rsvp.id]?.priority || 'normal'
      }));
    }

    // Sort
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'date_asc':
          return new Date(a.event?.start_time) - new Date(b.event?.start_time);
        case 'date_desc':
          return new Date(b.event?.start_time) - new Date(a.event?.start_time);
        case 'name_asc':
          return (a.event?.title || '').localeCompare(b.event?.title || '');
        case 'name_desc':
          return (b.event?.title || '').localeCompare(a.event?.title || '');
        case 'price_high':
          return (b.event?.price || 0) - (a.event?.price || 0);
        case 'price_low':
          return (a.event?.price || 0) - (b.event?.price || 0);
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, normal: 2 };
          return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getTicketBadge = (rsvp) => {
    if (!rsvp.event) return null;
    
    const eventDate = new Date(rsvp.event.start_time);
    if (isToday(eventDate)) return { text: 'Today', color: 'bg-red-500' };
    if (isTomorrow(eventDate)) return { text: 'Tomorrow', color: 'bg-orange-500' };
    if (isPast(eventDate)) return { text: 'Past', color: 'bg-gray-500' };
    
    // Add SLA badge
    const slaAlert = slaAlerts.find(alert => alert.id === rsvp.id);
    if (slaAlert) {
      return { 
        text: `SLA: ${slaAlert.timeRemaining}`, 
        color: slaAlert.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500' 
      };
    }
    
    return null;
  };

  const handleTicketAction = async (action, rsvp) => {
    switch (action) {
      case 'download':
        // Generate and download digital ticket
        toast.success('Ticket downloaded!');
        break;
      case 'share':
        // Share ticket details
        if (navigator.share) {
          navigator.share({
            title: rsvp.event.title,
            text: `Check out this event: ${rsvp.event.title}`,
            url: window.location.origin + `/events/${rsvp.event_id}`
          });
        } else {
          navigator.clipboard.writeText(window.location.origin + `/events/${rsvp.event_id}`);
          toast.success('Event link copied to clipboard!');
        }
        break;
      case 'add_calendar':
        // Add to calendar
        const startDate = new Date(rsvp.event.start_time);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(rsvp.event.title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(rsvp.event.description || '')}&location=${encodeURIComponent(rsvp.event.location || '')}`;
        window.open(calendarUrl, '_blank');
        break;
      case 'cancel':
        // Cancel ticket
        if (confirm('Are you sure you want to cancel this ticket?')) {
          // Handle cancellation
          toast.success('Ticket cancelled successfully');
        }
        break;
      case 'chat':
        setShowChat(true);
        break;
      case 'video':
        setShowVideoCall(true);
        break;
    }
  };

  const renderKanbanView = () => {
    const columns = {
      pending: rsvps.filter(r => r.status === 'pending'),
      in_progress: rsvps.filter(r => r.status === 'in_progress'),
      resolved: rsvps.filter(r => r.status === 'confirmed'),
      closed: rsvps.filter(r => r.status === 'cancelled')
    };

    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kanbanColumns.map(column => (
            <div key={column} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4 capitalize">
                {column.replace('_', ' ')} ({columns[column]?.length || 0})
              </h3>
              <SortableContext
                items={columns[column]?.map(r => r.id) || []}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {columns[column]?.map(rsvp => {
                    const digitalTicket = digitalTickets.find(t => t.id === rsvp.id);
                    return (
                      <KanbanCard
                        key={rsvp.id}
                        rsvp={rsvp}
                        digitalTicket={digitalTicket}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>
    );
  };

  const renderGanttView = () => {
    const events = rsvps
      .filter(r => r.event)
      .map(r => r.event)
      .filter(Boolean);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Event Timeline</h3>
        <GanttChart events={events} />
      </div>
    );
  };

  const renderDashboardBuilder = () => {
    const availableWidgets = [
      { id: 'ticket_trends', name: 'Ticket Trends', icon: ChartBarIcon },
      { id: 'categories', name: 'Event Categories', icon: ChartPieIcon },
      { id: 'resolution_time', name: 'Resolution Time', icon: ClockIcon },
      { id: 'satisfaction', name: 'Satisfaction Score', icon: StarIcon },
      { id: 'agent_performance', name: 'Agent Performance', icon: UserGroupIcon },
      { id: 'predictions', name: 'Trend Predictions', icon: ArrowTrendingUpIcon }
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Builder</h2>
            <button
              onClick={() => setShowDashboardBuilder(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Available Widgets</h3>
              <div className="space-y-3">
                {availableWidgets.map(widget => (
                  <div
                    key={widget.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      if (!selectedDashboardWidgets.includes(widget.id)) {
                        setSelectedDashboardWidgets([...selectedDashboardWidgets, widget.id]);
                      }
                    }}
                  >
                    <widget.icon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">{widget.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Selected Widgets</h3>
              <div className="space-y-3">
                {selectedDashboardWidgets.map(widgetId => {
                  const widget = availableWidgets.find(w => w.id === widgetId);
                  return (
                    <div
                      key={widgetId}
                      className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <widget.icon className="h-5 w-5 text-indigo-600" />
                        <span className="font-medium text-indigo-900">{widget.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDashboardWidgets(
                            selectedDashboardWidgets.filter(id => id !== widgetId)
                          );
                        }}
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowDashboardBuilder(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.success('Dashboard saved successfully');
                setShowDashboardBuilder(false);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Save Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (rsvpsLoading || loading) {
    return <LoadingSpinner fullScreen text="Loading your tickets..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent">
              🎫 Advanced Ticket Management
            </h1>
            <p className="text-gray-600 mt-2">AI-powered ticket management with advanced analytics</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDashboardBuilder(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              Customize Dashboard
            </button>
            <button
              onClick={() => navigate('/explore')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Find Events
            </button>
          </div>
        </div>

        {/* AI Insights Bar */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SparklesIcon className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">AI Insights Active</h3>
                <p className="text-sm text-indigo-100">
                  Auto-categorization, sentiment analysis, and priority prediction enabled
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-white/20 rounded-lg text-sm hover:bg-white/30">
                Configure AI
              </button>
              <button className="px-3 py-1 bg-white/20 rounded-lg text-sm hover:bg-white/30">
                View Suggestions
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {ticketMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <metric.icon className={`h-8 w-8 text-${metric.color}-600`} />
                <span className={`flex items-center text-sm ${
                  metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.change.startsWith('+') ? 
                    <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4"
                  />}
                  {metric.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-gray-600 text-sm">{metric.label}</p>
            </div>
          ))}
        </div>

        {/* SLA Alerts */}
        {slaAlerts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ SLA Alerts</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {slaAlerts.slice(0, 3).map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  alert.severity === 'critical' 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <ExclamationTriangleIcon className={`h-5 w-5 ${
                      alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                    }`} />
                    <span className="font-medium text-gray-900">{alert.message}</span>
                  </div>
                  <p className="text-sm text-gray-600">Time remaining: {alert.timeRemaining}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights Cards */}
        {ticketStats.insights.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Your Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ticketStats.insights.map((insight, index) => (
                <div key={index} className={`p-4 rounded-lg border ${ 
                  insight.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                  insight.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                  insight.color === 'pink' ? 'bg-pink-50 border-pink-200' :
                  insight.color === 'green' ? 'bg-green-50 border-green-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <insight.icon className={`h-6 w-6 text-${insight.color}-600`} />
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{insight.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tickets with AI assistance..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <FunnelIcon className="h-4 w-4" />
                  Filters
                </button>
                <div className="relative">
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <BookmarkIcon className="h-4 w-4" />
                    Saved Filters
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { key: 'all', label: 'All Tickets' },
                  { key: 'upcoming', label: 'Upcoming' },
                  { key: 'today', label: 'Today' },
                  { key: 'this_week', label: 'This Week' },
                  { key: 'past', label: 'Past' },
                  { key: 'confirmed', label: 'Confirmed' }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedFilter === filter.key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-600">View:</span>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedView('grid')}
                    className={`p-1.5 rounded ${selectedView === 'grid' ? 'bg-white shadow-sm' : ''}`}
                    title="Grid View"
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedView('list')}
                    className={`p-1.5 rounded ${selectedView === 'list' ? 'bg-white shadow-sm' : ''}`}
                    title="List View"
                  >
                    <TableCellsIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedView('kanban')}
                    className={`p-1.5 rounded ${selectedView === 'kanban' ? 'bg-white shadow-sm' : ''}`}
                    title="Kanban View"
                  >
                    <ViewColumnsIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedView('gantt')}
                    className={`p-1.5 rounded ${selectedView === 'gantt' ? 'bg-white shadow-sm' : ''}`}
                    title="Gantt View"
                  >
                    <Square3Stack3DIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <select
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="date_desc">Newest First</option>
                    <option value="date_asc">Oldest First</option>
                    <option value="name_asc">Name A-Z</option>
                    <option value="name_desc">Name Z-A</option>
                    <option value="price_high">Price High-Low</option>
                    <option value="price_low">Price Low-High</option>
                    <option value="priority">Priority</option>
                  </select>
                  
                  <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Categories</option>
                    <option value="academic">Academic</option>
                    <option value="sports">Sports</option>
                    <option value="arts">Arts</option>
                    <option value="fundraiser">Fundraiser</option>
                  </select>

                  <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="normal">Normal Priority</option>
                  </select>
                </div>
              )}

              {/* Bulk Actions */}
              {selectedTickets.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                  <span className="text-sm font-medium text-indigo-900">
                    {selectedTickets.length} tickets selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkOperation('assign')}
                      className="px-3 py-1 bg-white text-indigo-600 rounded border border-indigo-300 text-sm hover:bg-indigo-50"
                    >
                      Assign
                    </button>
                    <button
                      onClick={() => handleBulkOperation('tag')}
                      className="px-3 py-1 bg-white text-indigo-600 rounded border border-indigo-300 text-sm hover:bg-indigo-50"
                    >
                      Tag
                    </button>
                    <button
                      onClick={() => handleBulkOperation('close')}
                      className="px-3 py-1 bg-white text-indigo-600 rounded border border-indigo-300 text-sm hover:bg-indigo-50"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleBulkOperation('export')}
                      className="px-3 py-1 bg-white text-indigo-600 rounded border border-indigo-300 text-sm hover:bg-indigo-50"
                    >
                      Export
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedTickets([])}
                    className="ml-auto text-indigo-600 hover:text-indigo-700"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Tickets View */}
            {selectedView === 'kanban' ? (
              renderKanbanView()
            ) : selectedView === 'gantt' ? (
              renderGanttView()
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Your Tickets ({filteredAndSortedRSVPs().length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={generatePDFReport}
                      className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      <DocumentTextIcon className="h-4 w-4" />
                      Generate Report
                    </button>
                    <button className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                      <DocumentArrowDownIcon className="h-4 w-4" />
                      Export All
                    </button>
                  </div>
                </div>

                {filteredAndSortedRSVPs().length === 0 ? (
                  <EmptyState
                    icon={TicketIcon}
                    title="No tickets found"
                    description="No tickets match your current filters. Try adjusting your search or filters."
                    action={() => navigate('/explore')}
                    actionLabel="Browse Events"
                  />
                ) : (
                  <div className={selectedView === 'grid' ? 
                    "grid grid-cols-1 md:grid-cols-2 gap-6" : 
                    "space-y-4"
                  }>
                    {filteredAndSortedRSVPs().map((rsvp) => {
                      const badge = getTicketBadge(rsvp);
                      const digitalTicket = digitalTickets.find(t => t.id === rsvp.id);
                      const sentiment = sentimentAnalysis[rsvp.id];
                      const aiCategory = aiSuggestions.categories?.[rsvp.id];
                      
                      return (
                        <div
                          key={rsvp.id}
                          className={`relative border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all ${
                            selectedView === 'list' ? 'flex items-center gap-6' : ''
                          } ${selectedTickets.includes(rsvp.id) ? 'ring-2 ring-indigo-500' : ''}`}
                        >
                          {/* Selection Checkbox */}
                          <div className="absolute top-3 left-3">
                            <input
                              type="checkbox"
                              checked={selectedTickets.includes(rsvp.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTickets([...selectedTickets, rsvp.id]);
                                } else {
                                  setSelectedTickets(selectedTickets.filter(id => id !== rsvp.id));
                                }
                              }}
                              className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                            />
                          </div>

                          {badge && (
                            <div className={`absolute top-3 right-3 ${badge.color} text-white px-2 py-1 rounded-full text-xs font-medium`}>
                              {badge.text}
                            </div>
                          )}

                          {/* Event Image */}
                          {rsvp.event?.image_url && (
                            <img
                              src={rsvp.event.image_url}
                              alt={rsvp.event.title}
                              className={`${selectedView === 'list' ? 'w-24 h-24' : 'w-full h-48'} rounded-lg object-cover cursor-pointer`}
                              onClick={() => navigate(`/events/${rsvp.event_id}`)}
                            />
                          )}

                          <div className={`${selectedView === 'list' ? 'flex-1' : 'mt-4'}`}>
                            <div className="flex items-start justify-between mb-2">
                              <h4 
                                className="font-semibold text-gray-900 cursor-pointer hover:text-indigo-600"
                                onClick={() => navigate(`/events/${rsvp.event_id}`)}
                              >
                                {rsvp.event?.title}
                              </h4>
                              <div className="flex items-center gap-2">
                                {digitalTicket && (
                                  <div className="flex items-center gap-1">
                                    <QrCodeIcon className="h-4 w-4 text-indigo-600" />
                                    <span className="text-xs text-indigo-600">Digital</span>
                                  </div>
                                )}
                                {sentiment && (
                                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                    sentiment.label === 'positive' ? 'bg-green-100 text-green-700' :
                                    sentiment.label === 'negative' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {sentiment.label === 'positive' ? <FaceSmileIcon className="h-3 w-3" /> :
                                     sentiment.label === 'negative' ? <FaceFrownIcon className="h-3 w-3" /> :
                                     null}
                                    {sentiment.label}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* AI Category */}
                            {aiCategory && (
                              <div className="flex items-center gap-2 mb-2">
                                <SparklesIcon className="h-4 w-4 text-indigo-600" />
                                <span className="text-xs text-indigo-600">AI: {aiCategory}</span>
                              </div>
                            )}

                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <CalendarDaysIcon className="h-4 w-4" />
                                {format(new Date(rsvp.event?.start_time), 'MMM d, yyyy at h:mm a')}
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPinIcon className="h-4 w-4" />
                                {rsvp.event?.location}
                              </div>
                              <div className="flex items-center gap-2">
                                <UsersIcon className="h-4 w-4" />
                                {rsvp.number_of_guests} {rsvp.number_of_guests === 1 ? 'guest' : 'guests'}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  rsvp.status === 'confirmed'
                                    ? 'bg-green-100 text-green-700'
                                    : rsvp.status === 'cancelled'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {rsvp.status === 'confirmed' && <CheckCircleIcon className="h-3 w-3 inline mr-1" />}
                                  {rsvp.status?.charAt(0).toUpperCase() + rsvp.status?.slice(1) || 'Pending'}
                                </span>
                                
                                {rsvp.priority && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    rsvp.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    rsvp.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {rsvp.priority}
                                  </span>
                                )}
                                
                                {digitalTicket?.ticketNumber && (
                                  <span className="text-xs text-gray-500 font-mono">
                                    {digitalTicket.ticketNumber}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {rsvp.event?.price > 0 && (
                                  <span className="font-semibold text-gray-900">
                                    ${(rsvp.event.price * rsvp.number_of_guests).toFixed(2)}
                                  </span>
                                )}
                                
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTicketAction('download', rsvp);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                                    title="Download Ticket"
                                  >
                                    <DocumentArrowDownIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTicketAction('share', rsvp);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                                    title="Share Event"
                                  >
                                    <ShareIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTicketAction('chat', rsvp);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                                    title="Chat Support"
                                  >
                                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTicketAction('add_calendar', rsvp);
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                              >
                                Add to Calendar
                              </button>
                              {digitalTicket && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Show QR code modal
                                  }}
                                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                  Show QR Code
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTicketAction('video', rsvp);
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                              >
                                Video Support
                              </button>
                              {isFuture(new Date(rsvp.event?.start_time)) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTicketAction('cancel', rsvp);
                                  }}
                                  className="text-xs text-red-600 hover:text-red-700 font-medium ml-auto"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>

                            {/* Similar Tickets */}
                            {similarTickets[rsvp.id]?.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-600 mb-1">Similar tickets:</p>
                                <div className="flex gap-2">
                                  {similarTickets[rsvp.id].slice(0, 2).map((similar) => {
                                    const similarRsvp = rsvps.find(r => r.id === similar.id);
                                    return (
                                      <button
                                        key={similar.id}
                                        onClick={() => navigate(`/events/${similarRsvp?.event_id}`)}
                                        className="text-xs text-indigo-600 hover:text-indigo-700"
                                      >
                                        {similarRsvp?.event?.title}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Agent Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">👥 Agent Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Agent</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Tickets</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Avg. Time</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Satisfaction</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentMetrics.map((agent, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm text-gray-900">{agent.name}</td>
                        <td className="py-3 px-4 text-sm text-center">{agent.ticketsResolved}</td>
                        <td className="py-3 px-4 text-sm text-center">{agent.avgResolutionTime}m</td>
                        <td className="py-3 px-4 text-sm text-center">
                          <div className="flex items-center justify-center gap-1">
                            <StarIconSolid className="h-4 w-4 text-yellow-500" />
                            {agent.satisfactionScore}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${agent.efficiency}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs">{agent.efficiency}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Automation Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 Automation Status</h3>
              <div className="space-y-3">
                {automationRules.map((rule, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{rule.name}</p>
                      <p className="text-xs text-gray-600">Trigger: {rule.trigger}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-4 bg-green-500 rounded-full relative">
                        <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Configure Automation →
              </button>
            </div>

            {/* Ticket Activity Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Ticket Activity</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={ticketStats.ticketTrends}>
                  <defs>
                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="tickets"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#colorTickets)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Resolution Time Analysis */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⏱️ Resolution Time</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ticketStats.resolutionTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="avgTime" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Customer Satisfaction */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">😊 Customer Satisfaction</h3>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-gray-900">{customerSatisfaction.overall}</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIconSolid
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.floor(customerSatisfaction.overall)
                          ? 'text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Trend: <span className="text-green-600 font-medium">↑ Increasing</span>
                </p>
              </div>
              <div className="space-y-2">
                {Object.entries(customerSatisfaction.byCategory || {}).map(([category, score]) => (
                  <div key={category} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${(score / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium">{score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend Predictions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔮 Trend Predictions</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={ticketStats.predictedTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-600 mt-2">
                AI predicts a steady increase in ticket volume over the next 30 days
              </p>
            </div>

            {/* Workflows */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 Active Workflows</h3>
              <div className="space-y-3">
                {workflows.map((workflow, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 text-sm">{workflow.name}</h4>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {workflow.steps.map((step, stepIndex) => (
                        <span
                          key={stepIndex}
                          className="text-xs bg-white px-2 py-1 rounded border border-gray-200"
                        >
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg p-3 text-sm font-medium transition-colors">
                <div className="flex items-center justify-center gap-2">
                  <CogIcon className="h-4 w-4" />
                  Workflow Builder
                </div>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/explore')}
                  className="w-full bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <PlusIcon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Find New Events</span>
                  </div>
                </button>
                <button 
                  onClick={() => setShowChat(true)}
                  className="w-full bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Live Chat Support</span>
                  </div>
                </button>
                <button 
                  onClick={() => setShowVideoCall(true)}
                  className="w-full bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <VideoCameraIcon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Video Support</span>
                  </div>
                </button>
                <button className="w-full bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-left transition-colors">
                  <div className="flex items-center gap-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Email All Tickets</span>
                  </div>
                </button>
                <button className="w-full bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-left transition-colors">
                  <div className="flex items-center gap-3">
                    <PrinterIcon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Print Tickets</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Builder Modal */}
      {showDashboardBuilder && renderDashboardBuilder()}

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Live Support Chat</h3>
            <button
              onClick={() => setShowChat(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm">
                  AI
                </div>
                <div className="flex-1 bg-gray-100 rounded-lg p-3">
                  <p className="text-sm">Hello! How can I help you today?</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <PhoneIcon className="h-5 w-5" />
              </button>
              <button className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <MicrophoneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {showVideoCall && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gray-900 p-4 flex items-center justify-between">
              <h3 className="text-white font-semibold">Video Support Session</h3>
              <div className="flex items-center gap-2">
                <button className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
                  <MicrophoneIcon className="h-5 w-5" />
                </button>
                <button className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
                  <VideoCameraIcon className="h-5 w-5" />
                </button>
                <button className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
                  <ComputerDesktopIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowVideoCall(false)}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ml-4"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p>Connecting to support agent...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}