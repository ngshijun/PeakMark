<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-4">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Puzzles</h1>
        <p class="text-muted-foreground">Create and manage puzzles for your classroom</p>
      </div>

      <!-- Actions Bar -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <!-- Search Input -->
        <div class="relative flex-1 sm:max-w-md">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input v-model="searchQuery" type="search" placeholder="Search puzzles..." class="pl-8" />
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
          <Button @click="isCrosswordDialogOpen = true">
            <Grid3x3 class="mr-2 h-4 w-4" />
            Create Crossword
          </Button>
          <Button @click="isWordsearchDialogOpen = true" variant="outline">
            <Search class="mr-2 h-4 w-4" />
            Create Wordsearch
          </Button>
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
                {{ searchQuery ? 'No puzzles found' : 'No puzzles yet. Create your first puzzle!' }}
              </p>
            </div>
          </div>

          <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-4">
            <ContextMenu v-for="puzzle in paginatedPuzzles" :key="puzzle.id">
              <ContextMenuTrigger as-child>
                <div
                  class="group rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
                  @click="handlePuzzleClick(puzzle)"
                >
                  <!-- Puzzle Thumbnail -->
                  <div class="aspect-video flex items-center justify-center">
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
                        <p class="text-amber-600 dark:text-amber-500 font-medium">
                          {{ puzzle.exp }} XP
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent class="w-48">
                <ContextMenuItem @click="editPuzzle(puzzle)">
                  <Pencil class="mr-2 h-4 w-4" />
                  Edit
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem @click="openDeleteDialog(puzzle)" class="text-destructive">
                  <Trash2 class="mr-2 h-4 w-4" />
                  Delete Puzzle
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
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

    <!-- Crossword Generator Dialog -->
    <CrosswordGeneratorDialog
      :open="isCrosswordDialogOpen"
      @update:open="(val) => (isCrosswordDialogOpen = val)"
      @save="handleSaveCrossword"
    />

    <!-- Wordsearch Generator Dialog -->
    <WordsearchGeneratorDialog
      :open="isWordsearchDialogOpen"
      @update:open="(val) => (isWordsearchDialogOpen = val)"
      @save="handleSaveWordsearch"
    />

    <!-- Crossword Viewer Dialog -->
    <CrosswordViewerDialog
      v-if="selectedPuzzle?.puzzle_type === 'crossword'"
      :open="isViewerDialogOpen"
      :puzzle="selectedPuzzle"
      @update:open="(val) => (isViewerDialogOpen = val)"
    />

    <!-- Wordsearch Viewer Dialog -->
    <WordsearchViewerDialog
      v-else-if="selectedPuzzle?.puzzle_type === 'wordsearch'"
      :open="isViewerDialogOpen"
      :puzzle="selectedPuzzle"
      @update:open="(val) => (isViewerDialogOpen = val)"
    />

    <!-- Delete Confirmation Dialog -->
    <Dialog :open="isDeleteDialogOpen" @update:open="(val) => (isDeleteDialogOpen = val)">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Puzzle</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ puzzleToDelete?.title }}"? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="isDeleteDialogOpen = false" :disabled="isSubmitting">
            Cancel
          </Button>
          <Button variant="destructive" @click="confirmDelete" :disabled="isSubmitting">
            {{ isSubmitting ? 'Deleting...' : 'Delete' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </MainLayout>
</template>

<script setup lang="ts">
import CrosswordGeneratorDialog from '@/components/Puzzles/CrosswordGeneratorDialog.vue'
import CrosswordThumbnail from '@/components/Puzzles/CrosswordThumbnail.vue'
import CrosswordViewerDialog from '@/components/Puzzles/CrosswordViewerDialog.vue'
import WordsearchGeneratorDialog from '@/components/Puzzles/WordsearchGeneratorDialog.vue'
import WordsearchThumbnail from '@/components/Puzzles/WordsearchThumbnail.vue'
import WordsearchViewerDialog from '@/components/Puzzles/WordsearchViewerDialog.vue'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useNavigation } from '@/composables/useNavigation'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { usePuzzleStore } from '@/stores/puzzles'
import type { Tables } from '@/types/database.types'
import type { PlacedWord } from '@/utils/crossword-generator'
import type { PlacedWord as WordsearchPlacedWord } from '@/utils/wordsearch-generator'
import { Grid3x3, Pencil, Search, Trash2, Puzzle } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

type Puzzle = Tables<'puzzles'>

const puzzleStore = usePuzzleStore()
const authStore = useAuthStore()
const { selectedClassroomId } = useNavigation()

const breadcrumbs = [{ label: 'Puzzles' }]

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(parseInt(localStorage.getItem('puzzlesItemsPerPage') || '12'))
const itemsPerPageString = computed({
  get: () => String(itemsPerPage.value),
  set: (value: string) => {
    itemsPerPage.value = parseInt(value)
    currentPage.value = 1
    localStorage.setItem('puzzlesItemsPerPage', value)
  },
})

const isCrosswordDialogOpen = ref(false)
const isWordsearchDialogOpen = ref(false)
const isViewerDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const selectedPuzzle = ref<Puzzle | null>(null)
const puzzleToDelete = ref<Puzzle | null>(null)

const isSubmitting = computed(() => puzzleStore.loading)

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

const handlePuzzleClick = (puzzle: Puzzle) => {
  selectedPuzzle.value = puzzle
  isViewerDialogOpen.value = true
}

const editPuzzle = (puzzle: Puzzle) => {
  // TODO: Implement edit functionality
  console.log('Edit puzzle:', puzzle)
  toast.info('Edit functionality coming soon')
}

const handleSaveCrossword = async (data: {
  title: string
  grid: string[][]
  placedWords: PlacedWord[]
  exp: number
}) => {
  if (!selectedClassroomId.value || !authStore.user) return

  try {
    await puzzleStore.createPuzzle({
      title: data.title,
      puzzle_type: 'crossword',
      grid: [JSON.stringify(data.grid)],
      placed_words: [JSON.stringify(data.placedWords)],
      classroom_id: selectedClassroomId.value,
      created_by: authStore.user.id,
      exp: data.exp,
    })

    toast.success('Crossword puzzle created successfully')
    isCrosswordDialogOpen.value = false
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to create crossword')
  }
}

const handleSaveWordsearch = async (data: {
  title: string
  grid: string[][]
  placedWords: WordsearchPlacedWord[]
  exp: number
}) => {
  if (!selectedClassroomId.value || !authStore.user) return

  try {
    await puzzleStore.createPuzzle({
      title: data.title,
      puzzle_type: 'wordsearch',
      grid: [JSON.stringify(data.grid)],
      placed_words: [JSON.stringify(data.placedWords)],
      classroom_id: selectedClassroomId.value,
      created_by: authStore.user.id,
      exp: data.exp,
    })

    toast.success('Wordsearch puzzle created successfully')
    isWordsearchDialogOpen.value = false
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to create wordsearch')
  }
}

const openDeleteDialog = (puzzle: Puzzle) => {
  puzzleToDelete.value = puzzle
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!puzzleToDelete.value) return

  try {
    await puzzleStore.deletePuzzle(puzzleToDelete.value.id)
    toast.success('Puzzle deleted successfully')
    isDeleteDialogOpen.value = false
    puzzleToDelete.value = null
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to delete puzzle')
  }
}

onMounted(async () => {
  if (!selectedClassroomId.value) return

  try {
    await puzzleStore.fetchPuzzles(selectedClassroomId.value)
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to load puzzles')
  }
})
</script>
