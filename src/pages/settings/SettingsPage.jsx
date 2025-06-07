import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BellIcon, 
  MoonIcon, 
  GlobeAltIcon, 
  ShieldCheckIcon,
  KeyIcon,
  UserIcon,
  ChevronRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { MoonIcon as MoonSolidIcon, SunIcon } from '@heroicons/react/24/solid';
import Header from '../../components/layout/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useUserSettings } from '../../hooks/useUserSettings';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { settings, loading, saving, updateSettings, updateTheme } = useUserSettings();
  const [activeSection, setActiveSection] = useState('notifications');

  const handleToggle = async (field, value) => {
    const result = await updateSettings({ [field]: value });
    if (result.success) {
      toast.success('Settings updated');
    } else {
      toast.error('Failed to update settings');
    }
  };

  const handleThemeChange = async (theme) => {
    const result = await updateTheme(theme);
    if (result.success) {
      toast.success(`Theme changed to ${theme}`);
    }
  };

  const sections = [
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'appearance', label: 'Appearance', icon: MoonIcon },
    { id: 'language', label: 'Language & Region', icon: GlobeAltIcon },
    { id: 'privacy', label: 'Privacy & Security', icon: ShieldCheckIcon },
    { id: 'account', label: 'Account', icon: UserIcon }
  ];

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading settings..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <section.icon className="h-5 w-5" />
                  {section.label}
                  <ChevronRightIcon className="h-4 w-4 ml-auto" />
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {activeSection === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Receive email updates about events and activities
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggle('email_notifications', !settings?.email_notifications)}
                        disabled={saving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings?.email_notifications ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings?.email_notifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Push Notifications</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Get push notifications on your mobile device
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggle('push_notifications', !settings?.push_notifications)}
                        disabled={saving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings?.push_notifications ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings?.push_notifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-medium text-gray-900 mb-4">Notification Types</h3>
                      <div className="space-y-3">
                        {['New Events', 'Event Reminders', 'RSVP Updates', 'System Updates'].map((type) => (
                          <label key={type} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'appearance' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Appearance</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Theme</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: 'light', label: 'Light', icon: SunIcon },
                          { value: 'dark', label: 'Dark', icon: MoonSolidIcon },
                          { value: 'auto', label: 'System', icon: null }
                        ].map((theme) => (
                          <button
                            key={theme.value}
                            onClick={() => handleThemeChange(theme.value)}
                            disabled={saving}
                            className={`relative p-4 rounded-lg border-2 transition-all ${
                              settings?.theme === theme.value
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {theme.icon && <theme.icon className="h-6 w-6 mx-auto mb-2 text-gray-700" />}
                            <span className="text-sm font-medium">{theme.label}</span>
                            {settings?.theme === theme.value && (
                              <CheckIcon className="absolute top-2 right-2 h-4 w-4 text-indigo-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'language' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Language & Region</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={settings?.language || 'en'}
                        onChange={(e) => handleToggle('language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={settings?.timezone || 'UTC'}
                        onChange={(e) => handleToggle('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'privacy' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Privacy & Security</h2>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Add an extra layer of security to your account
                      </p>
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        Enable 2FA
                      </button>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Data & Privacy</h3>
                      <div className="space-y-3">
                        <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Download my data</span>
                            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        </button>
                        <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Privacy policy</span>
                            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'account' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Account Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <p className="text-sm text-gray-900">{user?.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <p className="text-sm text-gray-900">{profile?.full_name || 'Not set'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <p className="text-sm text-gray-900 capitalize">{profile?.role?.replace('_', ' ') || 'User'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-medium text-gray-900 mb-4">Danger Zone</h3>
                      <button className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}