import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import useAuthStore from '../../store/authStore'
import SearchModal from '../common/SearchModal'
import NotificationsDropdown from '../common/NotificationsDropdown'
import SettingsDropdown from '../common/SettingsDropdown'

export default function DashboardHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuthStore()
  const [searchOpen, setSearchOpen] = useState(false)

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/explore', label: 'Events' },
    { path: '/tickets', label: 'Tickets' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/support', label: 'Support' }
  ]

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/')
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      <header className="bg-white border-b">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate('/')}
              >
                <CalendarDaysIcon className="h-6 w-6" />
                <span className="text-xl font-semibold">YowTix</span>
              </div>
              
              <nav className="flex items-center gap-6">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      isActive(item.path)
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSearchOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
              <NotificationsDropdown />
              <SettingsDropdown />
              
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-lg p-1"
                onClick={() => navigate('/profile')}
              >
                <img 
                  src={profile?.avatar_url || `https://i.pravatar.cc/150?u=${user?.email}`}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500">
                    {profile?.role === 'school_admin' ? 'School Admin' : 
                     profile?.role === 'teacher' ? 'Teacher' : 
                     profile?.role === 'parent' ? 'Parent' : 'Manager'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}