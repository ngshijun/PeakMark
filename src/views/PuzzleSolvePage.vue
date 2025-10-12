<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="mb-4 space-y-2">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold tracking-tight">{{ puzzle?.title || 'Puzzle' }}</h1>
          <Button variant="outline" @click="handleBack">
            <ArrowLeft class="h-4 w-4 mr-2" />
            Back to Puzzles
          </Button>
        </div>
        <p v-if="puzzle?.description" class="text-muted-foreground">{{ puzzle.description }}</p>
      </div>

      <!-- Loading State -->
      <div v-if="puzzleStore.loading" class="flex-1 flex items-center justify-center">
        <div class="text-center space-y-4">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p class="text-muted-foreground">Loading puzzle...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="!puzzle" class="flex-1 flex items-center justify-center">
        <div class="text-center space-y-4">
          <Puzzle class="mx-auto h-12 w-12 text-muted-foreground" />
          <p class="text-muted-foreground">Puzzle not found</p>
        </div>
      </div>

      <!-- Puzzle Content -->
      <div v-else class="flex-1 min-h-0 rounded-xl border bg-card overflow-hidden">
        <div class="h-full overflow-auto">
          <div class="container mx-auto p-6">
            <div class="flex flex-col lg:flex-row gap-8">
              <!-- Left Panel: Crossword Grid -->
              <div class="flex-1 flex flex-col">
                <div class="bg-white rounded-lg border p-6">
                  <div class="w-full h-full max-w-[600px] max-h-[600px] mx-auto">
                    <InteractiveCrosswordGrid
                      :grid="grid"
                      :placed-words="placedWords"
                      :user-answers="userAnswers"
                      :checked-answers="checkedAnswers"
                      :incorrect-answers="incorrectAnswers"
                      :current-clue="currentClue"
                      :show-solution="showSolution"
                      @update:user-answers="userAnswers = $event"
                      @update:current-clue="currentClue = $event"
                      @update:current-direction="currentDirection = $event"
                      @clue-selected="handleClueSelected"
                      ref="gridRef"
                    />
                  </div>

                  <!-- Controls -->
                  <div class="mt-6 flex gap-3 flex-wrap">
                    <Button @click="checkAnswers" variant="default">
                      <CheckCircle class="h-4 w-4 mr-2" />
                      Check Answers
                    </Button>
                    <Button @click="clearGrid" variant="outline">
                      <Eraser class="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                    <Button @click="showSolution = !showSolution" variant="outline">
                      <Eye class="h-4 w-4 mr-2" />
                      {{ showSolution ? 'Hide' : 'Show' }} Solution
                    </Button>
                  </div>
                </div>
              </div>

              <!-- Right Panel: Clues -->
              <div class="w-full lg:w-96 flex flex-col">
                <div class="bg-white rounded-lg border p-6 flex flex-col h-full">
                  <h3 class="text-lg font-semibold mb-4">Clues</h3>

                  <div class="space-y-6 overflow-auto">
                    <!-- Across Clues -->
                    <div v-if="acrossClues.length > 0">
                      <h4 class="font-semibold text-base mb-3 flex items-center gap-2">
                        <ArrowRight class="h-4 w-4" />
                        Across
                      </h4>
                      <div class="space-y-2">
                        <div
                          v-for="clue in acrossClues"
                          :key="`across-${clue.number}`"
                          class="clue"
                          :class="{ active: isActiveClue(clue) }"
                          @click="selectClue(clue)"
                        >
                          <span class="clue-number">{{ clue.number }}.</span>
                          <span class="clue-text">{{ clue.clue }} ({{ clue.word.length }})</span>
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
                          v-for="clue in downClues"
                          :key="`down-${clue.number}`"
                          class="clue"
                          :class="{ active: isActiveClue(clue) }"
                          @click="selectClue(clue)"
                        >
                          <span class="clue-number">{{ clue.number }}.</span>
                          <span class="clue-text">{{ clue.clue }} ({{ clue.word.length }})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import InteractiveCrosswordGrid from '@/components/Puzzles/InteractiveCrosswordGrid.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { usePuzzleStore } from '@/stores/puzzles'
import type { PlacedWord } from '@/utils/crossword-generator'
import { ArrowDown, ArrowLeft, ArrowRight, CheckCircle, Eraser, Eye, Puzzle } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const puzzleStore = usePuzzleStore()

const puzzleId = route.params.puzzleId as string
const classroomId = route.params.classroomId as string

const breadcrumbs = computed(() => [
  { label: 'Puzzles', to: `/classroom/${classroomId}/puzzles` },
  { label: 'Solve' },
])

