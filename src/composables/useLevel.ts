import { computed } from 'vue'
import { useClassroomStore } from '@/stores/classrooms'

// Level calculation formula: level = floor(sqrt(exp / 100)) + 1
// Each level requires progressively more XP
// Minimum level is 1 (even with 0 XP)
export const calculateLevel = (exp: number): number => {
  return Math.floor(Math.sqrt(exp / 100)) + 1
}

// Calculate XP needed for a specific level
// Adjusted for level starting at 1
const calculateExpForLevel = (level: number): number => {
  const adjustedLevel = level - 1
  return adjustedLevel * adjustedLevel * 100
}

/**
 * Composable for level calculations based on experience points
 * Uses the profile store as the single source of truth for exp data
 */
export const useLevel = () => {
  const classroomStore = useClassroomStore()

  const currentExp = computed(() => classroomStore.studentExp?.exp || 0)

  const currentLevel = computed(() => calculateLevel(currentExp.value))

  const expForCurrentLevel = computed(() => calculateExpForLevel(currentLevel.value))

  const expForNextLevel = computed(() => calculateExpForLevel(currentLevel.value + 1))

  const expToNextLevel = computed(() => expForNextLevel.value - expForCurrentLevel.value)

  const expProgress = computed(() => {
    const expInCurrentLevel = currentExp.value - expForCurrentLevel.value
    return Math.min(100, (expInCurrentLevel / expToNextLevel.value) * 100)
  })

  const expInCurrentLevel = computed(() => currentExp.value - expForCurrentLevel.value)

  return {
    // Computed values
    currentExp,
    currentLevel,
    expForCurrentLevel,
    expForNextLevel,
    expToNextLevel,
    expProgress,
    expInCurrentLevel,

    // Methods from profile store
    addExp: classroomStore.updateStudentExp,
  }
}
