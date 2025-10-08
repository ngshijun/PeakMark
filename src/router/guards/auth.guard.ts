import { useAuthStore } from '@/stores/auth'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'

/**
 * Authentication guard
 * Ensures user is authenticated before accessing protected routes
 */
export async function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): Promise<boolean | RouteLocationRaw> {
  const authStore = useAuthStore()
  const { user, loading } = authStore

  // Wait for auth to initialize - don't proceed if still loading
  if (loading) {
    // Wait for auth to finish initializing
    return new Promise((resolve) => {
      const unsubscribe = authStore.$subscribe((mutation, state) => {
        if (!state.loading) {
          unsubscribe()
          // Allow the navigation to proceed after auth loads
          resolve(true)
        }
      })
    })
  }

  // Check if route requires authentication
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  // Public routes - allow access
  if (!requiresAuth) {
    return true
  }

  // Protected routes - check authentication
  if (!user) {
    // Redirect to login if not authenticated
    if (to.name !== 'login-page') {
      return { name: 'login-page' }
    }
  }

  return true
}
