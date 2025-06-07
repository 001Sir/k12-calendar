import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/authStore';
import SophisticatedHeader from '../../components/layout/SophisticatedHeader';
import { toast } from 'react-hot-toast';
import {
  User,
  Lock,
  Bell,
  Shield,
  Palette,
  Link,
  CreditCard,
  Search,
  Save,
  Download,
  Upload,
  Key,
  Smartphone,
  Clock,
  ChevronRight,
  Check,
  X,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Trash2,
  Globe,
  Sun,
  Moon,
  Monitor,
  Accessibility,
  Calendar,
  Zap,
  History,
  Undo,
  Redo,
  Settings,
  Camera,
  Mail,
  MessageSquare,
  Phone,
  Twitter,
  Linkedin,
  Github,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Activity,
  Keyboard,
  XCircle,
  Info,
  Wifi,
  WifiOff,
  Keyboard,
  FileText,
  Database,
  Activity,
  Plus,
  Minus,
  Edit2,
  QrCode,
  Fingerprint,
  LogOut
} from 'lucide-react';

// Tab configuration
const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'profile', label: 'Profile', icon: Camera },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'integrations', label: 'Integrations', icon: Link },
  { id: 'billing', label: 'Billing & Subscription', icon: CreditCard }
];

// Theme presets
const THEME_PRESETS = [
  { id: 'light', name: 'Light', icon: Sun, colors: { primary: '#3B82F6', bg: '#FFFFFF' } },
  { id: 'dark', name: 'Dark', icon: Moon, colors: { primary: '#3B82F6', bg: '#111827' } },
  { id: 'auto', name: 'System', icon: Monitor, colors: { primary: '#3B82F6', bg: '#1F2937' } }
];

// Language options
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' }
];

// Notification channels
const NOTIFICATION_CHANNELS = [
  { id: 'email', label: 'Email', icon: Mail, description: 'Get notifications via email' },
  { id: 'push', label: 'Push', icon: MessageSquare, description: 'Browser push notifications' },
  { id: 'sms', label: 'SMS', icon: Phone, description: 'Text message notifications' }
];

// Notification types
const NOTIFICATION_TYPES = [
  { id: 'event_reminders', label: 'Event Reminders', description: 'Reminders for upcoming events' },
  { id: 'rsvp_updates', label: 'RSVP Updates', description: 'When someone RSVPs to your events' },
  { id: 'new_events', label: 'New Events', description: 'New events from your schools' },
  { id: 'event_changes', label: 'Event Changes', description: 'Updates to events you\'re attending' },
  { id: 'system_updates', label: 'System Updates', description: 'Important platform updates' },
  { id: 'marketing', label: 'Marketing', description: 'News and special offers' }
];

// Integration options
const INTEGRATIONS = [
  { id: 'google_calendar', name: 'Google Calendar', icon: Calendar, connected: false },
  { id: 'outlook', name: 'Outlook Calendar', icon: Calendar, connected: false },
  { id: 'apple_calendar', name: 'Apple Calendar', icon: Calendar, connected: false },
  { id: 'zoom', name: 'Zoom', icon: Zap, connected: false },
  { id: 'slack', name: 'Slack', icon: MessageSquare, connected: false }
];

