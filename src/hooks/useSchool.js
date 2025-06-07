import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'

export function useSchool() {
  const { user } = useAuthStore()
  const [school, setSchool] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.id) {
      fetchSchool()
    }
  }, [user?.id])

  async function fetchSchool() {
    try {
      setLoading(true)
      
      // First get the user's profile to find their school
      let profile = null
      let profileError = null
      
      // Try to get all profile data first to check what columns exist
      const { data: fullProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (checkError?.code === 'PGRST116') {
        // No rows found - try with user_id column
        const { data: altProfile, error: altError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (!altError && altProfile) {
          profile = altProfile
        } else {
          profileError = altError || checkError
        }
      } else if (!checkError && fullProfile) {
        profile = fullProfile
      } else {
        profileError = checkError
      }

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        // Don't throw - just log and return
        return
      }

      // Check if school_id exists in the profile
      if (profile && 'school_id' in profile && profile.school_id) {
        // Get the school details
        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .select(`
            *,
            district:districts(id, name, region)
          `)
          .eq('id', profile.school_id)
          .single()

        if (schoolError) {
          console.error('School fetch error:', schoolError)
          setError(schoolError.message)
        } else {
          setSchool(schoolData)
        }
      } else {
        console.warn('No school_id found in user profile or school_id is null')
      }
    } catch (err) {
      console.error('Error fetching school:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { school, loading, error }
}