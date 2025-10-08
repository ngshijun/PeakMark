import type { NavigationGuard } from 'vue-router'

/**
 * Guard composition and utilities
 * Exports all guards and helper functions
 */
export { authGuard } from './auth.guard'
export { roleGuard } from './role.guard'
export { classroomAccessGuard } from './classroom-access.guard'

/**
 * Compose multiple guards into a single guard function
 * Guards are executed in the order they are provided
 * If any guard returns false or a redirect, execution stops
 */
export function composeGuards(...guards: NavigationGuard[]): NavigationGuard {
  return async (to, from, next) => {
    for (const guard of guards) {
      const result = await guard(to, from, next)

      // If guard returns false, stop navigation
      if (result === false) {
        next(false)
        return
      }

      // If guard returns a redirect location, navigate there
      if (result !== true && result !== undefined) {
        next(result)
        return
      }
    }

    // All guards passed, allow navigation
    next()
  }
}