// Reactive state
const userAnswers = ref<string[][]>([])
const checkedAnswers = ref<boolean[][]>([])
const incorrectAnswers = ref<boolean[][]>([])
const currentClue = ref<PlacedWord | null>(null)
const currentDirection = ref<'across' | 'down'>('across')
const showSolution = ref(false)
const gridRef = ref<InstanceType<typeof InteractiveCrosswordGrid> | null>(null)

// Get puzzle from store
const puzzle = computed(() => puzzleStore.selectedPuzzle)

// Parse grid from JSON string array
const grid = computed<string[][]>(() => {
  if (!puzzle.value?.grid?.length) return []

  try {
    const gridData = puzzle.value.grid[0]
    if (!gridData) return []

    const parsed = JSON.parse(gridData)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to parse grid:', error)
    return []
  }
})

// Parse placed words from JSON string array
const placedWords = computed<PlacedWord[]>(() => {
  if (!puzzle.value?.placed_words?.length) return []

  try {
    const placedWordsData = puzzle.value.placed_words[0]
    if (!placedWordsData) return []

    const parsed = JSON.parse(placedWordsData)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to parse placed words:', error)
    return []
  }
})

const acrossClues = computed(() =>
  placedWords.value.filter((w) => w.direction === 'across').sort((a, b) => a.number - b.number),
)

const downClues = computed(() =>
  placedWords.value.filter((w) => w.direction === 'down').sort((a, b) => a.number - b.number),
)

// Initialize user answers grid
const initializeUserAnswers = () => {
  userAnswers.value = grid.value.map((row) => row.map(() => ''))
  checkedAnswers.value = grid.value.map((row) => row.map(() => false))
  incorrectAnswers.value = grid.value.map((row) => row.map(() => false))
}

const isActiveClue = (clue: PlacedWord) => {
  return (
    currentClue.value &&
    currentClue.value.number === clue.number &&
    currentClue.value.direction === clue.direction
  )
}

// Clue selection
const selectClue = (clue: PlacedWord) => {
  currentClue.value = clue
  currentDirection.value = clue.direction

  // Focus the first cell of the clue
  if (gridRef.value) {
    gridRef.value.focusCell(clue.row, clue.col)
  }
}

const handleClueSelected = (clue: PlacedWord) => {
  currentClue.value = clue
}

// Actions
const checkAnswers = () => {
  let correctCount = 0
  let totalCount = 0

  // Reset validation states
  checkedAnswers.value = grid.value.map((row) => row.map(() => false))
  incorrectAnswers.value = grid.value.map((row) => row.map(() => false))

  for (let i = 0; i < grid.value.length; i++) {
    const gridRow = grid.value[i]
    const userRow = userAnswers.value[i]
    const checkedRow = checkedAnswers.value[i]
    const incorrectRow = incorrectAnswers.value[i]

    if (!gridRow || !userRow || !checkedRow || !incorrectRow) continue

    for (let j = 0; j < gridRow.length; j++) {
      if (gridRow[j] !== '') {
        totalCount++
        const isAnswerCorrect = userRow[j]?.toUpperCase() === gridRow[j]
        checkedRow[j] = isAnswerCorrect
        incorrectRow[j] = !isAnswerCorrect && userRow[j] !== ''

        if (isAnswerCorrect) {
          correctCount++
        }
      }
    }
  }

  if (correctCount === totalCount) {
    toast.success('Congratulations! All answers are correct!')
  } else {
    toast.info(`${correctCount} out of ${totalCount} answers are correct`)
  }
}

const clearGrid = () => {
  userAnswers.value = grid.value.map((row) => row.map(() => ''))
  checkedAnswers.value = grid.value.map((row) => row.map(() => false))
  incorrectAnswers.value = grid.value.map((row) => row.map(() => false))
  toast.info('Grid cleared')
}

const handleBack = () => {
  router.push({ name: 'puzzles', params: { classroomId } })
}

// Load puzzle on mount
onMounted(async () => {
  try {
    await puzzleStore.fetchPuzzleById(puzzleId)
    if (puzzle.value) {
      initializeUserAnswers()
    }
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to load puzzle')
    router.push({ name: 'puzzles', params: { classroomId } })
  }
})
</script>

<style scoped>
.clue {
  padding: 8px 12px;
  margin: 4px 0;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.clue:hover {
  background-color: hsl(var(--muted));
}

.clue.active {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.clue-number {
  font-weight: 600;
  min-width: 2rem;
  flex-shrink: 0;
}

.clue-text {
  flex: 1;
}
</style>
