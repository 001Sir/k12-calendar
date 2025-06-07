import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/authStore';

export const useSupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (ticketData) => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([{
          user_id: user.id,
          school_id: user.user_metadata?.school_id,
          title: ticketData.subject,
          description: ticketData.description,
          category: ticketData.category,
          priority: ticketData.priority,
          status: 'open'
        }])
        .select()
        .single();

      if (error) throw error;
      
      setTickets([data, ...tickets]);
      return { data, error: null };
    } catch (err) {
      console.error('Error creating ticket:', err);
      return { data: null, error: err.message };
    }
  };

  const updateTicketStatus = async (ticketId, status) => {
    try {
      const updateData = { status };
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;

      setTickets(tickets.map(t => t.id === ticketId ? data : t));
      return { data, error: null };
    } catch (err) {
      console.error('Error updating ticket:', err);
      return { data: null, error: err.message };
    }
  };

  const getTicketStats = () => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const resolvedToday = tickets.filter(t => {
      if (!t.resolved_at) return false;
      const resolvedDate = new Date(t.resolved_at);
      const today = new Date();
      return resolvedDate.toDateString() === today.toDateString();
    }).length;

    // Calculate average resolution time
    const resolvedTickets = tickets.filter(t => t.resolved_at);
    let avgResolutionTime = 0;
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at);
        const resolved = new Date(ticket.resolved_at);
        return sum + (resolved - created);
      }, 0);
      avgResolutionTime = totalTime / resolvedTickets.length / (1000 * 60 * 60); // Convert to hours
    }

    return {
      total,
      open,
      inProgress,
      resolved,
      resolvedToday,
      avgResolutionTime: avgResolutionTime.toFixed(1)
    };
  };

  const getMetrics = () => {
    const stats = getTicketStats();
    const resolutionRate = stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(0) : 0;
    
    return [
      { 
        label: 'Average Response Time', 
        value: `${stats.avgResolutionTime} hrs`, 
        change: '-15%', 
        icon: 'Clock', 
        color: 'from-blue-500 to-blue-600' 
      },
      { 
        label: 'Resolution Rate', 
        value: `${resolutionRate}%`, 
        change: '+5%', 
        icon: 'CheckCircle', 
        color: 'from-green-500 to-green-600' 
      },
      { 
        label: 'Active Tickets', 
        value: `${stats.open + stats.inProgress}`, 
        change: '-8%', 
        icon: 'MessageSquare', 
        color: 'from-purple-500 to-purple-600' 
      },
      { 
        label: 'Customer Satisfaction', 
        value: '4.8/5', 
        change: '+0.3', 
        icon: 'Star', 
        color: 'from-yellow-500 to-yellow-600' 
      }
    ];
  };

  return {
    tickets,
    loading,
    error,
    createTicket,
    updateTicketStatus,
    getTicketStats,
    getMetrics,
    refresh: fetchTickets
  };
};