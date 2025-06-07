import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageSquare, 
  FileText, 
  Phone, 
  Mail, 
  Search, 
  Send, 
  Clock, 
  CheckCircle,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Video,
  Users,
  Shield,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Star,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Calendar,
  User,
  MessageCircle,
  Paperclip,
  Play,
  ExternalLink,
  Award,
  BarChart3,
  Activity
} from 'lucide-react';
import { useSupportTickets } from '../../hooks/useSupportTickets';
import useAuthStore from '../../store/authStore';
import { formatDistanceToNow } from 'date-fns';

const SupportPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'bot', message: 'Hello! How can I help you today?', time: '10:00 AM' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    description: '',
    attachments: []
  });

  const { tickets, loading, createTicket, updateTicketStatus, getMetrics, getTicketStats, refresh } = useSupportTickets();
  const user = useAuthStore((state) => state.user);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // Get real metrics from the hook
  const supportMetrics = getMetrics().map(metric => {
    const iconMap = {
      'Clock': Clock,
      'CheckCircle': CheckCircle,
      'MessageSquare': MessageSquare,
      'Star': Star
    };
    return { ...metric, icon: iconMap[metric.icon] };
  });

  const supportCategories = [
    { 
      id: 1, 
      name: 'Technical Issues', 
      icon: Zap, 
      count: 45,
      description: 'System errors, bugs, and technical problems',
      gradient: 'from-red-500 to-pink-600'
    },
    { 
      id: 2, 
      name: 'Account & Billing', 
      icon: Shield, 
      count: 23,
      description: 'Subscription, payments, and account settings',
      gradient: 'from-blue-500 to-indigo-600'
    },
    { 
      id: 3, 
      name: 'Event Management', 
      icon: Calendar, 
      count: 67,
      description: 'Creating, editing, and managing school events',
      gradient: 'from-green-500 to-teal-600'
    },
    { 
      id: 4, 
      name: 'User Training', 
      icon: Users, 
      count: 34,
      description: 'Tutorials, guides, and best practices',
      gradient: 'from-purple-500 to-pink-600'
    }
  ];

  // Format tickets for display
  const formattedTickets = tickets.map(ticket => ({
    id: ticket.id.slice(0, 8).toUpperCase(),
    subject: ticket.title,
    category: ticket.category || 'General',
    status: ticket.status,
    priority: ticket.priority,
    created: formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true }),
    lastUpdate: formatDistanceToNow(new Date(ticket.updated_at || ticket.created_at), { addSuffix: true }),
    messages: 1
  }));

  const knowledgeArticles = [
    {
      id: 1,
      title: 'Getting Started with K12 Calendar',
      category: 'Basics',
      views: 1234,
      helpful: 89,
      updated: '2 days ago',
      readTime: '5 min'
    },
    {
      id: 2,
      title: 'Managing School Events Effectively',
      category: 'Events',
      views: 856,
      helpful: 92,
      updated: '1 week ago',
      readTime: '8 min'
    },
    {
      id: 3,
      title: 'Setting Up User Permissions',
      category: 'Administration',
      views: 623,
      helpful: 87,
      updated: '3 days ago',
      readTime: '6 min'
    }
  ];

  const videoTutorials = [
    {
      id: 1,
      title: 'Complete Platform Overview',
      duration: '15:42',
      thumbnail: 'https://via.placeholder.com/320x180',
      views: '2.3k',
      category: 'Getting Started'
    },
    {
      id: 2,
      title: 'Creating and Managing Events',
      duration: '8:30',
      thumbnail: 'https://via.placeholder.com/320x180',
      views: '1.8k',
      category: 'Events'
    },
    {
      id: 3,
      title: 'Advanced Admin Features',
      duration: '12:15',
      thumbnail: 'https://via.placeholder.com/320x180',
      views: '945',
      category: 'Administration'
    }
  ];

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking on the "Forgot Password" link on the login page. Enter your email address and we\'ll send you instructions to reset your password.',
      category: 'Account'
    },
    {
      question: 'Can I import events from another calendar?',
      answer: 'Yes! We support importing events from Google Calendar, Outlook, and ICS files. Go to Events > Import and follow the step-by-step guide.',
      category: 'Events'
    },
    {
      question: 'What are the different user roles?',
      answer: 'We have three main roles: Administrators (full access), Teachers (can create and manage events), and Parents (view-only access to public events).',
      category: 'Permissions'
    },
    {
      question: 'How do I set up recurring events?',
      answer: 'When creating an event, select "Make this a recurring event" and choose your recurrence pattern (daily, weekly, monthly, or custom).',
      category: 'Events'
    }
  ];

  const emergencyContacts = [
    {
      type: 'Critical Issues',
      phone: '+1 (800) 123-4567',
      available: '24/7',
      email: 'critical@k12calendar.com'
    },
    {
      type: 'Technical Support',
      phone: '+1 (800) 123-4568',
      available: '8 AM - 8 PM EST',
      email: 'tech@k12calendar.com'
    },
    {
      type: 'Billing Support',
      phone: '+1 (800) 123-4569',
      available: '9 AM - 5 PM EST',
      email: 'billing@k12calendar.com'
    }
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages([
        ...chatMessages,
        { id: chatMessages.length + 1, sender: 'user', message: newMessage, time: 'Now' },
        { id: chatMessages.length + 2, sender: 'bot', message: 'Thanks for your message. A support agent will respond shortly.', time: 'Now' }
      ]);
      setNewMessage('');
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setIsCreatingTicket(true);
    
    const { data, error } = await createTicket(newTicket);
    
    if (!error) {
      setNewTicket({
        subject: '',
        category: '',
        priority: 'medium',
        description: '',
        attachments: []
      });
      setSelectedTicket(null);
      setActiveTab('tickets');
    } else {
      console.error('Error creating ticket:', error);
    }
    
    setIsCreatingTicket(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 animate-fade-in">
              How Can We Help You?
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Get instant support, browse our knowledge base, or contact our team
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                placeholder="Search for help articles, tutorials, or FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pl-14 rounded-full text-gray-900 bg-white/95 backdrop-blur-sm shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
              />
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Support Metrics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
              <div className="p-6">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${metric.color} text-white mb-4`}>
                  <metric.icon className="h-6 w-6" />
                </div>
                <p className="text-gray-600 text-sm mb-1">{metric.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <span className={`text-sm font-medium ${metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-2xl shadow-lg p-2">
          {['overview', 'tickets', 'chat', 'knowledge', 'tutorials'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Support Categories */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Support Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {supportCategories.map((category) => (
                  <div key={category.id} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 rounded-2xl blur-xl transition-opacity duration-300"
                         style={{ backgroundImage: `linear-gradient(to right, ${category.gradient})` }}></div>
                    <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 p-6 border border-gray-100">
                      <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${category.gradient} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <category.icon className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">{category.count}</span>
                        <button className="text-blue-600 hover:text-purple-600 font-medium flex items-center gap-1 transition-colors">
                          View All
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Emergency Support</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {emergencyContacts.map((contact, index) => (
                  <div key={index} className="bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl shadow-xl text-white p-6 transform hover:scale-105 transition-all duration-300">
                    <h3 className="text-xl font-semibold mb-4">{contact.type}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5" />
                        <span className="font-medium">{contact.phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5" />
                        <span className="text-sm">{contact.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5" />
                        <span className="text-sm">{contact.available}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl hover:border-purple-300 transition-colors duration-300">
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <HelpCircle className="h-5 w-5 text-purple-600" />
                          <span className="font-medium text-gray-900">{faq.question}</span>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-400 transform transition-transform duration-300 ${
                          expandedFAQ === index ? 'rotate-180' : ''
                        }`} />
                      </button>
                      {expandedFAQ === index && (
                        <div className="px-6 pb-4">
                          <p className="text-gray-600 pl-8">{faq.answer}</p>
                          <div className="flex items-center gap-4 mt-4 pl-8">
                            <button className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors">
                              <ThumbsUp className="h-4 w-4" />
                              <span className="text-sm">Helpful</span>
                            </button>
                            <button className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors">
                              <ThumbsDown className="h-4 w-4" />
                              <span className="text-sm">Not Helpful</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Ticket List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-300"
                  >
                    Create New Ticket
                  </button>
                </div>

                {selectedTicket === null ? (
                  <form onSubmit={handleCreateTicket} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                      <input
                        type="text"
                        value={newTicket.subject}
                        onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                        placeholder="Brief description of your issue"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                          value={newTicket.category}
                          onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                          required
                        >
                          <option value="">Select category</option>
                          <option value="technical">Technical Issues</option>
                          <option value="billing">Account & Billing</option>
                          <option value="events">Event Management</option>
                          <option value="training">User Training</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <select
                          value={newTicket.priority}
                          onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={newTicket.description}
                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                        placeholder="Please describe your issue in detail..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
                        <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Drag and drop files here or click to browse</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        disabled={isCreatingTicket}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreatingTicket ? 'Creating...' : 'Submit Ticket'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading tickets...</p>
                      </div>
                    ) : formattedTickets.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No tickets yet</p>
                        <p className="text-sm text-gray-500 mt-2">Create your first support ticket above</p>
                      </div>
                    ) : (
                      formattedTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className="border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-lg cursor-pointer transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                            <p className="text-sm text-gray-600">{ticket.id} • {ticket.category}</p>
                          </div>
                          <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                              {ticket.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Created {ticket.created}</span>
                          <div className="flex items-center gap-4">
                            <span>Updated {ticket.lastUpdate}</span>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              <span>{ticket.messages}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Stats */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Statistics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Tickets</span>
                    <span className="text-2xl font-bold text-gray-900">{getTicketStats().total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Resolved Today</span>
                    <span className="text-xl font-semibold text-green-600">{getTicketStats().resolvedToday}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Avg. Resolution</span>
                    <span className="text-xl font-semibold text-blue-600">{getTicketStats().avgResolutionTime} hrs</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="h-8 w-8" />
                  <h3 className="text-lg font-semibold">Support Achievement</h3>
                </div>
                <p className="text-sm mb-2">You've resolved 89% of tickets within SLA this month!</p>
                <div className="bg-white/20 rounded-full h-3 mt-4">
                  <div className="bg-white rounded-full h-3 w-[89%] transition-all duration-1000"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <h3 className="font-semibold">Support Agent</h3>
                        <p className="text-sm text-blue-100">Online • Typically replies instantly</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                      <ExternalLink className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-3 rounded-2xl ${
                        msg.sender === 'user' 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                          : 'bg-white shadow-md text-gray-800'
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-white border-t border-gray-100">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Options */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <span className="text-gray-700">Request Documentation</span>
                    </div>
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <span className="text-gray-700">Schedule Call</span>
                    </div>
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-purple-600" />
                      <span className="text-gray-700">Email Transcript</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
                <Activity className="h-8 w-8 mb-3" />
                <h3 className="text-lg font-semibold mb-2">Live Support Status</h3>
                <p className="text-sm mb-4">3 agents online • 2 min avg. wait time</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Queue Position</span>
                    <span className="font-semibold">You're next!</span>
                  </div>
                  <div className="bg-white/20 rounded-full h-2">
                    <div className="bg-white rounded-full h-2 w-[95%] transition-all duration-1000"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="space-y-8">
            {/* Knowledge Base Search */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Knowledge Base</h2>
              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="Search articles..."
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {knowledgeArticles.map((article) => (
                  <div key={article.id} className="border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                        {article.category}
                      </span>
                      <span className="text-sm text-gray-500">{article.readTime} read</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-3">{article.title}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-3">
                        <span>{article.views} views</span>
                        <span>{article.helpful}% helpful</span>
                      </div>
                      <span>Updated {article.updated}</span>
                    </div>
                    <button className="mt-4 text-blue-600 hover:text-purple-600 font-medium flex items-center gap-1 transition-colors">
                      Read Article
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Topics */}
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Popular Topics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Getting Started', 'Event Management', 'User Permissions', 'Billing', 'API Documentation', 'Integrations', 'Security', 'Mobile App'].map((topic) => (
                  <button key={topic} className="bg-white rounded-xl px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg">
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tutorials' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Video Tutorials</h2>
                <select className="px-4 py-2 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all">
                  <option>All Categories</option>
                  <option>Getting Started</option>
                  <option>Events</option>
                  <option>Administration</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videoTutorials.map((video) => (
                  <div key={video.id} className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="relative">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors"></div>
                      <button className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Play className="h-8 w-8 text-purple-600 ml-1" />
                        </div>
                      </button>
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                        {video.duration}
                      </span>
                    </div>
                    <div className="p-4 bg-white">
                      <span className="text-xs text-purple-600 font-medium">{video.category}</span>
                      <h3 className="font-semibold text-gray-900 mt-1 mb-2">{video.title}</h3>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{video.views} views</span>
                        <button className="text-blue-600 hover:text-purple-600 font-medium transition-colors">
                          Watch Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Paths */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Recommended Learning Path</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-xl font-bold">1</span>
                  </div>
                  <h4 className="font-semibold mb-2">Beginner</h4>
                  <p className="text-sm text-blue-100">Master the basics of K12 Calendar</p>
                  <p className="text-xs mt-2">5 tutorials • 45 min</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-xl font-bold">2</span>
                  </div>
                  <h4 className="font-semibold mb-2">Intermediate</h4>
                  <p className="text-sm text-blue-100">Advanced features and workflows</p>
                  <p className="text-xs mt-2">8 tutorials • 1.5 hrs</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-xl font-bold">3</span>
                  </div>
                  <h4 className="font-semibold mb-2">Advanced</h4>
                  <p className="text-sm text-blue-100">Admin tools and integrations</p>
                  <p className="text-xs mt-2">6 tutorials • 2 hrs</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportPage;