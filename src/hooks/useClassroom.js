import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export function useClassroom() {
  const { user, profile } = useAuthStore()
  const [classroom, setClassroom] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.id && profile?.role === 'teacher') {
      fetchClassroomData()
    }
  }, [user?.id, profile?.role])

  async function fetchClassroomData() {
    try {
      setLoading(true)
      
      // Get teacher's classroom
      const { data: classroomData, error: classroomError } = await supabase
        .from('classrooms')
        .select(`
          *,
          school:schools(name, logo_url)
        `)
        .eq('teacher_id', user.id)
        .single()

      if (classroomError) {
        // If no classroom exists, teacher might not be assigned yet
        console.log('No classroom assigned to teacher')
        setClassroom(null)
        setStudents([])
        return
      }

      setClassroom(classroomData)

      // Get students in the classroom
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          academic_records(
            gpa,
            attendance_rate,
            grade_level
          )
        `)
        .eq('classroom_id', classroomData.id)
        .order('last_name')

      if (studentsError) throw studentsError

      // Process student data
      const processedStudents = studentsData?.map(student => ({
        ...student,
        current_gpa: student.academic_records?.[0]?.gpa || null,
        attendance_rate: student.academic_records?.[0]?.attendance_rate || null,
      })) || []

      setStudents(processedStudents)
    } catch (err) {
      console.error('Error fetching classroom data:', err)
      setError(err.message)
      toast.error('Failed to load classroom data')
    } finally {
      setLoading(false)
    }
  }

  async function updateStudentGrade(studentId, gradeData) {
    try {
      const { data, error } = await supabase
        .from('academic_records')
        .insert([{
          student_id: studentId,
          teacher_id: user.id,
          ...gradeData,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single()

      if (error) throw error
      
      await fetchClassroomData()
      toast.success('Grade updated successfully')
      return { success: true, data }
    } catch (err) {
      console.error('Error updating grade:', err)
      toast.error('Failed to update grade')
      return { success: false, error: err.message }
    }
  }

  async function markAttendance(attendanceData) {
    try {
      // Batch insert attendance records
      const records = attendanceData.map(record => ({
        ...record,
        teacher_id: user.id,
        marked_at: new Date().toISOString(),
      }))

      const { error } = await supabase
        .from('attendance_records')
        .insert(records)

      if (error) throw error
      
      toast.success('Attendance marked successfully')
      return { success: true }
    } catch (err) {
      console.error('Error marking attendance:', err)
      toast.error('Failed to mark attendance')
      return { success: false, error: err.message }
    }
  }

  async function sendParentMessage(studentId, message) {
    try {
      // Get student's parent ID
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('parent_id, first_name, last_name')
        .eq('id', studentId)
        .single()

      if (studentError) throw studentError

      const { data, error } = await supabase
        .from('parent_communications')
        .insert([{
          parent_id: student.parent_id,
          sender_id: user.id,
          student_id: studentId,
          ...message,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single()

      if (error) throw error
      
      toast.success('Message sent to parent')
      return { success: true, data }
    } catch (err) {
      console.error('Error sending parent message:', err)
      toast.error('Failed to send message')
      return { success: false, error: err.message }
    }
  }

  // Calculate classroom statistics
  const classStats = {
    totalStudents: students.length,
    averageGPA: students.reduce((sum, s) => sum + (s.current_gpa || 0), 0) / students.length || 0,
    averageAttendance: students.reduce((sum, s) => sum + (s.attendance_rate || 0), 0) / students.length || 0,
    gradeLevel: classroom?.grade_level || 'N/A',
  }

  return {
    classroom,
    students,
    classStats,
    loading,
    error,
    refetch: fetchClassroomData,
    updateStudentGrade,
    markAttendance,
    sendParentMessage,
  }
}