// Custom hook for settings management
const useSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const saveTimeoutRef = useRef(null);
  const { user } = useAuthStore();

  // Load settings
  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const defaultSettings = {
        // Account
        email: user.email,
        twoFactorEnabled: false,
        sessionTimeout: 30,
        
        // Profile
        displayName: user.user_metadata?.full_name || '',
        bio: '',
        avatar: user.user_metadata?.avatar_url || '',
        socialLinks: {
          twitter: '',
          linkedin: '',
          github: ''
        },
        
        // Notifications
        notificationChannels: {
          email: true,
          push: false,
          sms: false
        },
        notificationTypes: {
          event_reminders: true,
          rsvp_updates: true,
          new_events: true,
          event_changes: true,
          system_updates: true,
          marketing: false
        },
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        },
        
        // Privacy
        profileVisibility: 'public',
        showEmail: false,
        allowAnalytics: true,
        dataRetention: 90,
        
        // Appearance
        theme: 'auto',
        language: 'en',
        fontSize: 'medium',
        reducedMotion: false,
        highContrast: false,
        colorBlindMode: 'none',
        customColors: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          accent: '#10B981'
        },
        
        // Integrations
        connectedIntegrations: [],
        apiKeys: [],
        webhooks: [],
        
        // Billing
        subscription: {
          plan: 'free',
          status: 'active',
          nextBilling: null
        },
        paymentMethod: null,
        billingEmail: user.email,
        
        // Metadata
        lastUpdated: new Date().toISOString(),
        version: 1
      };

      const mergedSettings = {
        ...defaultSettings,
        ...data?.preferences,
        email: user.email // Always use current email
      };

      setSettings(mergedSettings);
      setHistory([mergedSettings]);
      setHistoryIndex(0);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Save settings with debounce
  const saveSettings = useCallback(async (newSettings, immediate = false) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const doSave = async () => {
      setSaving(true);
      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            preferences: {
              ...newSettings,
              lastUpdated: new Date().toISOString(),
              version: (newSettings.version || 0) + 1
            }
          });

        if (error) throw error;

        // Update history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newSettings);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        toast.success('Settings saved', { duration: 2000 });
      } catch (error) {
        console.error('Error saving settings:', error);
        toast.error('Failed to save settings');
        // Rollback on error
        setSettings(history[historyIndex]);
      } finally {
        setSaving(false);
      }
    };

    if (immediate) {
      await doSave();
    } else {
      saveTimeoutRef.current = setTimeout(doSave, 1000);
    }
  }, [user.id, history, historyIndex]);

  // Update settings
  const updateSettings = useCallback((updates, immediate = false) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings, immediate);
  }, [settings, saveSettings]);

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSettings(history[newIndex]);
      saveSettings(history[newIndex], true);
    }
  }, [historyIndex, history, saveSettings]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSettings(history[newIndex]);
      saveSettings(history[newIndex], true);
    }
  }, [historyIndex, history, saveSettings]);

  useEffect(() => {
    if (user) {
      loadSettings();
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user]);

  return {
    settings,
    loading,
    saving,
    updateSettings,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1
  };
};

// Settings search hook
const useSettingsSearch = (searchQuery) => {
  const searchableItems = useMemo(() => {
    const items = [];
    
    // Add all settings with their paths
    TABS.forEach(tab => {
      items.push({
        id: tab.id,
        label: tab.label,
        path: [tab.label],
        tabId: tab.id
      });
    });

    // Add specific settings
    items.push(
      { id: 'password', label: 'Change Password', path: ['Account', 'Password'], tabId: 'account' },
      { id: '2fa', label: 'Two-Factor Authentication', path: ['Account', 'Security'], tabId: 'account' },
      { id: 'avatar', label: 'Profile Picture', path: ['Profile', 'Avatar'], tabId: 'profile' },
      { id: 'social', label: 'Social Links', path: ['Profile', 'Social'], tabId: 'profile' },
      { id: 'email-notif', label: 'Email Notifications', path: ['Notifications', 'Email'], tabId: 'notifications' },
      { id: 'quiet-hours', label: 'Quiet Hours', path: ['Notifications', 'Quiet Hours'], tabId: 'notifications' },
      { id: 'data-export', label: 'Export Data', path: ['Privacy & Security', 'Data'], tabId: 'privacy' },
      { id: 'delete-account', label: 'Delete Account', path: ['Privacy & Security', 'Account'], tabId: 'privacy' },
      { id: 'theme', label: 'Theme', path: ['Appearance', 'Theme'], tabId: 'appearance' },
      { id: 'language', label: 'Language', path: ['Appearance', 'Language'], tabId: 'appearance' },
      { id: 'api-keys', label: 'API Keys', path: ['Integrations', 'API'], tabId: 'integrations' },
      { id: 'calendar-sync', label: 'Calendar Sync', path: ['Integrations', 'Calendar'], tabId: 'integrations' },
      { id: 'subscription', label: 'Subscription', path: ['Billing & Subscription', 'Plan'], tabId: 'billing' },
      { id: 'payment', label: 'Payment Method', path: ['Billing & Subscription', 'Payment'], tabId: 'billing' }
    );

    return items;
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return [];

    const query = searchQuery.toLowerCase();
    return searchableItems.filter(item => 
      item.label.toLowerCase().includes(query) ||
      item.path.some(p => p.toLowerCase().includes(query))
    );
  }, [searchQuery, searchableItems]);

  return filteredItems;
};

