import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, eachHourOfInterval, startOfDay, endOfDay } from 'date-fns';
import { FireIcon, UsersIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return '12 AM';
  if (i < 12) return `${i} AM`;
  if (i === 12) return '12 PM';
  return `${i - 12} PM`;
});

export default function AttendanceHeatmap({ schoolId }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('week'); // week, month
  const [selectedCell, setSelectedCell] = useState(null);
  const [maxAttendance, setMaxAttendance] = useState(0);
  const [insights, setInsights] = useState({
    peakDay: null,
    peakHour: null,
    totalEvents: 0,
    avgAttendance: 0
  });

  useEffect(() => {
    fetchAttendanceData();
  }, [schoolId, viewMode]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch events with attendance data
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          start_time,
          end_time,
          capacity,
          event_attendees(count),
          event_checkins(count)
        `)
        .eq('school_id', schoolId)
        .gte('start_time', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Process data into heatmap format
      const processedData = processEventData(events);
      setHeatmapData(processedData.heatmap);
      setMaxAttendance(processedData.max);
      calculateInsights(events, processedData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processEventData = (events) => {
    const heatmap = {};
    let max = 0;

    // Initialize grid
    DAYS.forEach((_, dayIndex) => {
      HOURS.forEach((_, hourIndex) => {
        const key = `${dayIndex}-${hourIndex}`;
        heatmap[key] = {
          day: dayIndex,
          hour: hourIndex,
          count: 0,
          events: [],
          attendance: 0
        };
      });
    });

    // Populate with event data
    events.forEach(event => {
      const startDate = new Date(event.start_time);
      const dayIndex = startDate.getDay();
      const hourIndex = startDate.getHours();
      const key = `${dayIndex}-${hourIndex}`;
      
      const attendance = event.event_checkins?.[0]?.count || event.event_attendees?.[0]?.count || 0;
      
      if (heatmap[key]) {
        heatmap[key].count += 1;
        heatmap[key].attendance += attendance;
        heatmap[key].events.push({
          title: event.title,
          attendance: attendance,
          capacity: event.capacity
        });
        
        max = Math.max(max, heatmap[key].attendance);
      }
    });

    return { heatmap: Object.values(heatmap), max };
  };

  const calculateInsights = (events, processedData) => {
    // Find peak day and hour
    let peakDayData = { day: 0, attendance: 0 };
    let peakHourData = { hour: 0, attendance: 0 };
    const dayTotals = {};
    const hourTotals = {};

    processedData.heatmap.forEach(cell => {
      dayTotals[cell.day] = (dayTotals[cell.day] || 0) + cell.attendance;
      hourTotals[cell.hour] = (hourTotals[cell.hour] || 0) + cell.attendance;
    });

    Object.entries(dayTotals).forEach(([day, attendance]) => {
      if (attendance > peakDayData.attendance) {
        peakDayData = { day: parseInt(day), attendance };
      }
    });

    Object.entries(hourTotals).forEach(([hour, attendance]) => {
      if (attendance > peakHourData.attendance) {
        peakHourData = { hour: parseInt(hour), attendance };
      }
    });

    const totalAttendance = events.reduce((sum, event) => 
      sum + (event.event_checkins?.[0]?.count || event.event_attendees?.[0]?.count || 0), 0
    );

    setInsights({
      peakDay: DAYS[peakDayData.day],
      peakHour: HOURS[peakHourData.hour],
      totalEvents: events.length,
      avgAttendance: events.length > 0 ? Math.round(totalAttendance / events.length) : 0
    });
  };

  const getHeatmapColor = (value) => {
    if (value === 0) return 'bg-gray-50';
    const intensity = maxAttendance > 0 ? value / maxAttendance : 0;
    
    if (intensity > 0.8) return 'bg-red-600';
    if (intensity > 0.6) return 'bg-orange-500';
    if (intensity > 0.4) return 'bg-yellow-500';
    if (intensity > 0.2) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getHeatmapOpacity = (value) => {
    if (value === 0) return '';
    const intensity = maxAttendance > 0 ? value / maxAttendance : 0;
    return `opacity-${Math.ceil(intensity * 10) * 10}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Attendance Patterns</h3>
          <p className="text-sm text-gray-600 mt-1">Event popularity by day and time</p>
        </div>
        <div className="flex items-center gap-2">
          <FireIcon className="h-5 w-5 text-orange-500" />
          <span className="text-sm text-gray-600">Higher attendance</span>
        </div>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDaysIcon className="h-4 w-4 text-indigo-600" />
            <span className="text-xs text-indigo-600">Peak Day</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{insights.peakDay}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <FireIcon className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-purple-600">Peak Hour</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{insights.peakHour}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <UsersIcon className="h-4 w-4 text-green-600" />
            <span className="text-xs text-green-600">Avg Attendance</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{insights.avgAttendance}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDaysIcon className="h-4 w-4 text-amber-600" />
            <span className="text-xs text-amber-600">Total Events</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{insights.totalEvents}</p>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="relative overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Hour labels */}
          <div className="flex items-center mb-2">
            <div className="w-12"></div>
            {HOURS.map((hour, index) => (
              <div key={hour} className="flex-1 text-center">
                <span className="text-xs text-gray-500">
                  {index % 3 === 0 ? hour : ''}
                </span>
              </div>
            ))}
          </div>

          {/* Day rows */}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="flex items-center mb-1">
              <div className="w-12 text-sm text-gray-600 font-medium">{day}</div>
              <div className="flex flex-1 gap-0.5">
                {HOURS.map((_, hourIndex) => {
                  const cell = heatmapData.find(d => d.day === dayIndex && d.hour === hourIndex);
                  const hasEvents = cell && cell.count > 0;
                  
                  return (
                    <div
                      key={`${dayIndex}-${hourIndex}`}
                      className="relative group flex-1"
                      onMouseEnter={() => setSelectedCell(cell)}
                      onMouseLeave={() => setSelectedCell(null)}
                    >
                      <div
                        className={`
                          aspect-square rounded-sm transition-all cursor-pointer
                          ${hasEvents ? getHeatmapColor(cell.attendance) : 'bg-gray-50'}
                          ${hasEvents ? getHeatmapOpacity(cell.attendance) : ''}
                          ${hasEvents ? 'hover:ring-2 hover:ring-indigo-500' : ''}
                        `}
                      />
                      
                      {/* Tooltip */}
                      {selectedCell === cell && hasEvents && (
                        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white p-2 rounded-lg text-xs">
                          <p className="font-medium">{day} at {HOURS[hourIndex]}</p>
                          <p>{cell.count} event{cell.count > 1 ? 's' : ''}</p>
                          <p>{cell.attendance} total attendees</p>
                          {cell.events.slice(0, 2).map((event, i) => (
                            <p key={i} className="truncate mt-1">• {event.title}</p>
                          ))}
                          {cell.events.length > 2 && (
                            <p className="text-gray-400">+{cell.events.length - 2} more</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 text-sm text-gray-600">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-gray-50 rounded-sm"></div>
          <div className="w-4 h-4 bg-blue-500 opacity-20 rounded-sm"></div>
          <div className="w-4 h-4 bg-green-500 opacity-40 rounded-sm"></div>
          <div className="w-4 h-4 bg-yellow-500 opacity-60 rounded-sm"></div>
          <div className="w-4 h-4 bg-orange-500 opacity-80 rounded-sm"></div>
          <div className="w-4 h-4 bg-red-600 opacity-100 rounded-sm"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
}