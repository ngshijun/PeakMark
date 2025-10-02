import { supabase } from '@/lib/supabaseClient'
import type { Tables } from '@/types/database.types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from './auth'

type UserRow = Tables<'users'>
type ExpRow = Tables<'student_exp'>

interface StudentStats {
  questionsAnswered: number
  accuracyRate: number
  studyStreak: number
  setsCompleted: number
}

export const useProfileStore = defineStore('profile', () => {
  const authStore = useAuthStore()

  // ===================================
  // STATE
  // ===================================

  // Common (All roles)
  const userProfile = ref<UserRow | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Student only
  const userExp = ref<ExpRow | null>(null)
  const studentStats = ref<StudentStats>({
    questionsAnswered: 0,
    accuracyRate: 0,
    studyStreak: 0,
    setsCompleted: 0,
  })

  // Teacher only
  // TODO: Add teacher-specific state here

  // Admin only
  // TODO: Add admin-specific state here

  // ===================================
  // COMPUTED PROPERTIES
  // ===================================

  // Common (All roles)
  const fullName = computed(() => userProfile.value?.full_name || '')
  const dob = computed(() => userProfile.value?.dob || '')
  const role = computed(() => userProfile.value?.role || 'student')

  // Student only
  const exp = computed(() => userExp.value?.exp || 0)

  // Teacher only
  // TODO: Add teacher-specific computed properties here

  // Admin only
  // TODO: Add admin-specific computed properties here

  // ===================================
  // FETCH METHODS
  // ===================================

  // Common: Fetch user profile from users table
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError) {
        error.value = fetchError.message
        throw fetchError
      }

      userProfile.value = data
    } catch (err) {
      console.error('Error fetching user profile:', err)
      throw err
    }
  }

  // Student only: Fetch exp data
  const fetchUserExp = async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('student_exp')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (fetchError) {
        error.value = fetchError.message
        throw fetchError
      }

      userExp.value = data
    } catch (err) {
      console.error('Error fetching user exp:', err)
      throw err
    }
  }

  // Student only: Fetch statistics from question_attemps
  const fetchStudentStats = async (userId: string) => {
    try {
      const { data: attempts, error: fetchError } = await supabase
        .from('question_attempts')
        .select('is_correct, created_at')
        .eq('attempted_by', userId)

      if (fetchError) {
        error.value = fetchError.message
        throw fetchError
      }

      if (!attempts || attempts.length === 0) {
        studentStats.value = {
          questionsAnswered: 0,
          accuracyRate: 0,
          studyStreak: 0,
          setsCompleted: 0,
        }
        return
      }

      // Calculate questions answered
      const questionsAnswered = attempts.length

      // Calculate accuracy rate
      const correctAnswers = attempts.filter((a) => a.is_correct).length
      const accuracyRate = Math.round((correctAnswers / questionsAnswered) * 100)

      // Calculate study streak (consecutive days with activity)
      const uniqueDates: string[] = [
        ...new Set(attempts.map((a) => new Date(a.created_at).toDateString())),
      ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

      let studyStreak = 0
      const today = new Date().toDateString()
      const yesterday = new Date(Date.now() - 86400000).toDateString()

      if (uniqueDates.length > 0) {
        // Only count streak if activity is today or yesterday
        if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
          studyStreak = 1
          for (let i = 1; i < uniqueDates.length; i++) {
            const currentDateStr = uniqueDates[i - 1]
            const prevDateStr = uniqueDates[i]
            if (!currentDateStr || !prevDateStr) continue

            const currentDate = new Date(currentDateStr)
            const prevDate = new Date(prevDateStr)
            const diffTime = currentDate.getTime() - prevDate.getTime()
            const diffDays = Math.round(diffTime / 86400000)

            if (diffDays === 1) {
              studyStreak++
            } else {
              break
            }
          }
        }
      }

      // Calculate sets completed (practice sessions that have ended)
      // TODO: Fetch practice sets that have been completed

      studentStats.value = {
        questionsAnswered,
        accuracyRate,
        studyStreak,
        setsCompleted: 0,
      }
    } catch (err) {
      console.error('Error fetching student stats:', err)
      throw err
    }
  }

  // Teacher only: Fetch teacher-specific data
  // TODO: Add fetchTeacherStats method here

  // Admin only: Fetch admin-specific data
  // TODO: Add fetchAdminStats method here

  // Common: Fetch all profile data based on role
  const fetchProfile = async () => {
    const userId = authStore.user?.id
    if (!userId) {
      error.value = 'No user authenticated'
      return
    }

    loading.value = true
    error.value = null

    try {
      await fetchUserProfile(userId)

      const userRole = authStore.user?.user_metadata?.role || 'student'

      // Fetch role-specific data
      if (userRole === 'student') {
        await Promise.all([fetchUserExp(userId), fetchStudentStats(userId)])
      } else if (userRole === 'teacher') {
        // TODO: Fetch teacher-specific data
      } else if (userRole === 'admin') {
        // TODO: Fetch admin-specific data
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      loading.value = false
    }
  }

  // ===================================
  // UPDATE METHODS
  // ===================================

  // Common: Update user profile
  const updateProfile = async (updates: Partial<UserRow>) => {
    const userId = authStore.user?.id
    if (!userId) {
      error.value = 'No user authenticated'
      return
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) {
        error.value = updateError.message
        throw updateError
      }

      userProfile.value = data
    } catch (err) {
      console.error('Error updating profile:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Student only: Update exp
  const updateExp = async (newExp: number) => {
    const userId = authStore.user?.id
    if (!userId) {
      error.value = 'No user authenticated'
      return
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('student_exp')
        .update({ exp: newExp, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) {
        error.value = updateError.message
        throw updateError
      }

      userExp.value = data
    } catch (err) {
      console.error('Error updating exp:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Teacher only: Update teacher-specific data
  // TODO: Add teacher update methods here

  // Admin only: Update admin-specific data
  // TODO: Add admin update methods here

  // ===================================
  // UTILITY METHODS
  // ===================================

  // Common: Clear all profile data (on logout)
  const clearProfile = () => {
    // Clear common data
    userProfile.value = null
    error.value = null

    // Clear student data
    userExp.value = null
    studentStats.value = {
      questionsAnswered: 0,
      accuracyRate: 0,
      studyStreak: 0,
      setsCompleted: 0,
    }

    // TODO: Clear teacher data

    // TODO: Clear admin data
  }

  // ===================================
  // RETURN
  // ===================================

  return {
    // ===================================
    // STATE
    // ===================================
    // Common
    userProfile,
    loading,
    error,
    // Student
    userExp,
    studentStats,
    // Teacher
    // TODO: Export teacher state
    // Admin
    // TODO: Export admin state

    // ===================================
    // COMPUTED
    // ===================================
    // Common
    fullName,
    dob,
    role,
    // Student
    exp,
    // Teacher
    // TODO: Export teacher computed
    // Admin
    // TODO: Export admin computed

    // ===================================
    // ACTIONS
    // ===================================
    // Common
    fetchProfile,
    fetchUserProfile,
    updateProfile,
    clearProfile,
    // Student
    fetchUserExp,
    fetchStudentStats,
    updateExp,
    // Teacher
    // TODO: Export teacher actions
    // Admin
    // TODO: Export admin actions
  }
})
