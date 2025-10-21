import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useClassroomStore } from '@/stores/classrooms'

/**
 * Classroom role composable
 * Determines user's role in a classroom and their permissions
 */
export function useClassroomRole(classroomId: string) {
  const authStore = useAuthStore()
  const classroomStore = useClassroomStore()

  /**
   * Determine user's role in the classroom
   * Returns 'owner', 'collaborator', 'student', or null
   */
  const role = computed(() => {
    if (!authStore.user) return null

    const userId = authStore.user.id
    const userRole = authStore.user.user_metadata?.role

    // Check if student
    if (userRole === 'student') {
      const isStudent = classroomStore.studentClassrooms.some((c) => c.id === classroomId)
      return isStudent ? 'student' : null
    }

    // Check if teacher (owner or collaborator)
    if (userRole === 'teacher') {
      const classroom = classroomStore.teacherClassrooms.find((c) => c.id === classroomId)

      if (classroom) {
        // ClassroomWithRole includes userRole property
        if ('userRole' in classroom) {
          return classroom.userRole || null
        }

        // Fallback: check if teacher_id matches (owner)
        if ('teacher_id' in classroom && classroom.teacher_id === userId) {
          return 'owner'
        }
      }
    }

    return null
  })

  /**
   * Check if user is the owner of the classroom
   */
  const isOwner = computed(() => role.value === 'owner')

  /**
   * Check if user is a collaborator in the classroom
   */
  const isCollaborator = computed(() => role.value === 'collaborator')

  /**
   * Check if user is a student in the classroom
   */
  const isStudent = computed(() => role.value === 'student')

  /**
   * Check if user can edit content (questions, videos, documents, puzzles)
   * Both owners and collaborators can edit content
   */
  const canEditContent = computed(() => {
    return isOwner.value || isCollaborator.value
  })

  /**
   * Check if user can edit classroom settings
   * Only owners can edit settings
   */
  const canEditSettings = computed(() => {
    return isOwner.value
  })

  /**
   * Check if user can manage collaborators (invite, remove)
   * Only owners can manage collaborators
   */
  const canManageCollaborators = computed(() => {
    return isOwner.value
  })

  /**
   * Check if user can delete the classroom
   * Only owners can delete the classroom
   */
  const canDeleteClassroom = computed(() => {
    return isOwner.value
  })

  /**
   * Check if user can leave the classroom
   * Collaborators can leave, owners cannot
   */
  const canLeaveClassroom = computed(() => {
    return isCollaborator.value
  })

  return {
    role,
    isOwner,
    isCollaborator,
    isStudent,
    canEditContent,
    canEditSettings,
    canManageCollaborators,
    canDeleteClassroom,
    canLeaveClassroom,
  }
}
