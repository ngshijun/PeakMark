import type { Tables } from '@/types/database.types'
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type Classroom = Tables<'classrooms'>

export const useClassroomSelectionStore = defineStore('classroomSelection', () => {
  const router = useRouter()
  const route = useRoute()

  // Get classroom ID from URL
  const selectedClassroomId = computed(() => route.params.classroomId as string | undefined)

  const selectClassroom = (classroom: Classroom) => {
    router.push({
      name: 'dashboard',
      params: { classroomId: classroom.id },
    })
  }

  const clearSelection = () => {
    router.push({ name: 'classrooms' })
  }

  return {
    // State
    selectedClassroomId,

    // Actions
    selectClassroom,
    clearSelection,
  }
})
