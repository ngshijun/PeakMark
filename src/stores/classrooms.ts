import { supabase } from '@/lib/supabaseClient'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

type Classroom = Tables<'classrooms'>
type ClassroomInsert = TablesInsert<'classrooms'>
type ClassroomUpdate = TablesUpdate<'classrooms'>

export interface ClassroomWithMemberCount extends Classroom {
  member_count?: number
  teacher_name?: string
}

export const useClassroomStore = defineStore('classroom', () => {
  const classrooms = ref<ClassroomWithMemberCount[]>([])
  const enrolledClassrooms = ref<ClassroomWithMemberCount[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch classrooms created by teacher
  const fetchTeacherClassrooms = async (teacherId: string) => {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('classrooms')
      .select(
        `
        *,
        classroom_members(count)
      `,
      )
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })

    loading.value = false

    if (fetchError) {
      error.value = fetchError.message
      throw fetchError
    }

    classrooms.value = (data || []).map((classroom: any) => ({
      ...classroom,
      member_count: classroom.classroom_members?.[0]?.count || 0,
      classroom_members: undefined, // Remove from result
    }))

    return classrooms.value
  }

  // Fetch classrooms student is enrolled in
  const fetchStudentClassrooms = async (studentId: string) => {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('classroom_members')
      .select(
        `
        classrooms!classroom_members_classroom_id_fkey(
          *,
          users!classrooms_teacher_id_fkey(
            full_name
          )
        )
      `,
      )
      .eq('student_id', studentId)
      .order('joined_at', { ascending: false })

    loading.value = false

    if (fetchError) {
      error.value = fetchError.message
      throw fetchError
    }

    enrolledClassrooms.value = (data || []).map((member: any) => ({
      ...member.classrooms,
      teacher_name: member.classrooms?.users?.full_name || 'Unknown Teacher',
      users: undefined, // Remove from result
    }))

    return enrolledClassrooms.value
  }

  // Create a new classroom
  const createClassroom = async (classroom: ClassroomInsert) => {
    loading.value = true
    error.value = null

    const { data, error: createError } = await supabase
      .from('classrooms')
      .insert(classroom)
      .select()
      .single()

    loading.value = false

    if (createError) {
      error.value = createError.message
      throw createError
    }

    if (data) {
      classrooms.value.unshift({ ...data, member_count: 0 })
    }

    return data
  }

  // Update a classroom
  const updateClassroom = async (id: string, updates: ClassroomUpdate) => {
    loading.value = true
    error.value = null

    const { data, error: updateError } = await supabase
      .from('classrooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    loading.value = false

    if (updateError) {
      error.value = updateError.message
      throw updateError
    }

    if (data) {
      const index = classrooms.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        classrooms.value[index] = { ...classrooms.value[index], ...data }
      }
    }

    return data
  }

  // Delete a classroom
  const deleteClassroom = async (id: string) => {
    loading.value = true
    error.value = null

    const { error: deleteError } = await supabase.from('classrooms').delete().eq('id', id)

    loading.value = false

    if (deleteError) {
      error.value = deleteError.message
      throw deleteError
    }

    classrooms.value = classrooms.value.filter((c) => c.id !== id)
  }

  // Join a classroom via classroom ID
  const joinClassroom = async (studentId: string, classroomId: string) => {
    loading.value = true
    error.value = null

    // Find classroom by ID
    const { data: classroom, error: findError } = await supabase
      .from('classrooms')
      .select('*')
      .eq('id', classroomId)
      .maybeSingle()

    if (findError || !classroom) {
      loading.value = false
      error.value = findError?.message || 'Classroom not found'
      throw new Error('Classroom not found')
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('classroom_members')
      .select('id')
      .eq('classroom_id', classroom.id)
      .eq('student_id', studentId)
      .maybeSingle()

    if (existing) {
      loading.value = false
      error.value = 'You are already a member of this classroom'
      throw new Error('You are already a member of this classroom')
    }

    // Add member
    const { data, error: joinError } = await supabase
      .from('classroom_members')
      .insert({
        classroom_id: classroom.id,
        student_id: studentId,
      })
      .select()
      .single()

    loading.value = false

    if (joinError) {
      error.value = joinError.message
      throw joinError
    }

    // Refresh enrolled classrooms
    await fetchStudentClassrooms(studentId)

    return data
  }

  // Leave a classroom
  const leaveClassroom = async (studentId: string, classroomId: string) => {
    loading.value = true
    error.value = null

    const { error: leaveError } = await supabase
      .from('classroom_members')
      .delete()
      .eq('classroom_id', classroomId)
      .eq('student_id', studentId)

    loading.value = false

    if (leaveError) {
      error.value = leaveError.message
      throw leaveError
    }

    enrolledClassrooms.value = enrolledClassrooms.value.filter((c) => c.id !== classroomId)
  }

  // Fetch classroom members
  const fetchClassroomMembers = async (classroomId: string) => {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('classroom_members')
      .select(
        `
        *,
        users!classroom_members_student_id_fkey(
          id,
          full_name,
          created_at
        )
      `,
      )
      .eq('classroom_id', classroomId)
      .order('joined_at', { ascending: false })

    loading.value = false

    if (fetchError) {
      error.value = fetchError.message
      throw fetchError
    }

    return data || []
  }

  // Check if user has access to a classroom
  const hasAccessToClassroom = async (userId: string, classroomId: string, role: string) => {
    try {
      // Teachers: check if they own the classroom
      if (role === 'teacher') {
        const { data } = await supabase
          .from('classrooms')
          .select('id')
          .eq('id', classroomId)
          .eq('teacher_id', userId)
          .maybeSingle()
        return !!data
      }

      // Students: check if they are a member
      if (role === 'student') {
        const { data } = await supabase
          .from('classroom_members')
          .select('id')
          .eq('classroom_id', classroomId)
          .eq('student_id', userId)
          .maybeSingle()
        return !!data
      }

      // Admins have access to all classrooms
      if (role === 'admin') {
        return true
      }

      return false
    } catch {
      return false
    }
  }

  // Clear error
  const clearError = () => {
    error.value = null
  }

  return {
    // State
    classrooms,
    enrolledClassrooms,
    loading,
    error,

    // Actions
    fetchTeacherClassrooms,
    fetchStudentClassrooms,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    joinClassroom,
    leaveClassroom,
    fetchClassroomMembers,
    hasAccessToClassroom,
    clearError,
  }
})
