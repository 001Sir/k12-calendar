import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CalendarDaysIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ShareIcon,
  BookmarkIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  QrCodeIcon,
  LinkIcon,
  PhotoIcon,
  PlayIcon,
  EyeIcon,
  PlusIcon,
  MinusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  StarIcon,
  ArrowLeftIcon,
  BellIcon,
  UserCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  DocumentDuplicateIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import Header from '../../components/layout/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EventCard from '../../components/common/EventCard';
import { useSavedEvents } from '../../hooks/useSavedEvents';
import useAuthStore from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { format, isPast, isToday, differenceInDays, differenceInHours } from 'date-fns';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

export default function AdvancedEventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { isEventSaved, toggleSaveEvent } = useSavedEvents();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [waitlistPosition, setWaitlistPosition] = useState(null);
  const [submittingRSVP, setSubmittingRSVP] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [eventAnalytics, setEventAnalytics] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const tabs = [
    { id: 'details', label: 'Details', icon: CalendarDaysIcon },
    { id: 'discussion', label: 'Discussion', icon: ChatBubbleLeftIcon },
    { id: 'media', label: 'Media', icon: PhotoIcon },
    { id: 'attendees', label: 'Attendees', icon: UsersIcon }
  ];

  useEffect(() => {
    if (id) {
      fetchEventDetails();
      trackEventView();
    }
  }, [id]);

  useEffect(() => {
    if (event) {
      fetchComments();
      fetchRelatedEvents();
      fetchRSVPStatus();
      generateQRCode();
      if (profile?.role === 'school_admin' || profile?.role === 'teacher') {
        fetchEventAnalytics();
      }
    }
  }, [event, user]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          school:schools(*),
          event_attendees(count),
          event_checkins(count),
          revenue_tracking(amount, transaction_type),
          event_analytics(views_count, rsvp_count)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Process event data
      const processedEvent = {
        ...data,
        attendee_count: data.event_attendees?.[0]?.count || 0,
        checkin_count: data.event_checkins?.[0]?.count || 0,
        total_revenue: data.revenue_tracking?.reduce((sum, r) => 
          r.transaction_type === 'ticket_sale' ? sum + r.amount : sum, 0) || 0,
        total_views: data.event_analytics?.reduce((sum, a) => sum + (a.views_count || 0), 0) || 0,
        images: data.image_url ? [data.image_url] : []
      };

      setEvent(processedEvent);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const trackEventView = async () => {
    try {
      await supabase.rpc('track_event_view', { 
        p_event_id: id, 
        p_unique: true 
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('event_comments')
        .select(`
          *,
          user:profiles(full_name, avatar_url),
          comment_likes(count)
        `)
        .eq('event_id', id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchRelatedEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          school:schools(name),
          event_attendees(count)
        `)
        .eq('school_id', event.school_id)
        .eq('status', 'active')
        .neq('id', id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(3);

      if (error) throw error;
      setRelatedEvents(data || []);
    } catch (error) {
      console.error('Error fetching related events:', error);
    }
  };

  const fetchRSVPStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setRsvpStatus(data);

      // Check waitlist status
      const { data: waitlistData } = await supabase
        .from('event_waitlist')
        .select('position')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .single();

      if (waitlistData) {
        setWaitlistPosition(waitlistData.position);
      }
    } catch (error) {
      console.error('Error fetching RSVP status:', error);
    }
  };

  const fetchEventAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_event_conversion_rate', { p_event_id: id });

      if (error) throw error;
      setEventAnalytics(data?.[0]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const generateQRCode = async () => {
    try {
      const qrData = `${window.location.origin}/events/${id}/checkin`;
      const qrCodeUrl = await QRCode.toDataURL(qrData);
      setQrCode(qrCodeUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleRSVP = async () => {
    if (!user) {
      toast.error('Please log in to RSVP');
      return;
    }

    setSubmittingRSVP(true);
    try {
      if (rsvpStatus) {
        // Cancel RSVP
        const { error } = await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        setRsvpStatus(null);
        toast.success('RSVP cancelled');
      } else {
        // Check if event is full
        if (event.capacity && event.attendee_count >= event.capacity) {
          // Add to waitlist
          const { data, error } = await supabase
            .from('event_waitlist')
            .insert([{
              event_id: id,
              user_id: user.id,
              position: event.attendee_count + 1
            }])
            .select()
            .single();

          if (error) throw error;
          setWaitlistPosition(data.position);
          toast.success('Added to waitlist');
        } else {
          // Direct RSVP
          const { data, error } = await supabase
            .from('event_attendees')
            .insert([{
              event_id: id,
              user_id: user.id
            }])
            .select()
            .single();

          if (error) throw error;
          setRsvpStatus(data);
          
          // Track conversion
          await supabase.rpc('track_event_view', { 
            p_event_id: id, 
            p_unique: false 
          });

          toast.success('RSVP confirmed!');
        }
      }
      
      // Refresh event data
      fetchEventDetails();
    } catch (error) {
      console.error('Error handling RSVP:', error);
      toast.error('Failed to update RSVP');
    } finally {
      setSubmittingRSVP(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setCommentLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_comments')
        .insert([{
          event_id: id,
          user_id: user.id,
          content: newComment.trim()
        }])
        .select(`
          *,
          user:profiles(full_name, avatar_url),
          comment_likes(count)
        `)
        .single();

      if (error) throw error;
      
      setComments([data, ...comments]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const shareEvent = async (platform) => {
    const url = window.location.href;
    const text = `Check out this event: ${event.title}`;
    
    switch (platform) {
      case 'copy':
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(text + '\n\n' + url)}`;
        break;
    }
    setShowShareModal(false);
  };

  const formatTimeUntilEvent = () => {
    const eventDate = new Date(event.start_time);
    const now = new Date();
    
    if (isPast(eventDate)) return 'Event has passed';
    if (isToday(eventDate)) return 'Today';
    
    const days = differenceInDays(eventDate, now);
    const hours = differenceInHours(eventDate, now);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} away`;
    return `${hours} hour${hours > 1 ? 's' : ''} away`;
  };

  const getCapacityStatus = () => {
    if (!event.capacity) return null;
    
    const percentage = (event.attendee_count / event.capacity) * 100;
    
    if (percentage >= 100) return { status: 'full', color: 'red', text: 'Event Full' };
    if (percentage >= 90) return { status: 'filling', color: 'orange', text: 'Filling Fast' };
    if (percentage >= 70) return { status: 'available', color: 'yellow', text: 'Limited Spots' };
    return { status: 'available', color: 'green', text: 'Spots Available' };
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading event details..." />;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/explore')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  const capacityStatus = getCapacityStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to events
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Hero Image */}
            <div className="relative mb-8">
              {event.images.length > 0 ? (
                <div className="relative">
                  <img
                    src={event.images[selectedImageIndex]}
                    alt={event.title}
                    className="w-full h-96 object-cover rounded-xl cursor-pointer"
                    onClick={() => setShowImageModal(true)}
                  />
                  {event.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex(Math.min(event.images.length - 1, selectedImageIndex + 1))}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {event.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`w-3 h-3 rounded-full ${index === selectedImageIndex ? 'bg-white' : 'bg-white/50'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <div className="text-center text-white">
                    <CalendarDaysIcon className="h-20 w-20 mx-auto mb-4 opacity-50" />
                    <h3 className="text-2xl font-bold">{event.title}</h3>
                  </div>
                </div>
              )}
              
              {/* Event Status Badge */}
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${
                  isPast(new Date(event.start_time)) ? 'bg-gray-500' : 'bg-green-500'
                }`}>
                  {isPast(new Date(event.start_time)) ? 'Past Event' : formatTimeUntilEvent()}
                </span>
              </div>

              {/* Capacity Badge */}
              {capacityStatus && (
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium text-white bg-${capacityStatus.color}-500`}>
                    {capacityStatus.text}
                  </span>
                </div>
              )}
            </div>

            {/* Event Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
                  <p className="text-lg text-gray-600">{event.school?.name}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSaveEvent(event.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    {isEventSaved(event.id) ? (
                      <BookmarkSolidIcon className="h-6 w-6 text-indigo-600" />
                    ) : (
                      <BookmarkIcon className="h-6 w-6" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <ShareIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Event Meta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="h-5 w-5" />
                  <span>{format(new Date(event.start_time), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  <span>
                    {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5" />
                  <span>{event.location}</span>
                </div>
                {event.price > 0 && (
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="h-5 w-5" />
                    <span>${event.price}</span>
                  </div>
                )}
                {event.capacity && (
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5" />
                    <span>{event.attendee_count} / {event.capacity} attending</span>
                  </div>
                )}
                {event.total_views > 0 && (
                  <div className="flex items-center gap-2">
                    <EyeIcon className="h-5 w-5" />
                    <span>{event.total_views} views</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 leading-relaxed">{event.description}</p>
                    </div>
                  </div>

                  {/* Event Analytics for Organizers */}
                  {eventAnalytics && (profile?.role === 'school_admin' || profile?.role === 'teacher') && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Performance</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-indigo-600">{eventAnalytics.views}</div>
                          <div className="text-sm text-gray-600">Views</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{eventAnalytics.rsvp_clicks}</div>
                          <div className="text-sm text-gray-600">RSVP Clicks</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{eventAnalytics.conversions}</div>
                          <div className="text-sm text-gray-600">RSVPs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{eventAnalytics.overall_conversion_rate}%</div>
                          <div className="text-sm text-gray-600">Conversion</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'discussion' && (
                <div className="space-y-6">
                  {/* Comment Form */}
                  {user && (
                    <form onSubmit={handleComment} className="space-y-4">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Share your thoughts about this event..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim() || commentLoading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {commentLoading ? 'Posting...' : 'Post Comment'}
                      </button>
                    </form>
                  )}

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ChatBubbleLeftIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No comments yet. Be the first to share your thoughts!</p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            {comment.user?.avatar_url ? (
                              <img src={comment.user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                            ) : (
                              <UserCircleIcon className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{comment.user?.full_name || 'Anonymous'}</span>
                              <span className="text-sm text-gray-500">
                                {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            <p className="text-gray-700">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div>
                  {event.images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {event.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt=""
                          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => {
                            setSelectedImageIndex(index);
                            setShowImageModal(true);
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <PhotoIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No media available for this event.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'attendees' && (
                <div>
                  <div className="text-center py-8 text-gray-500">
                    <UsersIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Attendee list is only visible to event organizers.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* RSVP Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center mb-4">
                {event.price > 0 ? (
                  <div className="text-3xl font-bold text-gray-900">${event.price}</div>
                ) : (
                  <div className="text-3xl font-bold text-green-600">Free</div>
                )}
              </div>

              {!isPast(new Date(event.start_time)) && (
                <>
                  {rsvpStatus ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                        <CheckCircleIcon className="h-5 w-5" />
                        <span className="font-medium">You're attending!</span>
                      </div>
                      <button
                        onClick={handleRSVP}
                        disabled={submittingRSVP}
                        className="w-full px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        Cancel RSVP
                      </button>
                    </div>
                  ) : waitlistPosition ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-orange-600 bg-orange-50 p-3 rounded-lg">
                        <ClockIcon className="h-5 w-5" />
                        <span className="font-medium">Waitlist #{waitlistPosition}</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleRSVP}
                      disabled={submittingRSVP}
                      className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                    >
                      {submittingRSVP ? 'Processing...' : 
                       (event.capacity && event.attendee_count >= event.capacity) ? 'Join Waitlist' : 'RSVP Now'}
                    </button>
                  )}
                </>
              )}

              {/* Capacity Bar */}
              {event.capacity && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{event.attendee_count} attending</span>
                    <span>{event.capacity} capacity</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        event.attendee_count >= event.capacity ? 'bg-red-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min((event.attendee_count / event.capacity) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* QR Code for Check-in */}
            {rsvpStatus && qrCode && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Check-in QR Code</h3>
                <div className="flex justify-center mb-4">
                  <img src={qrCode} alt="Check-in QR Code" className="w-32 h-32" />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Show this QR code at the event for quick check-in
                </p>
              </div>
            )}

            {/* Event Organizer */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Organizer</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold text-lg">
                    {event.school?.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{event.school?.name}</div>
                  <div className="text-sm text-gray-600">{event.school?.address}</div>
                </div>
              </div>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <EnvelopeIcon className="h-4 w-4" />
                  Contact School
                </button>
              </div>
            </div>

            {/* Related Events */}
            {relatedEvents.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">More from {event.school?.name}</h3>
                <div className="space-y-4">
                  {relatedEvents.map((relatedEvent) => (
                    <div key={relatedEvent.id} className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 transition-colors cursor-pointer"
                         onClick={() => navigate(`/events/${relatedEvent.id}`)}>
                      <h4 className="font-medium text-gray-900 text-sm mb-1">{relatedEvent.title}</h4>
                      <p className="text-xs text-gray-600">
                        {format(new Date(relatedEvent.start_time), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Share Event</h3>
              <button onClick={() => setShowShareModal(false)}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => shareEvent('copy')}
                className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <LinkIcon className="h-4 w-4" />
                Copy Link
              </button>
              <button
                onClick={() => shareEvent('email')}
                className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <EnvelopeIcon className="h-4 w-4" />
                Email
              </button>
              <button
                onClick={() => shareEvent('twitter')}
                className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ShareIcon className="h-4 w-4" />
                Twitter
              </button>
              <button
                onClick={() => shareEvent('facebook')}
                className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ShareIcon className="h-4 w-4" />
                Facebook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <XMarkIcon className="h-8 w-8" />
            </button>
            <img
              src={event.images[selectedImageIndex]}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}