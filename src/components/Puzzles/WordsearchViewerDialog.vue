<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent
      class="max-w-7xl max-h-[90vh] flex flex-col p-0 lg:min-w-[80rem] lg:min-h-[50rem]"
    >
      <DialogHeader class="px-6 pt-6 pb-4 border-b">
        <DialogTitle class="text-2xl flex items-center gap-3">
          {{ puzzle?.title }}
          <Badge
            v-if="puzzleStatus === 'completed'"
            variant="default"
            class="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 class="h-3 w-3 mr-1" />
            Completed
          </Badge>
          <Badge v-else-if="puzzleStatus === 'in-progress'" variant="secondary">
            <Clock class="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        </DialogTitle>
      </DialogHeader>

      <div class="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <!-- Left Panel: Wordsearch Grid -->
        <div
          class="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-4 overflow-hidden"
        >
          <div class="w-full h-full max-w-[600px] max-h-[600px] flex items-center justify-center">
            <WordsearchGrid
              :grid="parsedGrid"
              :placed-words="parsedPlacedWords"
              :show-solution="showSolution"
              :found-words="foundWordsSet"
            />
          </div>
        </div>

        <!-- Right Panel: Word List -->
        <div
          class="w-full lg:w-1/2 flex flex-col px-6 py-4 border-t lg:border-t-0 lg:border-l overflow-auto"
        >
          <h3 class="text-lg font-semibold mb-4">Words to Find</h3>

          <div v-if="parsedPlacedWords.length > 0" class="space-y-2">
            <div
              v-for="(word, idx) in parsedPlacedWords"
              :key="idx"
              class="flex gap-3 p-3 rounded border"
              :class="{
                'bg-green-50 border-green-200': foundWordsSet.has(word.word),
                'bg-white': !foundWordsSet.has(word.word),
              }"
            >
              <div class="flex items-center gap-2 min-w-[2rem]">
                <span class="font-semibold text-sm text-muted-foreground">{{ idx + 1 }}.</span>
                <CheckCircle2 v-if="foundWordsSet.has(word.word)" class="h-4 w-4 text-green-600" />
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium">{{ word.word }}</p>
                <p v-if="word.hint" class="text-sm text-muted-foreground">{{ word.hint }}</p>
              </div>
            </div>
          </div>

          <div v-else class="flex items-center justify-center h-full text-muted-foreground">
            <div class="text-center">
              <p>No words available</p>
            </div>
          </div>

          <!-- Progress Summary -->
          <div v-if="parsedPlacedWords.length > 0" class="mt-6 p-4 bg-muted/50 rounded-lg">
            <p class="text-sm font-medium">
              Progress: {{ foundWordsSet.size }} / {{ parsedPlacedWords.length }} words found
            </p>
          </div>
        </div>
      </div>

      <DialogFooter class="px-6 py-4 border-t">
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4"
        >
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div
              v-if="showSolutionToggle || puzzleStatus === 'completed'"
              class="flex items-center gap-2"
            >
              <Label for="show-solution" class="text-sm font-medium">Show Solution</Label>
              <Switch
                id="show-solution"
                v-model:checked="showSolution"
                @update:modelValue="handleShowSolutionChange"
              />
            </div>
            <div
              class="text-sm text-muted-foreground"
              :class="{ 'sm:border-l sm:pl-3': showSolutionToggle || puzzleStatus === 'completed' }"
            >
              <p v-if="puzzleStatus === 'in-progress'">Showing your saved progress</p>
              <p v-else-if="puzzleStatus === 'completed' && !showSolution">
                Showing your submitted answers
              </p>
              <p v-else-if="puzzleStatus === 'completed' && showSolution">
                Showing words in solution
              </p>
              <p v-else-if="puzzle?.created_at">Created {{ formatDate(puzzle.created_at) }}</p>
            </div>
          </div>
          <div class="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" @click="handleClose" class="flex-1 sm:flex-none"
              >Close</Button
            >
            <Button
              v-if="!showSolutionToggle && puzzleStatus !== 'completed'"
              variant="default"
              @click="handleStartSolving"
              class="flex-1 sm:flex-none"
            >
              <Play class="h-4 w-4 mr-2" />
              {{ puzzleStatus === 'in-progress' ? 'Continue Solving' : 'Start Solving' }}
            </Button>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import WordsearchGrid from '@/components/Puzzles/WordsearchGrid.vue'
import type { Tables } from '@/types/database.types'
import type { PlacedWord } from '@/utils/wordsearch-generator'
import { Play, CheckCircle2, Clock } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

type Puzzle = Tables<'puzzles'>

const props = withDefaults(
  defineProps<{
    open: boolean
    puzzle: Puzzle | null
    showSolutionToggle?: boolean
    puzzleStatus?: 'not-started' | 'in-progress' | 'completed'
    foundWords?: string[]
  }>(),
  {
    showSolutionToggle: true,
    puzzleStatus: 'not-started',
    foundWords: () => [],
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const router = useRouter()
const route = useRoute()

const showSolution = ref(false)

const handleShowSolutionChange = (value: boolean) => {
  showSolution.value = value
  console.log('show solution', value)
}

// Convert found words array to Set for efficient lookup
const foundWordsSet = computed<Set<string>>(() => new Set(props.foundWords))

/**
 * Parse grid from JSON string array
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

const handleStartSolving = () => {
  if (!props.puzzle) return

  const classroomId = route.params.classroomId as string
  router.push({
    name: 'puzzle-solve',
    params: {
      classroomId,
      puzzleId: props.puzzle.id,
    },
  })
  emit('update:open', false)
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
