import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  DocumentTextIcon,
  SparklesIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  PlusIcon,
  MinusIcon,
  TagIcon,
  TicketIcon,
  MegaphoneIcon,
  AcademicCapIcon,
  TrophyIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  BeakerIcon,
  GlobeAltIcon,
  ChartBarIcon,
  LightBulbIcon,
  FireIcon,
  StarIcon,
  ArrowPathIcon,
  BellIcon,
  LinkIcon,
  QrCodeIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  ComputerDesktopIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import Header from '../../components/layout/Header';
import useAuthStore from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import toast from 'react-hot-toast';

// Event templates
const EVENT_TEMPLATES = [
  {
    id: 'science-fair',
    name: 'Science Fair',
    icon: BeakerIcon,
    category: 'academic',
    description: 'Annual student science project exhibition',
    duration: 3,
    capacity: 200,
    price: 0,
    features: ['Judging', 'Awards', 'Public viewing']
  },
  {
    id: 'sports-game',
    name: 'Sports Game',
    icon: TrophyIcon,
    category: 'sports',
    description: 'Competitive athletic event',
    duration: 2,
    capacity: 500,
    price: 5,
    features: ['Concessions', 'Live scoring', 'Team merchandise']
  },
  {
    id: 'school-play',
    name: 'School Play',
    icon: PaintBrushIcon,
    category: 'arts',
    description: 'Student theatrical performance',
    duration: 2.5,
    capacity: 300,
    price: 10,
    features: ['Reserved seating', 'Intermission', 'Program']
  },
  {
    id: 'pta-meeting',
    name: 'PTA Meeting',
    icon: UsersIcon,
    category: 'meeting',
    description: 'Parent-Teacher Association meeting',
    duration: 1.5,
    capacity: 100,
    price: 0,
    features: ['Agenda', 'Voting', 'Refreshments']
  },
  {
    id: 'fundraiser',
    name: 'Fundraiser',
    icon: CurrencyDollarIcon,
    category: 'fundraiser',
    description: 'School fundraising event',
    duration: 4,
    capacity: 300,
    price: 25,
    features: ['Auction', 'Dinner', 'Entertainment']
  }
];

// Event categories
const EVENT_CATEGORIES = [
  { id: 'academic', name: 'Academic', icon: AcademicCapIcon, color: 'blue' },
  { id: 'sports', name: 'Sports', icon: TrophyIcon, color: 'green' },
  { id: 'arts', name: 'Arts & Culture', icon: PaintBrushIcon, color: 'purple' },
  { id: 'music', name: 'Music', icon: MusicalNoteIcon, color: 'yellow' },
  { id: 'science', name: 'Science', icon: BeakerIcon, color: 'teal' },
  { id: 'social', name: 'Social', icon: UsersIcon, color: 'pink' },
  { id: 'fundraiser', name: 'Fundraising', icon: CurrencyDollarIcon, color: 'emerald' },
  { id: 'meeting', name: 'Meeting', icon: UsersIcon, color: 'gray' },
  { id: 'other', name: 'Other', icon: TagIcon, color: 'indigo' }
];

// Wizard steps
const WIZARD_STEPS = [
  { id: 'template', label: 'Choose Template', icon: DocumentDuplicateIcon },
  { id: 'basics', label: 'Basic Details', icon: DocumentTextIcon },
  { id: 'datetime', label: 'Date & Time', icon: CalendarDaysIcon },
  { id: 'location', label: 'Location', icon: MapPinIcon },
  { id: 'tickets', label: 'Tickets & Pricing', icon: TicketIcon },
  { id: 'media', label: 'Media & Content', icon: PhotoIcon },
  { id: 'settings', label: 'Advanced Settings', icon: AdjustmentsHorizontalIcon },
  { id: 'preview', label: 'Preview & Publish', icon: EyeIcon }
];

