<template>
  <div v-if="grid.length > 0" class="flex flex-col items-center justify-center w-full h-full">
    <div
      :class="['crossword-grid', { 'crossword-grid-thumbnail': isThumbnail }]"
      :style="{
        display: 'grid',
        gridTemplateColumns: `repeat(${grid[0]?.length || 0}, 1fr)`,
        gridTemplateRows: `repeat(${grid.length}, 1fr)`,
        gap: '2px',
      }"
    >
      <template v-for="(row, i) in grid" :key="`row-${i}`">
        <div
          v-for="(cell, j) in row"
          :key="`cell-${i}-${j}`"
          :class="[
            'crossword-cell',
            'relative',
            cell ? getCellBackgroundClass(i, j) : 'bg-gray-800',
          ]"
        >
          <!-- Word number -->
          <span
            v-if="cell && !isThumbnail && getWordStartAt(placedWords, i, j)"
            class="absolute top-0.5 left-1 text-[0.6em] font-bold text-gray-600 leading-none"
          >
            {{ getWordStartAt(placedWords, i, j)?.number }}
          </span>

          <!-- Cell content -->
          <div
            v-if="cell"
            class="w-full h-full flex items-center justify-center font-bold text-[1.2em]"
            :class="showSolution ? 'text-gray-800' : 'text-transparent'"
          >
            {{ cell }}
          </div>
        </div>
      </template>
    </div>
  </div>
  <div v-else class="flex items-center justify-center h-full text-muted-foreground">
    <div class="text-center">
      <Grid3x3 class="mx-auto mb-2 h-16 w-16 opacity-50" />
      <p>No puzzle grid available</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlacedWord } from '@/utils/crossword-generator'
import { getWordStartAt } from '@/utils/crossword-generator'
import { Grid3x3 } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    grid: string[][]
    placedWords: PlacedWord[]
    showSolution?: boolean
    isThumbnail?: boolean
    correctAnswers?: boolean[][]
    incorrectAnswers?: boolean[][]
  }>(),
  {
    isThumbnail: false,
    correctAnswers: undefined,
    incorrectAnswers: undefined,
  },
)

// Determine cell background color based on validation state
const getCellBackgroundClass = (row: number, col: number): string => {
  // If we have validation data
  if (props.correctAnswers && props.incorrectAnswers) {
    const isCorrect = props.correctAnswers[row]?.[col]
    const isIncorrect = props.incorrectAnswers[row]?.[col]

    if (isCorrect) {
      return 'bg-green-100'
    }
    if (isIncorrect) {
      return 'bg-red-100'
    }
  }

  // Default white background
  return 'bg-white'
}
</script>

<style scoped>
.crossword-grid {
  width: 100%;
  height: 100%;
  max-width: 600px;
  max-height: 600px;
  aspect-ratio: 1 / 1;
  font-size: clamp(10px, 1.2vw, 16px);
  background-color: rgb(31, 41, 55); /* gray-800 */
  margin: 0 auto;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* Thumbnail mode: Use container-based sizing to avoid viewport issues */
.crossword-grid-thumbnail {
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  font-size: clamp(6px, 1.5vw, 12px);
}

.crossword-cell {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

@media (max-width: 768px) {
  .crossword-grid:not(.crossword-grid-thumbnail) {
    font-size: clamp(8px, 1.5vw, 12px);
  }
}

@media (orientation: landscape) and (max-height: 600px) {
  .crossword-grid:not(.crossword-grid-thumbnail) {
    max-width: 400px;
    max-height: 400px;
  }
}
</style>