// Tab content components
const AccountSettings = ({ settings, updateSettings, saving }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [enabling2FA, setEnabling2FA] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const enable2FA = async () => {
    setEnabling2FA(true);
    try {
      // In a real app, you would generate a TOTP secret and QR code
      // For demo purposes, we'll simulate this
      setQrCode('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/K12Calendar:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=K12Calendar');
      
      toast.success('Scan the QR code with your authenticator app');
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast.error('Failed to enable 2FA');
    } finally {
      setEnabling2FA(false);
    }
  };

  const verify2FA = async () => {
    try {
      // In a real app, you would verify the TOTP code
      if (verificationCode === '123456') {
        updateSettings({ twoFactorEnabled: true }, true);
        setQrCode(null);
        setVerificationCode('');
        toast.success('Two-factor authentication enabled');
      } else {
        toast.error('Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast.error('Failed to verify code');
    }
  };

  return (
    <div className="space-y-8">
      {/* Email Section */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Address
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Current Email</label>
            <div className="flex items-center gap-3">
              <input
                type="email"
                value={settings.email}
                disabled
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300"
              />
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Password
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg pr-10"
                placeholder="Enter current password"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg pr-10"
                placeholder="Enter new password"
              />
              <button
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Confirm New Password</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
              placeholder="Confirm new password"
            />
          </div>

          <button
            onClick={handlePasswordChange}
            disabled={!passwords.current || !passwords.new || !passwords.confirm || changingPassword}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-2"
          >
            {changingPassword ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Changing Password...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Change Password
              </>
            )}
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Fingerprint className="w-5 h-5" />
          Two-Factor Authentication
        </h3>
        
        {!settings.twoFactorEnabled && !qrCode ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>
            <button
              onClick={enable2FA}
              disabled={enabling2FA}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 rounded-lg transition-all flex items-center gap-2"
            >
              {enabling2FA ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Enable 2FA
                </>
              )}
            </button>
          </div>
        ) : qrCode ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            </div>
            <p className="text-sm text-gray-400 text-center">
              Scan this QR code with your authenticator app, then enter the verification code below.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-center text-lg tracking-wider"
              />
              <button
                onClick={verify2FA}
                disabled={verificationCode.length !== 6}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 rounded-lg transition-all"
              >
                Verify
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">2FA is enabled</p>
                  <p className="text-sm text-gray-400">Your account is protected</p>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ twoFactorEnabled: false }, true)}
                className="px-3 py-1 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                Disable
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Session Management */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Session Management
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Session Timeout</label>
            <select
              value={settings.sessionTimeout}
              onChange={(e) => updateSettings({ sessionTimeout: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={480}>8 hours</option>
              <option value={1440}>24 hours</option>
            </select>
          </div>

          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-400">
              You will be automatically logged out after {settings.sessionTimeout} minutes of inactivity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileSettings = ({ settings, updateSettings, saving }) => {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      updateSettings({ avatar: publicUrl }, true);
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Picture */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Profile Picture
        </h3>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white/10">
              {settings.avatar ? (
                <img src={settings.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center"
            >
              {uploadingAvatar ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Camera className="w-6 h-6" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2">Upload a new profile picture</p>
            <p className="text-xs text-gray-500">JPG, PNG or GIF. Max 5MB.</p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Basic Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Display Name</label>
            <input
              type="text"
              value={settings.displayName}
              onChange={(e) => updateSettings({ displayName: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
              placeholder="Enter your display name"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Bio</label>
            <textarea
              value={settings.bio}
              onChange={(e) => updateSettings({ bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Link className="w-5 h-5" />
          Social Links
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block flex items-center gap-2">
              <Twitter className="w-4 h-4" />
              Twitter
            </label>
            <input
              type="text"
              value={settings.socialLinks?.twitter || ''}
              onChange={(e) => updateSettings({
                socialLinks: { ...settings.socialLinks, twitter: e.target.value }
              })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
              placeholder="https://twitter.com/username"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </label>
            <input
              type="text"
              value={settings.socialLinks?.linkedin || ''}
              onChange={(e) => updateSettings({
                socialLinks: { ...settings.socialLinks, linkedin: e.target.value }
              })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
              placeholder="https://linkedin.com/in/username"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub
            </label>
            <input
              type="text"
              value={settings.socialLinks?.github || ''}
              onChange={(e) => updateSettings({
                socialLinks: { ...settings.socialLinks, github: e.target.value }
              })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
              placeholder="https://github.com/username"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationSettings = ({ settings, updateSettings, saving }) => {
  return (
    <div className="space-y-8">
      {/* Notification Channels */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Channels
        </h3>
        <div className="space-y-4">
          {NOTIFICATION_CHANNELS.map(channel => (
            <div key={channel.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <channel.icon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">{channel.label}</p>
                  <p className="text-sm text-gray-400">{channel.description}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationChannels?.[channel.id] || false}
                  onChange={(e) => updateSettings({
                    notificationChannels: {
                      ...settings.notificationChannels,
                      [channel.id]: e.target.checked
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Notification Preferences
        </h3>
        <div className="space-y-4">
          {NOTIFICATION_TYPES.map(type => (
            <div key={type.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="font-medium">{type.label}</p>
                <p className="text-sm text-gray-400">{type.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationTypes?.[type.id] || false}
                  onChange={(e) => updateSettings({
                    notificationTypes: {
                      ...settings.notificationTypes,
                      [type.id]: e.target.checked
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Moon className="w-5 h-5" />
          Quiet Hours
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Quiet Hours</p>
              <p className="text-sm text-gray-400">Pause notifications during specific hours</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.quietHours?.enabled || false}
                onChange={(e) => updateSettings({
                  quietHours: {
                    ...settings.quietHours,
                    enabled: e.target.checked
                  }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {settings.quietHours?.enabled && (
            <div className="flex gap-4 mt-4">
              <div className="flex-1">
                <label className="text-sm text-gray-400 mb-1 block">Start Time</label>
                <input
                  type="time"
                  value={settings.quietHours?.start || '22:00'}
                  onChange={(e) => updateSettings({
                    quietHours: {
                      ...settings.quietHours,
                      start: e.target.value
                    }
                  })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-400 mb-1 block">End Time</label>
                <input
                  type="time"
                  value={settings.quietHours?.end || '08:00'}
                  onChange={(e) => updateSettings({
                    quietHours: {
                      ...settings.quietHours,
                      end: e.target.value
                    }
                  })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Rules */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Advanced Notification Rules
        </h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Set up custom rules for when and how you receive notifications.
          </p>
          <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Custom Rule
          </button>
        </div>
      </div>
    </div>
  );
};

const PrivacySettings = ({ settings, updateSettings, saving }) => {
  const [exportingData, setExportingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleDataExport = async () => {
    setExportingData(true);
    try {
      // In a real app, this would trigger a data export process
      toast.success('Data export started. You will receive an email when it\'s ready.');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setExportingData(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeletingAccount(true);
    try {
      // In a real app, this would delete the account
      toast.success('Account deletion scheduled. You will receive a confirmation email.');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Visibility */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Profile Visibility
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Who can see your profile?</label>
            <select
              value={settings.profileVisibility}
              onChange={(e) => updateSettings({ profileVisibility: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
            >
              <option value="public">Everyone</option>
              <option value="school">School Community Only</option>
              <option value="private">Only Me</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="font-medium">Show Email Address</p>
              <p className="text-sm text-gray-400">Display your email on your profile</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showEmail || false}
                onChange={(e) => updateSettings({ showEmail: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Data & Analytics */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Data & Analytics
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="font-medium">Usage Analytics</p>
              <p className="text-sm text-gray-400">Help us improve by sharing anonymous usage data</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowAnalytics || false}
                onChange={(e) => updateSettings({ allowAnalytics: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Data Retention Period</label>
            <select
              value={settings.dataRetention}
              onChange={(e) => updateSettings({ dataRetention: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
              <option value={-1}>Forever</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Your Data
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Download a copy of all your data including events, RSVPs, and settings.
        </p>
        <button
          onClick={handleDataExport}
          disabled={exportingData}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg transition-all flex items-center gap-2"
        >
          {exportingData ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export Data
            </>
          )}
        </button>
      </div>

      {/* Account Deletion */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 border-red-500/20">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
          <Trash2 className="w-5 h-5" />
          Delete Account
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">
              <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
            </p>
          </div>
          
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Type <span className="font-mono text-red-400">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
              placeholder="Type DELETE"
            />
          </div>

          <button
            onClick={handleAccountDeletion}
            disabled={deleteConfirmation !== 'DELETE' || deletingAccount}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-2"
          >
            {deletingAccount ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const AppearanceSettings = ({ settings, updateSettings, saving }) => {
  const [customTheme, setCustomTheme] = useState(false);

  return (
    <div className="space-y-8">
      {/* Theme Selection */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Theme
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {THEME_PRESETS.map(theme => (
            <button
              key={theme.id}
              onClick={() => updateSettings({ theme: theme.id })}
              className={`p-4 rounded-lg border-2 transition-all ${
                settings.theme === theme.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <theme.icon className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">{theme.name}</p>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
          <div>
            <p className="font-medium">Custom Theme</p>
            <p className="text-sm text-gray-400">Create your own color scheme</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={customTheme}
              onChange={(e) => setCustomTheme(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        {customTheme && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.customColors?.primary || '#3B82F6'}
                  onChange={(e) => updateSettings({
                    customColors: { ...settings.customColors, primary: e.target.value }
                  })}
                  className="w-12 h-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.customColors?.primary || '#3B82F6'}
                  onChange={(e) => updateSettings({
                    customColors: { ...settings.customColors, primary: e.target.value }
                  })}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.customColors?.secondary || '#8B5CF6'}
                  onChange={(e) => updateSettings({
                    customColors: { ...settings.customColors, secondary: e.target.value }
                  })}
                  className="w-12 h-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.customColors?.secondary || '#8B5CF6'}
                  onChange={(e) => updateSettings({
                    customColors: { ...settings.customColors, secondary: e.target.value }
                  })}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.customColors?.accent || '#10B981'}
                  onChange={(e) => updateSettings({
                    customColors: { ...settings.customColors, accent: e.target.value }
                  })}
                  className="w-12 h-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.customColors?.accent || '#10B981'}
                  onChange={(e) => updateSettings({
                    customColors: { ...settings.customColors, accent: e.target.value }
                  })}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Language */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Language & Region
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Language</label>
            <select
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Typography
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Font Size</label>
            <select
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
            >
              <option value="small">Small</option>
              <option value="medium">Medium (Default)</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>

          <div className="p-4 bg-white/5 rounded-lg">
            <p className={`text-${settings.fontSize === 'small' ? 'sm' : settings.fontSize === 'large' ? 'lg' : settings.fontSize === 'extra-large' ? 'xl' : 'base'}`}>
              Preview: The quick brown fox jumps over the lazy dog.
            </p>
          </div>
        </div>
      </div>

      {/* Accessibility */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Accessibility className="w-5 h-5" />
          Accessibility
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="font-medium">Reduced Motion</p>
              <p className="text-sm text-gray-400">Minimize animations and transitions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.reducedMotion || false}
                onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="font-medium">High Contrast</p>
              <p className="text-sm text-gray-400">Increase contrast for better visibility</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.highContrast || false}
                onChange={(e) => updateSettings({ highContrast: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Color Blind Mode</label>
            <select
              value={settings.colorBlindMode}
              onChange={(e) => updateSettings({ colorBlindMode: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
            >
              <option value="none">None</option>
              <option value="protanopia">Protanopia (Red-Green)</option>
              <option value="deuteranopia">Deuteranopia (Red-Green)</option>
              <option value="tritanopia">Tritanopia (Blue-Yellow)</option>
              <option value="achromatopsia">Achromatopsia (Complete)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

const IntegrationSettings = ({ settings, updateSettings, saving }) => {
  const [generatingKey, setGeneratingKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState({});

  const generateApiKey = async () => {
    setGeneratingKey(true);
    try {
      // Generate a random API key
      const key = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const newKey = {
        id: Date.now(),
        name: `API Key ${(settings.apiKeys?.length || 0) + 1}`,
        key,
        created: new Date().toISOString(),
        lastUsed: null
      };

      updateSettings({
        apiKeys: [...(settings.apiKeys || []), newKey]
      }, true);

      toast.success('API key generated successfully');
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('Failed to generate API key');
    } finally {
      setGeneratingKey(false);
    }
  };

  const deleteApiKey = (keyId) => {
    updateSettings({
      apiKeys: settings.apiKeys.filter(k => k.id !== keyId)
    }, true);
    toast.success('API key deleted');
  };

  const copyApiKey = (key) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  };

  const toggleIntegration = (integrationId) => {
    const connected = settings.connectedIntegrations?.includes(integrationId);
    if (connected) {
      updateSettings({
        connectedIntegrations: settings.connectedIntegrations.filter(id => id !== integrationId)
      }, true);
      toast.success('Integration disconnected');
    } else {
      updateSettings({
        connectedIntegrations: [...(settings.connectedIntegrations || []), integrationId]
      }, true);
      toast.success('Integration connected');
    }
  };

  return (
    <div className="space-y-8">
      {/* Calendar Integrations */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Calendar Integrations
        </h3>
        <div className="space-y-4">
          {INTEGRATIONS.filter(i => i.icon === Calendar).map(integration => (
            <div key={integration.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <integration.icon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">{integration.name}</p>
                  <p className="text-sm text-gray-400">
                    {settings.connectedIntegrations?.includes(integration.id) ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleIntegration(integration.id)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  settings.connectedIntegrations?.includes(integration.id)
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {settings.connectedIntegrations?.includes(integration.id) ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Other Integrations */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Other Integrations
        </h3>
        <div className="space-y-4">
          {INTEGRATIONS.filter(i => i.icon !== Calendar).map(integration => (
            <div key={integration.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <integration.icon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">{integration.name}</p>
                  <p className="text-sm text-gray-400">
                    {settings.connectedIntegrations?.includes(integration.id) ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleIntegration(integration.id)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  settings.connectedIntegrations?.includes(integration.id)
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {settings.connectedIntegrations?.includes(integration.id) ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" />
          API Keys
        </h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Generate API keys to integrate with external services and applications.
          </p>

          {settings.apiKeys?.length > 0 && (
            <div className="space-y-2">
              {settings.apiKeys.map(apiKey => (
                <div key={apiKey.id} className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{apiKey.name}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyApiKey(apiKey.key)}
                        className="p-1 hover:bg-white/10 rounded"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteApiKey(apiKey.id)}
                        className="p-1 hover:bg-white/10 rounded text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-black/20 px-2 py-1 rounded font-mono overflow-hidden">
                      {showApiKey[apiKey.id] ? apiKey.key : '•'.repeat(32)}
                    </code>
                    <button
                      onClick={() => setShowApiKey({ ...showApiKey, [apiKey.id]: !showApiKey[apiKey.id] })}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      {showApiKey[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Created: {new Date(apiKey.created).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={generateApiKey}
            disabled={generatingKey}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg transition-all flex items-center gap-2"
          >
            {generatingKey ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Generate New Key
              </>
            )}
          </button>
        </div>
      </div>

      {/* Webhooks */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Webhooks
        </h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Configure webhooks to receive real-time notifications about events in your account.
          </p>
          <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Webhook
          </button>
        </div>
      </div>
    </div>
  );
};

const BillingSettings = ({ settings, updateSettings, saving }) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      features: ['Basic features', 'Up to 10 events', 'Email support']
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$9.99/mo',
      features: ['All features', 'Unlimited events', 'Priority support', 'API access']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      features: ['Custom features', 'Dedicated support', 'SLA', 'Custom integrations']
    }
  ];

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Current Plan
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`p-6 rounded-lg border-2 transition-all ${
                settings.subscription?.plan === plan.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <h4 className="text-lg font-semibold mb-2">{plan.name}</h4>
              <p className="text-2xl font-bold mb-4">{plan.price}</p>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              {settings.subscription?.plan === plan.id ? (
                <div className="mt-4 text-center text-sm text-gray-400">Current Plan</div>
              ) : (
                <button className="w-full mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-all">
                  {plan.id === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Method
        </h3>
        {settings.paymentMethod ? (
          <div className="p-4 bg-white/5 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-gray-400" />
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-gray-400">Expires 12/24</p>
              </div>
            </div>
            <button className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 rounded-lg transition-all">
              Update
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              No payment method on file. Add one to upgrade your plan.
            </p>
            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Payment Method
            </button>
          </div>
        )}
      </div>

      {/* Billing History */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <History className="w-5 h-5" />
          Billing History
        </h3>
        <div className="space-y-2">
          <div className="p-4 bg-white/5 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium">Pro Plan - Monthly</p>
              <p className="text-sm text-gray-400">January 1, 2025</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">$9.99</span>
              <button className="p-1 hover:bg-white/10 rounded">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Email */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Billing Email
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Email for receipts</label>
            <input
              type="email"
              value={settings.billingEmail}
              onChange={(e) => updateSettings({ billingEmail: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity Log Component
const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      // In a real app, this would fetch from an activity log table
      setActivities([
        { id: 1, action: 'Settings updated', details: 'Theme changed to dark', timestamp: new Date().toISOString() },
        { id: 2, action: 'Password changed', details: 'Password successfully updated', timestamp: new Date(Date.now() - 86400000).toISOString() },
        { id: 3, action: 'API key created', details: 'New API key generated', timestamp: new Date(Date.now() - 172800000).toISOString() }
      ]);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        Recent Activity
      </h3>
      <div className="space-y-2">
        {activities.map(activity => (
          <div key={activity.id} className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{activity.action}</p>
                <p className="text-sm text-gray-400">{activity.details}</p>
              </div>
              <p className="text-sm text-gray-500">
                {new Date(activity.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Keyboard shortcuts
const KEYBOARD_SHORTCUTS = [
  { keys: ['Cmd', 'K'], action: 'Open search' },
  { keys: ['Cmd', 'S'], action: 'Save settings' },
  { keys: ['Cmd', 'Z'], action: 'Undo' },
  { keys: ['Cmd', 'Shift', 'Z'], action: 'Redo' },
  { keys: ['Esc'], action: 'Close dialogs' }
];

// Main component
export default function AdvancedSettings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('account');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const {
    settings,
    loading,
    saving,
    updateSettings,
    undo,
    redo,
    canUndo,
    canRedo
  } = useSettings();

  const searchResults = useSettingsSearch(searchQuery);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }

      // Cmd/Ctrl + S to save (though we auto-save)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        toast.success('Settings are automatically saved');
      }

      // Cmd/Ctrl + Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }

      // Cmd/Ctrl + Shift + Z for redo
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (canRedo) redo();
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowShortcuts(false);
        setShowActivityLog(false);
      }

      // ? for shortcuts help
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        setShowShortcuts(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  // Handle responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
    }
  }, [user, navigate]);

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountSettings settings={settings} updateSettings={updateSettings} saving={saving} />;
      case 'profile':
        return <ProfileSettings settings={settings} updateSettings={updateSettings} saving={saving} />;
      case 'notifications':
        return <NotificationSettings settings={settings} updateSettings={updateSettings} saving={saving} />;
      case 'privacy':
        return <PrivacySettings settings={settings} updateSettings={updateSettings} saving={saving} />;
      case 'appearance':
        return <AppearanceSettings settings={settings} updateSettings={updateSettings} saving={saving} />;
      case 'integrations':
        return <IntegrationSettings settings={settings} updateSettings={updateSettings} saving={saving} />;
      case 'billing':
        return <BillingSettings settings={settings} updateSettings={updateSettings} saving={saving} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <SophisticatedHeader />
      
      {/* Settings Header */}
      <div className="sticky top-16 z-40 bg-gray-900/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h1 className="text-xl font-semibold">Settings</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Button */}
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Activity Log */}
              <button
                onClick={() => setShowActivityLog(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Activity className="w-5 h-5" />
              </button>

              {/* Keyboard Shortcuts */}
              <button
                onClick={() => setShowShortcuts(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Keyboard className="w-5 h-5" />
              </button>

              {/* Undo/Redo */}
              <div className="flex items-center gap-1 border-l border-white/10 pl-3">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Redo className="w-4 h-4" />
                </button>
              </div>

              {/* Save Indicator */}
              {saving && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Hidden on mobile */}
          {!isMobile && (
            <aside className="w-64 shrink-0">
              <nav className="sticky top-32 space-y-1">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-500/20 text-blue-400 border-l-4 border-blue-500'
                        : 'hover:bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </aside>
          )}

          {/* Mobile Tab Selector */}
          {isMobile && (
            <div className="w-full mb-6">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg"
              >
                {TABS.map(tab => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20"
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search settings..."
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="max-h-96 overflow-y-auto">
                  {searchResults.map(result => (
                    <button
                      key={result.id}
                      onClick={() => {
                        setActiveTab(result.tabId);
                        setShowSearch(false);
                        setSearchQuery('');
                      }}
                      className="w-full px-4 py-3 hover:bg-white/5 transition-colors text-left"
                    >
                      <p className="font-medium">{result.label}</p>
                      <p className="text-sm text-gray-400">
                        {result.path.join(' › ')}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <p>No results found for "{searchQuery}"</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h3>
              <div className="space-y-2">
                {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between p-2">
                    <span className="text-gray-400">{shortcut.action}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <React.Fragment key={i}>
                          <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-gray-500">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Log Modal */}
      <AnimatePresence>
        {showActivityLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowActivityLog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <ActivityLog />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}