import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export function useSchoolManagement() {
  const { user, profile } = useAuthStore()
  const [school, setSchool] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.id && ['school_admin', 'district_admin'].includes(profile?.role)) {
      fetchSchoolData()
    }
  }, [user?.id, profile?.role])

  async function fetchSchoolData() {
    try {
      setLoading(true)
      
      // Get school info
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select(`
          *,
          district:districts(name)
        `)
        .eq('id', profile.school_id)
        .single()

      if (schoolError) throw schoolError
      setSchool(schoolData)

      // Get all teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('school_id', profile.school_id)
        .eq('role', 'teacher')
        .order('full_name')

      if (teachersError) throw teachersError
      setTeachers(teachersData || [])

      // Get all students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          parent:profiles!parent_id(full_name, email, phone),
          classroom:classrooms(name, grade_level)
        `)
        .eq('school_id', profile.school_id)
        .order('last_name')

      if (studentsError) throw studentsError
      setStudents(studentsData || [])

      // Get all classrooms
      const { data: classroomsData, error: classroomsError } = await supabase
        .from('classrooms')
        .select(`
          *,
          teacher:profiles!teacher_id(full_name),
          students(count)
        `)
        .eq('school_id', profile.school_id)
        .order('grade_level', { ascending: true })

      if (classroomsError) throw classroomsError
      
      const processedClassrooms = classroomsData?.map(classroom => ({
        ...classroom,
        student_count: classroom.students?.[0]?.count || 0,
      })) || []
      
      setClassrooms(processedClassrooms)
    } catch (err) {
      console.error('Error fetching school data:', err)
      setError(err.message)
      toast.error('Failed to load school data')
    } finally {
      setLoading(false)
    }
  }

  async function inviteTeacher(teacherData) {
    try {
      // Create invitation
      const { data, error } = await supabase
        .from('teacher_invitations')
        .insert([{
          email: teacherData.email,
          school_id: profile.school_id,
          invited_by: user.id,
          invitation_token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        }])
        .select()
        .single()

      if (error) throw error
      
      // Send invitation email (implement email service)
      console.log('Sending invitation to:', teacherData.email)
      
      toast.success('Teacher invitation sent')
      return { success: true, data }
    } catch (err) {
      console.error('Error inviting teacher:', err)
      toast.error('Failed to send invitation')
      return { success: false, error: err.message }
    }
  }

  async function createClassroom(classroomData) {
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .insert([{
          ...classroomData,
          school_id: profile.school_id,
        }])
        .select()
        .single()

      if (error) throw error
      
      await fetchSchoolData()
      toast.success('Classroom created successfully')
      return { success: true, data }
    } catch (err) {
      console.error('Error creating classroom:', err)
      toast.error('Failed to create classroom')
      return { success: false, error: err.message }
    }
  }

  async function assignTeacherToClassroom(classroomId, teacherId) {
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .update({ teacher_id: teacherId })
        .eq('id', classroomId)
        .eq('school_id', profile.school_id)
        .select()
        .single()

      if (error) throw error
      
      await fetchSchoolData()
      toast.success('Teacher assigned successfully')
      return { success: true, data }
    } catch (err) {
      console.error('Error assigning teacher:', err)
      toast.error('Failed to assign teacher')
      return { success: false, error: err.message }
    }
  }

  async function enrollStudent(studentData) {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          ...studentData,
          school_id: profile.school_id,
          enrollment_date: new Date().toISOString(),
          status: 'active',
        }])
        .select()
        .single()

      if (error) throw error
      
      await fetchSchoolData()
      toast.success('Student enrolled successfully')
      return { success: true, data }
    } catch (err) {
      console.error('Error enrolling student:', err)
      toast.error('Failed to enroll student')
      return { success: false, error: err.message }
    }
  }

  async function updateSchoolSettings(updates) {
    try {
      const { data, error } = await supabase
        .from('schools')
        .update(updates)
        .eq('id', profile.school_id)
        .select()
        .single()

      if (error) throw error
      
      setSchool(data)
      toast.success('School settings updated')
      return { success: true, data }
    } catch (err) {
      console.error('Error updating school settings:', err)
      toast.error('Failed to update settings')
      return { success: false, error: err.message }
    }
  }

  async function generateReport(reportType, options = {}) {
    try {
      let reportData = {}
      
      switch (reportType) {
        case 'enrollment':
          reportData = {
            total_students: students.length,
            by_grade: students.reduce((acc, s) => {
              acc[s.grade_level] = (acc[s.grade_level] || 0) + 1
              return acc
            }, {}),
            active_students: students.filter(s => s.status === 'active').length,
          }
          break
          
        case 'attendance':
          // Fetch attendance data
          const { data: attendanceData } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('school_id', profile.school_id)
            .gte('date', options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .lte('date', options.endDate || new Date().toISOString())
          
          reportData = {
            average_attendance: attendanceData?.length ? 
              (attendanceData.filter(a => a.status === 'present').length / attendanceData.length * 100).toFixed(2) : 0,
            total_records: attendanceData?.length || 0,
          }
          break
          
        case 'performance':
          // Aggregate academic performance
          const { data: gradesData } = await supabase
            .from('academic_records')
            .select('gpa, grade_level')
            .eq('school_id', profile.school_id)
          
          reportData = {
            average_gpa: gradesData?.length ? 
              (gradesData.reduce((sum, g) => sum + g.gpa, 0) / gradesData.length).toFixed(2) : 0,
            by_grade_level: gradesData?.reduce((acc, g) => {
              if (!acc[g.grade_level]) acc[g.grade_level] = { total: 0, count: 0 }
              acc[g.grade_level].total += g.gpa
              acc[g.grade_level].count += 1
              return acc
            }, {}),
          }
          break
      }
      
      return { success: true, data: reportData }
    } catch (err) {
      console.error('Error generating report:', err)
      toast.error('Failed to generate report')
      return { success: false, error: err.message }
    }
  }

  // Calculate school statistics
  const schoolStats = {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalClassrooms: classrooms.length,
    averageClassSize: classrooms.length ? 
      Math.round(students.length / classrooms.length) : 0,
    studentTeacherRatio: teachers.length ? 
      `${Math.round(students.length / teachers.length)}:1` : 'N/A',
  }

  return {
    school,
    teachers,
    students,
    classrooms,
    schoolStats,
    loading,
    error,
    refetch: fetchSchoolData,
    inviteTeacher,
    createClassroom,
    assignTeacherToClassroom,
    enrollStudent,
    updateSchoolSettings,
    generateReport,
  }
}