import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { useSchool } from '../../hooks/useSchool'
import { useEvents } from '../../hooks/useEvents'
import Header from '../../components/layout/Header'

export default function SimpleDashboard() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { school, loading: schoolLoading, error: schoolError } = useSchool()
  const { events, loading: eventsLoading, error: eventsError } = useEvents({
    school_id: school?.id
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8 pt-24">
        <h1 className="text-2xl font-bold mb-8">Dashboard Debug Info</h1>
        
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">User Info</h2>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify({ user: user?.email, userId: user?.id }, null, 2)}
            </pre>
          </div>

          {/* Profile Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Profile Info</h2>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(profile, null, 2)}
            </pre>
            {!profile?.school_id && (
              <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded">
                ⚠️ No school_id assigned to profile. Run this SQL in Supabase:
                <pre className="mt-2 text-xs bg-yellow-200 p-2 rounded">
{`UPDATE profiles 
SET school_id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
    role = 'school_admin'
WHERE user_id = '${user?.id}';`}
                </pre>
              </div>
            )}
          </div>

          {/* School Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">School Info</h2>
            {schoolLoading ? (
              <p>Loading school...</p>
            ) : schoolError ? (
              <p className="text-red-600">Error: {schoolError}</p>
            ) : (
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(school, null, 2)}
              </pre>
            )}
          </div>

          {/* Events Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Events ({events?.length || 0})</h2>
            {eventsLoading ? (
              <p>Loading events...</p>
            ) : eventsError ? (
              <p className="text-red-600">Error: {eventsError}</p>
            ) : (
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(events, null, 2)}
              </pre>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Real Dashboard
              </button>
              <button
                onClick={() => navigate('/debug')}
                className="ml-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Database Debug
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}