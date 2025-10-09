import { useAuthStore } from '@/stores/auth'
import { useClassroomStore } from '@/stores/classrooms'
import type { RouteLocationNormalized } from 'vue-router'

/**
 * Classroom data prefetch guard
 * Ensures classroom data is loaded before entering classroom routes
 */
export async function classroomDataGuard(
  to: RouteLocationNormalized,
): Promise<boolean> {
  const authStore = useAuthStore()
  const classroomStore = useClassroomStore()
  const classroomId = to.params.classroomId as string | undefined

  // Only fetch data if navigating to a classroom route
  if (!classroomId || !authStore.user) {
    return true
  }

  const role = authStore.user.user_metadata?.role

  try {
    if (role === 'student') {
      // Fetch student classrooms if empty
      if (classroomStore.studentClassrooms.length === 0) {
        await classroomStore.fetchStudentClassrooms(authStore.user.id)
      }
      // Always fetch student exp for the current classroom
      await classroomStore.fetchStudentExp(authStore.user.id, classroomId)
    } else if (role === 'teacher') {
      // Fetch teacher classrooms if empty
      if (classroomStore.teacherClassrooms.length === 0) {
        await classroomStore.fetchTeacherClassrooms(authStore.user.id)
      }
    }
  } catch (error) {
    // Log error but continue navigation
    console.error('Error loading classroom data:', error)
  }

  return true
}
