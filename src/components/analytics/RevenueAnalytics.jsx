import React, { useState, useEffect } from 'react';
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
  RadialBarChart,
  RadialBar
} from 'recharts';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { supabase } from '../../lib/supabase';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function RevenueAnalytics({ schoolId, dateRange = 30 }) {
  const [revenueData, setRevenueData] = useState([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    averageTicketPrice: 0,
    growthRate: 0,
    projectedRevenue: 0,
    topEventRevenue: null
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly
  const [comparisonMode, setComparisonMode] = useState(false);

  useEffect(() => {
    fetchRevenueData();
  }, [schoolId, dateRange, viewMode]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = subDays(endDate, dateRange);

      // Fetch revenue data
      const { data: revenue, error } = await supabase
        .from('revenue_tracking')
        .select(`
          *,
          event:events(title, event_type)
        `)
        .eq('status', 'completed')
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString())
        .order('transaction_date', { ascending: true });

      if (error) throw error;

      // Process data based on view mode
      const processedData = processRevenueData(revenue, viewMode);
      setRevenueData(processedData);

      // Calculate metrics
      calculateMetrics(revenue, processedData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processRevenueData = (data, mode) => {
    const grouped = {};
    
    data.forEach(transaction => {
      const date = new Date(transaction.transaction_date);
      let key;
      
      switch (mode) {
        case 'daily':
          key = format(date, 'MMM dd');
          break;
        case 'weekly':
          key = `Week ${format(date, 'w')}`;
          break;
        case 'monthly':
          key = format(date, 'MMM yyyy');
          break;
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          revenue: 0,
          transactions: 0,
          refunds: 0,
          tickets: 0
        };
      }
      
      if (transaction.transaction_type === 'refund') {
        grouped[key].refunds += Math.abs(transaction.amount);
      } else {
        grouped[key].revenue += transaction.amount;
        grouped[key].tickets += 1;
      }
      grouped[key].transactions += 1;
    });

    return Object.values(grouped);
  };

  const calculateMetrics = (rawData, processedData) => {
    const total = rawData.reduce((sum, t) => 
      sum + (t.transaction_type === 'refund' ? -t.amount : t.amount), 0
    );
    
    const tickets = rawData.filter(t => t.transaction_type === 'ticket_sale').length;
    const avgPrice = tickets > 0 ? total / tickets : 0;
    
    // Calculate growth rate
    const midPoint = Math.floor(processedData.length / 2);
    const firstHalf = processedData.slice(0, midPoint).reduce((sum, d) => sum + d.revenue, 0);
    const secondHalf = processedData.slice(midPoint).reduce((sum, d) => sum + d.revenue, 0);
    const growth = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
    
    // Simple linear projection
    const dailyAvg = total / dateRange;
    const projected = dailyAvg * 30; // 30-day projection

    // Find top revenue event
    const eventRevenue = {};
    rawData.forEach(t => {
      if (t.event?.title) {
        eventRevenue[t.event.title] = (eventRevenue[t.event.title] || 0) + t.amount;
      }
    });
    
    const topEvent = Object.entries(eventRevenue)
      .sort(([,a], [,b]) => b - a)[0];

    setMetrics({
      totalRevenue: total,
      averageTicketPrice: avgPrice,
      growthRate: growth,
      projectedRevenue: projected,
      topEventRevenue: topEvent ? { name: topEvent[0], amount: topEvent[1] } : null
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
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
    <div className="space-y-6">
      {/* Revenue Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <CurrencyDollarIcon className="h-8 w-8 opacity-80" />
            <span className={`flex items-center text-sm ${metrics.growthRate >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {metrics.growthRate >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
              {Math.abs(metrics.growthRate).toFixed(1)}%
            </span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
          <p className="text-indigo-100 text-sm mt-1">Total Revenue</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <ChartBarIcon className="h-8 w-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(metrics.averageTicketPrice)}</p>
          <p className="text-purple-100 text-sm mt-1">Avg. Ticket Price</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <ArrowTrendingUpIcon className="h-8 w-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(metrics.projectedRevenue)}</p>
          <p className="text-pink-100 text-sm mt-1">30-Day Projection</p>
        </div>

        {metrics.topEventRevenue && (
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <CalendarDaysIcon className="h-8 w-8 opacity-80" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.topEventRevenue.amount)}</p>
            <p className="text-amber-100 text-sm mt-1 truncate">{metrics.topEventRevenue.name}</p>
          </div>
        )}
      </div>

      {/* Main Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
          <div className="flex items-center gap-2">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <button
              onClick={() => setComparisonMode(!comparisonMode)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                comparisonMode 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Compare
            </button>
            <button
              onClick={fetchRevenueData}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={formatCurrency} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#6366f1"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={2}
            />
            {comparisonMode && (
              <Area
                type="monotone"
                dataKey="refunds"
                stroke="#ef4444"
                fillOpacity={0.6}
                fill="#ef4444"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Event Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={revenueData.slice(0, 5)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ date, revenue }) => `${date}: ${formatCurrency(revenue)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
              >
                {revenueData.slice(0, 5).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Volume</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip />
              <Bar dataKey="tickets" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}