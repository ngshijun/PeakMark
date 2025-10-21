import { classroomService } from '@/services/api/classroom.service'
import { expService } from '@/services/api/exp.service'
import type {
  ClassroomWithMemberCount,
  ClassroomWithRole,
  CollaboratorWithUser,
} from '@/services/api/classroom.service'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useLevelUpStore } from '@/stores/level-up'
import { calculateLevel } from '@/composables/useLevel'

type ClassroomInsert = TablesInsert<'classrooms'>
type ClassroomUpdate = TablesUpdate<'classrooms'>
type ExpRow = Tables<'student_exp'>

export type { ClassroomWithMemberCount, ClassroomWithRole }

export const useClassroomStore = defineStore('classroom', () => {
  const teacherClassrooms = ref<ClassroomWithRole[]>([])
  const studentClassrooms = ref<ClassroomWithMemberCount[]>([])
  const publicClassrooms = ref<ClassroomWithMemberCount[]>([])
  const collaborators = ref<CollaboratorWithUser[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const studentExp = ref<ExpRow | null>(null)

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

  // Fetch all public classrooms (excluding ones student has already joined)
  const fetchPublicClassrooms = async (studentId?: string) => {
    loading.value = true
    error.value = null

    try {
      const data = await classroomService.getPublicClassrooms(studentId)
      publicClassrooms.value = data
      return publicClassrooms.value
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

      // Initialize level tracking for this classroom (starts at level 1 with 0 XP)
      const levelUpStore = useLevelUpStore()
      const currentLevel = calculateLevel(experience.exp)
      levelUpStore.initializeLevel(classroomId, currentLevel)

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

      // Initialize level tracking for this classroom
      if (data) {
        const levelUpStore = useLevelUpStore()
        const currentLevel = calculateLevel(data.exp)
        levelUpStore.initializeLevel(classroomId, currentLevel)
      }

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

      // Check for level up
      const levelUpStore = useLevelUpStore()
      const newLevel = calculateLevel(data.exp)

      // Find classroom name for better celebration message
      const classroom = studentClassrooms.value.find((c) => c.id === classroomId)
      const classroomName = classroom?.name

      levelUpStore.checkLevelUp(classroomId, newLevel, classroomName)

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  const addStudentExp = async (studentId: string, classroomId: string, expToAdd: number) => {
    loading.value = true
    error.value = null

    try {
      const data = await expService.addExpToStudent(studentId, classroomId, expToAdd)
      studentExp.value = data

      // Check for level up
      const levelUpStore = useLevelUpStore()
      const newLevel = calculateLevel(data.exp)

      // Find classroom name for better celebration message
      const classroom = studentClassrooms.value.find((c) => c.id === classroomId)
      const classroomName = classroom?.name

      levelUpStore.checkLevelUp(classroomId, newLevel, classroomName)

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch collaborators for a classroom
  const fetchCollaborators = async (classroomId: string) => {
    loading.value = true
    error.value = null

    try {
      const data = await classroomService.getCollaborators(classroomId)
      collaborators.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Invite a collaborator by email
  const inviteCollaborator = async (classroomId: string, email: string) => {
    loading.value = true
    error.value = null

    try {
      // Import userService here to avoid circular dependency
      const { userService } = await import('@/services/api/user.service')

      // Look up user by email
      const user = await userService.getUserByEmail(email)

      if (!user) {
        error.value = 'User not found'
        throw new Error('User not found')
      }

      if (user.role !== 'teacher') {
        error.value = 'User is not a teacher'
        throw new Error('User is not a teacher')
      }

      // Check if already a collaborator
      const isAlreadyCollaborator = await classroomService.isCollaborator(classroomId, user.id)
      if (isAlreadyCollaborator) {
        error.value = 'User is already a collaborator'
        throw new Error('User is already a collaborator')
      }

      // Check if user is the owner
      const isOwnerUser = await classroomService.isOwner(classroomId, user.id)
      if (isOwnerUser) {
        error.value = 'Cannot invite the classroom owner as collaborator'
        throw new Error('Cannot invite the classroom owner as collaborator')
      }

      // Add as collaborator
      await classroomService.addCollaborator(classroomId, user.id)

      // Refresh collaborators list
      await fetchCollaborators(classroomId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Remove a collaborator
  const removeCollaborator = async (classroomId: string, teacherId: string) => {
    loading.value = true
    error.value = null

    try {
      await classroomService.removeCollaborator(classroomId, teacherId)
      collaborators.value = collaborators.value.filter((c) => c.user_id !== teacherId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Leave as collaborator
  const leaveAsCollaborator = async (teacherId: string, classroomId: string) => {
    loading.value = true
    error.value = null

    try {
      await classroomService.removeCollaborator(classroomId, teacherId)
      teacherClassrooms.value = teacherClassrooms.value.filter((c) => c.id !== classroomId)
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

  // Check if student is member of classroom (from cached store data)
  const isStudentMemberFromStore = (studentId: string, classroomId: string): boolean => {
    return studentClassrooms.value.some((c) => c.id === classroomId)
  }

  // Check if teacher owns classroom (from cached store data)
  const isTeacherOwnerFromStore = (teacherId: string, classroomId: string): boolean => {
    return teacherClassrooms.value.some((c) => c.id === classroomId)
  }

  return {
    // State
    teacherClassrooms,
    studentClassrooms,
    publicClassrooms,
    collaborators,
    loading,
    error,
    studentExp,

    // Actions
    fetchTeacherClassrooms,
    fetchStudentClassrooms,
    fetchPublicClassrooms,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    joinClassroom,
    leaveClassroom,
    fetchClassroomMembers,
    fetchClassroomSettings,
    fetchStudentExp,
    updateStudentExp,
    addStudentExp,
    fetchCollaborators,
    inviteCollaborator,
    removeCollaborator,
    leaveAsCollaborator,
    clearError,
    isStudentMemberFromStore,
    isTeacherOwnerFromStore,
  }
})
