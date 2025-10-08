import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { permissionsService } from '@/services/permissions.service'

/**
 * Permissions composable
 * Provides reactive permission checks in components
 */
export function usePermissions() {
  const authStore = useAuthStore()

  // Reactive role checks
  const isTeacher = computed(() => permissionsService.isTeacher(authStore.user))
  const isStudent = computed(() => permissionsService.isStudent(authStore.user))
  const isAdmin = computed(() => permissionsService.isAdmin(authStore.user))

  /**
   * Check if current user has access to a classroom
   */
  const canAccessClassroom = async (classroomId: string): Promise<boolean> => {
    const user = authStore.user
    if (!user || !user.user_metadata?.role) {
      return false
    }

    return permissionsService.canAccessClassroom(user.id, classroomId, user.user_metadata.role)
  }

  /**
   * Check if current user can manage a classroom
   */
  const canManageClassroom = async (classroomId: string): Promise<boolean> => {
    const user = authStore.user
    if (!user || !user.user_metadata?.role) {
      return false
    }

    return permissionsService.canManageClassroom(user.id, classroomId, user.user_metadata.role)
  }

  /**
   * Check if current user can manage questions in a classroom
   */
  const canManageQuestions = async (classroomId: string): Promise<boolean> => {
    const user = authStore.user
    if (!user || !user.user_metadata?.role) {
      return false
    }

    return permissionsService.canManageQuestions(user.id, classroomId, user.user_metadata.role)
  }

  /**
   * Check if current user can manage videos in a classroom
   */
  const canManageVideos = async (classroomId: string): Promise<boolean> => {
    const user = authStore.user
    if (!user || !user.user_metadata?.role) {
      return false
    }

    return permissionsService.canManageVideos(user.id, classroomId, user.user_metadata.role)
  }

  /**
   * Check if current user can view students in a classroom
   */
  const canViewStudents = async (classroomId: string): Promise<boolean> => {
    const user = authStore.user
    if (!user || !user.user_metadata?.role) {
      return false
    }

    return permissionsService.canViewStudents(user.id, classroomId, user.user_metadata.role)
  }

  /**
   * Check if current user has one of the specified roles
   */
  const hasRole = (roles: string[]): boolean => {
    const user = authStore.user
    if (!user || !user.user_metadata?.role) {
      return false
    }

    return permissionsService.hasRoleAccess(roles, user.user_metadata.role)
  }

  /**
   * Check if current user can edit a resource they own
   */
  const canEditResource = (resourceOwnerId: string): boolean => {
    const user = authStore.user
    if (!user) {
      return false
    }

    return permissionsService.canEditResource(user.id, resourceOwnerId)
  }

  /**
   * Check if current user can delete a resource
   */
  const canDeleteResource = (resourceOwnerId: string): boolean => {
    const user = authStore.user
    if (!user || !user.user_metadata?.role) {
      return false
    }

    return permissionsService.canDeleteResource(user.id, resourceOwnerId, user.user_metadata.role)
  }

  return {
    // Reactive role checks
    isTeacher,
    isStudent,
    isAdmin,

    // Permission checks
    canAccessClassroom,
    canManageClassroom,
    canManageQuestions,
    canManageVideos,
    canViewStudents,
    hasRole,
    canEditResource,
    canDeleteResource,
  }
}
