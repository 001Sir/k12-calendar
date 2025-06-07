import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export function useCommunications() {
  const { user } = useAuthStore()
  const [communications, setCommunications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user?.id) {
      fetchCommunications()
      subscribeToUpdates()
    }
  }, [user?.id])

  async function fetchCommunications() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('parent_communications')
        .select(`
          *,
          sender:profiles!sender_id(full_name, avatar_url, role),
          student:students(first_name, last_name)
        `)
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCommunications(data || [])
      
      // Count unread messages
      const unread = data?.filter(comm => !comm.read_at).length || 0
      setUnreadCount(unread)
    } catch (err) {
      console.error('Error fetching communications:', err)
      setError(err.message)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  function subscribeToUpdates() {
    const channel = supabase
      .channel('parent-communications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'parent_communications',
          filter: `parent_id=eq.${user.id}`
        },
        (payload) => {
          toast.info('New message received')
          fetchCommunications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  async function markAsRead(communicationId) {
    try {
      const { error } = await supabase
        .from('parent_communications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', communicationId)
        .eq('parent_id', user.id)

      if (error) throw error
      
      await fetchCommunications()
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  async function markAllAsRead() {
    try {
      const { error } = await supabase
        .from('parent_communications')
        .update({ read_at: new Date().toISOString() })
        .eq('parent_id', user.id)
        .is('read_at', null)

      if (error) throw error
      
      await fetchCommunications()
      toast.success('All messages marked as read')
    } catch (err) {
      console.error('Error marking all as read:', err)
      toast.error('Failed to mark messages as read')
    }
  }

  async function sendReply(communicationId, message) {
    try {
      // Find original communication
      const original = communications.find(c => c.id === communicationId)
      if (!original) throw new Error('Communication not found')

      const { data, error } = await supabase
        .from('parent_communications')
        .insert([{
          parent_id: original.sender_id,
          sender_id: user.id,
          student_id: original.student_id,
          subject: `Re: ${original.subject}`,
          message,
          priority: 'medium',
          category: original.category,
          related_to: communicationId
        }])
        .select()
        .single()

      if (error) throw error
      
      toast.success('Reply sent successfully')
      return { success: true, data }
    } catch (err) {
      console.error('Error sending reply:', err)
      toast.error('Failed to send reply')
      return { success: false, error: err.message }
    }
  }

  async function archiveCommunication(communicationId) {
    try {
      const { error } = await supabase
        .from('parent_communications')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', communicationId)
        .eq('parent_id', user.id)

      if (error) throw error
      
      await fetchCommunications()
      toast.success('Message archived')
    } catch (err) {
      console.error('Error archiving communication:', err)
      toast.error('Failed to archive message')
    }
  }

  return {
    communications,
    loading,
    error,
    unreadCount,
    refetch: fetchCommunications,
    markAsRead,
    markAllAsRead,
    sendReply,
    archiveCommunication
  }
}