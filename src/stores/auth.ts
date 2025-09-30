import { supabase } from '@/lib/supabaseClient'
import type { Session, User } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)

  const initAuth = async () => {
    loading.value = true
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession()
    session.value = currentSession
    user.value = currentSession?.user ?? null

    loading.value = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      user.value = newSession?.user ?? null
      session.value = newSession
    })

    return subscription
  }

  const signUp = async (
    email: string,
    password: string,
    metaData?: { name: string; role: string },
  ) => {
    loading.value = true
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metaData,
      },
    })

    loading.value = false
    return { data, error }
  }

  const signInWithPassword = async (email: string, password: string) => {
    loading.value = true
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    loading.value = false
    return { data, error }
  }

  const signOut = async () => {
    loading.value = true
    const { error } = await supabase.auth.signOut()

    loading.value = false
    return { error }
  }

  return {
    // State
    user,
    session,
    loading,

    // Actions
    initAuth,
    signUp,
    signInWithPassword,
    signOut,
  }
})
