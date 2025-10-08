import { authService } from '@/services/api/auth.service'
import type { Session, User } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const initAuth = async () => {
    loading.value = true
    error.value = null

    try {
      const currentSession = await authService.getSession()
      session.value = currentSession
      user.value = currentSession?.user ?? null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
    } finally {
      loading.value = false
    }

    const subscription = authService.onAuthStateChange(async (event, newSession) => {
      user.value = newSession?.user ?? null
      session.value = newSession

      // Import profile store dynamically to avoid circular dependency
      const { useProfileStore } = await import('./profile')
      const profileStore = useProfileStore()

      if (event === 'SIGNED_IN' && newSession?.user) {
        // Fetch new user's profile
        await profileStore.fetchProfile()
      } else if (event === 'SIGNED_OUT') {
        // Clear profile data
        profileStore.clearProfile()
      }
    })

    return subscription
  }

  const signUp = async (
    email: string,
    password: string,
    metaData: { full_name: string; dob: string; role: string },
  ) => {
    loading.value = true
    error.value = null

    try {
      await authService.signUp(email, password, metaData)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  const signInWithPassword = async (email: string, password: string) => {
    loading.value = true
    error.value = null

    try {
      await authService.signInWithPassword(email, password)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    loading.value = true
    error.value = null

    try {
      await authService.signOut()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    user,
    session,
    loading,
    error,

    // Actions
    initAuth,
    signUp,
    signInWithPassword,
    signOut,
    clearError,
  }
})
