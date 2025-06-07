import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function TestDashboard() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()

  const testRoutes = [
    { path: '/dashboard', label: 'Dashboard', color: 'bg-indigo-600' },
    { path: '/explore', label: 'Events Explore', color: 'bg-green-600' },
    { path: '/tickets', label: 'My Tickets', color: 'bg-blue-600' },
    { path: '/analytics', label: 'Analytics', color: 'bg-purple-600' },
    { path: '/support', label: 'Support Center', color: 'bg-yellow-600' },
    { path: '/profile', label: 'User Profile', color: 'bg-pink-600' },
    { path: '/events/create', label: 'Create Event', color: 'bg-red-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Dashboard Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Current User Info</h2>
          <p><strong>Email:</strong> {user?.email || 'Not logged in'}</p>
          <p><strong>Name:</strong> {profile?.full_name || 'N/A'}</p>
          <p><strong>Role:</strong> {profile?.role || 'N/A'}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {testRoutes.map((route) => (
              <button
                key={route.path}
                onClick={() => navigate(route.path)}
                className={`${route.color} text-white px-4 py-3 rounded-lg hover:opacity-90 transition-opacity`}
              >
                {route.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 underline"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    </div>
  )
}