export default function SophisticatedEventCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuthStore();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    // Template
    template: null,
    
    // Basic Details
    title: '',
    description: '',
    category: 'other',
    tags: [],
    
    // Date & Time
    startDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '18:00',
    endDate: format(new Date(), 'yyyy-MM-dd'),
    endTime: '20:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isRecurring: false,
    recurringPattern: 'weekly',
    recurringEnd: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    
    // Location
    locationType: 'in-person',
    venue: '',
    address: '',
    virtualUrl: '',
    virtualPlatform: 'zoom',
    hybridDetails: '',
    
    // Tickets & Pricing
    requiresRSVP: true,
    requiresPayment: false,
    price: 0,
    earlyBirdPrice: 0,
    earlyBirdDeadline: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    groupDiscounts: [],
    capacity: 100,
    waitlistEnabled: true,
    refundPolicy: 'no-refunds',
    
    // Media
    coverImage: null,
    gallery: [],
    videoUrl: '',
    documents: [],
    
    // Advanced Settings
    visibility: 'public',
    ageRestrictions: 'all-ages',
    registrationDeadline: '',
    customFields: [],
    emailReminders: true,
    allowComments: true,
    allowPhotos: true,
    requireApproval: false,
    
    // Collaborators
    coHosts: [],
    moderators: []
  });
  
  // File upload refs
  const coverImageRef = useRef(null);
  const galleryRef = useRef(null);
  const documentsRef = useRef(null);
  
  // AI Suggestions state
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState({});
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Live preview state
  const [showPreview, setShowPreview] = useState(false);

  // Initialize from URL params
  useEffect(() => {
    const template = searchParams.get('template');
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    
    if (template) {
      const selectedTemplate = EVENT_TEMPLATES.find(t => t.id === template);
      if (selectedTemplate) {
        applyTemplate(selectedTemplate);
      }
    }
    
    if (date) {
      setFormData(prev => ({ ...prev, startDate: date, endDate: date }));
    }
    
    if (time) {
      setFormData(prev => ({ ...prev, startTime: `${time}:00` }));
    }
  }, [searchParams]);

  // Apply template
  const applyTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      template: template.id,
      title: template.name,
      description: template.description,
      category: template.category,
      capacity: template.capacity,
      price: template.price,
      requiresPayment: template.price > 0
    }));
    
    // Generate AI suggestions based on template
    generateAISuggestions(template);
  };

  // Generate AI suggestions
  const generateAISuggestions = (template = null) => {
    const suggestions = {
      title: [
        `Annual ${formData.title || 'School Event'} 2024`,
        `Spring ${formData.title || 'Event'} Spectacular`,
        `${profile?.school?.name || 'School'} ${formData.title || 'Event'}`
      ],
      description: [
        'Join us for an exciting event that brings our school community together!',
        'Don\'t miss this opportunity to participate in our school\'s premier event.',
        'An engaging experience for students, parents, and teachers alike.'
      ],
      bestTimes: [
        { day: 'Thursday', time: '6:00 PM', reason: 'Highest parent attendance' },
        { day: 'Saturday', time: '10:00 AM', reason: 'Best for families' },
        { day: 'Friday', time: '7:00 PM', reason: 'Popular for performances' }
      ],
      pricing: {
        suggested: template?.price || 10,
        reason: 'Based on similar events in your area'
      },
      capacity: {
        suggested: template?.capacity || 150,
        reason: 'Typical attendance for this type of event'
      }
    };
    
    setAiSuggestions(suggestions);
  };

  // Validate current step
  const validateStep = () => {
    const newErrors = {};
    const step = WIZARD_STEPS[currentStep].id;
    
    switch (step) {
      case 'basics':
        if (!formData.title) newErrors.title = 'Title is required';
        if (!formData.description) newErrors.description = 'Description is required';
        if (!formData.category) newErrors.category = 'Category is required';
        break;
        
      case 'datetime':
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.startTime) newErrors.startTime = 'Start time is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';
        if (!formData.endTime) newErrors.endTime = 'End time is required';
        
        const start = new Date(`${formData.startDate}T${formData.startTime}`);
        const end = new Date(`${formData.endDate}T${formData.endTime}`);
        
        if (end <= start) {
          newErrors.endTime = 'End time must be after start time';
        }
        break;
        
      case 'location':
        if (formData.locationType === 'in-person') {
          if (!formData.venue) newErrors.venue = 'Venue is required';
          if (!formData.address) newErrors.address = 'Address is required';
        } else if (formData.locationType === 'virtual') {
          if (!formData.virtualUrl) newErrors.virtualUrl = 'Virtual meeting URL is required';
        }
        break;
        
      case 'tickets':
        if (formData.requiresPayment && formData.price <= 0) {
          newErrors.price = 'Price must be greater than 0';
        }
        if (formData.capacity <= 0) {
          newErrors.capacity = 'Capacity must be greater than 0';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      setCompletedSteps([...completedSteps, WIZARD_STEPS[currentStep].id]);
      if (currentStep < WIZARD_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle step click
  const handleStepClick = (index) => {
    if (index <= currentStep || completedSteps.includes(WIZARD_STEPS[index].id)) {
      setCurrentStep(index);
    }
  };

  // Handle file upload
  const handleFileUpload = async (files, type) => {
    const uploadedFiles = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${type}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('event-media')
        .upload(filePath, file);
      
      if (error) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('event-media')
        .getPublicUrl(filePath);
      
      uploadedFiles.push({
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size
      });
    }
    
    return uploadedFiles;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare event data
      const eventData = {
        school_id: profile?.school_id,
        title: formData.title,
        description: formData.description,
        start_time: new Date(`${formData.startDate}T${formData.startTime}`).toISOString(),
        end_time: new Date(`${formData.endDate}T${formData.endTime}`).toISOString(),
        location: formData.locationType === 'in-person' ? formData.address : formData.virtualUrl,
        venue: formData.venue,
        capacity: formData.capacity,
        event_type: formData.category,
        visibility: formData.visibility,
        requires_rsvp: formData.requiresRSVP,
        requires_payment: formData.requiresPayment,
        price: formData.price,
        image_url: formData.coverImage?.url,
        created_by: user.id,
        status: 'active',
        metadata: {
          locationType: formData.locationType,
          virtualPlatform: formData.virtualPlatform,
          tags: formData.tags,
          gallery: formData.gallery,
          documents: formData.documents,
          videoUrl: formData.videoUrl,
          earlyBirdPrice: formData.earlyBirdPrice,
          earlyBirdDeadline: formData.earlyBirdDeadline,
          groupDiscounts: formData.groupDiscounts,
          waitlistEnabled: formData.waitlistEnabled,
          refundPolicy: formData.refundPolicy,
          ageRestrictions: formData.ageRestrictions,
          registrationDeadline: formData.registrationDeadline,
          customFields: formData.customFields,
          emailReminders: formData.emailReminders,
          allowComments: formData.allowComments,
          allowPhotos: formData.allowPhotos,
          requireApproval: formData.requireApproval,
          coHosts: formData.coHosts,
          moderators: formData.moderators
        }
      };
      
      // Create event
      const { data: event, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Handle recurring events
      if (formData.isRecurring) {
        await createRecurringEvents(event, eventData);
      }
      
      toast.success('Event created successfully!');
      navigate(`/events/${event.id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create recurring events
  const createRecurringEvents = async (originalEvent, eventData) => {
    const recurringEvents = [];
    let currentDate = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDate = new Date(formData.recurringEnd);
    
    while (currentDate <= endDate) {
      // Calculate next date based on pattern
      switch (formData.recurringPattern) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'biweekly':
          currentDate = addWeeks(currentDate, 2);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
      }
      
      if (currentDate <= endDate) {
        const duration = new Date(eventData.end_time) - new Date(eventData.start_time);
        
        recurringEvents.push({
          ...eventData,
          title: `${eventData.title} - ${format(currentDate, 'MMM d')}`,
          start_time: currentDate.toISOString(),
          end_time: new Date(currentDate.getTime() + duration).toISOString(),
          parent_event_id: originalEvent.id
        });
      }
    }
    
    if (recurringEvents.length > 0) {
      const { error } = await supabase
        .from('events')
        .insert(recurringEvents);
      
      if (error) {
        console.error('Error creating recurring events:', error);
        toast.error('Some recurring events could not be created');
      }
    }
  };

  // Render step content
  const renderStepContent = () => {
    const step = WIZARD_STEPS[currentStep].id;
    
    switch (step) {
      case 'template':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose a Template</h3>
              <p className="text-gray-600">Start with a template or create from scratch</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center group"
              >
                <PlusIcon className="h-12 w-12 text-gray-400 group-hover:text-indigo-600 mx-auto mb-3" />
                <h4 className="font-medium text-gray-900">Start from Scratch</h4>
                <p className="text-sm text-gray-600 mt-1">Create a custom event</p>
              </button>
              
              {EVENT_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    applyTemplate(template);
                    setCurrentStep(1);
                  }}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all text-left group"
                >
                  <template.icon className="h-12 w-12 text-indigo-600 mb-3" />
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  
                  <div className="mt-4 space-y-1">
                    {template.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckIcon className="h-3 w-3 text-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-3 w-3" />
                      {template.duration}h
                    </span>
                    <span className="flex items-center gap-1">
                      <UsersIcon className="h-3 w-3" />
                      {template.capacity}
                    </span>
                    <span className="flex items-center gap-1">
                      <CurrencyDollarIcon className="h-3 w-3" />
                      {template.price === 0 ? 'Free' : `$${template.price}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
        
      case 'basics':
        return (
          <div className="space-y-6">
            {/* AI Suggestions Panel */}
            {showAISuggestions && aiSuggestions.title && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5 text-purple-600" />
                    <h4 className="font-medium text-gray-900">AI Suggestions</h4>
                  </div>
                  <button
                    onClick={() => setShowAISuggestions(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Title suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.title.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setFormData({ ...formData, title: suggestion })}
                          className="px-3 py-1 bg-white rounded-lg text-sm text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.title ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Enter a catchy title for your event"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <div className="relative">
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.description ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Describe your event in detail..."
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {formData.description.length} / 500
                </div>
              </div>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
            
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {EVENT_CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setFormData({ ...formData, category: category.id })}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.category === category.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <category.icon className={`h-6 w-6 mx-auto mb-1 ${
                      formData.category === category.id ? 'text-indigo-600' : 'text-gray-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      formData.category === category.id ? 'text-indigo-900' : 'text-gray-700'
                    }`}>
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>
            
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add tags..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      e.preventDefault();
                      setFormData({
                        ...formData,
                        tags: [...formData.tags, e.target.value]
                      });
                      e.target.value = '';
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => setFormData({
                          ...formData,
                          tags: formData.tags.filter((_, i) => i !== index)
                        })}
                        className="hover:text-indigo-900"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
        
      case 'datetime':
        return (
          <div className="space-y-6">
            {/* AI Time Suggestions */}
            {showAISuggestions && aiSuggestions.bestTimes && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <LightBulbIcon className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium text-gray-900">Best Times for Your Event</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {aiSuggestions.bestTimes.map((time, index) => (
                    <button
                      key={index}
                      className="p-3 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
                    >
                      <div className="font-medium text-gray-900">{time.day}, {time.time}</div>
                      <div className="text-sm text-gray-600 mt-1">{time.reason}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.startDate ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                )}
              </div>
              
              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.startTime ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
                )}
              </div>
              
              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.endDate ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                )}
              </div>
              
              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.endTime ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
                )}
              </div>
            </div>
            
            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value={formData.timezone}>{formData.timezone}</option>
              </select>
            </div>
            
            {/* Recurring Event */}
            <div className="bg-gray-50 rounded-xl p-6">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="font-medium text-gray-900">This is a recurring event</span>
              </label>
              
              {formData.isRecurring && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Repeat Pattern
                      </label>
                      <select
                        value={formData.recurringPattern}
                        onChange={(e) => setFormData({ ...formData, recurringPattern: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Every 2 weeks</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Repeat
                      </label>
                      <input
                        type="date"
                        value={formData.recurringEnd}
                        onChange={(e) => setFormData({ ...formData, recurringEnd: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <p className="text-sm text-indigo-700">
                      <InformationCircleIcon className="inline h-4 w-4 mr-1" />
                      This will create multiple events based on your pattern
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'location':
        return (
          <div className="space-y-6">
            {/* Location Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Event Type *
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setFormData({ ...formData, locationType: 'in-person' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.locationType === 'in-person'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <BuildingOffice2Icon className={`h-8 w-8 mx-auto mb-2 ${
                    formData.locationType === 'in-person' ? 'text-indigo-600' : 'text-gray-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    formData.locationType === 'in-person' ? 'text-indigo-900' : 'text-gray-700'
                  }`}>
                    In-Person
                  </span>
                </button>
                
                <button
                  onClick={() => setFormData({ ...formData, locationType: 'virtual' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.locationType === 'virtual'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ComputerDesktopIcon className={`h-8 w-8 mx-auto mb-2 ${
                    formData.locationType === 'virtual' ? 'text-indigo-600' : 'text-gray-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    formData.locationType === 'virtual' ? 'text-indigo-900' : 'text-gray-700'
                  }`}>
                    Virtual
                  </span>
                </button>
                
                <button
                  onClick={() => setFormData({ ...formData, locationType: 'hybrid' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.locationType === 'hybrid'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <GlobeAltIcon className={`h-8 w-8 mx-auto mb-2 ${
                    formData.locationType === 'hybrid' ? 'text-indigo-600' : 'text-gray-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    formData.locationType === 'hybrid' ? 'text-indigo-900' : 'text-gray-700'
                  }`}>
                    Hybrid
                  </span>
                </button>
              </div>
            </div>
            
            {/* In-Person Details */}
            {(formData.locationType === 'in-person' || formData.locationType === 'hybrid') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Name *
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.venue ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="e.g., School Auditorium, Gymnasium"
                  />
                  {errors.venue && (
                    <p className="mt-1 text-sm text-red-600">{errors.venue}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Address *
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.address ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Enter the complete address"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Virtual Details */}
            {(formData.locationType === 'virtual' || formData.locationType === 'hybrid') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Virtual Platform
                  </label>
                  <select
                    value={formData.virtualPlatform}
                    onChange={(e) => setFormData({ ...formData, virtualPlatform: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="zoom">Zoom</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="meet">Google Meet</option>
                    <option value="youtube">YouTube Live</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting URL *
                  </label>
                  <input
                    type="url"
                    value={formData.virtualUrl}
                    onChange={(e) => setFormData({ ...formData, virtualUrl: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.virtualUrl ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="https://..."
                  />
                  {errors.virtualUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.virtualUrl}</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Hybrid Details */}
            {formData.locationType === 'hybrid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hybrid Event Details
                </label>
                <textarea
                  value={formData.hybridDetails}
                  onChange={(e) => setFormData({ ...formData, hybridDetails: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Explain how attendees can participate both in-person and virtually..."
                />
              </div>
            )}
          </div>
        );
        
      case 'tickets':
        return (
          <div className="space-y-6">
            {/* AI Pricing Suggestions */}
            {showAISuggestions && aiSuggestions.pricing && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <LightBulbIcon className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium text-gray-900">Pricing Recommendation</h4>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      ${aiSuggestions.pricing.suggested}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">{aiSuggestions.pricing.reason}</p>
                  </div>
                  <button
                    onClick={() => setFormData({ 
                      ...formData, 
                      price: aiSuggestions.pricing.suggested,
                      requiresPayment: true
                    })}
                    className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
            
            {/* RSVP Settings */}
            <div className="bg-gray-50 rounded-xl p-6">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.requiresRSVP}
                  onChange={(e) => setFormData({ ...formData, requiresRSVP: e.target.checked })}
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="font-medium text-gray-900">Require RSVP</span>
              </label>
              <p className="text-sm text-gray-600 mt-2 ml-8">
                Attendees must register to attend this event
              </p>
            </div>
            
            {/* Payment Settings */}
            <div className="bg-gray-50 rounded-xl p-6">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.requiresPayment}
                  onChange={(e) => setFormData({ ...formData, requiresPayment: e.target.checked })}
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="font-medium text-gray-900">This is a paid event</span>
              </label>
              
              {formData.requiresPayment && (
                <div className="mt-4 space-y-4">
                  {/* Regular Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ticket Price *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className={`w-full pl-8 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                          errors.price ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                    )}
                  </div>
                  
                  {/* Early Bird Pricing */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Early Bird Pricing</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Early Bird Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <input
                            type="number"
                            value={formData.earlyBirdPrice}
                            onChange={(e) => setFormData({ ...formData, earlyBirdPrice: parseFloat(e.target.value) || 0 })}
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Valid Until
                        </label>
                        <input
                          type="date"
                          value={formData.earlyBirdDeadline}
                          onChange={(e) => setFormData({ ...formData, earlyBirdDeadline: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Refund Policy */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Policy
                    </label>
                    <select
                      value={formData.refundPolicy}
                      onChange={(e) => setFormData({ ...formData, refundPolicy: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="no-refunds">No refunds</option>
                      <option value="7-days">Refundable up to 7 days before</option>
                      <option value="24-hours">Refundable up to 24 hours before</option>
                      <option value="anytime">Refundable anytime</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            {/* Capacity Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Capacity *
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  className={`w-32 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.capacity ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="100"
                />
                <span className="text-gray-600">attendees</span>
              </div>
              {errors.capacity && (
                <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
              )}
              
              {/* Waitlist */}
              <label className="flex items-center gap-3 mt-3">
                <input
                  type="checkbox"
                  checked={formData.waitlistEnabled}
                  onChange={(e) => setFormData({ ...formData, waitlistEnabled: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Enable waitlist when full</span>
              </label>
            </div>
          </div>
        );
        
      case 'media':
        return (
          <div className="space-y-6">
            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors">
                {formData.coverImage ? (
                  <div className="relative inline-block">
                    <img
                      src={formData.coverImage.url}
                      alt="Cover"
                      className="h-48 w-auto rounded-lg"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, coverImage: null })}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                    <input
                      ref={coverImageRef}
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const uploaded = await handleFileUpload([file], 'cover');
                          if (uploaded.length > 0) {
                            setFormData({ ...formData, coverImage: uploaded[0] });
                          }
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      onClick={() => coverImageRef.current?.click()}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Choose Image
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Gallery */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo Gallery
              </label>
              <div className="grid grid-cols-4 gap-4">
                {formData.gallery.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setFormData({
                        ...formData,
                        gallery: formData.gallery.filter((_, i) => i !== index)
                      })}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={() => galleryRef.current?.click()}
                  className="h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 transition-colors flex items-center justify-center"
                >
                  <PlusIcon className="h-6 w-6 text-gray-400" />
                </button>
                
                <input
                  ref={galleryRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) {
                      const uploaded = await handleFileUpload(files, 'gallery');
                      setFormData({
                        ...formData,
                        gallery: [...formData.gallery, ...uploaded]
                      });
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>
            
            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Video
              </label>
              <div className="flex items-center gap-4">
                <VideoCameraIcon className="h-5 w-5 text-gray-400" />
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="YouTube or Vimeo URL"
                />
              </div>
            </div>
            
            {/* Documents */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documents & Resources
              </label>
              
              {formData.documents.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                        <span className="text-sm text-gray-700">{doc.name}</span>
                      </div>
                      <button
                        onClick={() => setFormData({
                          ...formData,
                          documents: formData.documents.filter((_, i) => i !== index)
                        })}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => documentsRef.current?.click()}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 transition-colors flex items-center justify-center gap-2"
              >
                <CloudArrowUpIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">Upload Documents</span>
              </button>
              
              <input
                ref={documentsRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files);
                  if (files.length > 0) {
                    const uploaded = await handleFileUpload(files, 'documents');
                    setFormData({
                      ...formData,
                      documents: [...formData.documents, ...uploaded]
                    });
                  }
                }}
                className="hidden"
              />
            </div>
          </div>
        );
        
      case 'settings':
        return (
          <div className="space-y-6">
            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Event Visibility
              </label>
              <div className="space-y-2">
                {[
                  { value: 'public', label: 'Public', description: 'Anyone can view and RSVP' },
                  { value: 'school', label: 'School Only', description: 'Only school members can view' },
                  { value: 'private', label: 'Private', description: 'Only invited people can view' }
                ].map(option => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.visibility === option.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={formData.visibility === option.value}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Age Restrictions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Restrictions
              </label>
              <select
                value={formData.ageRestrictions}
                onChange={(e) => setFormData({ ...formData, ageRestrictions: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all-ages">All Ages</option>
                <option value="k-5">Elementary (K-5)</option>
                <option value="6-8">Middle School (6-8)</option>
                <option value="9-12">High School (9-12)</option>
                <option value="18+">Adults Only (18+)</option>
              </select>
            </div>
            
            {/* Registration Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Deadline
              </label>
              <input
                type="date"
                value={formData.registrationDeadline}
                onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-600 mt-1">
                Leave blank for no deadline
              </p>
            </div>
            
            {/* Advanced Options */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Advanced Options</h4>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.emailReminders}
                  onChange={(e) => setFormData({ ...formData, emailReminders: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Send email reminders to attendees</span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.allowComments}
                  onChange={(e) => setFormData({ ...formData, allowComments: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Allow comments on event page</span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.allowPhotos}
                  onChange={(e) => setFormData({ ...formData, allowPhotos: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Allow attendees to share photos</span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.requireApproval}
                  onChange={(e) => setFormData({ ...formData, requireApproval: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Require approval for registrations</span>
              </label>
            </div>
            
            {/* Custom Fields */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Custom Registration Fields</h4>
                <button
                  onClick={() => setFormData({
                    ...formData,
                    customFields: [...formData.customFields, { label: '', type: 'text', required: false }]
                  })}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Add Field
                </button>
              </div>
              
              {formData.customFields.length > 0 && (
                <div className="space-y-3">
                  {formData.customFields.map((field, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => {
                          const newFields = [...formData.customFields];
                          newFields[index].label = e.target.value;
                          setFormData({ ...formData, customFields: newFields });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Field label"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => {
                          const newFields = [...formData.customFields];
                          newFields[index].type = e.target.value;
                          setFormData({ ...formData, customFields: newFields });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="select">Dropdown</option>
                      </select>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => {
                            const newFields = [...formData.customFields];
                            newFields[index].required = e.target.checked;
                            setFormData({ ...formData, customFields: newFields });
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">Required</span>
                      </label>
                      <button
                        onClick={() => setFormData({
                          ...formData,
                          customFields: formData.customFields.filter((_, i) => i !== index)
                        })}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
        
      case 'preview':
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Review your event</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please review all details before publishing. You can edit the event after publishing.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Event Preview Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {formData.coverImage && (
                <img
                  src={formData.coverImage.url}
                  alt="Event cover"
                  className="w-full h-64 object-cover"
                />
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{formData.title}</h3>
                    <p className="text-gray-600 mt-2">{formData.description}</p>
                  </div>
                  {formData.requiresPayment && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">${formData.price}</div>
                      <div className="text-sm text-gray-500">per ticket</div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center gap-3 text-gray-600">
                    <CalendarDaysIcon className="h-5 w-5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {format(new Date(`${formData.startDate}T${formData.startTime}`), 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div className="text-sm">
                        {format(new Date(`${formData.startDate}T${formData.startTime}`), 'h:mm a')} - 
                        {format(new Date(`${formData.endDate}T${formData.endTime}`), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPinIcon className="h-5 w-5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {formData.locationType === 'in-person' ? formData.venue : 'Virtual Event'}
                      </div>
                      <div className="text-sm">
                        {formData.locationType === 'in-person' ? formData.address : formData.virtualPlatform}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <UsersIcon className="h-5 w-5" />
                    <div>
                      <div className="font-medium text-gray-900">{formData.capacity} spots</div>
                      <div className="text-sm">
                        {formData.waitlistEnabled ? 'Waitlist available' : 'No waitlist'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <TagIcon className="h-5 w-5" />
                    <div>
                      <div className="font-medium text-gray-900 capitalize">{formData.category}</div>
                      <div className="text-sm">{formData.visibility} event</div>
                    </div>
                  </div>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Publishing Options */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-medium text-gray-900 mb-4">Publishing Options</h4>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Publish immediately</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Send announcement to all school members</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Feature on school homepage</span>
                </label>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Header />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Wizard Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <EyeIcon className="h-4 w-4" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200"></div>
            <div 
              className="absolute top-5 left-0 h-0.5 bg-indigo-600 transition-all duration-500"
              style={{ width: `${(currentStep / (WIZARD_STEPS.length - 1)) * 100}%` }}
            ></div>
            
            <div className="relative flex justify-between">
              {WIZARD_STEPS.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = completedSteps.includes(step.id);
                const isClickable = index <= currentStep || isCompleted;
                
                return (
                  <button
                    key={step.id}
                    onClick={() => isClickable && handleStepClick(index)}
                    disabled={!isClickable}
                    className={`flex flex-col items-center ${
                      isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-200'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? (
                        <CheckCircleSolidIcon className="h-6 w-6" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 ${
                      isActive ? 'text-indigo-600 font-medium' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {renderStepContent()}
              
              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    currentStep === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Previous
                </button>
                
                {currentStep < WIZARD_STEPS.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Next
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        Publish Event
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Live Preview Sidebar */}
          {showPreview && (
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {formData.coverImage && (
                    <img
                      src={formData.coverImage.url}
                      alt="Preview"
                      className="w-full h-32 object-cover"
                    />
                  )}
                  
                  <div className="p-4">
                    <h4 className="font-bold text-gray-900 mb-2">
                      {formData.title || 'Event Title'}
                    </h4>
                    
                    {formData.startDate && formData.startTime && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <CalendarDaysIcon className="h-4 w-4" />
                        <span>
                          {format(new Date(`${formData.startDate}T${formData.startTime}`), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    )}
                    
                    {(formData.venue || formData.virtualUrl) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPinIcon className="h-4 w-4" />
                        <span className="truncate">
                          {formData.locationType === 'in-person' ? formData.venue : 'Virtual Event'}
                        </span>
                      </div>
                    )}
                    
                    {formData.capacity > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <UsersIcon className="h-4 w-4" />
                        <span>{formData.capacity} capacity</span>
                      </div>
                    )}
                    
                    {formData.requiresPayment && formData.price > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Price</span>
                          <span className="text-lg font-bold text-gray-900">
                            ${formData.price}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="mt-6 bg-indigo-50 rounded-xl p-4">
                  <h4 className="font-medium text-indigo-900 mb-3">Event Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-700">Type</span>
                      <span className="font-medium text-indigo-900 capitalize">
                        {formData.locationType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-700">Category</span>
                      <span className="font-medium text-indigo-900 capitalize">
                        {formData.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-700">Visibility</span>
                      <span className="font-medium text-indigo-900 capitalize">
                        {formData.visibility}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-700">RSVP</span>
                      <span className="font-medium text-indigo-900">
                        {formData.requiresRSVP ? 'Required' : 'Not Required'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}