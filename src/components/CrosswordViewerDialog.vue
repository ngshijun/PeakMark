<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-7xl max-h-[90vh] flex flex-col p-0 min-w-[80rem] min-h-[50rem]">
      <DialogHeader class="px-6 pt-6 pb-4 border-b">
        <DialogTitle class="text-2xl flex items-center gap-3">
          {{ puzzle?.title }}
        </DialogTitle>
        <DialogDescription v-if="puzzle?.description" class="mt-1">
          {{ puzzle.description }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-hidden flex">
        <!-- Left Panel: Crossword Grid -->
        <div class="w-1/2 flex flex-col px-6 py-4 overflow-auto">
          <div v-if="parsedGrid.length > 0" class="flex flex-col items-center">
            <div class="inline-block" style="font-size: 0">
              <div v-for="(row, i) in parsedGrid" :key="i" style="display: flex">
                <div
                  v-for="(cell, j) in row"
                  :key="j"
                  :class="['relative', cell ? 'bg-white border-2 border-gray-800' : 'bg-gray-800']"
                  style="width: 40px; height: 40px"
                >
                  <!-- Word number -->
                  <span
                    v-if="getWordStart(i, j)"
                    class="absolute top-0.5 left-1 text-[9px] font-bold text-gray-600"
                  >
                    {{ getWordStart(i, j)?.number }}
                  </span>

                  <!-- Cell content -->
                  <div
                    v-if="cell"
                    class="w-full h-full flex items-center justify-center font-bold"
                    :class="showSolution ? 'text-gray-800 text-lg' : 'text-transparent'"
                  >
                    {{ cell }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="flex items-center justify-center h-full text-muted-foreground">
            <div class="text-center">
              <Grid3x3 class="mx-auto mb-2 h-16 w-16 opacity-50" />
              <p>No puzzle grid available</p>
            </div>
          </div>
        </div>

        <!-- Right Panel: Clues -->
        <div class="w-1/2 flex flex-col px-6 py-4 border-l overflow-auto">
          <h3 class="text-lg font-semibold mb-4">Clues</h3>

          <div v-if="parsedPlacedWords.length > 0" class="space-y-6">
            <!-- Across Clues -->
            <div v-if="acrossClues.length > 0">
              <h4 class="font-semibold text-base mb-3 flex items-center gap-2">
                <ArrowRight class="h-4 w-4" />
                Across
              </h4>
              <div class="space-y-2">
                <div
                  v-for="word in acrossClues"
                  :key="word.number"
                  class="flex gap-3 p-2 rounded hover:bg-muted/50"
                >
                  <span class="font-semibold text-sm text-muted-foreground min-w-[2rem]">
                    {{ word.number }}.
                  </span>
                  <div class="flex-1">
                    <p class="text-sm">{{ word.clue }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Down Clues -->
            <div v-if="downClues.length > 0">
              <h4 class="font-semibold text-base mb-3 flex items-center gap-2">
                <ArrowDown class="h-4 w-4" />
                Down
              </h4>
              <div class="space-y-2">
                <div
                  v-for="word in downClues"
                  :key="word.number"
                  class="flex gap-3 p-2 rounded hover:bg-muted/50"
                >
                  <span class="font-semibold text-sm text-muted-foreground min-w-[2rem]">
                    {{ word.number }}.
                  </span>
                  <div class="flex-1">
                    <p class="text-sm">{{ word.clue }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="flex items-center justify-center h-full text-muted-foreground">
            <div class="text-center">
              <p>No clues available</p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="px-6 py-4 border-t">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <Label for="show-solution" class="text-sm font-medium">Show Solution</Label>
              <Switch
                id="show-solution"
                v-model:checked="showSolution"
                @update:modelValue="handleShowSolutionChange"
              />
            </div>
            <div class="text-sm text-muted-foreground border-l pl-3">
              <p v-if="puzzle?.created_at">Created {{ formatDate(puzzle.created_at) }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" @click="handleClose">Close</Button>
            <Button @click="handlePrint">
              <Printer class="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { Tables } from '@/types/database.types'
import type { PlacedWord } from '@/utils/crossword-generator'
import { getWordStartAt } from '@/utils/crossword-generator'
import { ArrowDown, ArrowRight, Grid3x3, Printer } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

type Puzzle = Tables<'puzzles'>

const props = defineProps<{
  open: boolean
  puzzle: Puzzle | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const showSolution = ref(false)

const handleShowSolutionChange = (value: boolean) => {
  showSolution.value = value
}

// Parse grid from JSON string array
const parsedGrid = computed<string[][]>(() => {
  if (!props.puzzle?.grid || props.puzzle.grid.length === 0) return []

  try {
    const gridData = props.puzzle.grid[0]
    if (!gridData) return []
    return JSON.parse(gridData)
  } catch (e) {
    console.error('Failed to parse grid:', e)
    return []
  }
})

// Parse placed words from JSON string array
const parsedPlacedWords = computed<PlacedWord[]>(() => {
  if (!props.puzzle?.placed_words || props.puzzle.placed_words.length === 0) return []

  try {
    const placedWordsData = props.puzzle.placed_words[0]
    if (!placedWordsData) return []
    return JSON.parse(placedWordsData)
  } catch (e) {
    console.error('Failed to parse placed words:', e)
    return []
  }
})

const acrossClues = computed(() =>
  parsedPlacedWords.value
    .filter((w) => w.direction === 'across')
    .sort((a, b) => a.number - b.number),
)

const downClues = computed(() =>
  parsedPlacedWords.value.filter((w) => w.direction === 'down').sort((a, b) => a.number - b.number),
)

const getWordStart = (row: number, col: number): PlacedWord | undefined => {
  return getWordStartAt(parsedPlacedWords.value, row, col)
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const handleOpenChange = (value: boolean) => {
  emit('update:open', value)
}

const handleClose = () => {
  emit('update:open', false)
}

const handlePrint = () => {
  window.print()
}

// Reset solution toggle when dialog closes
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      showSolution.value = false
    }
  },
)
</script>

<style scoped>
@media print {
  /* Print styles for the crossword */
  :deep(.dialog-overlay),
  :deep(button) {
    display: none !important;
  }
}
</style>
