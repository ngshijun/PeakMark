<template>
  <div
    class="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden"
  >
    <div v-if="parsedGrid.length > 0" class="flex items-center justify-center w-full h-full p-2">
      <div class="inline-block" :style="{ fontSize: 0, transform: `scale(${scale})` }">
        <div v-for="(row, i) in parsedGrid" :key="i" style="display: flex">
          <div
            v-for="(cell, j) in row"
            :key="j"
            :class="[
              'relative',
              cell ? 'bg-white border border-gray-400' : 'bg-gray-700',
              compact ? '' : 'border-2',
            ]"
            :style="{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
            }"
          ></div>
        </div>
      </div>
    </div>
    <div v-else class="text-muted-foreground">
      <Grid3x3 class="h-12 w-12 opacity-50" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Grid3x3 } from 'lucide-vue-next'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    grid: string[] | string[][]
    cellSize?: number
    compact?: boolean
    maxSize?: number
  }>(),
  {
    cellSize: 16,
    compact: false,
    maxSize: 200,
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

// Calculate scale to fit within maxSize
const scale = computed(() => {
  if (parsedGrid.value.length === 0) return 1

  const gridDimension = parsedGrid.value.length * props.cellSize
  if (gridDimension <= props.maxSize) return 1

  return props.maxSize / gridDimension
})
</script>
