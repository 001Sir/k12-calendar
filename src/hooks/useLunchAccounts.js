import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export function useLunchAccounts() {
  const { user } = useAuthStore()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.id) {
      fetchLunchAccounts()
    }
  }, [user?.id])

  async function fetchLunchAccounts() {
    try {
      setLoading(true)
      
      // Get all students for this parent
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('parent_id', user.id)

      if (studentsError) throw studentsError

      // For now, return empty arrays since lunch tables don't exist
      // This prevents errors while maintaining the component structure
      setAccounts([])
      setTransactions([])
      
      // You can implement lunch account functionality when tables are created
      console.log('Lunch account tables not yet implemented')
    } catch (err) {
      console.error('Error fetching lunch accounts:', err)
      setError(err.message)
      // Don't show error toast for missing tables
      if (!err.message.includes('does not exist')) {
        toast.error('Failed to load lunch accounts')
      }
    } finally {
      setLoading(false)
    }
  }

  async function addFunds(studentId, amount, paymentMethod = 'credit_card') {
    // Placeholder - implement when lunch tables are created
    toast.info('Lunch account functionality coming soon')
    return { success: false, error: 'Lunch accounts not yet implemented' }
  }

  async function setAutoReload(studentId, enabled, amount = 20, threshold = 5) {
    // Placeholder - implement when lunch tables are created
    toast.info('Lunch account functionality coming soon')
    return { success: false, error: 'Lunch accounts not yet implemented' }
  }

  async function getTransactionHistory(studentId, limit = 50) {
    // Return empty array for now
    return []
  }

  async function downloadStatement(studentId, startDate, endDate) {
    toast.info('Lunch account statements coming soon')
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
  const lowBalanceAccounts = accounts.filter(acc => acc.balance < 5)

  return {
    accounts,
    transactions,
    loading,
    error,
    totalBalance,
    lowBalanceAccounts,
    refetch: fetchLunchAccounts,
    addFunds,
    setAutoReload,
    getTransactionHistory,
    downloadStatement
  }
}