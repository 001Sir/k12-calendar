import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/authStore';

export const useSavedEvents = () => {
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      fetchSavedEvents();
    }
  }, [user]);

  const fetchSavedEvents = async () => {
    try {
      setLoading(true);
      // Check if saved_events table exists
      const { data, error } = await supabase
        .from('saved_events')
        .select(`
          *,
          events(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === 'PGRST200' || error.message.includes('relationship')) {
          console.warn('Saved events table not yet created. Run the advanced-analytics.sql file.');
          setSavedEvents([]);
          return;
        }
        throw error;
      }
      setSavedEvents(data || []);
    } catch (err) {
      console.error('Error fetching saved events:', err);
      setError(err.message);
      setSavedEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const saveEvent = async (eventId) => {
    try {
      const { data, error } = await supabase
        .from('saved_events')
        .insert([{
          user_id: user.id,
          event_id: eventId
        }])
        .select(`
          *,
          events(*)
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST200' || error.message.includes('relationship')) {
          console.warn('Saved events table not yet created. Feature will work after running advanced-analytics.sql');
          return { success: false, error: 'Feature not yet available' };
        }
        throw error;
      }
      
      setSavedEvents([data, ...savedEvents]);
      return { success: true, error: null };
    } catch (err) {
      console.error('Error saving event:', err);
      return { success: false, error: err.message };
    }
  };

  const unsaveEvent = async (eventId) => {
    try {
      const { error } = await supabase
        .from('saved_events')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      if (error) {
        if (error.code === 'PGRST200' || error.message.includes('relationship')) {
          console.warn('Saved events table not yet created.');
          return { success: false, error: 'Feature not yet available' };
        }
        throw error;
      }
      
      setSavedEvents(savedEvents.filter(se => se.event_id !== eventId));
      return { success: true, error: null };
    } catch (err) {
      console.error('Error unsaving event:', err);
      return { success: false, error: err.message };
    }
  };

  const isEventSaved = (eventId) => {
    return savedEvents.some(se => se.event_id === eventId);
  };

  const toggleSaveEvent = async (eventId) => {
    if (isEventSaved(eventId)) {
      return await unsaveEvent(eventId);
    } else {
      return await saveEvent(eventId);
    }
  };

  return {
    savedEvents,
    loading,
    error,
    saveEvent,
    unsaveEvent,
    isEventSaved,
    toggleSaveEvent,
    refresh: fetchSavedEvents
  };
};