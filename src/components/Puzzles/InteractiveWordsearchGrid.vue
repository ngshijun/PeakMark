<template>
  <div class="flex flex-col items-center justify-center w-full h-full">
    <div
      ref="gridContainer"
      class="wordsearch-grid"
      :style="{
        display: 'grid',
        gridTemplateColumns: `repeat(${grid[0]?.length || 0}, 1fr)`,
        gridTemplateRows: `repeat(${grid.length}, 1fr)`,
        gap: '2px',
      }"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
    >
      <template v-for="(row, i) in grid" :key="`row-${i}`">
        <div
          v-for="(cell, j) in row"
          :key="`cell-${i}-${j}`"
          :data-row="i"
          :data-col="j"
          :class="[
            'wordsearch-cell',
            'relative',
            'bg-white',
            {
              'cell-selecting': isInCurrentSelection(i, j),
              'cell-found': isCellInFoundWord(i, j),
            },
          ]"
        >
          <!-- Cell content -->
          <div
            class="w-full h-full flex items-center justify-center font-bold text-[1.2em] text-gray-800 pointer-events-none"
          >
            {{ cell }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PlacedWord } from '@/utils/wordsearch-generator'

const props = defineProps<{
  grid: string[][]
  placedWords: PlacedWord[]
  foundWords: Set<string>
}>()

const emit = defineEmits<{
  'word-found': [word: string]
}>()

interface Selection {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

const isSelecting = ref(false)
const currentSelection = ref<Selection | null>(null)
const gridContainer = ref<HTMLDivElement>()

const handleMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  const cell = target.closest('[data-row][data-col]')

  if (!cell) return

  const row = Number(cell.getAttribute('data-row'))
  const col = Number(cell.getAttribute('data-col'))

  isSelecting.value = true
  currentSelection.value = {
    startRow: row,
    startCol: col,
    endRow: row,
    endCol: col,
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isSelecting.value || !currentSelection.value) return

  const target = document.elementFromPoint(e.clientX, e.clientY)
  const cell = target?.closest('[data-row][data-col]')

  if (!cell) return

  const row = Number(cell.getAttribute('data-row'))
  const col = Number(cell.getAttribute('data-col'))

  // Only allow selections in valid directions
  const selection = currentSelection.value
  const rowDiff = row - selection.startRow
  const colDiff = col - selection.startCol

  // Check if it's a valid direction (horizontal, vertical, or diagonal)
  const isHorizontal = rowDiff === 0
  const isVertical = colDiff === 0
  const isDiagonal = Math.abs(rowDiff) === Math.abs(colDiff)

  if (isHorizontal || isVertical || isDiagonal) {
    selection.endRow = row
    selection.endCol = col
  }
}

const handleMouseUp = () => {
  if (!isSelecting.value || !currentSelection.value) return

  checkWordFound()

  isSelecting.value = false
  currentSelection.value = null
}

const handleMouseLeave = () => {
  if (isSelecting.value) {
    handleMouseUp()
  }
}

const isInCurrentSelection = (row: number, col: number): boolean => {
  if (!currentSelection.value) return false

  const selection = currentSelection.value
  const { startRow, startCol, endRow, endCol } = selection

  // Calculate direction
  const rowDiff = endRow - startRow
  const colDiff = endCol - startCol
  const length = Math.max(Math.abs(rowDiff), Math.abs(colDiff))

  if (length === 0) {
    return row === startRow && col === startCol
  }

  const rowStep = rowDiff === 0 ? 0 : rowDiff / Math.abs(rowDiff)
  const colStep = colDiff === 0 ? 0 : colDiff / Math.abs(colDiff)

  // Check each position in the selection
  for (let i = 0; i <= length; i++) {
    const checkRow = startRow + i * rowStep
    const checkCol = startCol + i * colStep

    if (checkRow === row && checkCol === col) return true
  }

  return false
}

const isCellInFoundWord = (row: number, col: number): boolean => {
  return props.placedWords.some((word) => {
    if (!props.foundWords.has(word.word)) return false

    const { startRow, startCol, endRow, endCol } = word
    const rowDiff = endRow - startRow
    const colDiff = endCol - startCol
    const length = Math.max(Math.abs(rowDiff), Math.abs(colDiff))

    const rowStep = rowDiff === 0 ? 0 : rowDiff / Math.abs(rowDiff)
    const colStep = colDiff === 0 ? 0 : colDiff / Math.abs(colDiff)

    for (let i = 0; i <= length; i++) {
      const checkRow = startRow + i * rowStep
      const checkCol = startCol + i * colStep

      if (checkRow === row && checkCol === col) return true
    }

    return false
  })
}

const getSelectedWord = (): string => {
  if (!currentSelection.value) return ''

  const { startRow, startCol, endRow, endCol } = currentSelection.value
  const rowDiff = endRow - startRow
  const colDiff = endCol - startCol
  const length = Math.max(Math.abs(rowDiff), Math.abs(colDiff))

  if (length === 0) {
    return props.grid[startRow]?.[startCol] || ''
  }

  const rowStep = rowDiff === 0 ? 0 : rowDiff / Math.abs(rowDiff)
  const colStep = colDiff === 0 ? 0 : colDiff / Math.abs(colDiff)

  let word = ''
  for (let i = 0; i <= length; i++) {
    const checkRow = startRow + i * rowStep
    const checkCol = startCol + i * colStep
    const letter = props.grid[checkRow]?.[checkCol]
    if (letter) {
      word += letter
    }
  }

  return word
}

const checkWordFound = () => {
  if (!currentSelection.value) return

  const selectedWord = getSelectedWord()

  // Check both forward and backward
  const matchingWord = props.placedWords.find((word) => {
    if (props.foundWords.has(word.word)) return false // Already found

    // Check if the selected word matches this placed word (forward or backward)
    return (
      selectedWord === word.word ||
      selectedWord === word.word.split('').reverse().join('')
    )
  })

  if (matchingWord) {
    emit('word-found', matchingWord.word)
  }
}

defineExpose({
  // Expose methods if needed by parent
})
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
  cursor: crosshair;
}

.wordsearch-cell {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  transition: background-color 0.1s ease;
}

.cell-selecting {
  background-color: rgb(191, 219, 254) !important; /* blue-200 */
}

.cell-found {
  background-color: rgb(187, 247, 208) !important; /* green-200 */
}

@media (max-width: 768px) {
  .wordsearch-grid {
    font-size: clamp(8px, 1.5vw, 12px);
  }
}

@media (orientation: landscape) and (max-height: 600px) {
  .wordsearch-grid {
    max-width: 400px;
    max-height: 400px;
  }
}
</style>
