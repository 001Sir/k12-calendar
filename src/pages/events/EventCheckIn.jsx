import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  CameraIcon,
  DocumentTextIcon,
  UsersIcon,
  ClockIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import Header from '../../components/layout/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useAuthStore from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function EventCheckIn() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [checkedInUsers, setCheckedInUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [scannerActive, setScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkInStats, setCheckInStats] = useState({
    total: 0,
    checkedIn: 0,
    percentage: 0
  });

  useEffect(() => {
    if (id) {
      fetchEventDetails();
      fetchAttendees();
    }
  }, [id]);

  useEffect(() => {
    if (attendees.length > 0) {
      fetchCheckInStatus();
    }
  }, [attendees]);

  useEffect(() => {
    // Calculate stats
    const total = attendees.length;
    const checkedIn = checkedInUsers.size;
    const percentage = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
    
    setCheckInStats({ total, checkedIn, percentage });
  }, [attendees, checkedInUsers]);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          school:schools(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
    }
  };

  const fetchAttendees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          *,
          user:profiles(full_name, email, phone)
        `)
        .eq('event_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAttendees(data || []);
    } catch (error) {
      console.error('Error fetching attendees:', error);
      toast.error('Failed to load attendees');
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckInStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('event_checkins')
        .select('user_id')
        .eq('event_id', id);

      if (error) throw error;
      
      const checkedInSet = new Set(data?.map(checkin => checkin.user_id) || []);
      setCheckedInUsers(checkedInSet);
    } catch (error) {
      console.error('Error fetching check-in status:', error);
    }
  };

  const handleCheckIn = async (userId, method = 'manual') => {
    try {
      if (checkedInUsers.has(userId)) {
        toast.error('User already checked in');
        return;
      }

      const { data, error } = await supabase
        .from('event_checkins')
        .insert([{
          event_id: id,
          user_id: userId,
          check_in_method: method,
          location: method === 'qr' ? 'QR Scan' : 'Manual Entry'
        }])
        .select()
        .single();

      if (error) throw error;

      setCheckedInUsers(prev => new Set([...prev, userId]));
      toast.success('Attendee checked in successfully');
      
      setScanResult({
        success: true,
        message: 'Check-in successful',
        user: attendees.find(a => a.user_id === userId)?.user
      });
    } catch (error) {
      console.error('Error checking in user:', error);
      toast.error('Failed to check in attendee');
      
      setScanResult({
        success: false,
        message: 'Check-in failed',
        error: error.message
      });
    }
  };

  const handleUndoCheckIn = async (userId) => {
    try {
      const { error } = await supabase
        .from('event_checkins')
        .delete()
        .eq('event_id', id)
        .eq('user_id', userId);

      if (error) throw error;

      setCheckedInUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      
      toast.success('Check-in undone');
    } catch (error) {
      console.error('Error undoing check-in:', error);
      toast.error('Failed to undo check-in');
    }
  };

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScannerActive(true);
        
        // Start scanning for QR codes
        scanForQRCode();
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      toast.error('Unable to access camera');
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScannerActive(false);
  };

  const scanForQRCode = () => {
    // This is a simplified QR code scanner
    // In a real implementation, you'd use a library like jsQR
    const scanInterval = setInterval(() => {
      if (!scannerActive || !videoRef.current) {
        clearInterval(scanInterval);
        return;
      }

      // Simulate QR code detection (replace with actual QR scanning logic)
      // For demo purposes, we'll just check for manual input
    }, 100);
  };

  const exportCheckInList = () => {
    const checkedInAttendees = attendees.filter(attendee => 
      checkedInUsers.has(attendee.user_id)
    );

    const csvData = [
      ['Name', 'Email', 'Check-in Time', 'Status'].join(','),
      ...checkedInAttendees.map(attendee => [
        attendee.user?.full_name || 'N/A',
        attendee.user?.email || 'N/A',
        format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        'Checked In'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.title || 'event'}-checkin-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Check-in list exported');
  };

  const filteredAttendees = attendees.filter(attendee =>
    attendee.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attendee.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if user has permission to access this page
  const hasPermission = profile?.role === 'school_admin' || profile?.role === 'teacher';

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access the check-in system.</p>
          <button
            onClick={() => navigate(`/events/${id}`)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading check-in system..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/events/${id}`)}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event?.title}</h1>
              <p className="text-gray-600">Event Check-in System</p>
            </div>
          </div>
          
          <button
            onClick={exportCheckInList}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <DocumentTextIcon className="h-4 w-4" />
            Export List
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Registered</p>
                <p className="text-3xl font-bold text-gray-900">{checkInStats.total}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Checked In</p>
                <p className="text-3xl font-bold text-green-600">{checkInStats.checkedIn}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-3xl font-bold text-purple-600">{checkInStats.percentage}%</p>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${checkInStats.percentage * 1.75} 175`}
                    className="text-purple-600"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* QR Scanner */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code Scanner</h3>
              
              {!scannerActive ? (
                <div className="text-center">
                  <QrCodeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Scan attendee QR codes for quick check-in</p>
                  <button
                    onClick={startScanner}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 mx-auto"
                  >
                    <CameraIcon className="h-4 w-4" />
                    Start Scanner
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    className="w-full h-48 bg-black rounded-lg"
                    playsInline
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <button
                    onClick={stopScanner}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Stop Scanner
                  </button>
                </div>
              )}

              {scanResult && (
                <div className={`mt-4 p-3 rounded-lg ${
                  scanResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {scanResult.success ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-medium ${scanResult.success ? 'text-green-900' : 'text-red-900'}`}>
                      {scanResult.message}
                    </span>
                  </div>
                  {scanResult.user && (
                    <p className="text-sm text-gray-600 mt-1">
                      {scanResult.user.full_name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Attendee List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Attendee List</h3>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search attendees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAttendees.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <UsersIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No attendees found</p>
                  </div>
                ) : (
                  filteredAttendees.map((attendee) => {
                    const isCheckedIn = checkedInUsers.has(attendee.user_id);
                    
                    return (
                      <div
                        key={attendee.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          isCheckedIn 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isCheckedIn ? 'bg-green-100' : 'bg-gray-200'
                          }`}>
                            {isCheckedIn ? (
                              <CheckIcon className="h-5 w-5 text-green-600" />
                            ) : (
                              <UserIcon className="h-5 w-5 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {attendee.user?.full_name || 'Unknown User'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {attendee.user?.email}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isCheckedIn ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-600 font-medium">Checked In</span>
                              <button
                                onClick={() => handleUndoCheckIn(attendee.user_id)}
                                className="px-3 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50"
                              >
                                Undo
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleCheckIn(attendee.user_id)}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                            >
                              Check In
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}