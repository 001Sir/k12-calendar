import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/authStore';

export const useUserSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // If no settings exist, create default settings
      if (!data) {
        const defaultSettings = {
          user_id: user.id,
          email_notifications: true,
          push_notifications: false,
          language: 'en',
          timezone: 'UTC',
          theme: 'light'
        };
        
        const { data: newData, error: insertError } = await supabase
          .from('user_settings')
          .insert([defaultSettings])
          .select()
          .single();
          
        if (insertError) throw insertError;
        setSettings(newData);
      } else {
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates) => {
    try {
      setSaving(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setSettings(data);
      return { success: true, error: null };
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  };

  const updateTheme = async (theme) => {
    const result = await updateSettings({ theme });
    if (result.success) {
      // Apply theme to document
      document.documentElement.classList.remove('light', 'dark');
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }
    return result;
  };

  const updateLanguage = async (language) => {
    return await updateSettings({ language });
  };

  const updateTimezone = async (timezone) => {
    return await updateSettings({ timezone });
  };

  const updateNotificationPreferences = async (preferences) => {
    return await updateSettings({
      email_notifications: preferences.email_notifications,
      push_notifications: preferences.push_notifications
    });
  };

  return {
    settings,
    loading,
    error,
    saving,
    updateSettings,
    updateTheme,
    updateLanguage,
    updateTimezone,
    updateNotificationPreferences,
    refresh: fetchSettings
  };
};