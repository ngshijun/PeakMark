<template>
  <div v-if="grid.length > 0" class="flex flex-col items-center justify-center w-full h-full">
    <div
      :class="['wordsearch-grid', { 'wordsearch-grid-thumbnail': isThumbnail }]"
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
          :class="['wordsearch-cell', 'relative', getCellBackgroundClass(i, j)]"
        >
          <!-- Cell content -->
          <div
            class="w-full h-full flex items-center justify-center font-bold text-[1.2em]"
            :class="showSolution ? 'text-gray-800' : 'text-gray-700'"
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
import { Grid3x3 } from 'lucide-vue-next'
import type { PlacedWord } from '@/utils/wordsearch-generator'

const props = withDefaults(
  defineProps<{
    grid: string[][]
    placedWords?: PlacedWord[]
    showSolution?: boolean
    isThumbnail?: boolean
    foundWords?: Set<string>
  }>(),
  {
    isThumbnail: false,
    placedWords: () => [],
    foundWords: () => new Set(),
  },
)

// Determine cell background color based on whether it's part of a found word or solution
const getCellBackgroundClass = (row: number, col: number): string => {
  if (!props.placedWords) {
    return 'bg-white'
  }

  // When showing solution, highlight all words in green
  if (props.showSolution) {
    const isPartOfWord = props.placedWords.some((word) => isCellInWord(row, col, word))
    return isPartOfWord ? 'bg-green-100' : 'bg-white'
  }

  // When not showing solution, only highlight found words
  const isPartOfFoundWord = props.placedWords.some((word) => {
    if (!props.foundWords?.has(word.word)) return false
    return isCellInWord(row, col, word)
  })

  return isPartOfFoundWord ? 'bg-green-100' : 'bg-white'
}

// Check if a cell is part of a word
function isCellInWord(row: number, col: number, word: PlacedWord): boolean {
  const { startRow, startCol, endRow, endCol } = word

  // Calculate direction
  const dr = endRow > startRow ? 1 : endRow < startRow ? -1 : 0
  const dc = endCol > startCol ? 1 : endCol < startCol ? -1 : 0

  // Check each position in the word
  let r = startRow
  let c = startCol

  while (true) {
    if (r === row && c === col) return true

    if (r === endRow && c === endCol) {
      // Check the last cell
      return r === row && c === col
    }

    r += dr
    c += dc
  }
}
</script>

<style scoped>
.wordsearch-grid {
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
.wordsearch-grid-thumbnail {
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  font-size: clamp(6px, 1.5vw, 12px);
}

.wordsearch-cell {
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
  .wordsearch-grid:not(.wordsearch-grid-thumbnail) {
    font-size: clamp(8px, 1.5vw, 12px);
  }
}

@media (orientation: landscape) and (max-height: 600px) {
  .wordsearch-grid:not(.wordsearch-grid-thumbnail) {
    max-width: 400px;
    max-height: 400px;
  }
}
</style>
