import type { Tables } from '@/types/database.types'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

type Classroom = Tables<'classrooms'>

const STORAGE_KEY = 'peakmark_selected_classroom'

export const useClassroomSelectionStore = defineStore('classroomSelection', () => {
  const selectedClassroom = ref<Classroom | null>(null)

  // Load from localStorage on initialization
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        selectedClassroom.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load selected classroom from storage:', error)
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Save to localStorage whenever selection changes
  watch(
    selectedClassroom,
    (newValue) => {
      if (newValue) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    },
    { deep: true },
  )

  const selectClassroom = (classroom: Classroom) => {
    selectedClassroom.value = classroom
  }

  const clearSelection = () => {
    selectedClassroom.value = null
  }

  // Initialize on store creation
  loadFromStorage()

  return {
    // State
    selectedClassroom,

    // Actions
    selectClassroom,
    clearSelection,
  }
})
