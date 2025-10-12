<template>
  <div
    class="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden pointer-events-none"
  >
    <div v-if="parsedGrid.length > 0" class="w-full h-full">
      <CrosswordGrid
        :grid="parsedGrid"
        :placed-words="parsedPlacedWords"
        :show-solution="false"
      />
    </div>
    <div v-else class="text-muted-foreground">
      <Grid3x3 class="h-12 w-12 opacity-50" />
    </div>
  </div>
</template>

<script setup lang="ts">
import CrosswordGrid from './CrosswordGrid.vue'
import type { PlacedWord } from '@/utils/crossword-generator'
import { Grid3x3 } from 'lucide-vue-next'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    grid: string[] | string[][]
    placedWords?: string[] | PlacedWord[]
  }>(),
  {
    placedWords: () => [],
  },
)

// Parse the grid - it could be stored as string[] (JSON strings) or already parsed
const parsedGrid = computed<string[][]>(() => {
  if (!props.grid || props.grid.length === 0) return []

  // If grid is an array of strings (JSON), parse the first one
  if (typeof props.grid[0] === 'string') {
    try {
      return JSON.parse(props.grid[0])
    } catch (e) {
      console.error('Failed to parse grid:', e)
      return []
    }
  }

  // Already a 2D array
  return props.grid as string[][]
})

// Parse placed words - same pattern as grid
const parsedPlacedWords = computed<PlacedWord[]>(() => {
  if (!props.placedWords || props.placedWords.length === 0) return []

  // If it's an array of strings (JSON), parse the first one
  if (typeof props.placedWords[0] === 'string') {
    try {
      return JSON.parse(props.placedWords[0])
    } catch (e) {
      console.error('Failed to parse placed words:', e)
      return []
    }
  }

  // Already a parsed array
  return props.placedWords as PlacedWord[]
})
</script>
