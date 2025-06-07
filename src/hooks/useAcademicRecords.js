import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export function useAcademicRecords(studentId) {
  const { user } = useAuthStore()
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (studentId && user?.id) {
      fetchAcademicRecords()
    }
  }, [studentId, user?.id])

  async function fetchAcademicRecords() {
    try {
      setLoading(true)
      
      // Fetch academic records
      const { data: recordsData, error: recordsError } = await supabase
        .from('academic_records')
        .select(`
          *,
          teacher:teacher_id(profiles(full_name)),
          subject_grades
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (recordsError) throw recordsError

      setRecords(recordsData || [])

      // Calculate summary statistics
      if (recordsData && recordsData.length > 0) {
        const latest = recordsData[0]
        const avgGpa = recordsData.reduce((sum, r) => sum + (r.gpa || 0), 0) / recordsData.length
        const avgAttendance = recordsData.reduce((sum, r) => sum + (r.attendance_rate || 0), 0) / recordsData.length

        setSummary({
          currentGpa: latest.gpa,
          averageGpa: avgGpa.toFixed(2),
          currentAttendance: latest.attendance_rate,
          averageAttendance: Math.round(avgAttendance),
          currentGrade: latest.grade_level,
          totalRecords: recordsData.length
        })
      }
    } catch (err) {
      console.error('Error fetching academic records:', err)
      setError(err.message)
      toast.error('Failed to load academic records')
    } finally {
      setLoading(false)
    }
  }

  async function getReportCard(recordId) {
    try {
      const record = records.find(r => r.id === recordId)
      if (!record) throw new Error('Record not found')

      // Format report card data
      const reportCard = {
        studentName: record.student_name,
        gradeLevel: record.grade_level,
        term: record.term,
        year: record.year,
        gpa: record.gpa,
        attendanceRate: record.attendance_rate,
        subjects: record.subject_grades || {},
        comments: record.comments,
        teacher: record.teacher?.profiles?.full_name || 'Unknown'
      }

      return reportCard
    } catch (err) {
      console.error('Error getting report card:', err)
      toast.error('Failed to load report card')
      return null
    }
  }

  async function downloadReportCard(recordId) {
    try {
      const reportCard = await getReportCard(recordId)
      if (!reportCard) return

      // Create PDF or formatted document
      // This is a placeholder - in production, use a PDF library
      const content = `
REPORT CARD
===========
Student: ${reportCard.studentName}
Grade: ${reportCard.gradeLevel}
Term: ${reportCard.term} ${reportCard.year}
GPA: ${reportCard.gpa}
Attendance: ${reportCard.attendanceRate}%

GRADES:
${Object.entries(reportCard.subjects).map(([subject, grade]) => 
  `${subject}: ${grade}`
).join('\n')}

Teacher Comments:
${reportCard.comments || 'None'}

Teacher: ${reportCard.teacher}
      `

      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-card-${reportCard.term}-${reportCard.year}.txt`
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success('Report card downloaded')
    } catch (err) {
      console.error('Error downloading report card:', err)
      toast.error('Failed to download report card')
    }
  }

  return {
    records,
    summary,
    loading,
    error,
    refetch: fetchAcademicRecords,
    getReportCard,
    downloadReportCard
  }
}