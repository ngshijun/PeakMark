<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-4">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Puzzles</h1>
        <p class="text-muted-foreground">Browse and solve puzzles from your classroom</p>
      </div>

      <!-- Search Bar -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <!-- Search Input -->
        <div class="relative flex-1 sm:max-w-md">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input v-model="searchQuery" type="search" placeholder="Search puzzles..." class="pl-8" />
        </div>
      </div>

      <!-- Puzzles Grid -->
      <div class="flex-1 min-h-0 rounded-xl border bg-card overflow-hidden">
        <div class="h-full overflow-auto">
          <div
            v-if="puzzleStore.loading"
            class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-4"
          >
            <div v-for="i in 8" :key="i" class="rounded-lg border bg-card overflow-hidden">
              <Skeleton class="aspect-video w-full" />
              <div class="p-4 space-y-2">
                <Skeleton class="h-5 w-3/4" />
                <Skeleton class="h-4 w-1/2" />
              </div>
            </div>
          </div>

          <div
            v-else-if="filteredPuzzles.length === 0"
            class="flex items-center justify-center h-full text-center"
          >
            <div class="space-y-2">
              <Puzzle class="mx-auto h-12 w-12 text-muted-foreground" />
              <p class="text-muted-foreground">
                {{ searchQuery ? 'No puzzles found' : 'No puzzles available yet' }}
              </p>
            </div>
          </div>

          <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-4">
            <div
              v-for="puzzle in paginatedPuzzles"
              :key="puzzle.id"
              class="group rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
              @click="handlePuzzleClick(puzzle)"
            >
              <!-- Puzzle Thumbnail -->
              <div class="aspect-video flex items-center justify-center relative">
                <div class="h-full aspect-square">
                  <CrosswordThumbnail
                    v-if="puzzle.puzzle_type === 'crossword'"
                    :grid="puzzle.grid"
                    :placed-words="puzzle.placed_words"
                  />
                  <WordsearchThumbnail
                    v-else-if="puzzle.puzzle_type === 'wordsearch'"
                    :grid="puzzle.grid"
                    :placed-words="puzzle.placed_words"
                  />
                </div>
                <!-- Status Badge -->
                <div class="absolute top-2 right-2">
                  <Badge
                    v-if="getPuzzleStatus(puzzle.id) === 'completed'"
                    variant="default"
                    class="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 class="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                  <Badge
                    v-else-if="getPuzzleStatus(puzzle.id) === 'in-progress'"
                    variant="secondary"
                  >
                    <Clock class="h-3 w-3 mr-1" />
                    In Progress
                  </Badge>
                </div>
              </div>

              <!-- Puzzle Info -->
              <div class="p-4 flex flex-col flex-1">
                <div class="flex-1 space-y-2">
                  <div>
                    <h3 class="font-semibold line-clamp-2 mb-1">{{ puzzle.title }}</h3>
                  </div>
                  <div class="text-sm text-muted-foreground space-y-1">
                    <p class="capitalize">{{ puzzle.puzzle_type }}</p>
                    <p>{{ formatDate(puzzle.created_at) }}</p>
                    <div class="flex items-center justify-between">
                      <p class="text-amber-600 dark:text-amber-500 font-medium">
                        {{ puzzle.exp }} XP
                      </p>
                      <p
                        v-if="getEarnedXP(puzzle.id) !== null"
                        class="text-green-600 dark:text-green-500 font-medium"
                      >
                        Earned: {{ getEarnedXP(puzzle.id) }} XP
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredPuzzles.length > 0" class="grid grid-cols-3 items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</span>
          <Select v-model="itemsPerPageString">
            <SelectTrigger class="w-[5rem] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="48">48</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex justify-center">
          <Pagination
            v-if="totalPages > 1"
            v-slot="{ page }"
            :items-per-page="itemsPerPage"
            :total="filteredPuzzles.length"
            :sibling-count="1"
            :show-edges="true"
            v-model:page="currentPage"
          >
            <PaginationContent v-slot="{ items }">
              <PaginationPrevious />

              <template v-for="(item, index) in items" :key="index">
                <PaginationEllipsis v-if="item.type === 'ellipsis'" :index="index" />
                <PaginationItem v-else :value="item.value" :is-active="item.value === page">
                  {{ item.value }}
                </PaginationItem>
              </template>

              <PaginationNext />
            </PaginationContent>
          </Pagination>
        </div>

        <p class="flex items-center justify-end text-sm text-muted-foreground whitespace-nowrap">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }}-{{
            Math.min(currentPage * itemsPerPage, filteredPuzzles.length)
          }}
          of {{ filteredPuzzles.length }}
        </p>
      </div>
    </div>

    <!-- Crossword Viewer Dialog -->
    <CrosswordViewerDialog
      v-if="selectedPuzzle?.puzzle_type === 'crossword'"
      :open="isViewerDialogOpen"
      :puzzle="selectedPuzzle"
      :show-solution-toggle="false"
      :puzzle-status="selectedPuzzleStatus"
      :saved-grid="selectedPuzzleSavedGrid"
      @update:open="(val) => (isViewerDialogOpen = val)"
    />

    <!-- Wordsearch Viewer Dialog -->
    <WordsearchViewerDialog
      v-else-if="selectedPuzzle?.puzzle_type === 'wordsearch'"
      :open="isViewerDialogOpen"
      :puzzle="selectedPuzzle"
      :show-solution-toggle="false"
      :puzzle-status="selectedPuzzleStatus"
      :found-words="selectedPuzzleFoundWords"
      @update:open="(val) => (isViewerDialogOpen = val)"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import CrosswordThumbnail from '@/components/Puzzles/CrosswordThumbnail.vue'
