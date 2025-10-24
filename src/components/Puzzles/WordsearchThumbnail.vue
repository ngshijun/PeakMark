<template>
  <div
    class="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden pointer-events-none"
  >
    <svg
      v-if="parsedGrid.length > 0"
      :viewBox="`0 0 ${gridSize * cellSize} ${gridSize * cellSize}`"
      class="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- Grid background -->
      <rect
        :width="gridSize * cellSize"
        :height="gridSize * cellSize"
        fill="rgb(31, 41, 55)"
        rx="2"
      />

      <!-- Grid cells with letters -->
      <g v-for="(row, i) in parsedGrid" :key="`row-${i}`">
        <g v-for="(cell, j) in row" :key="`cell-${i}-${j}`">
          <!-- Cell background -->
          <rect
            :x="j * cellSize + cellPadding"
            :y="i * cellSize + cellPadding"
            :width="cellSize - cellPadding * 2"
            :height="cellSize - cellPadding * 2"
            fill="white"
            rx="1"
          />
          <!-- Letter text -->
          <text
            :x="j * cellSize + cellSize / 2"
            :y="i * cellSize + cellSize / 2"
            text-anchor="middle"
            dominant-baseline="central"
            :font-size="cellSize * 0.5"
            font-weight="bold"
            fill="rgb(31, 41, 55)"
            font-family="system-ui, -apple-system, sans-serif"
          >
            {{ cell }}
          </text>
        </g>
      </g>
    </svg>
    <div v-else class="text-muted-foreground">
      <Grid3x3 class="h-12 w-12 opacity-50" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlacedWord } from '@/utils/wordsearch-generator'
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

const gridSize = computed(() => parsedGrid.value.length || 0)
const cellSize = 20
const cellPadding = 1
</script>
