import { create } from 'zustand'
import { supabase, getUser, getSession } from '../lib/supabase'

const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      set({ loading: true })
      const session = await getSession()
      const user = await getUser()
      
      if (user) {
        // Fetch user profile - try user_id first, then id for backward compatibility
        let profile = null
        let error = null
        
        // Query with id (the actual column name in production)
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        profile = data
        error = fetchError
        
        if (error && error.code !== 'PGRST116') {
          console.error('Profile fetch error:', error)
        }
        
        // If no profile exists, create one
        if (!profile && user) {
          console.log('Creating profile for user:', user.id)
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              email: user.email,
              full_name: user.email?.split('@')[0] || 'User',
              role: 'parent', // Default role
              created_at: new Date().toISOString()
            }])
            .select()
            .single()
          
          if (newProfile) {
            profile = newProfile
          } else if (createError) {
            console.error('Profile creation error:', createError)
          }
        }
        
        set({ user, session, profile, loading: false })
      } else {
        set({ user: null, session: null, profile: null, loading: false })
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ error: error.message, loading: false })
    }
  },

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  
  updateProfile: async (updates) => {
    const { user, profile } = get()
    if (!user) return { error: 'No user logged in' }
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    
    if (data) {
      set({ profile: data })
    }
    
    return { data, error }
  },

  clearAuth: () => set({ 
    user: null, 
    session: null, 
    profile: null, 
    error: null 
  }),

  logout: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error)
      return { error }
    }
    // clearAuth will be called by the auth state listener
    return { error: null }
  },
}))

// Auth state listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    useAuthStore.getState().setSession(session)
    useAuthStore.getState().setUser(session.user)
    useAuthStore.getState().initialize()
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.getState().clearAuth()
  }
})

export default useAuthStore
export { useAuthStore }