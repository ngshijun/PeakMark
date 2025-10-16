<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-7xl max-h-[90vh] flex flex-col p-0 min-w-[80rem] min-h-[50rem]">
      <DialogHeader class="px-6 pt-6">
        <DialogTitle class="text-xl flex items-center gap-3"> Create Crossword Puzzle </DialogTitle>
        <DialogDescription> Add words and clues to see a live preview </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="onSubmit" class="flex-1 overflow-hidden flex">
        <!-- Left Panel: Word Input and List -->
        <div class="w-1/2 flex flex-col px-6 py-4 border-r">
          <!-- Fixed Top Section -->
          <div class="flex-shrink-0">
            <!-- Title Input -->
            <FormField
              v-slot="{ componentField }"
              name="puzzleTitle"
              :validateOnBlur="hasAttemptSubmit"
              :validateOnModelUpdate="hasAttemptSubmit"
            >
              <FormItem class="mb-6">
                <FormLabel>
                  Puzzle Title
                  <span class="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    type="text"
                    placeholder="Enter crossword puzzle title"
                    :disabled="isSaving"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Word Input Section -->
            <div class="mb-6">
              <div class="space-y-4 mb-4">
                <div>
                  <Label class="mb-2"> Answer </Label>
                  <Input
                    ref="answerInput"
                    v-model="currentAnswer"
                    type="text"
                    placeholder="Enter answer word"
                    class="uppercase"
                    @keydown.enter.prevent="addWord"
                    @input="handleAnswerInput"
                    :disabled="isSaving"
                  />
                </div>
                <div>
                  <Label class="mb-2"> Clue </Label>
                  <Input
                    v-model="currentClue"
                    type="text"
                    placeholder="Enter clue"
                    @keydown.enter.prevent="addWord"
                    :disabled="isSaving"
                  />
                </div>
              </div>
              <Button
                @click="addWord"
                type="button"
                variant="outline"
                class="w-full"
                :disabled="isSaving"
              >
                <Plus class="mr-2 h-4 w-4" />
                Add Word
              </Button>
            </div>

            <!-- Grid Size Input -->
            <div class="grid grid-cols-3 mb-6 gap-6">
              <div>
                <Label class="mb-2">Grid Size</Label>
                <NumberField
                  v-model="gridSize"
                  :min="10"
                  :max="25"
                  :default-value="15"
                  class="w-full"
                  :disabled="isSaving"
                  @update:model-value="generatePreview"
                >
                  <NumberFieldContent>
                    <NumberFieldDecrement />
                    <NumberFieldInput />
                    <NumberFieldIncrement />
                  </NumberFieldContent>
                </NumberField>
              </div>
              <div>
                <Label class="mb-2">Seed</Label>
                <NumberField
                  v-model="seed"
                  :default-value="1"
                  :min="0"
                  :max="9999"
                  class="w-full"
                  :disabled="isSaving"
                  @update:model-value="generatePreview"
                >
                  <NumberFieldContent>
                    <NumberFieldDecrement />
                    <NumberFieldInput />
                    <NumberFieldIncrement />
                  </NumberFieldContent>
                </NumberField>
              </div>
              <div>
                <Label class="mb-2">exp</Label>
                <NumberField
                  v-model="exp"
                  :min="0"
                  :max="9999"
                  :default-value="100"
                  class="w-full"
                  :disabled="isSaving"
                >
                  <NumberFieldContent>
                    <NumberFieldDecrement />
                    <NumberFieldInput />
                    <NumberFieldIncrement />
                  </NumberFieldContent>
                </NumberField>
              </div>
            </div>
          </div>

          <!-- Scrollable Words List Section -->
          <div class="flex-1 min-h-0 overflow-hidden flex flex-col">
            <div v-if="words.length > 0" class="flex flex-col h-full">
              <h3 class="text-lg font-semibold mb-3 flex-shrink-0">Words ({{ words.length }})</h3>
              <div class="space-y-2 overflow-y-auto flex-1 pr-2">
                <div v-for="word in words" :key="word.answer" class="flex items-center gap-2">
                  <div
                    class="flex-1 rounded-md border bg-card p-3"
                    :class="{
                      'border-red-500 bg-red-50': unusedWords.some((w) => w.answer === word.answer),
                    }"
                  >
                    <div class="font-medium text-sm">{{ word.answer }}</div>
                    <div class="text-sm text-muted-foreground">{{ word.clue }}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="removeWord(word.answer)"
                    class="h-8 w-8"
                    title="Remove word"
                  >
                    <X class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel: Live Preview -->
        <div class="w-1/2 overflow-auto px-6 py-4">
          <h3 class="text-lg font-semibold mb-4">Live Preview</h3>

          <div v-if="grid.length > 0" class="space-y-6">
            <!-- Grid Preview -->
            <div class="overflow-x-auto">
              <div class="inline-block" style="font-size: 0">
                <div v-for="(row, i) in grid" :key="i" style="display: flex">
                  <div
                    v-for="(cell, j) in row"
                    :key="j"
                    :class="[
                      'relative',
                      cell ? 'bg-white border-2 border-gray-800' : 'bg-gray-800',
                    ]"
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

            <!-- Clues -->
            <div class="grid grid-cols-2 gap-6">
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

          <div v-else class="flex items-center justify-center h-full text-muted-foreground">
            <div class="text-center">
              <Grid3x3 class="mx-auto mb-2 h-16 w-16 opacity-50" />
              <p>Preview will appear here</p>
            </div>
          </div>
        </div>
      </form>

      <DialogFooter class="px-6 py-4 border-t">
        <Button type="button" variant="outline" @click="handleClose" :disabled="isSaving">
          Cancel
        </Button>
        <Button type="submit" @click="handleSave" :disabled="grid.length === 0 || isSaving">
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
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'
import {
  generateCrossword as generateCrosswordUtil,
  getWordStartAt,
  type WordEntry,
  type PlacedWord,
} from '@/utils/crossword-generator'
import { toTypedSchema } from '@vee-validate/zod'
import { Grid3x3, Plus, X } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { computed, nextTick, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import * as z from 'zod'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [
    data: {
      title: string
      grid: string[][]
      placedWords: PlacedWord[]
      exp: number
    },
  ]
}>()

