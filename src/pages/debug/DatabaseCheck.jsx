import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'

export default function DatabaseCheck() {
  const { user } = useAuthStore()
  const [data, setData] = useState({
    districts: [],
    schools: [],
    events: [],
    profiles: [],
    userInfo: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkDatabase()
  }, [user])

  async function checkDatabase() {
    try {
      // Check districts
      const { data: districts, error: districtError } = await supabase
        .from('districts')
        .select('*')
      
      // Check schools
      const { data: schools, error: schoolError } = await supabase
        .from('schools')
        .select('*')
      
      // Check events
      const { data: events, error: eventError } = await supabase
        .from('events')
        .select('*')
      
      // Check profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')

      setData({
        districts: districts || [],
        schools: schools || [],
        events: events || [],
        profiles: profiles || [],
        userInfo: user,
        errors: {
          districts: districtError,
          schools: schoolError,
          events: eventError,
          profiles: profileError
        }
      })
    } catch (error) {
      console.error('Database check error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading database info...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Database Diagnostic</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Current User</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(data.userInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Districts ({data.districts.length})</h2>
          {data.errors?.districts && (
            <div className="text-red-600 mb-2">Error: {data.errors.districts.message}</div>
          )}
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(data.districts, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Schools ({data.schools.length})</h2>
          {data.errors?.schools && (
            <div className="text-red-600 mb-2">Error: {data.errors.schools.message}</div>
          )}
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(data.schools, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Events ({data.events.length})</h2>
          {data.errors?.events && (
            <div className="text-red-600 mb-2">Error: {data.errors.events.message}</div>
          )}
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(data.events, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Profiles ({data.profiles.length})</h2>
          {data.errors?.profiles && (
            <div className="text-red-600 mb-2">Error: {data.errors.profiles.message}</div>
          )}
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(data.profiles, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}