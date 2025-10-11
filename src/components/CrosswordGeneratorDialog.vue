<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-6xl max-h-[90vh] min-w-[80rem] flex flex-col p-0">
      <DialogHeader class="px-6 pt-6 pb-4 border-b">
        <DialogTitle class="text-xl flex items-center gap-3">
          <Grid3x3 class="text-indigo-600" />
          Crossword Puzzle Generator
        </DialogTitle>
        <DialogDescription> Add words and clues to generate a crossword puzzle </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-auto px-6 py-4">
        <!-- Word Input Section -->
        <div class="mb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label class="mb-2">Answer</Label>
              <Input
                v-model="currentAnswer"
                type="text"
                placeholder="Enter answer word"
                @keypress.enter="addWord"
              />
            </div>
            <div>
              <Label class="mb-2">Clue</Label>
              <Input
                v-model="currentClue"
                type="text"
                placeholder="Enter clue"
                @keypress.enter="addWord"
              />
            </div>
          </div>
          <Button @click="addWord" variant="outline">
            <Plus class="mr-2 h-4 w-4" />
            Add Word
          </Button>
        </div>

        <!-- Words List -->
        <div v-if="words.length > 0" class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Words ({{ words.length }})</h3>
          <div class="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-4">
            <div
              v-for="word in words"
              :key="word.id"
              class="flex items-center justify-between bg-muted p-3 rounded-lg"
            >
              <div class="flex-1">
                <span class="font-semibold text-primary">{{ word.answer }}</span>
                <span class="text-muted-foreground ml-3">{{ word.clue }}</span>
              </div>
              <Button variant="ghost" size="sm" @click="removeWord(word.id)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Grid Size Input -->
        <div class="flex items-center gap-4 mb-6">
          <div>
            <Label class="mb-2">Grid Size</Label>
            <Input
              v-model.number="gridSize"
              type="number"
              min="10"
              max="20"
              class="w-24"
              @input="handleGridSizeChange"
            />
          </div>
          <Button @click="handleGenerate" :disabled="words.length === 0" class="mt-6">
            Generate Crossword
          </Button>
        </div>

        <!-- Generated Crossword Preview -->
        <div v-if="grid.length > 0" class="border rounded-lg p-6 bg-muted/30">
          <h3 class="text-lg font-semibold mb-4">Preview</h3>

          <div class="mb-6 overflow-x-auto">
            <div class="inline-block" style="font-size: 0">
              <div v-for="(row, i) in grid" :key="i" style="display: flex">
                <div
                  v-for="(cell, j) in row"
                  :key="j"
                  :class="['relative', cell ? 'bg-white border-2 border-gray-800' : 'bg-gray-800']"
                  style="width: 32px; height: 32px"
                >
                  <span
                    v-if="getWordStart(i, j)"
                    class="absolute top-0 left-1 text-[8px] font-bold text-gray-600"
                  >
                    {{ getWordStart(i, j)?.number }}
                  </span>
                  <div
                    v-if="cell"
                    class="w-full h-full flex items-center justify-center text-sm font-bold text-gray-800"
                  >
                    {{ cell }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-semibold mb-3">Across</h4>
              <div class="space-y-2 text-sm">
                <div v-for="word in acrossClues" :key="word.number">
                  <span class="font-semibold">{{ word.number }}.</span> {{ word.clue }}
                </div>
              </div>
            </div>
            <div>
              <h4 class="font-semibold mb-3">Down</h4>
              <div class="space-y-2 text-sm">
                <div v-for="word in downClues" :key="word.number">
                  <span class="font-semibold">{{ word.number }}.</span> {{ word.clue }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="px-6 py-4 border-t">
        <Button variant="outline" @click="handleClose"> Cancel </Button>
        <Button @click="handleSave" :disabled="grid.length === 0 || isSaving">
          {{ isSaving ? 'Saving...' : 'Save Puzzle' }}
        </Button>
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  generateCrossword as generateCrosswordUtil,
  getWordStartAt,
  type WordEntry,
  type PlacedWord,
} from '@/utils/crossword-generator'
import { Grid3x3, Plus, Trash2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [
    data: { words: WordEntry[]; grid: string[][]; placedWords: PlacedWord[]; gridSize: number },
  ]
}>()

const words = ref<WordEntry[]>([])
const currentAnswer = ref('')
const currentClue = ref('')
const grid = ref<string[][]>([])
const placedWords = ref<PlacedWord[]>([])
const gridSize = ref(15)
const isSaving = ref(false)

const acrossClues = computed(() => placedWords.value.filter((w) => w.direction === 'across'))
const downClues = computed(() => placedWords.value.filter((w) => w.direction === 'down'))

const addWord = () => {
  if (currentAnswer.value.trim() && currentClue.value.trim()) {
    words.value.push({
      id: Date.now().toString(),
      answer: currentAnswer.value.toUpperCase().replace(/[^A-Z]/g, ''),
      clue: currentClue.value,
    })
    currentAnswer.value = ''
    currentClue.value = ''
  }
}

const removeWord = (id: string) => {
  words.value = words.value.filter((w) => w.id !== id)
  // Clear grid if words are removed
  if (grid.value.length > 0) {
    grid.value = []
    placedWords.value = []
  }
}

const handleGridSizeChange = (e: Event) => {
  const value = parseInt((e.target as HTMLInputElement).value) || 15
  gridSize.value = Math.max(10, Math.min(20, value))
}

const handleGenerate = () => {
  const result = generateCrosswordUtil(words.value, gridSize.value)
  if (result) {
    grid.value = result.grid
    placedWords.value = result.placedWords
  }
}

const getWordStart = (row: number, col: number): PlacedWord | undefined => {
  return getWordStartAt(placedWords.value, row, col)
}

const handleOpenChange = (value: boolean) => {
  emit('update:open', value)
}

const handleClose = () => {
  emit('update:open', false)
}

const handleSave = () => {
  if (grid.value.length > 0) {
    emit('save', {
      words: words.value,
      grid: grid.value,
      placedWords: placedWords.value,
      gridSize: gridSize.value,
    })
  }
}

// Reset state when dialog closes
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      words.value = []
      currentAnswer.value = ''
      currentClue.value = ''
      grid.value = []
      placedWords.value = []
      gridSize.value = 15
      isSaving.value = false
    }
  },
)
</script>