const answerInput = ref<InstanceType<typeof Input> | HTMLInputElement | null>(null)
const words = ref<WordEntry[]>([])
const currentAnswer = ref('')
const currentClue = ref('')
const grid = ref<string[][]>([])
const placedWords = ref<PlacedWord[]>([])
const unusedWords = ref<WordEntry[]>([])
const gridSize = ref(15)
const seed = ref(1)
const exp = ref(100)
const isSaving = ref(false)
const hasAttemptSubmit = ref(false)

// Form Schema
const formSchema = toTypedSchema(
  z.object({
    puzzleTitle: z.string().min(1, 'Puzzle title is required'),
  }),
)

// Form
const { handleSubmit, resetForm } = useForm({
  validationSchema: formSchema,
  keepValuesOnUnmount: true,
  initialValues: {
    puzzleTitle: '',
  },
})

const acrossClues = computed(() => placedWords.value.filter((w) => w.direction === 'across'))
const downClues = computed(() => placedWords.value.filter((w) => w.direction === 'down'))

const handleAnswerInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  currentAnswer.value = target.value.toUpperCase().replace(/[^A-Z]/g, '')
}

const addWord = async () => {
  if (currentAnswer.value.trim() && currentClue.value.trim()) {
    const normalized = currentAnswer.value.toUpperCase().replace(/[^A-Z]/g, '')

    // Check for duplicates
    if (words.value.some((w) => w.answer === normalized)) {
      toast.error('This entry already exists!')
      return
    }

    words.value.push({
      answer: normalized,
      clue: currentClue.value,
    })
    currentAnswer.value = ''
    currentClue.value = ''

    // Focus back on answer input
    await nextTick()
    if (answerInput.value) {
      // The Input component wraps a native input, access via $el
      const inputElement = '$el' in answerInput.value ? answerInput.value.$el : answerInput.value
      if (inputElement instanceof HTMLInputElement) {
        inputElement.focus()
      }
    }
  }
}

const removeWord = (answer: string) => {
  words.value = words.value.filter((w) => w.answer !== answer)
}

const generatePreview = () => {
  if (words.value.length === 0) {
    grid.value = []
    placedWords.value = []
    return
  }

  const result = generateCrosswordUtil(words.value, gridSize.value, seed.value)
  if (result) {
    grid.value = result.grid
    placedWords.value = result.placedWords
    unusedWords.value = result.unusedWords
  }
}

// Auto-generate preview when words change
watch([() => words.value.length], generatePreview)

const getWordStart = (row: number, col: number): PlacedWord | undefined => {
  return getWordStartAt(placedWords.value, row, col)
}

const handleOpenChange = (value: boolean) => {
  emit('update:open', value)
}

const handleClose = () => {
  emit('update:open', false)
}

const onSubmit = handleSubmit((formValues) => {
  if (grid.value.length > 0) {
    emit('save', {
      title: formValues.puzzleTitle,
      grid: grid.value,
      placedWords: placedWords.value,
      exp: exp.value,
    })
  }
})

const handleSave = () => {
  hasAttemptSubmit.value = true
  onSubmit()
}

// Reset state when dialog closes
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      resetForm({
        values: {
          puzzleTitle: '',
        },
      })
      words.value = []
      currentAnswer.value = ''
      currentClue.value = ''
      grid.value = []
      placedWords.value = []
      gridSize.value = 15
      seed.value = 1
      exp.value = 100
      isSaving.value = false
      hasAttemptSubmit.value = false
    }
  },
)
</script>