import CrosswordViewerDialog from '@/components/Puzzles/CrosswordViewerDialog.vue'
import WordsearchThumbnail from '@/components/Puzzles/WordsearchThumbnail.vue'
import WordsearchViewerDialog from '@/components/Puzzles/WordsearchViewerDialog.vue'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useNavigation } from '@/composables/useNavigation'
import MainLayout from '@/layouts/MainLayout.vue'
import { puzzleAttemptService } from '@/services/api/puzzle-attempt.service'
import { useAuthStore } from '@/stores/auth'
import { usePuzzleStore } from '@/stores/puzzles'
import type { Tables } from '@/types/database.types'
import { Puzzle, Search, CheckCircle2, Clock } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

type PuzzleType = Tables<'puzzles'>
type PuzzleAttempt = Tables<'puzzle_attempts'>

const puzzleStore = usePuzzleStore()
const authStore = useAuthStore()
const { selectedClassroomId } = useNavigation()

const breadcrumbs = [{ label: 'Puzzles' }]

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(parseInt(localStorage.getItem('studentPuzzlesItemsPerPage') || '12'))
const itemsPerPageString = computed({
  get: () => String(itemsPerPage.value),
  set: (value: string) => {
    itemsPerPage.value = parseInt(value)
    currentPage.value = 1
    localStorage.setItem('studentPuzzlesItemsPerPage', value)
  },
})

const isViewerDialogOpen = ref(false)
const selectedPuzzle = ref<PuzzleType | null>(null)
const selectedPuzzleStatus = ref<'not-started' | 'in-progress' | 'completed'>('not-started')
const selectedPuzzleSavedGrid = ref<string[][]>([])
const selectedPuzzleFoundWords = ref<string[]>([])
const puzzleAttempts = ref<PuzzleAttempt[]>([])
const attemptsLoading = ref(false)

// Get puzzle status
const getPuzzleStatus = (puzzleId: string) => {
  const attempts = puzzleAttempts.value.filter((a) => a.puzzle_id === puzzleId)

  if (attempts.length === 0) {
    return 'not-started'
  }

  const hasCompleted = attempts.some((a) => a.is_completed)
  if (hasCompleted) {
    return 'completed'
  }

  return 'in-progress'
}

// Get highest XP earned for a puzzle
const getEarnedXP = (puzzleId: string) => {
  const completedAttempts = puzzleAttempts.value.filter(
    (a) => a.puzzle_id === puzzleId && a.is_completed && a.exp_earned !== null,
  )

  if (completedAttempts.length === 0) return null

  return Math.max(...completedAttempts.map((a) => a.exp_earned || 0))
}

const filteredPuzzles = computed(() => {
  if (!searchQuery.value) {
    return puzzleStore.puzzles
  }

  return puzzleStore.puzzles.filter((puzzle) =>
    puzzle.title.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const totalPages = computed(() => {
  return Math.ceil(filteredPuzzles.value.length / itemsPerPage.value)
})

const paginatedPuzzles = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredPuzzles.value.slice(start, end)
})

watch(searchQuery, () => {
  currentPage.value = 1
})

const formatDate = (dateString: string | null): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const handlePuzzleClick = (puzzle: PuzzleType) => {
  selectedPuzzle.value = puzzle
  selectedPuzzleStatus.value = getPuzzleStatus(puzzle.id)

  // Get saved grid/data based on puzzle status
  let attemptToShow = null

  if (selectedPuzzleStatus.value === 'completed') {
    // For completed puzzles, get the latest completed attempt
    attemptToShow = puzzleAttempts.value
      .filter((a) => a.puzzle_id === puzzle.id && a.is_completed)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  } else if (selectedPuzzleStatus.value === 'in-progress') {
    // For in-progress puzzles, get the latest incomplete attempt
    attemptToShow = puzzleAttempts.value.find((a) => a.puzzle_id === puzzle.id && !a.is_completed)
  }

  if (attemptToShow && attemptToShow.grid) {
    if (puzzle.puzzle_type === 'wordsearch') {
      // For wordsearch, grid contains found words as JSON array
      try {
        selectedPuzzleFoundWords.value = JSON.parse(attemptToShow.grid[0] || '[]')
      } catch {
        selectedPuzzleFoundWords.value = []
      }
      selectedPuzzleSavedGrid.value = []
    } else {
      // For crossword, parse saved grid from database
      selectedPuzzleSavedGrid.value = attemptToShow.grid.map((rowString) => {
        try {
          return JSON.parse(rowString)
        } catch {
          return []
        }
      })
      selectedPuzzleFoundWords.value = []
    }
  } else {
    selectedPuzzleSavedGrid.value = []
    selectedPuzzleFoundWords.value = []
  }

  isViewerDialogOpen.value = true
}

// Fetch puzzle attempts for current student
const fetchPuzzleAttempts = async () => {
  if (!selectedClassroomId.value || !authStore.user) return

  attemptsLoading.value = true
  try {
    puzzleAttempts.value = await puzzleAttemptService.getStudentAttempts(
      authStore.user.id,
      selectedClassroomId.value,
    )
  } catch (error) {
    console.error('Failed to load puzzle attempts:', error)
  } finally {
    attemptsLoading.value = false
  }
}

onMounted(async () => {
  if (!selectedClassroomId.value) return

  try {
    await Promise.all([puzzleStore.fetchPuzzles(selectedClassroomId.value), fetchPuzzleAttempts()])
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to load puzzles')
  }
})
</script>
