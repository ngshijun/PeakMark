<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent
      class="max-w-7xl max-h-[90vh] flex flex-col p-0 lg:min-w-[80rem] lg:min-h-[50rem] print:max-w-none print:max-h-none print:min-w-0 print:min-h-0"
    >
      <DialogHeader class="px-6 pt-6 pb-4 border-b print:border-b-2 print:pb-6">
        <DialogTitle class="text-2xl flex items-center gap-3">
          {{ puzzle?.title }}
        </DialogTitle>
        <DialogDescription v-if="puzzle?.description" class="mt-1">
          {{ puzzle.description }}
        </DialogDescription>
      </DialogHeader>

      <div
        class="flex-1 overflow-hidden flex flex-col lg:flex-row print:flex-col print:overflow-visible"
      >
        <!-- Left Panel: Crossword Grid -->
        <div
          class="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-4 overflow-hidden print:w-full print:overflow-visible print:mb-8"
        >
          <div class="w-full h-full max-w-[600px] max-h-[600px] flex items-center justify-center">
            <CrosswordGrid
              :grid="parsedGrid"
              :placed-words="parsedPlacedWords"
              :show-solution="showSolution"
            />
          </div>
        </div>

        <!-- Right Panel: Clues -->
        <div
          class="w-full lg:w-1/2 flex flex-col px-6 py-4 border-t lg:border-t-0 lg:border-l overflow-auto print:w-full print:border-0 print:overflow-visible"
        >
          <h3 class="text-lg font-semibold mb-4">Clues</h3>

          <div v-if="parsedPlacedWords.length > 0" class="space-y-6 print:columns-2 print:gap-8">
            <!-- Across Clues -->
            <div v-if="acrossClues.length > 0" class="print:break-inside-avoid">
              <h4 class="font-semibold text-base mb-3 flex items-center gap-2">
                <ArrowRight class="h-4 w-4 print:hidden" />
                Across
              </h4>
              <div class="space-y-2">
                <div
                  v-for="word in acrossClues"
                  :key="word.number"
                  class="flex gap-3 p-2 rounded hover:bg-muted/50 print:p-1 print:hover:bg-transparent"
                >
                  <span
                    class="font-semibold text-sm text-muted-foreground min-w-[2rem] print:text-black"
                  >
                    {{ word.number }}.
                  </span>
                  <div class="flex-1">
                    <p class="text-sm">{{ word.clue }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Down Clues -->
            <div v-if="downClues.length > 0" class="print:break-inside-avoid">
              <h4 class="font-semibold text-base mb-3 flex items-center gap-2">
                <ArrowDown class="h-4 w-4 print:hidden" />
                Down
              </h4>
              <div class="space-y-2">
                <div
                  v-for="word in downClues"
                  :key="word.number"
                  class="flex gap-3 p-2 rounded hover:bg-muted/50 print:p-1 print:hover:bg-transparent"
                >
                  <span
                    class="font-semibold text-sm text-muted-foreground min-w-[2rem] print:text-black"
                  >
                    {{ word.number }}.
                  </span>
                  <div class="flex-1">
                    <p class="text-sm">{{ word.clue }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="flex items-center justify-center h-full text-muted-foreground print:hidden"
          >
            <div class="text-center">
              <p>No clues available</p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="px-6 py-4 border-t print:hidden">
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4"
        >
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div v-if="showSolutionToggle" class="flex items-center gap-2">
              <Label for="show-solution" class="text-sm font-medium">Show Solution</Label>
              <Switch
                id="show-solution"
                v-model:checked="showSolution"
                @update:modelValue="handleShowSolutionChange"
              />
            </div>
            <div
              class="text-sm text-muted-foreground"
              :class="{ 'sm:border-l sm:pl-3': showSolutionToggle }"
            >
              <p v-if="puzzle?.created_at">Created {{ formatDate(puzzle.created_at) }}</p>
            </div>
          </div>
          <div class="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" @click="handleClose" class="flex-1 sm:flex-none"
              >Close</Button
            >
            <Button @click="handlePrint" class="flex-1 sm:flex-none">
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
import CrosswordGrid from '@/components/Puzzles/CrosswordGrid.vue'
import type { Tables } from '@/types/database.types'
import type { PlacedWord } from '@/utils/crossword-generator'
import { ArrowDown, ArrowRight, Printer } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

type Puzzle = Tables<'puzzles'>

const props = withDefaults(
  defineProps<{
    open: boolean
    puzzle: Puzzle | null
    showSolutionToggle?: boolean
  }>(),
  {
    showSolutionToggle: true,
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const showSolution = ref(false)

const handleShowSolutionChange = (value: boolean) => {
  showSolution.value = value
}

/**
 * Parse grid from JSON string array
 * Grid is stored as a single-element array containing a JSON string
 * to avoid TypeScript issues with JSONB column type
 */
const parsedGrid = computed<string[][]>(() => {
  if (!props.puzzle?.grid?.length) return []

  try {
    const gridData = props.puzzle.grid[0]
    if (!gridData) return []

    const parsed = JSON.parse(gridData)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to parse grid:', error)
    return []
  }
})

/**
 * Parse placed words from JSON string array
 * Stored as a single-element array containing a JSON string
 * to avoid TypeScript issues with JSONB column type
 */
const parsedPlacedWords = computed<PlacedWord[]>(() => {
  if (!props.puzzle?.placed_words?.length) return []

  try {
    const placedWordsData = props.puzzle.placed_words[0]
    if (!placedWordsData) return []

    const parsed = JSON.parse(placedWordsData)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to parse placed words:', error)
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
  // Ensure solution is hidden for print unless already visible
  const wasSolutionVisible = showSolution.value

  // Give browser time to render before printing
  setTimeout(() => {
    window.print()

    // Restore solution state after print dialog closes
    // Note: This won't work if user cancels print, but it's a reasonable tradeoff
    if (!wasSolutionVisible) {
      showSolution.value = false
    }
  }, 100)
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
  /* Hide dialog overlay and interactive elements */
  :deep(.dialog-overlay) {
    display: none !important;
  }

  /* Reset dialog positioning for print */
  :deep([role='dialog']) {
    position: static !important;
    width: 100% !important;
    height: auto !important;
    max-width: none !important;
    max-height: none !important;
    transform: none !important;
  }

  /* Ensure proper page layout */
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>
