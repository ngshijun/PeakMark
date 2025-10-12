<template>
  <div v-if="grid.length > 0" class="flex flex-col items-center justify-center w-full h-full">
    <div
      class="crossword-grid"
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
            cell ? 'bg-white' : 'bg-gray-800'
          ]"
        >
          <!-- Word number -->
          <span
            v-if="cell && getWordStartAt(placedWords, i, j)"
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

defineProps<{
  grid: string[][]
  placedWords: PlacedWord[]
  showSolution?: boolean
}>()
</script>

<style scoped>
.crossword-grid {
  width: min(100%, calc(100vh - 16rem));
  height: min(100%, calc(100vh - 16rem));
  max-width: 600px;
  max-height: 600px;
  aspect-ratio: 1 / 1;
  font-size: clamp(10px, 1.2vw, 16px);
  background-color: rgb(31, 41, 55); /* gray-800 */
  margin: 0 auto;
}

.crossword-cell {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

@media print {
  .crossword-grid {
    width: 600px;
    height: 600px;
    font-size: 14px;
    page-break-inside: avoid;
    gap: 1px;
  }
}

@media (max-width: 768px) {
  .crossword-grid {
    width: min(100%, calc(100vh - 14rem));
    height: min(100%, calc(100vh - 14rem));
    font-size: clamp(8px, 1.5vw, 12px);
  }
}

@media (orientation: landscape) and (max-height: 600px) {
  .crossword-grid {
    width: min(100%, calc(100vh - 12rem));
    height: min(100%, calc(100vh - 12rem));
    max-width: 400px;
    max-height: 400px;
  }
}
</style>
