import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface LevelUpData {
  classroomId: string
  classroomName?: string
  oldLevel: number
  newLevel: number
}

export const useLevelUpStore = defineStore('levelUp', () => {
  // State
  const isDialogOpen = ref(false)
  const celebrationData = ref<LevelUpData | null>(null)

  // Track previous levels per classroom (in-memory)
  const previousLevels = ref<Map<string, number>>(new Map())

  // Actions

  /**
   * Initialize level tracking for a classroom
   */
  const initializeLevel = (classroomId: string, currentLevel: number) => {
    if (!previousLevels.value.has(classroomId)) {
      previousLevels.value.set(classroomId, currentLevel)
    }
  }

  /**
   * Check if level has increased and trigger celebration if so
   * @param classroomId - The classroom ID
   * @param newLevel - The new calculated level
   * @param classroomName - Optional classroom name for display
   * @returns true if level increased, false otherwise
   */
  const checkLevelUp = (classroomId: string, newLevel: number, classroomName?: string): boolean => {
    const previousLevel = previousLevels.value.get(classroomId)

    // If no previous level, initialize it (first load)
    if (previousLevel === undefined) {
      previousLevels.value.set(classroomId, newLevel)
      return false
    }

    // Check if level increased
    if (newLevel > previousLevel) {
      // Trigger celebration
      celebrationData.value = {
        classroomId,
        classroomName,
        oldLevel: previousLevel,
        newLevel,
      }
      isDialogOpen.value = true

      // Update tracked level
      previousLevels.value.set(classroomId, newLevel)

      return true
    }

    // Update tracked level even if no level up (in case XP decreased somehow)
    if (newLevel !== previousLevel) {
      previousLevels.value.set(classroomId, newLevel)
    }

    return false
  }

  /**
   * Close the celebration dialog
   */
  const closeDialog = () => {
    isDialogOpen.value = false
    // Don't clear celebrationData immediately to allow for exit animations
    setTimeout(() => {
      celebrationData.value = null
    }, 300)
  }

  /**
   * Manually trigger celebration (for testing)
   */
  const triggerCelebration = (data: LevelUpData) => {
    celebrationData.value = data
    isDialogOpen.value = true
  }

  /**
   * Reset all tracked levels (useful for logout)
   */
  const reset = () => {
    previousLevels.value.clear()
    isDialogOpen.value = false
    celebrationData.value = null
  }

  return {
    // State
    isDialogOpen,
    celebrationData,
    previousLevels,

    // Actions
    initializeLevel,
    checkLevelUp,
    closeDialog,
    triggerCelebration,
    reset,
  }
})
