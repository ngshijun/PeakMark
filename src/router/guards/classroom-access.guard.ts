import { useAuthStore } from '@/stores/auth'
import { useClassroomStore } from '@/stores/classrooms'
import { permissionsService } from '@/services/permissions.service'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'

/**
 * Classroom access guard
 * Verifies user has access to the classroom in the route
 * - Teachers: Must be owner OR collaborator
 * - Students: Must be a member
 * Optimized: Checks cached store data first before making DB queries
 */
export async function classroomAccessGuard(
  to: RouteLocationNormalized,
): Promise<boolean | RouteLocationRaw> {
  const authStore = useAuthStore()
  const classroomStore = useClassroomStore()
  const { user } = authStore

  // Get classroom ID from route params
  const classroomId = to.params.classroomId as string | undefined

  // If no classroomId in route, allow access (not a classroom route)
  if (!classroomId) {
    return true
  }

  // If no user, redirect to login (should be caught by authGuard)
  if (!user) {
    return { name: 'login-page' }
  }

  // Get user role
  const userRole = user.user_metadata?.role

  // If user has no role, redirect to login
  if (!userRole) {
    return { name: 'login-page' }
  }

  // Optimization: Check cached store data first
  let hasAccessFromStore = false

  if (userRole === 'student') {
    // Check if student classroom data is loaded and classroom is in the list
    if (classroomStore.studentClassrooms.length > 0) {
      hasAccessFromStore = classroomStore.isStudentMemberFromStore(user.id, classroomId)
      if (hasAccessFromStore) {
        return true
      }
    }
  } else if (userRole === 'teacher') {
    // Check if teacher classroom data is loaded and classroom is in the list
    if (classroomStore.teacherClassrooms.length > 0) {
      hasAccessFromStore = classroomStore.isTeacherOwnerFromStore(user.id, classroomId)
      if (hasAccessFromStore) {
        return true
      }
    }
  } else if (userRole === 'admin') {
    // Admins have access to all classrooms
    return true
  }

  // Fallback: If not found in store, check via DB (covers edge cases)
  const hasAccess = await permissionsService.canAccessClassroom(user.id, classroomId, userRole)

  if (!hasAccess) {
    // User doesn't have access to this classroom - redirect to classrooms
    return { name: 'classrooms' }
  }

  return true
}
