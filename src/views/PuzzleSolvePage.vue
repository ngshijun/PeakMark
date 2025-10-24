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

      <!-- Puzzle Content - Crossword -->
      <div v-else-if="isCrossword" class="flex-1 min-h-0 rounded-xl border bg-card overflow-hidden">
        <div class="h-full overflow-auto">
          <div class="container mx-auto p-6">
            <div class="flex flex-col lg:flex-row gap-8">
              <!-- Left Panel: Crossword Grid and Controls -->
              <div class="flex-1 flex flex-col gap-4">
                <div class="bg-white rounded-lg border p-4 sm:p-6">
                  <div class="w-full h-full max-w-[600px] max-h-[600px] mx-auto">
                    <InteractiveCrosswordGrid
                      :grid="grid"
                      :placed-words="placedWords"
                      :user-answers="userAnswers"
                      :checked-answers="checkedAnswers"
                      :incorrect-answers="incorrectAnswers"
                      :current-clue="currentClue"
                      @update:user-answers="userAnswers = $event"
                      @update:current-clue="currentClue = $event"
                      @update:current-direction="currentDirection = $event"
                      @clue-selected="handleClueSelected"
                      ref="gridRef"
                    />
                  </div>
                </div>

                <!-- Controls -->
                <div class="bg-white rounded-lg border p-4 flex flex-col sm:flex-row gap-3">
                  <Button @click="clearGrid" variant="outline" class="w-full sm:flex-1">
                    <Eraser class="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  <Button @click="handleSave" variant="outline" class="w-full sm:flex-1">
                    <Save class="h-4 w-4 mr-2" />
                    Save Progress
                  </Button>
                  <Button @click="handleCheckAnswers" variant="outline" class="w-full sm:flex-1">
                    <Eye class="h-4 w-4 mr-2" />
                    Check Answers
                  </Button>
                  <Button @click="openSubmitDialog" variant="default" class="w-full sm:flex-1">
                    <CheckCircle class="h-4 w-4 mr-2" />
                    Submit
                  </Button>
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
                          class="px-3 py-2 cursor-pointer rounded-md transition-all duration-200 flex gap-2 items-start"
                          :class="
                            isActiveClue(clue)
                              ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                              : 'hover:bg-muted'
                          "
                          @click="selectClue(clue)"
                        >
                          <span class="font-semibold min-w-8 flex-shrink-0"
                            >{{ clue.number }}.</span
                          >
                          <span class="flex-1">{{ clue.clue }} ({{ clue.word.length }})</span>
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
                          class="px-3 py-2 cursor-pointer rounded-md transition-all duration-200 flex gap-2 items-start"
                          :class="
                            isActiveClue(clue)
                              ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                              : 'hover:bg-muted'
                          "
                          @click="selectClue(clue)"
                        >
                          <span class="font-semibold min-w-8 flex-shrink-0"
                            >{{ clue.number }}.</span
                          >
                          <span class="flex-1">{{ clue.clue }} ({{ clue.word.length }})</span>
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

      <!-- Puzzle Content - Wordsearch -->
      <div
        v-else-if="isWordsearch"
        class="flex-1 min-h-0 rounded-xl border bg-card overflow-hidden"
      >
        <div class="h-full overflow-auto">
          <div class="container mx-auto p-6">
            <div class="flex flex-col lg:flex-row gap-8">
              <!-- Left Panel: Wordsearch Grid and Controls -->
              <div class="flex-1 flex flex-col gap-4">
                <div class="bg-white rounded-lg border p-4 sm:p-6">
                  <div class="w-full h-full max-w-[600px] max-h-[600px] mx-auto">
                    <InteractiveWordsearchGrid
                      :grid="grid"
                      :placed-words="wordsearchPlacedWords"
                      :found-words="foundWords"
                      @word-found="handleWordFound"
                    />
                  </div>
                </div>

                <!-- Controls -->
                <div class="bg-white rounded-lg border p-4 flex flex-col sm:flex-row gap-3">
                  <Button
                    @click="clearWordsearchProgress"
                    variant="outline"
                    class="w-full sm:flex-1"
                  >
                    <Eraser class="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  <Button @click="handleSave" variant="outline" class="w-full sm:flex-1">
                    <Save class="h-4 w-4 mr-2" />
                    Save Progress
                  </Button>
                  <Button @click="openSubmitDialog" variant="default" class="w-full sm:flex-1">
                    <CheckCircle class="h-4 w-4 mr-2" />
                    Submit
                  </Button>
                </div>
              </div>

              <!-- Right Panel: Word List -->
              <div class="w-full lg:w-96 flex flex-col">
                <div class="bg-white rounded-lg border p-6 flex flex-col h-full">
                  <h3 class="text-lg font-semibold mb-4">Words to Find</h3>

                  <div class="space-y-2 overflow-auto">
                    <div
                      v-for="(word, idx) in wordsearchPlacedWords"
                      :key="idx"
                      class="flex gap-3 p-3 rounded border transition-all"
                      :class="{
                        'bg-green-50 border-green-200': foundWords.has(word.word),
                        'bg-white': !foundWords.has(word.word),
                      }"
                    >
                      <div class="flex items-center gap-2 min-w-[2rem]">
                        <span class="font-semibold text-sm text-muted-foreground"
                          >{{ idx + 1 }}.</span
                        >
                        <CheckCircle
                          v-if="foundWords.has(word.word)"
                          class="h-4 w-4 text-green-600"
                        />
                      </div>
                      <div class="flex-1">
                        <p class="text-sm font-medium">{{ word.word }}</p>
                        <p v-if="word.hint" class="text-sm text-muted-foreground">
                          {{ word.hint }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Progress Summary -->
                  <div class="mt-6 p-4 bg-muted/50 rounded-lg">
                    <p class="text-sm font-medium">
                      Progress: {{ foundWords.size }} / {{ wordsearchPlacedWords.length }} words
                      found
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Submit Confirmation Dialog -->
    <Dialog :open="isSubmitDialogOpen" @update:open="(val) => (isSubmitDialogOpen = val)">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Puzzle</DialogTitle>
          <DialogDescription>
            Are you sure you want to submit your answers? This will finalize your attempt.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div class="flex justify-between">
              <span class="text-sm font-medium">Correct Answers:</span>
              <span class="text-sm font-semibold"
                >{{ submitStats.correctCount }} / {{ submitStats.totalCount }}</span
              >
            </div>
            <div class="flex justify-between">
              <span class="text-sm font-medium">Accuracy:</span>
              <span class="text-sm font-semibold">{{ submitStats.accuracy }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm font-medium">XP to Earn:</span>
              <span class="text-sm font-semibold text-amber-600 dark:text-amber-500">
                {{ submitStats.expEarned }} XP
              </span>
            </div>
          </div>
          <p class="text-sm text-muted-foreground">
            {{
              submitStats.correctCount === submitStats.totalCount
                ? 'Perfect score! You got all answers correct!'
                : 'You can check your answers before submitting to improve your score.'
            }}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isSubmitDialogOpen = false" :disabled="isSubmitting">
            Cancel
          </Button>
          <Button @click="handleSubmit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Submitting...' : 'Confirm Submit' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </MainLayout>
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
import InteractiveCrosswordGrid from '@/components/Puzzles/InteractiveCrosswordGrid.vue'
import InteractiveWordsearchGrid from '@/components/Puzzles/InteractiveWordsearchGrid.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { puzzleAttemptService } from '@/services/api/puzzle-attempt.service'
import { useAuthStore } from '@/stores/auth'
import { usePuzzleStore } from '@/stores/puzzles'
import { useClassroomStore } from '@/stores/classrooms'
import type { PlacedWord } from '@/utils/crossword-generator'
import type { PlacedWord as WordsearchPlacedWord } from '@/utils/wordsearch-generator'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eraser,
  Eye,
  Puzzle,
  Save,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const puzzleStore = usePuzzleStore()
const authStore = useAuthStore()
const classroomStore = useClassroomStore()

const puzzleId = route.params.puzzleId as string
const classroomId = route.params.classroomId as string

const breadcrumbs = computed(() => [
  { label: 'Puzzles', to: `/classroom/${classroomId}/puzzles` },
  { label: 'Solve' },
])

// Reactive state - Crossword
const userAnswers = ref<string[][]>([])
const checkedAnswers = ref<boolean[][]>([])
const incorrectAnswers = ref<boolean[][]>([])
const currentClue = ref<PlacedWord | null>(null)
const currentDirection = ref<'across' | 'down'>('across')
const gridRef = ref<InstanceType<typeof InteractiveCrosswordGrid> | null>(null)
const isSubmitDialogOpen = ref(false)
const isSubmitting = ref(false)
const submitStats = ref({
  correctCount: 0,
  totalCount: 0,
  accuracy: 0,
  expEarned: 0,
})

// Reactive state - Wordsearch
const foundWords = ref<Set<string>>(new Set())

// Get puzzle from store
const puzzle = computed(() => puzzleStore.selectedPuzzle)

// Determine puzzle type
const isCrossword = computed(() => puzzle.value?.puzzle_type === 'crossword')
const isWordsearch = computed(() => puzzle.value?.puzzle_type === 'wordsearch')

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

// Parse wordsearch placed words
const wordsearchPlacedWords = computed<WordsearchPlacedWord[]>(() => {
  if (!isWordsearch.value || !puzzle.value?.placed_words?.length) return []

  try {
    const placedWordsData = puzzle.value.placed_words[0]
    if (!placedWordsData) return []

    const parsed = JSON.parse(placedWordsData)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to parse wordsearch placed words:', error)
    return []
  }
})

// Initialize user answers grid
const initializeUserAnswers = () => {
  userAnswers.value = grid.value.map((row) => row.map(() => ''))
  checkedAnswers.value = grid.value.map((row) => row.map(() => false))
  incorrectAnswers.value = grid.value.map((row) => row.map(() => false))
}

const isActiveClue = (clue: PlacedWord) => {
  const isActive =
    currentClue.value &&
    currentClue.value.number === clue.number &&
    currentClue.value.direction === clue.direction

  return isActive
}

// Clue selection
const selectClue = (clue: PlacedWord) => {
  currentClue.value = clue
  currentDirection.value = clue.direction

  // Focus the first cell of the clue with the correct direction
  if (gridRef.value) {
    gridRef.value.focusCell(clue.row, clue.col, clue.direction)
  }
}

const handleClueSelected = (clue: PlacedWord) => {
  currentClue.value = clue
}

// Actions
const handleSave = async () => {
  if (!authStore.user) {
    toast.error('You must be logged in to save progress')
    return
  }

  try {
    // Check if there's an existing incomplete attempt
    const existingAttempt = await puzzleAttemptService.getLatestAttempt(puzzleId, authStore.user.id)

    // Prepare grid data based on puzzle type
    const gridData = isWordsearch.value
      ? [JSON.stringify(Array.from(foundWords.value))]
      : userAnswers.value.map((row) => JSON.stringify(row))

    if (existingAttempt && !existingAttempt.is_completed) {
      // Update existing incomplete attempt
      await puzzleAttemptService.updateAttempt(existingAttempt.id, {
        grid: gridData,
      })
      toast.success('Progress saved!')
    } else {
      // Create new attempt
      await puzzleAttemptService.createAttempt({
        puzzle_id: puzzleId,
        attempted_by: authStore.user.id,
        grid: gridData,
        exp_earned: null,
        is_completed: false,
      })
      toast.success('Progress saved!')
    }
  } catch (error) {
    toast.error('Failed to save progress')
    console.error('Save error:', error)
  }
}

// Calculate correct answers and stats
const calculateAnswers = () => {
  let correctCount = 0
  let totalCount = 0

  for (let i = 0; i < grid.value.length; i++) {
    const gridRow = grid.value[i]
    const userRow = userAnswers.value[i]

    if (!gridRow || !userRow) continue

    for (let j = 0; j < gridRow.length; j++) {
      if (gridRow[j] !== '') {
        totalCount++
        const isAnswerCorrect = userRow[j]?.toUpperCase() === gridRow[j]
        if (isAnswerCorrect) {
          correctCount++
        }
      }
    }
  }

  return { correctCount, totalCount }
}

// Check answers without submitting
const handleCheckAnswers = () => {
  // Reset validation states
  checkedAnswers.value = grid.value.map((row) => row.map(() => false))
  incorrectAnswers.value = grid.value.map((row) => row.map(() => false))

  let correctCount = 0
  let totalCount = 0

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

  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0

  if (correctCount === totalCount) {
    toast.success(`Perfect! All ${totalCount} answers correct! (${accuracy}%)`)
  } else {
    toast.info(`${correctCount} out of ${totalCount} answers correct (${accuracy}%)`)
  }
}

// Open submit dialog with calculated stats
const openSubmitDialog = () => {
  if (!puzzle.value) return

  let correctCount = 0
  let totalCount = 0

  if (isWordsearch.value) {
    // For wordsearch, count found words
    correctCount = foundWords.value.size
    totalCount = wordsearchPlacedWords.value.length
  } else {
    // For crossword, use the existing calculateAnswers function
    const answers = calculateAnswers()
    correctCount = answers.correctCount
    totalCount = answers.totalCount
  }

  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
  const correctRate = totalCount > 0 ? correctCount / totalCount : 0
  const expEarned = Math.ceil(puzzle.value.exp * correctRate)

  submitStats.value = {
    correctCount,
    totalCount,
    accuracy,
    expEarned,
  }

  isSubmitDialogOpen.value = true
}

// Submit puzzle attempt to database
const handleSubmit = async () => {
  if (!puzzle.value || !authStore.user) {
    toast.error('Unable to submit. Please try again.')
    return
  }

  isSubmitting.value = true

  try {
    let correctCount = 0
    let totalCount = 0

    if (isWordsearch.value) {
      correctCount = foundWords.value.size
      totalCount = wordsearchPlacedWords.value.length
    } else {
      const answers = calculateAnswers()
      correctCount = answers.correctCount
      totalCount = answers.totalCount
    }

    const correctRate = totalCount > 0 ? correctCount / totalCount : 0
    const expEarned = Math.ceil(puzzle.value.exp * correctRate)

    // Prepare grid data based on puzzle type
    const gridData = isWordsearch.value
      ? [JSON.stringify(Array.from(foundWords.value))]
      : userAnswers.value.map((row) => JSON.stringify(row))

    // Check if there's an existing incomplete attempt
    const existingAttempt = await puzzleAttemptService.getLatestAttempt(puzzleId, authStore.user.id)

    if (existingAttempt && !existingAttempt.is_completed) {
      // Update existing incomplete attempt with final results
      await puzzleAttemptService.updateAttempt(existingAttempt.id, {
        grid: gridData,
        exp_earned: expEarned,
        is_completed: true,
      })
    } else {
      // Create new puzzle attempt
      await puzzleAttemptService.createAttempt({
        puzzle_id: puzzleId,
        attempted_by: authStore.user.id,
        grid: gridData,
        exp_earned: expEarned,
        is_completed: true,
      })
    }

    // Update student's total exp (triggers level-up check)
    if (expEarned > 0) {
      await classroomStore.addStudentExp(authStore.user.id, puzzle.value.classroom_id, expEarned)
    }

    // Close dialog
    isSubmitDialogOpen.value = false

    // Show success message
    if (correctCount === totalCount) {
      toast.success(`Perfect! You earned ${expEarned} XP!`)
    } else {
      toast.success(`Submitted! You earned ${expEarned} XP!`)
    }

    // Navigate back to puzzles page
    router.push({ name: 'puzzles', params: { classroomId } })
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to submit puzzle')
    console.error('Submit error:', error)
  } finally {
    isSubmitting.value = false
  }
}

const clearGrid = () => {
  userAnswers.value = grid.value.map((row) => row.map(() => ''))
  checkedAnswers.value = grid.value.map((row) => row.map(() => false))
  incorrectAnswers.value = grid.value.map((row) => row.map(() => false))
  toast.info('Grid cleared')
}

// Wordsearch-specific handlers
const handleWordFound = (word: string) => {
  foundWords.value.add(word)
  toast.success(`Found: ${word}!`)
}

const clearWordsearchProgress = () => {
  foundWords.value.clear()
  toast.info('Progress cleared')
}

const handleBack = () => {
  router.push({ name: 'puzzles', params: { classroomId } })
}

// Load saved progress from database
const loadSavedProgress = async () => {
  if (!authStore.user) return

  try {
    const existingAttempt = await puzzleAttemptService.getLatestAttempt(puzzleId, authStore.user.id)

    if (existingAttempt && !existingAttempt.is_completed && existingAttempt.grid) {
      if (isWordsearch.value) {
        // For wordsearch, grid contains found words as JSON string
        try {
          const foundWordsArray = JSON.parse(existingAttempt.grid[0] || '[]')
          foundWords.value = new Set(foundWordsArray)
          if (foundWordsArray.length > 0) {
            toast.info('Loaded saved progress')
          }
        } catch (error) {
          console.error('Failed to parse wordsearch progress:', error)
        }
      } else {
        // For crossword, grid contains user answers
        userAnswers.value = existingAttempt.grid.map((rowString) => {
          try {
            return JSON.parse(rowString)
          } catch {
            return []
          }
        })
        toast.info('Loaded saved progress')
      }
    }
  } catch (error) {
    console.error('Failed to load saved progress:', error)
  }
}

// Load puzzle on mount
onMounted(async () => {
  try {
    await puzzleStore.fetchPuzzleById(puzzleId)
    if (puzzle.value) {
      initializeUserAnswers()
      await loadSavedProgress()

      // Select the first clue by default for better UX
      if (acrossClues.value.length > 0 && acrossClues.value[0]) {
        currentClue.value = acrossClues.value[0]
        currentDirection.value = 'across'
      } else if (downClues.value.length > 0 && downClues.value[0]) {
        currentClue.value = downClues.value[0]
        currentDirection.value = 'down'
      }
    }
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to load puzzle')
    router.push({ name: 'puzzles', params: { classroomId } })
  }
})
</script>
