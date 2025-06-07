import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Mic, MicOff, Camera, Play, Pause, ThumbsUp, ThumbsDown,
  Search, Filter, BookOpen, Video, HelpCircle, MessageSquare,
  FileText, Bug, Lightbulb, Activity, BarChart, Globe,
  Headphones, Monitor, Download, Upload, RefreshCw, Star,
  ChevronRight, ChevronLeft, X, Check, AlertCircle, Info,
  User, Bot, Zap, Code, Terminal, Copy, ExternalLink,
  Volume2, VolumeX, Settings, Share2, Bookmark, Clock,
  TrendingUp, Award, Shield, Cpu, Wifi, WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const AIHelpCenter = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const chatEndRef = useRef(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  // Main states
  const [activeView, setActiveView] = useState('chat'); // chat, knowledge, tickets, analytics
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: t('help.welcome', 'Hello! I\'m your AI assistant. How can I help you today?'),
      timestamp: new Date(),
      suggestions: [
        'How do I create an event?',
        'Reset my password',
        'Contact support',
        'View system status'
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);

  // Knowledge base states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [articles, setArticles] = useState([]);
  const [tutorials, setTutorials] = useState([]);
  const [faqs, setFaqs] = useState([]);

  // Support states
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [systemStatus, setSystemStatus] = useState({
    api: 'operational',
    database: 'operational',
    storage: 'operational',
    auth: 'operational'
  });

  // Analytics states
  const [helpMetrics, setHelpMetrics] = useState({
    totalQueries: 0,
    resolvedIssues: 0,
    avgResponseTime: 0,
    satisfaction: 0
  });
  const [commonIssues, setCommonIssues] = useState([]);
  const [searchAnalytics, setSearchAnalytics] = useState([]);

  // Language options
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' }
  ];

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = false;
      speechRecognitionRef.current.interimResults = true;
      speechRecognitionRef.current.lang = i18n.language;

      speechRecognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setInputMessage(transcript);
      };

      speechRecognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Initialize speech synthesis
    speechSynthesisRef.current = window.speechSynthesis;

    // Load initial data
    loadKnowledgeBase();
    loadAnalytics();
    checkSystemStatus();

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, [i18n.language]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load knowledge base content
  const loadKnowledgeBase = async () => {
    // Simulated data - would be fetched from Supabase in production
    setArticles([
      {
        id: 1,
        title: 'Getting Started with K12 Calendar',
        category: 'basics',
        content: 'Learn how to navigate and use the K12 Calendar system...',
        views: 1234,
        helpful: 89,
        tags: ['beginner', 'tutorial'],
        estimatedTime: '5 min',
        lastUpdated: new Date()
      },
      {
        id: 2,
        title: 'Creating and Managing Events',
        category: 'events',
        content: 'Step-by-step guide to creating events...',
        views: 987,
        helpful: 95,
        tags: ['events', 'management'],
        estimatedTime: '8 min',
        lastUpdated: new Date()
      }
    ]);

    setTutorials([
      {
        id: 1,
        title: 'Video: Quick Start Guide',
        duration: '3:45',
        thumbnail: '/api/placeholder/300/200',
        views: 5678,
        transcript: true,
        category: 'basics'
      },
      {
        id: 2,
        title: 'Video: Advanced Event Features',
        duration: '7:20',
        thumbnail: '/api/placeholder/300/200',
        views: 3456,
        transcript: true,
        category: 'advanced'
      }
    ]);

    setFaqs([
      {
        id: 1,
        question: 'How do I reset my password?',
        answer: 'You can reset your password by clicking on "Forgot Password" on the login page...',
        votes: 45,
        category: 'account'
      },
      {
        id: 2,
        question: 'Can I export events to my calendar?',
        answer: 'Yes! You can export events in multiple formats including iCal and Google Calendar...',
        votes: 38,
        category: 'features'
      }
    ]);
  };

  // Load analytics data
  const loadAnalytics = async () => {
    // Simulated analytics data
    setHelpMetrics({
      totalQueries: 2847,
      resolvedIssues: 2543,
      avgResponseTime: 1.8,
      satisfaction: 94
    });

    setCommonIssues([
      { issue: 'Password reset', count: 234, trend: 'up' },
      { issue: 'Event creation', count: 189, trend: 'stable' },
      { issue: 'Email notifications', count: 156, trend: 'down' },
      { issue: 'Permission errors', count: 98, trend: 'up' }
    ]);

    setSearchAnalytics([
      { query: 'create event', count: 456 },
      { query: 'invite parents', count: 321 },
      { query: 'export calendar', count: 234 },
      { query: 'change language', count: 198 }
    ]);
  };

  // Check system status
  const checkSystemStatus = async () => {
    try {
      // Check various system components
      const { data: healthCheck } = await supabase.from('events').select('id').limit(1);
      
      setSystemStatus({
        api: 'operational',
        database: healthCheck ? 'operational' : 'degraded',
        storage: 'operational',
        auth: 'operational'
      });
    } catch (error) {
      console.error('System status check failed:', error);
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);

      // Speak response if enabled
      if (isSpeaking && speechSynthesisRef.current) {
        const utterance = new SpeechSynthesisUtterance(aiResponse.content);
        utterance.lang = i18n.language;
        speechSynthesisRef.current.speak(utterance);
      }
    }, 1500);
  };

  // Generate AI response (simulated)
  const generateAIResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    let response = {
      id: Date.now(),
      type: 'bot',
      timestamp: new Date()
    };

    if (lowerQuery.includes('event') && lowerQuery.includes('create')) {
      response.content = 'To create an event, follow these steps:\n1. Click the "Create Event" button\n2. Fill in the event details\n3. Set the date and time\n4. Add participants\n5. Click "Save"';
      response.actions = [
        { label: 'Create Event Now', action: 'navigate', path: '/events/create' },
        { label: 'View Tutorial', action: 'showTutorial', id: 1 }
      ];
    } else if (lowerQuery.includes('password')) {
      response.content = 'I can help you reset your password. Would you like me to send a password reset link to your email?';
      response.actions = [
        { label: 'Send Reset Link', action: 'resetPassword' },
        { label: 'Contact Support', action: 'createTicket' }
      ];
    } else if (lowerQuery.includes('status')) {
      response.content = 'Here\'s the current system status:';
      response.systemStatus = systemStatus;
    } else {
      response.content = 'I\'m analyzing your question. Here are some resources that might help:';
      response.suggestions = [
        'View related articles',
        'Watch video tutorial',
        'Contact human support',
        'Run diagnostics'
      ];
    }

    return response;
  };

  // Toggle voice input
  const toggleVoiceInput = () => {
    if (!speechRecognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      speechRecognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Toggle voice output
  const toggleVoiceOutput = () => {
    setIsSpeaking(!isSpeaking);
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
  };

  // Start screen recording
  const startScreenRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedChunks([blob]);
        // Here you would upload the recording
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting screen recording:', error);
    }
  };

  // Stop screen recording
  const stopScreenRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Run diagnostics
  const runDiagnostics = async () => {
    setDiagnosticResults(null);
    
    const results = {
      browser: navigator.userAgent,
      screen: `${window.screen.width}x${window.screen.height}`,
      connection: navigator.connection?.effectiveType || 'unknown',
      memory: navigator.deviceMemory || 'unknown',
      cookies: navigator.cookieEnabled,
      localStorage: !!window.localStorage,
      timestamp: new Date()
    };

    // Check API connectivity
    try {
      const start = Date.now();
      await supabase.from('events').select('id').limit(1);
      results.apiLatency = Date.now() - start;
      results.apiStatus = 'connected';
    } catch (error) {
      results.apiStatus = 'error';
      results.apiError = error.message;
    }

    setDiagnosticResults(results);
  };

  // Create support ticket
  const createSupportTicket = async (data) => {
    try {
      // In production, this would create a ticket in your support system
      console.log('Creating support ticket:', data);
      setShowTicketForm(false);
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        content: 'Your support ticket has been created! Ticket #' + Math.floor(Math.random() * 10000),
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  // Vote on FAQ
  const voteFAQ = async (faqId, vote) => {
    setFaqs(prev => prev.map(faq => 
      faq.id === faqId 
        ? { ...faq, votes: faq.votes + (vote === 'up' ? 1 : -1) }
        : faq
    ));
  };

  // Chat UI
  const renderChat = () => (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-2xl ${message.type === 'user' ? 'order-2' : ''}`}>
                <div className="flex items-start space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-blue-500' : 'bg-purple-500'
                  }`}>
                    {message.type === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className={`rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      
                      {/* System status display */}
                      {message.systemStatus && (
                        <div className="mt-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center">
                            <Activity className="w-4 h-4 mr-2" />
                            System Status
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(message.systemStatus).map(([service, status]) => (
                              <div key={service} className="flex items-center justify-between">
                                <span className="capitalize">{service}</span>
                                <span className={`flex items-center text-sm ${
                                  status === 'operational' ? 'text-green-500' : 'text-yellow-500'
                                }`}>
                                  {status === 'operational' ? <Check className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
                                  {status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Suggestions */}
                      {message.suggestions && (
                        <div className="mt-3 space-y-1">
                          {message.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => setInputMessage(suggestion)}
                              className="block w-full text-left px-3 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-md text-sm transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Actions */}
                      {message.actions && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.actions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleAction(action)}
                              className="px-3 py-1 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 mt-1 block">
                      {format(message.timestamp, 'HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleVoiceInput}
            className={`p-2 rounded-lg transition-colors ${
              isListening ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <button
            onClick={toggleVoiceOutput}
            className={`p-2 rounded-lg transition-colors ${
              isSpeaking ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {isSpeaking ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          
          <button
            onClick={isRecording ? stopScreenRecording : startScreenRecording}
            className={`p-2 rounded-lg transition-colors ${
              isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Camera className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={t('help.askQuestion', 'Ask a question...')}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* Quick actions */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowTicketForm(true)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <Headphones className="w-4 h-4 inline mr-1" />
              Live Agent
            </button>
            <button
              onClick={runDiagnostics}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <Terminal className="w-4 h-4 inline mr-1" />
              Diagnostics
            </button>
          </div>
          
          {/* Language selector */}
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="text-sm bg-transparent border-none focus:outline-none"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  // Knowledge Base UI
  const renderKnowledgeBase = () => (
    <div className="p-6">
      {/* Search and filters */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles, videos, and FAQs..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
            <Filter className="w-5 h-5" />
          </button>
        </div>
        
        {/* Category tabs */}
        <div className="flex space-x-2 overflow-x-auto">
          {['all', 'basics', 'events', 'account', 'advanced', 'troubleshooting'].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Content sections */}
      <div className="space-y-8">
        {/* Articles */}
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Articles
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {articles.map(article => (
              <motion.div
                key={article.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <h4 className="font-medium mb-2">{article.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {article.content}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {article.estimatedTime}
                  </span>
                  <span className="flex items-center">
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    {article.helpful}% helpful
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {article.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Video Tutorials */}
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Video className="w-5 h-5 mr-2" />
            Video Tutorials
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tutorials.map(tutorial => (
              <motion.div
                key={tutorial.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                  <img src={tutorial.thumbnail} alt={tutorial.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-gray-900 ml-1" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {tutorial.duration}
                  </span>
                </div>
                <div className="p-4">
                  <h4 className="font-medium mb-2">{tutorial.title}</h4>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{tutorial.views.toLocaleString()} views</span>
                    {tutorial.transcript && (
                      <span className="flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        Transcript
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <HelpCircle className="w-5 h-5 mr-2" />
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {faqs.map(faq => (
              <motion.div
                key={faq.id}
                whileHover={{ scale: 1.01 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">{faq.question}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{faq.answer}</p>
                  </div>
                  <div className="flex items-center space-x-1 ml-4">
                    <button
                      onClick={() => voteFAQ(faq.id, 'up')}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium">{faq.votes}</span>
                    <button
                      onClick={() => voteFAQ(faq.id, 'down')}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  // Analytics UI
  const renderAnalytics = () => (
    <div className="p-6">
      <h3 className="text-xl font-semibold mb-6">Help Center Analytics</h3>
      
      {/* Metrics overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Queries</span>
            <MessageSquare className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{helpMetrics.totalQueries.toLocaleString()}</p>
          <p className="text-xs text-green-500">+12% from last month</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Resolved Issues</span>
            <Check className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold">{helpMetrics.resolvedIssues.toLocaleString()}</p>
          <p className="text-xs text-gray-500">
            {((helpMetrics.resolvedIssues / helpMetrics.totalQueries) * 100).toFixed(1)}% resolution rate
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Avg Response Time</span>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold">{helpMetrics.avgResponseTime}s</p>
          <p className="text-xs text-green-500">-0.3s from last week</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Satisfaction</span>
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold">{helpMetrics.satisfaction}%</p>
          <p className="text-xs text-gray-500">Based on 1,234 ratings</p>
        </div>
      </div>

      {/* Common issues */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h4 className="font-medium mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Common Issues
          </h4>
          <div className="space-y-3">
            {commonIssues.map((issue, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm">{issue.issue}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{issue.count}</span>
                  {issue.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
                  {issue.trend === 'down' && <TrendingUp className="w-4 h-4 text-green-500 transform rotate-180" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h4 className="font-medium mb-4 flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Top Search Queries
          </h4>
          <div className="space-y-3">
            {searchAnalytics.map((query, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm">{query.query}</span>
                <span className="text-sm font-medium">{query.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Handle action buttons
  const handleAction = (action) => {
    switch (action.action) {
      case 'navigate':
        window.location.href = action.path;
        break;
      case 'showTutorial':
        setActiveView('knowledge');
        break;
      case 'createTicket':
        setShowTicketForm(true);
        break;
      case 'resetPassword':
        // Handle password reset
        break;
      default:
        break;
    }
  };

  // Diagnostic results modal
  const renderDiagnostics = () => (
    <AnimatePresence>
      {diagnosticResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setDiagnosticResults(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Terminal className="w-5 h-5 mr-2" />
              System Diagnostics
            </h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium mb-2">Browser Information</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{diagnosticResults.browser}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium mb-1">Screen</h4>
                  <p className="text-sm">{diagnosticResults.screen}</p>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium mb-1">Connection</h4>
                  <p className="text-sm">{diagnosticResults.connection}</p>
                </div>
              </div>
              
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium mb-2">API Status</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <span className={`text-sm font-medium ${
                    diagnosticResults.apiStatus === 'connected' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {diagnosticResults.apiStatus}
                  </span>
                </div>
                {diagnosticResults.apiLatency && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm">Latency</span>
                    <span className="text-sm">{diagnosticResults.apiLatency}ms</span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => {
                    const data = JSON.stringify(diagnosticResults, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'diagnostics.json';
                    a.click();
                  }}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Download Report
                </button>
                <button
                  onClick={() => setDiagnosticResults(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Support ticket form
  const renderTicketForm = () => (
    <AnimatePresence>
      {showTicketForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowTicketForm(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Create Support Ticket</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              createSupportTicket(Object.fromEntries(formData));
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    required
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    name="priority"
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={4}
                    required
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="attachDiagnostics"
                    id="attachDiagnostics"
                    className="rounded"
                  />
                  <label htmlFor="attachDiagnostics" className="text-sm">
                    Attach system diagnostics
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Submit Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setShowTicketForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-4">
            <div className="mb-8">
              <h2 className="text-2xl font-bold flex items-center">
                <Zap className="w-6 h-6 mr-2 text-purple-500" />
                AI Help Center
              </h2>
              <p className="text-sm text-gray-500 mt-1">Powered by AI</p>
            </div>
            
            <nav className="space-y-2">
              <button
                onClick={() => setActiveView('chat')}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  activeView === 'chat' 
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>AI Assistant</span>
              </button>
              
              <button
                onClick={() => setActiveView('knowledge')}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  activeView === 'knowledge' 
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span>Knowledge Base</span>
              </button>
              
              <button
                onClick={() => setActiveView('tickets')}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  activeView === 'tickets' 
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Headphones className="w-5 h-5" />
                <span>Support Tickets</span>
              </button>
              
              <button
                onClick={() => setActiveView('analytics')}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  activeView === 'analytics' 
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <BarChart className="w-5 h-5" />
                <span>Analytics</span>
              </button>
            </nav>
            
            {/* System status */}
            <div className="mt-8 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Activity className="w-4 h-4 mr-1" />
                System Status
              </h3>
              <div className="space-y-1">
                {Object.entries(systemStatus).map(([service, status]) => (
                  <div key={service} className="flex items-center justify-between text-xs">
                    <span className="capitalize">{service}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      status === 'operational' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 bg-white dark:bg-gray-800 overflow-hidden">
            {activeView === 'chat' && renderChat()}
            {activeView === 'knowledge' && renderKnowledgeBase()}
            {activeView === 'tickets' && (
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4">Support Tickets</h3>
                <p className="text-gray-500">Your support tickets will appear here.</p>
              </div>
            )}
            {activeView === 'analytics' && renderAnalytics()}
          </div>
        </div>
      </div>

      {/* Modals */}
      {renderDiagnostics()}
      {renderTicketForm()}
    </div>
  );
};

export default AIHelpCenter;