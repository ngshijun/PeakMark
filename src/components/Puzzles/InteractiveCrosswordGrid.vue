<template>
  <div class="flex flex-col items-center justify-center w-full h-full">
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
            cell ? 'bg-white' : 'bg-gray-800',
            {
              'cell-highlight': isHighlighted(i, j),
              'cell-correct': isCorrect(i, j),
              'cell-incorrect': isIncorrect(i, j),
            },
          ]"
        >
          <!-- Word number -->
          <span
            v-if="cell && getCellNumber(i, j)"
            class="absolute top-0.5 left-1 text-[0.6em] font-bold text-gray-600 leading-none pointer-events-none z-10"
          >
            {{ getCellNumber(i, j) }}
          </span>

          <!-- Input field for white cells -->
          <input
            v-if="cell"
            type="text"
            maxlength="1"
            :value="showSolution ? cell : userAnswers[i]?.[j] || ''"
            @input="(e) => handleInput(e, i, j)"
            @keydown="(e) => handleKeydown(e, i, j)"
            @focus="() => handleFocus(i, j)"
            @click="() => handleClick(i, j)"
            :ref="(el) => setCellRef(el, i, j)"
            :disabled="showSolution"
            class="w-full h-full flex items-center justify-center font-bold text-[1.2em] text-center bg-transparent border-0 outline-none uppercase cursor-pointer disabled:cursor-default"
            :class="showSolution ? 'text-gray-800' : 'text-gray-900'"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlacedWord } from '@/utils/crossword-generator'
import { nextTick, ref } from 'vue'

const props = defineProps<{
  grid: string[][]
  placedWords: PlacedWord[]
  userAnswers: string[][]
  checkedAnswers: boolean[][]
  incorrectAnswers: boolean[][]
  currentClue: PlacedWord | null
  showSolution?: boolean
}>()

const emit = defineEmits<{
  'update:userAnswers': [answers: string[][]]
  'update:currentClue': [clue: PlacedWord | null]
  'update:currentDirection': [direction: 'across' | 'down']
  clueSelected: [clue: PlacedWord]
}>()

const cellRefs = ref<Record<string, HTMLInputElement>>({})
const currentDirection = ref<'across' | 'down'>('across')

const setCellRef = (el: HTMLInputElement | Element | null, row: number, col: number) => {
  if (el && el instanceof HTMLInputElement) {
    cellRefs.value[`${row}-${col}`] = el
  }
}

const getCellNumber = (row: number, col: number) => {
  const word = props.placedWords.find((w) => w.row === row && w.col === col)
  return word ? word.number : null
}

const isHighlighted = (row: number, col: number) => {
  if (!props.currentClue) return false
  const clue = props.currentClue
  for (let i = 0; i < clue.word.length; i++) {
    const checkRow = clue.direction === 'across' ? clue.row : clue.row + i
    const checkCol = clue.direction === 'across' ? clue.col + i : clue.col
    if (checkRow === row && checkCol === col) return true
  }
  return false
}

const isCorrect = (row: number, col: number) => {
  return props.checkedAnswers[row]?.[col] || false
}

const isIncorrect = (row: number, col: number) => {
  return props.incorrectAnswers[row]?.[col] || false
}

const handleInput = (event: Event, row: number, col: number) => {
  if (props.showSolution) return

  const target = event.target as HTMLInputElement
  const value = target.value.toUpperCase()

  // Update user answers
  const newAnswers = props.userAnswers.map((r, i) =>
    r.map((c, j) => (i === row && j === col ? value : c)),
  )
  emit('update:userAnswers', newAnswers)

  // Move to next cell if input was entered
  if (value.length > 0) {
    moveToNextCell(row, col)
  }
}

const handleKeydown = async (event: KeyboardEvent, row: number, col: number) => {
  let nextRow = row
  let nextCol = col

  if (event.key === 'Backspace' && props.userAnswers[row]?.[col] === '') {
    event.preventDefault()
    if (currentDirection.value === 'across') {
      nextCol--
    } else {
      nextRow--
    }
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    nextCol--
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    nextCol++
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    nextRow--
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    nextRow++
  } else {
    return
  }

  await nextTick()
  const nextCell = cellRefs.value[`${nextRow}-${nextCol}`]
  if (nextCell) {
    nextCell.focus()
  }
}

const handleFocus = (row: number, col: number) => {
  selectClueForCell(row, col)
}

const handleClick = (row: number, col: number) => {
  const activeEl = document.activeElement
  if (activeEl === cellRefs.value[`${row}-${col}`]) {
    // Toggle direction on click of already focused cell
    currentDirection.value = currentDirection.value === 'across' ? 'down' : 'across'
    emit('update:currentDirection', currentDirection.value)
    selectClueForCell(row, col)
  }
}

const selectClueForCell = (row: number, col: number) => {
  let matchingClues = props.placedWords.filter((c) => {
    if (c.direction === currentDirection.value) {
      if (c.direction === 'across') {
        return c.row === row && col >= c.col && col < c.col + c.word.length
      } else {
        return c.col === col && row >= c.row && row < c.row + c.word.length
      }
    }
    return false
  })

  if (matchingClues.length === 0) {
    matchingClues = props.placedWords.filter((c) => {
      if (c.direction === 'across') {
        return c.row === row && col >= c.col && col < c.col + c.word.length
      } else {
        return c.col === col && row >= c.row && row < c.row + c.word.length
      }
    })
  }

  if (matchingClues.length > 0) {
    const clue = matchingClues[0]
    if (clue) {
      emit('update:currentClue', clue)
      emit('update:currentDirection', clue.direction)
      emit('clueSelected', clue)
      currentDirection.value = clue.direction
    }
  }
}

const moveToNextCell = async (row: number, col: number) => {
  if (!props.currentClue) return

  let nextRow = row
  let nextCol = col

  if (currentDirection.value === 'across') {
    nextCol++
  } else {
    nextRow++
  }

  await nextTick()
  const nextCell = cellRefs.value[`${nextRow}-${nextCol}`]
  if (nextCell) {
    nextCell.focus()
  }
}

const focusCell = async (row: number, col: number) => {
  await nextTick()
  const cell = cellRefs.value[`${row}-${col}`]
  if (cell) {
    cell.focus()
  }
}

defineExpose({
  focusCell,
})
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
}

.crossword-cell {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.cell-highlight {
  background-color: #e3f2fd !important; /* Light blue */
}

.cell-correct {
  background-color: #c8e6c9 !important; /* Light green */
}

.cell-incorrect {
  background-color: #ffcdd2 !important; /* Light red */
}

input:focus {
  outline: 3px solid hsl(var(--primary));
  outline-offset: -3px;
  z-index: 5;
}

@media (max-width: 768px) {
  .crossword-grid {
    font-size: clamp(8px, 1.5vw, 12px);
  }
}

@media (orientation: landscape) and (max-height: 600px) {
  .crossword-grid {
    max-width: 400px;
    max-height: 400px;
  }
}
</style>
