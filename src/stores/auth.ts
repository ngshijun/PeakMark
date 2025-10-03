import { supabase } from '@/lib/supabaseClient'
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
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession()
    session.value = currentSession
    user.value = currentSession?.user ?? null
    loading.value = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
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
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metaData,
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    loading.value = false

    if (signUpError) {
      error.value = signUpError.message
      throw signUpError
    }
  }

  const signInWithPassword = async (email: string, password: string) => {
    loading.value = true
    error.value = null
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    loading.value = false

    if (signInError) {
      error.value = signInError.message
      throw signInError
    }
  }

  const signOut = async () => {
    loading.value = true
    error.value = null
    const { error: signOutError } = await supabase.auth.signOut()

    loading.value = false
    if (signOutError) {
      error.value = signOutError.message
      throw signOutError
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
