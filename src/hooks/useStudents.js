import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export function useStudents() {
  const { user } = useAuthStore()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.id) {
      fetchStudents()
    }
  }, [user?.id])

  async function fetchStudents() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          school:schools(name)
        `)
        .eq('parent_id', user.id)
        .order('first_name')

      if (error) throw error

      // Process data using existing student fields
      const processedData = data?.map(student => ({
        ...student,
        current_grade: student.grade_level,
        current_gpa: student.current_gpa || null,
        attendance_rate: student.attendance_rate || null
      })) || []

      setStudents(processedData)
    } catch (err) {
      console.error('Error fetching students:', err)
      setError(err.message)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  async function addStudent(studentData) {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{ ...studentData, parent_id: user.id }])
        .select()
        .single()

      if (error) throw error
      
      await fetchStudents()
      toast.success('Student added successfully')
      return { success: true, data }
    } catch (err) {
      console.error('Error adding student:', err)
      toast.error('Failed to add student')
      return { success: false, error: err.message }
    }
  }

  async function updateStudent(studentId, updates) {
    try {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', studentId)
        .eq('parent_id', user.id)
        .select()
        .single()

      if (error) throw error
      
      await fetchStudents()
      toast.success('Student updated successfully')
      return { success: true, data }
    } catch (err) {
      console.error('Error updating student:', err)
      toast.error('Failed to update student')
      return { success: false, error: err.message }
    }
  }

  async function removeStudent(studentId) {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)
        .eq('parent_id', user.id)

      if (error) throw error
      
      await fetchStudents()
      toast.success('Student removed successfully')
      return { success: true }
    } catch (err) {
      console.error('Error removing student:', err)
      toast.error('Failed to remove student')
      return { success: false, error: err.message }
    }
  }

  return {
    students,
    loading,
    error,
    refetch: fetchStudents,
    addStudent,
    updateStudent,
    removeStudent
  }
}