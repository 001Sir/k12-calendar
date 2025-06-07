import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  EyeIcon, 
  CursorArrowRaysIcon,
  CheckCircleIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FunnelIcon,
  ChartBarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { format, subDays } from 'date-fns';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function EventPerformanceComparison({ schoolId }) {
  const [events, setEvents] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('conversion_rate');
  const [timeframe, setTimeframe] = useState(30);
  const [loading, setLoading] = useState(true);
  const [topPerformers, setTopPerformers] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);

  const metrics = [
    { key: 'conversion_rate', label: 'Conversion Rate', icon: FunnelIcon, format: (v) => `${v}%` },
    { key: 'engagement_score', label: 'Engagement Score', icon: StarIcon, format: (v) => v.toFixed(1) },
    { key: 'attendance_rate', label: 'Attendance Rate', icon: CheckCircleIcon, format: (v) => `${v}%` },
    { key: 'revenue_per_attendee', label: 'Revenue/Attendee', icon: ChartBarIcon, format: (v) => `$${v}` }
  ];

  useEffect(() => {
    fetchEventPerformance();
  }, [schoolId, timeframe]);

  const fetchEventPerformance = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = subDays(endDate, timeframe);

      // Fetch events with comprehensive data
      const { data: eventsData, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_type,
          start_time,
          capacity,
          price,
          image_url,
          event_attendees(count),
          event_checkins(count),
          revenue_tracking(amount, transaction_type)
        `)
        .eq('school_id', schoolId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: false });

      if (error) throw error;

      // Fetch analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('event_analytics')
        .select('*')
        .in('event_id', eventsData.map(e => e.id))
        .gte('date', startDate.toISOString().split('T')[0]);

      if (analyticsError) throw analyticsError;

      // Process and calculate metrics
      const processedEvents = calculateEventMetrics(eventsData, analyticsData);
      setEvents(processedEvents);
      
      // Calculate top performers and comparison data
      calculateTopPerformers(processedEvents);
      generateComparisonData(processedEvents);
    } catch (error) {
      console.error('Error fetching event performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEventMetrics = (eventsData, analyticsData) => {
    return eventsData.map(event => {
      const analytics = analyticsData.filter(a => a.event_id === event.id);
      const totalViews = analytics.reduce((sum, a) => sum + (a.views || 0), 0);
      const totalClicks = analytics.reduce((sum, a) => sum + (a.rsvp_clicks || 0), 0);
      const totalConversions = analytics.reduce((sum, a) => sum + (a.conversions || 0), 0);
      
      const attendeeCount = event.event_attendees?.[0]?.count || 0;
      const checkinCount = event.event_checkins?.[0]?.count || 0;
      const revenue = event.revenue_tracking?.reduce((sum, r) => 
        r.transaction_type === 'ticket_sale' ? sum + r.amount : sum, 0) || 0;

      // Calculate metrics
      const conversion_rate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;
      const attendance_rate = attendeeCount > 0 ? (checkinCount / attendeeCount) * 100 : 0;
      const revenue_per_attendee = attendeeCount > 0 ? revenue / attendeeCount : 0;
      
      // Engagement score (composite metric)
      const engagement_score = (
        (conversion_rate / 10) * 0.3 +
        (attendance_rate / 10) * 0.3 +
        (totalClicks / Math.max(totalViews, 1)) * 100 * 0.2 +
        (revenue_per_attendee / 10) * 0.2
      );

      return {
        ...event,
        analytics: {
          views: totalViews,
          clicks: totalClicks,
          conversions: totalConversions,
          attendees: attendeeCount,
          checkins: checkinCount,
          revenue
        },
        metrics: {
          conversion_rate: Math.round(conversion_rate * 10) / 10,
          engagement_score: Math.round(engagement_score * 10) / 10,
          attendance_rate: Math.round(attendance_rate * 10) / 10,
          revenue_per_attendee: Math.round(revenue_per_attendee * 100) / 100
        }
      };
    });
  };

  const calculateTopPerformers = (events) => {
    const sorted = [...events]
      .filter(e => e.analytics.views > 0)
      .sort((a, b) => b.metrics[selectedMetric] - a.metrics[selectedMetric])
      .slice(0, 5);
    
    setTopPerformers(sorted);
  };

  const generateComparisonData = (events) => {
    const typeGroups = events.reduce((acc, event) => {
      const type = event.event_type || 'other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(event);
      return acc;
    }, {});

    const comparison = Object.entries(typeGroups).map(([type, typeEvents]) => {
      const avgMetrics = metrics.reduce((acc, metric) => {
        const avg = typeEvents.reduce((sum, e) => sum + e.metrics[metric.key], 0) / typeEvents.length;
        acc[metric.key] = Math.round(avg * 10) / 10;
        return acc;
      }, {});

      return {
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count: typeEvents.length,
        ...avgMetrics
      };
    });

    setComparisonData(comparison);
  };

  const getPerformanceColor = (value, metricKey) => {
    const thresholds = {
      conversion_rate: { good: 5, excellent: 10 },
      engagement_score: { good: 6, excellent: 8 },
      attendance_rate: { good: 70, excellent: 90 },
      revenue_per_attendee: { good: 10, excellent: 25 }
    };

    const threshold = thresholds[metricKey];
    if (value >= threshold.excellent) return 'text-green-600 bg-green-50';
    if (value >= threshold.good) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Event Performance Analysis</h2>
        <div className="flex items-center gap-4">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            {metrics.map(metric => (
              <option key={metric.key} value={metric.key}>{metric.label}</option>
            ))}
          </select>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrophyIcon className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Events</h3>
        </div>
        
        <div className="space-y-4">
          {topPerformers.map((event, index) => {
            const metric = metrics.find(m => m.key === selectedMetric);
            const value = event.metrics[selectedMetric];
            
            return (
              <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-600">
                      {event.analytics.views} views • {event.analytics.attendees} attendees
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(value, selectedMetric)}`}>
                  {metric.format(value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance by Event Type */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance by Event Type</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="type" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey={selectedMetric} 
              fill="#6366f1" 
              radius={[4, 4, 0, 0]}
              name={metrics.find(m => m.key === selectedMetric)?.label}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Events Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Event</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Views</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Clicks</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Conversions</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Conversion Rate</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Attendance Rate</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {event.image_url && (
                        <img src={event.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600 capitalize">{event.event_type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-4 px-4 text-sm">{event.analytics.views}</td>
                  <td className="text-center py-4 px-4 text-sm">{event.analytics.clicks}</td>
                  <td className="text-center py-4 px-4 text-sm">{event.analytics.conversions}</td>
                  <td className="text-center py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(event.metrics.conversion_rate, 'conversion_rate')}`}>
                      {event.metrics.conversion_rate}%
                    </span>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(event.metrics.attendance_rate, 'attendance_rate')}`}>
                      {event.metrics.attendance_rate}%
                    </span>
                  </td>
                  <td className="text-center py-4 px-4 text-sm font-medium">
                    ${event.analytics.revenue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Radar Chart */}
      {events.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Multi-Metric Performance</h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={metrics.map(metric => ({
              metric: metric.label,
              ...comparisonData.reduce((acc, type) => {
                acc[type.type] = type[metric.key];
                return acc;
              }, {})
            }))}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
              {comparisonData.map((type, index) => (
                <Radar
                  key={type.type}
                  name={type.type}
                  dataKey={type.type}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.1}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}