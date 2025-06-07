import { supabase } from '../lib/supabase'

/**
 * Utility function to query profiles table with backward compatibility
 * Handles both 'user_id' (original schema) and 'id' (production schema) column names
 */
export async function queryProfiles(query, userId) {
  // First try with user_id (original schema)
  const result1 = await query.eq('user_id', userId)
  
  if (result1.data) {
    return result1
  } else if (result1.error?.code === '42703') {
    // Column doesn't exist error - try with id column
    return await query.eq('id', userId)
  }
  
  return result1
}

/**
 * Query profiles by multiple user IDs with backward compatibility
 */
export async function queryProfilesByIds(userIds) {
  if (!userIds || userIds.length === 0) {
    return { data: [], error: null }
  }

  // First try with user_id column
  const result1 = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', userIds)
  
  if (result1.data && result1.data.length > 0) {
    return result1
  } else if (result1.error?.code === '42703') {
    // Column doesn't exist - try id column
    const result2 = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds)
    
    // Map id to user_id for consistency in the application
    if (result2.data) {
      result2.data = result2.data.map(profile => ({
        ...profile,
        user_id: profile.id || profile.user_id
      }))
    }
    
    return result2
  }
  
  return result1
}

/**
 * Get the profile ID column name (either 'user_id' or 'id')
 * This is cached after the first successful query
 */
let profileIdColumn = null

export async function getProfileIdColumn() {
  if (profileIdColumn) {
    return profileIdColumn
  }

  // Check which column exists
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
  
  if (data && data.length > 0) {
    profileIdColumn = data[0].hasOwnProperty('user_id') ? 'user_id' : 'id'
    return profileIdColumn
  }
  
  // Default to user_id if we can't determine
  return 'user_id'
}