<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
    <div class="max-w-6xl mx-auto">
      <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Grid3x3 class="text-indigo-600" />
          Crossword Puzzle Generator
        </h1>

        <div class="mb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Answer</label>
              <input
                v-model="currentAnswer"
                type="text"
                placeholder="Enter answer word"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                @keypress.enter="addWord"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Clue</label>
              <input
                v-model="currentClue"
                type="text"
                placeholder="Enter clue"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                @keypress.enter="addWord"
              />
            </div>
          </div>
          <button
            @click="addWord"
            class="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus :size="20" />
            Add Word
          </button>
        </div>

        <div v-if="words.length > 0" class="mb-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-3">Words ({{ words.length }})</h2>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="word in words"
              :key="word.id"
              class="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
            >
              <div class="flex-1">
                <span class="font-semibold text-indigo-600">{{ word.answer }}</span>
                <span class="text-gray-600 ml-3">{{ word.clue }}</span>
              </div>
              <button
                @click="removeWord(word.id)"
                class="text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 :size="18" />
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Grid Size</label>
            <input
              v-model.number="gridSize"
              type="number"
              min="10"
              max="20"
              class="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              @input="handleGridSizeChange"
            />
          </div>
          <button
            @click="generateCrossword(words, gridSize)"
            :disabled="words.length === 0"
            class="mt-6 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            Generate Crossword
          </button>
        </div>
      </div>

      <div v-if="grid.length > 0" class="bg-white rounded-lg shadow-lg p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Generated Crossword</h2>

        <div class="mb-8 overflow-x-auto">
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

        <div class="grid md:grid-cols-2 gap-8">
          <div>
            <h3 class="text-xl font-bold text-gray-800 mb-4">Across</h3>
            <div class="space-y-2">
              <div v-for="word in acrossClues" :key="word.number" class="text-gray-700">
                <span class="font-semibold">{{ word.number }}.</span> {{ word.clue }}
              </div>
            </div>
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-800 mb-4">Down</h3>
            <div class="space-y-2">
              <div v-for="word in downClues" :key="word.number" class="text-gray-700">
                <span class="font-semibold">{{ word.number }}.</span> {{ word.clue }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Trash2, Grid3x3 } from 'lucide-vue-next'
import {
  generateCrossword as generateCrosswordUtil,
  getWordStartAt,
  type WordEntry,
  type PlacedWord,
} from '@/utils/crossword-generator'

const words = ref<WordEntry[]>([])
const currentAnswer = ref('')
const currentClue = ref('')
const grid = ref<string[][]>([])
const placedWords = ref<PlacedWord[]>([])
const gridSize = ref(15)

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
}

const handleGridSizeChange = (e: Event) => {
  const value = parseInt((e.target as HTMLInputElement).value) || 15
  gridSize.value = Math.max(10, Math.min(20, value))
}

const generateCrossword = (wordList: WordEntry[], size: number) => {
  const result = generateCrosswordUtil(wordList, size)
  if (result) {
    grid.value = result.grid
    placedWords.value = result.placedWords
  }
}

const getWordStart = (row: number, col: number): PlacedWord | undefined => {
  return getWordStartAt(placedWords.value, row, col)
}
</script>
