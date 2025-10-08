import { classroomService } from '@/services/api/classroom.service'
import { expService } from '@/services/api/exp.service'
import type { ClassroomWithMemberCount } from '@/services/api/classroom.service'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type Classroom = Tables<'classrooms'>
type ClassroomInsert = TablesInsert<'classrooms'>
type ClassroomUpdate = TablesUpdate<'classrooms'>
type ExpRow = Tables<'student_exp'>

export type { ClassroomWithMemberCount }

export const useClassroomStore = defineStore('classroom', () => {
  const router = useRouter()
  const route = useRoute()

  const teacherClassrooms = ref<ClassroomWithMemberCount[]>([])
  const studentClassrooms = ref<ClassroomWithMemberCount[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const studentExp = ref<ExpRow | null>(null)
  const exp = computed(() => studentExp.value?.exp || 0)

  // Get classroom ID from URL
  const selectedClassroomId = computed(() => route.params.classroomId as string | undefined)

  // Fetch classrooms created by teacher
  const fetchTeacherClassrooms = async (teacherId: string) => {
    loading.value = true
    error.value = null

    try {
      const data = await classroomService.getTeacherClassrooms(teacherId)
      teacherClassrooms.value = data
      return teacherClassrooms.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch classrooms student is enrolled in
  const fetchStudentClassrooms = async (studentId: string) => {
    loading.value = true
    error.value = null

    try {
      const data = await classroomService.getStudentClassrooms(studentId)
      studentClassrooms.value = data
      return studentClassrooms.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create a new classroom
  const createClassroom = async (classroom: ClassroomInsert) => {
    loading.value = true
    error.value = null

    try {
      const data = await classroomService.createClassroom(classroom)
      teacherClassrooms.value.unshift({ ...data, member_count: 0 })
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update a classroom
  const updateClassroom = async (id: string, updates: ClassroomUpdate) => {
    loading.value = true
    error.value = null

    try {
      const data = await classroomService.updateClassroom(id, updates)
      const index = teacherClassrooms.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        teacherClassrooms.value[index] = { ...teacherClassrooms.value[index], ...data }
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete a classroom
  const deleteClassroom = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await classroomService.deleteClassroom(id)
      teacherClassrooms.value = teacherClassrooms.value.filter((c) => c.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Join a classroom via classroom ID
  const joinClassroom = async (studentId: string, classroomId: string) => {
    loading.value = true
    error.value = null

    try {
      // Check if classroom exists
      const exists = await classroomService.classroomExists(classroomId)
      if (!exists) {
        error.value = 'Classroom not found'
        throw new Error('Classroom not found')
      }

      // Check if already a member
      const isMember = await classroomService.checkMembership(classroomId, studentId)
      if (isMember) {
        error.value = 'You are already a member of this classroom'
        throw new Error('You are already a member of this classroom')
      }

      // Add member
      const data = await classroomService.addMember(classroomId, studentId)

      // Add exp
      const experience = await expService.createStudentExp(studentId, classroomId)
      studentExp.value = experience

      // Refresh enrolled classrooms
      await fetchStudentClassrooms(studentId)

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Leave a classroom
  const leaveClassroom = async (studentId: string, classroomId: string) => {
    loading.value = true
    error.value = null

    try {
      await classroomService.removeMember(classroomId, studentId)
      studentClassrooms.value = studentClassrooms.value.filter((c) => c.id !== classroomId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch classroom members
  const fetchClassroomMembers = async (classroomId: string) => {
    loading.value = true
    error.value = null

    try {
      const data = await classroomService.getClassroomMembers(classroomId)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch classroom settings
  const fetchClassroomSettings = async (classroomId: string) => {
    loading.value = true
    error.value = null

    try {
      const data = await classroomService.getClassroomById(classroomId)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchStudentExp = async (studentId: string, classroomId: string) => {
    loading.value = true
    error.value = null

    try {
      const data = await expService.getStudentExp(studentId, classroomId)
      studentExp.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateStudentExp = async (studentId: string, classroomId: string, exp: number) => {
    loading.value = true
    error.value = null

    try {
      const data = await expService.updateStudentExp(studentId, classroomId, exp)
      studentExp.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Clear error
  const clearError = () => {
    error.value = null
  }

  // Navigate to a classroom
  const selectClassroom = async (classroom: Classroom, userId?: string) => {
    if (userId) await fetchStudentExp(userId, classroom.id)
    router.push({
      name: 'dashboard',
      params: { classroomId: classroom.id },
    })
  }

  // Navigate to classroom selection page
  const clearSelection = () => {
    router.push({ name: 'classrooms' })
  }

  return {
    // State
    teacherClassrooms,
    studentClassrooms,
    loading,
    error,
    selectedClassroomId,
    exp,

    // Actions
    fetchTeacherClassrooms,
    fetchStudentClassrooms,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    joinClassroom,
    leaveClassroom,
    fetchClassroomMembers,
    fetchClassroomSettings,
    fetchStudentExp,
    updateStudentExp,
    selectClassroom,
    clearSelection,
    clearError,
  }
})
