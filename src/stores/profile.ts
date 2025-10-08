import { profileService } from '@/services/api/profile.service'
import type { StudentStats } from '@/services/api/profile.service'
import type { Tables } from '@/types/database.types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from './auth'

type UserRow = Tables<'users'>

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
  const studentStats = ref<StudentStats>({
    questionsAnswered: 0,
    accuracyRate: 0,
    studyStreak: 0,
    setsCompleted: 0,
  })

  const fullName = computed(() => userProfile.value?.full_name || '')
  const dob = computed(() => userProfile.value?.dob || '')
  const role = computed(() => userProfile.value?.role || 'student')

  // ===================================
  // FETCH METHODS
  // ===================================

  // Common: Fetch user profile from users table
  const fetchUserProfile = async (userId: string) => {
    try {
      const data = await profileService.getUserProfile(userId)
      userProfile.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    }
  }

  // Student only: Fetch statistics from question_attempts
  const fetchStudentStats = async (userId: string) => {
    try {
      const stats = await profileService.getStudentStatistics(userId)
      studentStats.value = stats
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    }
  }

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
        await fetchStudentStats(userId)
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
      const data = await profileService.updateUserProfile(userId, updates)
      userProfile.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ===================================
  // UTILITY METHODS
  // ===================================

  // Common: Clear all profile data (on logout)
  const clearProfile = () => {
    // Clear common data
    userProfile.value = null
    error.value = null

    // Clear student data
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
    userProfile,
    loading,
    error,
    studentStats,
    fullName,
    dob,
    role,
    fetchProfile,
    fetchUserProfile,
    fetchStudentStats,
    updateProfile,
    clearProfile,
  }
})
