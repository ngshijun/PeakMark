import type { RouteLocationNormalized } from 'vue-router'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

/**
 * Permission and authorization service
 * Centralizes all access control logic
 */
export class PermissionsService {
  /**
   * Check if a user has access to a classroom
   * - Teachers: Must own the classroom
   * - Students: Must be a member of the classroom
   * - Admins: Have access to all classrooms
   */
  async canAccessClassroom(userId: string, classroomId: string, role: string): Promise<boolean> {
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

  /**
   * Check if user can manage a classroom (create, update, delete)
   * Only teachers who own the classroom or admins can manage
   */
  async canManageClassroom(userId: string, classroomId: string, role: string): Promise<boolean> {
    if (role === 'admin') {
      return true
    }

    if (role === 'teacher') {
      try {
        const { data } = await supabase
          .from('classrooms')
          .select('id')
          .eq('id', classroomId)
          .eq('teacher_id', userId)
          .maybeSingle()
        return !!data
      } catch {
        return false
      }
    }

    return false
  }

  /**
   * Check if user can manage questions in a classroom
   * Only teachers who own the classroom or admins can manage questions
   */
  async canManageQuestions(userId: string, classroomId: string, role: string): Promise<boolean> {
    return this.canManageClassroom(userId, classroomId, role)
  }

  /**
   * Check if user can manage videos in a classroom
   * Only teachers who own the classroom or admins can manage videos
   */
  async canManageVideos(userId: string, classroomId: string, role: string): Promise<boolean> {
    return this.canManageClassroom(userId, classroomId, role)
  }

  /**
   * Check if user can view students in a classroom
   * Teachers who own the classroom and admins can view students
   */
  async canViewStudents(userId: string, classroomId: string, role: string): Promise<boolean> {
    return this.canManageClassroom(userId, classroomId, role)
  }

  /**
   * Check if user has access to a route based on role requirements
   */
  hasRouteAccess(route: RouteLocationNormalized, user: User | null): boolean {
    // Public routes - no authentication required
    if (!route.meta.requiresAuth) {
      return true
    }

    // Protected routes - authentication required
    if (!user) {
      return false
    }

    // Check role-based access
    const requiredRoles = route.meta.role as string[] | undefined
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const userRole = user.user_metadata?.role
    if (!userRole) {
      return false
    }

    return this.hasRoleAccess(requiredRoles, userRole)
  }

  /**
   * Check if user has one of the required roles
   */
  hasRoleAccess(requiredRoles: string[], userRole: string): boolean {
    return requiredRoles.includes(userRole)
  }

  /**
   * Check if user can edit a resource they own
   */
  canEditResource(userId: string, resourceOwnerId: string): boolean {
    return userId === resourceOwnerId
  }

  /**
   * Check if user can delete a resource
   * - Admins can delete any resource
   * - Users can delete their own resources
   */
  canDeleteResource(userId: string, resourceOwnerId: string, userRole: string): boolean {
    if (userRole === 'admin') {
      return true
    }

    return userId === resourceOwnerId
  }

  /**
   * Check if user is a teacher
   */
  isTeacher(user: User | null): boolean {
    return user?.user_metadata?.role === 'teacher'
  }

  /**
   * Check if user is a student
   */
  isStudent(user: User | null): boolean {
    return user?.user_metadata?.role === 'student'
  }

  /**
   * Check if user is an admin
   */
  isAdmin(user: User | null): boolean {
    return user?.user_metadata?.role === 'admin'
  }
}

// Export a singleton instance
export const permissionsService = new PermissionsService()
