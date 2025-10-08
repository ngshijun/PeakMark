import { useAuthStore } from '@/stores/auth'
import { permissionsService } from '@/services/permissions.service'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'

/**
 * Classroom access guard
 * Verifies user has access to the classroom in the route
 */
export async function classroomAccessGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): Promise<boolean | RouteLocationRaw> {
  const authStore = useAuthStore()
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

  // Check if user has access to this classroom
  const hasAccess = await permissionsService.canAccessClassroom(
    user.id,
    classroomId,
    userRole,
  )

  if (!hasAccess) {
    // User doesn't have access to this classroom - redirect to classrooms
    return { name: 'classrooms' }
  }

  return true
}
