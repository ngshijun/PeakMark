import { useAuthStore } from '@/stores/auth'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'

/**
 * Role-based access control guard
 * Checks if user has required role for the route
 */
export async function roleGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): Promise<boolean | RouteLocationRaw> {
  const authStore = useAuthStore()
  const { user } = authStore

  // Get required roles from route meta
  const requiredRoles = to.meta.role as string[] | undefined

  // If no roles required, allow access
  if (!requiredRoles || !Array.isArray(requiredRoles) || requiredRoles.length === 0) {
    return true
  }

  // If no user, redirect to login (should be caught by authGuard, but just in case)
  if (!user) {
    return { name: 'login-page' }
  }

  // Get user role
  const userRole = user.user_metadata?.role

  // If user has no role, redirect to login
  if (!userRole) {
    return { name: 'login-page' }
  }

  // Check if user has required role
  if (!requiredRoles.includes(userRole)) {
    // User doesn't have required role - redirect to classrooms
    return { name: 'classrooms' }
  }

  return true
}
