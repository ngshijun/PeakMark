# 🎯 COMPREHENSIVE IMPLEMENTATION PLAN
## Teacher Crossword CRUD Feature with Separated Schema

**Project:** PeakMark Education Platform
**Feature:** Crossword Puzzle Builder for Teachers
**Architecture:** Clean Architecture - Separated `words` and `generated_layout`
**Estimated Time:** 12-16 hours

---

## 📋 **PHASE 1: Database Schema Update**

### **1.1 Database Migration** (10 min)

**Create migration file in Supabase Dashboard:**

```sql
-- Add new columns to puzzles table
ALTER TABLE puzzles
  ADD COLUMN IF NOT EXISTS words JSONB,
  ADD COLUMN IF NOT EXISTS layout JSONB,

-- Add helpful comments
COMMENT ON COLUMN puzzles.words IS 'Array of {text, clue} - teacher input, source of truth';
COMMENT ON COLUMN puzzles.layout IS 'Generated crossword layout - computed from words';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_puzzles_classroom_type
  ON puzzles(classroom_id, puzzle_type);

CREATE INDEX IF NOT EXISTS idx_puzzles_difficulty
  ON puzzles(difficulty)
  WHERE difficulty IS NOT NULL;
```

### **1.2 Regenerate TypeScript Types** (5 min)

```bash
# Use Supabase CLI or your type generation method
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

**Verify new fields appear in types:**
- `words: Json | null`
- `layout: Json | null`

---

## 📋 **PHASE 2: Type Definitions & Interfaces** (20 min)

### **2.1 Create Puzzle Type Definitions**

**File:** `src/types/puzzle.types.ts`

```typescript
import type { Json } from './database.types'

// ============================================
// Core Crossword Types
// ============================================

/**
 * Word input by teacher (before layout generation)
 */
export interface CrosswordWordInput {
  text: string  // Answer (e.g., "PHOTOSYNTHESIS")
  clue: string  // Question/hint
}

/**
 * Word with position after layout generation
 */
export interface CrosswordWord extends CrosswordWordInput {
  id: string                         // Unique identifier
  number: number                     // Clue number (1, 2, 3...)
  row: number                        // Starting row (0-indexed)
  col: number                        // Starting column (0-indexed)
  orientation: 'across' | 'down'    // Direction
}

/**
 * Cell in the crossword grid
 */
export interface CrosswordCell {
  row: number
  col: number
  letter: string | null              // Null for black cells
  number?: number                     // Clue number if cell starts a word
}

/**
 * Complete generated crossword layout
 */
export interface CrosswordLayout {
  rows: number                        // Grid height
  cols: number                        // Grid width
  cells: CrosswordCell[][]            // 2D array of cells
  words: CrosswordWord[]              // Positioned words
  acrossWords: CrosswordWord[]        // Convenience: only across
  downWords: CrosswordWord[]          // Convenience: only down
  generatedAt: string                 // ISO timestamp
}

/**
 * Complete puzzle data structure
 */
export interface PuzzleData {
  words: CrosswordWordInput[]
  layout: CrosswordLayout | null
}

// ============================================
// Validation & Error Types
// ============================================

export interface WordValidationError {
  index: number
  field: 'text' | 'clue'
  message: string
}

export interface PuzzleValidationResult {
  isValid: boolean
  errors: WordValidationError[]
  warnings?: string[]
}

// ============================================
// UI State Types
// ============================================

export interface CrosswordPreviewOptions {
  cellSize: number                    // px
  showNumbers: boolean
  showGrid: boolean
  highlightWord?: string              // Word ID to highlight
  readOnly: boolean
}

export interface WordEntryFormState {
  text: string
  clue: string
  errors: {
    text?: string
    clue?: string
  }
}

// ============================================
// Constants
// ============================================

export const PUZZLE_CONSTANTS = {
  MIN_WORDS: 3,
  MAX_WORDS: 50,
  MIN_WORD_LENGTH: 2,
  MAX_WORD_LENGTH: 20,
  MIN_CLUE_LENGTH: 3,
  MAX_CLUE_LENGTH: 500,
  MAX_GRID_SIZE: 25,

} as const
```

---

## 📋 **PHASE 3: Utility Functions** (45 min)

### **3.1 Crossword Generation Utility**

**File:** `src/utils/crossword-generator.ts`

```typescript
import generateLayout from 'crossword-layout-generator'
import type {
  CrosswordWordInput,
  CrosswordWord,
  CrosswordLayout,
  CrosswordCell
} from '@/types/puzzle.types'

/**
 * Generate crossword layout from words
 * @param words - Array of word inputs with text and clue
 * @returns Generated layout or null if generation fails
 */
export function generateCrosswordLayout(
  words: CrosswordWordInput[]
): CrosswordLayout | null {
  try {
    // Prepare input for library
    const input = words.map(w => ({
      clue: w.clue,
      answer: w.text.toUpperCase().trim()
    }))

    // Generate layout using library
    const rawLayout = generateLayout(input)

    if (!rawLayout || !rawLayout.result || rawLayout.result.length === 0) {
      console.warn('Layout generation failed: No words placed')
      return null
    }

    // Transform library output to our format
    const positionedWords: CrosswordWord[] = rawLayout.result
      .filter((word: any) => word.orientation !== 'none')  // Only successfully placed words
      .map((word: any, index: number) => ({
        id: `word-${Date.now()}-${index}`,
        text: word.answer,
        clue: word.clue,
        row: word.starty,
        col: word.startx,
        orientation: word.orientation === 'across' ? 'across' : 'down',
        number: index + 1  // Will be recalculated below
      }))

    // Sort words by position (top-to-bottom, left-to-right) for proper numbering
    const sortedWords = [...positionedWords].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row
      return a.col - b.col
    })

    // Assign numbers based on position
    const numberedWords = assignClueNumbers(sortedWords)

    // Build cell grid
    const cells = buildCellGrid(
      rawLayout.rows || 15,
      rawLayout.cols || 15,
      numberedWords
    )

    // Separate across/down for convenience
    const acrossWords = numberedWords.filter(w => w.orientation === 'across')
    const downWords = numberedWords.filter(w => w.orientation === 'down')

    return {
      rows: rawLayout.rows || 15,
      cols: rawLayout.cols || 15,
      cells,
      words: numberedWords,
      acrossWords,
      downWords,
      generatedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Crossword generation error:', error)
    return null
  }
}

/**
 * Assign clue numbers to words based on grid position
 * Words starting at the same cell share the same number
 */
function assignClueNumbers(words: CrosswordWord[]): CrosswordWord[] {
  const cellMap = new Map<string, number>()
  let currentNumber = 1

  return words.map(word => {
    const key = `${word.row},${word.col}`

    if (!cellMap.has(key)) {
      cellMap.set(key, currentNumber++)
    }

    return {
      ...word,
      number: cellMap.get(key)!
    }
  })
}

/**
 * Build 2D cell grid from positioned words
 */
function buildCellGrid(
  rows: number,
  cols: number,
  words: CrosswordWord[]
): CrosswordCell[][] {
  // Initialize empty grid
  const grid: CrosswordCell[][] = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      letter: null,
      isBlack: true
    }))
  )

  // Place words in grid
  words.forEach(word => {
    const letters = word.text.split('')
    const isAcross = word.orientation === 'across'

    letters.forEach((letter, i) => {
      const row = isAcross ? word.row : word.row + i
      const col = isAcross ? word.col + i : word.col

      if (row < rows && col < cols) {
        const cell = grid[row][col]
        cell.letter = letter
        cell.isBlack = false

        // Add number to first cell if not already set
        if (i === 0 && !cell.number) {
          cell.number = word.number
        }
      }
    })
  })

  return grid
}

/**
 * Estimate difficulty based on word count and average word length
 */
export function estimateDifficulty(
  words: CrosswordWordInput[]
): 'easy' | 'medium' | 'hard' {
  const wordCount = words.length
  const avgLength = words.reduce((sum, w) => sum + w.text.length, 0) / wordCount

  if (wordCount <= 8 && avgLength <= 6) return 'easy'
  if (wordCount <= 15 && avgLength <= 8) return 'medium'
  return 'hard'
}

/**
 * Calculate grid size recommendation based on words
 */
export function recommendGridSize(words: CrosswordWordInput[]): number {
  const maxLength = Math.max(...words.map(w => w.text.length))
  const wordCount = words.length

  // Heuristic: grid should be ~1.5x longest word, minimum based on count
  const sizeByLength = Math.ceil(maxLength * 1.5)
  const sizeByCount = Math.ceil(Math.sqrt(wordCount) * 3)

  return Math.max(10, Math.min(25, Math.max(sizeByLength, sizeByCount)))
}
```

### **3.2 Validation Utility**

**File:** `src/utils/crossword-validation.ts`

```typescript
import type {
  CrosswordWordInput,
  WordValidationError,
  PuzzleValidationResult
} from '@/types/puzzle.types'
import { PUZZLE_CONSTANTS } from '@/types/puzzle.types'

/**
 * Validate a single word input
 */
export function validateWord(
  word: CrosswordWordInput,
  index: number
): WordValidationError[] {
  const errors: WordValidationError[] = []

  // Validate text (answer)
  if (!word.text || word.text.trim().length === 0) {
    errors.push({
      index,
      field: 'text',
      message: 'Answer is required'
    })
  } else {
    const trimmed = word.text.trim()

    if (trimmed.length < PUZZLE_CONSTANTS.MIN_WORD_LENGTH) {
      errors.push({
        index,
        field: 'text',
        message: `Answer must be at least ${PUZZLE_CONSTANTS.MIN_WORD_LENGTH} characters`
      })
    }

    if (trimmed.length > PUZZLE_CONSTANTS.MAX_WORD_LENGTH) {
      errors.push({
        index,
        field: 'text',
        message: `Answer must be at most ${PUZZLE_CONSTANTS.MAX_WORD_LENGTH} characters`
      })
    }

    if (!/^[a-zA-Z]+$/.test(trimmed)) {
      errors.push({
        index,
        field: 'text',
        message: 'Answer must contain only letters (A-Z)'
      })
    }
  }

  // Validate clue
  if (!word.clue || word.clue.trim().length === 0) {
    errors.push({
      index,
      field: 'clue',
      message: 'Clue is required'
    })
  } else {
    const trimmed = word.clue.trim()

    if (trimmed.length < PUZZLE_CONSTANTS.MIN_CLUE_LENGTH) {
      errors.push({
        index,
        field: 'clue',
        message: `Clue must be at least ${PUZZLE_CONSTANTS.MIN_CLUE_LENGTH} characters`
      })
    }

    if (trimmed.length > PUZZLE_CONSTANTS.MAX_CLUE_LENGTH) {
      errors.push({
        index,
        field: 'clue',
        message: `Clue must be at most ${PUZZLE_CONSTANTS.MAX_CLUE_LENGTH} characters`
      })
    }
  }

  return errors
}

/**
 * Validate entire puzzle word list
 */
export function validatePuzzleWords(
  words: CrosswordWordInput[]
): PuzzleValidationResult {
  const errors: WordValidationError[] = []
  const warnings: string[] = []

  // Check minimum word count
  if (words.length < PUZZLE_CONSTANTS.MIN_WORDS) {
    errors.push({
      index: -1,
      field: 'text',
      message: `Puzzle must have at least ${PUZZLE_CONSTANTS.MIN_WORDS} words`
    })
  }

  // Check maximum word count
  if (words.length > PUZZLE_CONSTANTS.MAX_WORDS) {
    errors.push({
      index: -1,
      field: 'text',
      message: `Puzzle cannot have more than ${PUZZLE_CONSTANTS.MAX_WORDS} words`
    })
  }

  // Validate each word
  words.forEach((word, index) => {
    const wordErrors = validateWord(word, index)
    errors.push(...wordErrors)
  })

  // Check for duplicate answers (case-insensitive)
  const answers = words.map(w => w.text.trim().toUpperCase())
  const duplicates = answers.filter((a, i) => answers.indexOf(a) !== i)

  if (duplicates.length > 0) {
    warnings.push(`Duplicate answers found: ${[...new Set(duplicates)].join(', ')}`)
  }

  // Check for very short words (valid but might be hard to place)
  const shortWords = words.filter(w => w.text.trim().length === 2)
  if (shortWords.length > words.length * 0.3) {
    warnings.push('More than 30% of words are very short (2 letters). This might affect layout generation.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Sanitize word input (trim, uppercase for consistency)
 */
export function sanitizeWordInput(word: CrosswordWordInput): CrosswordWordInput {
  return {
    text: word.text.trim().toUpperCase(),
    clue: word.clue.trim()
  }
}

/**
 * Sanitize all words in a puzzle
 */
export function sanitizePuzzleWords(words: CrosswordWordInput[]): CrosswordWordInput[] {
  return words.map(sanitizeWordInput)
}
```

---

## 📋 **PHASE 4: Service Layer** (30 min)

### **4.1 Puzzle Service**

**File:** `src/services/api/puzzle.service.ts`

```typescript
import { BaseService } from './base.service'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import type { CrosswordWordInput, CrosswordLayout } from '@/types/puzzle.types'
import { generateCrosswordLayout } from '@/utils/crossword-generator'
import { sanitizePuzzleWords } from '@/utils/crossword-validation'

type Puzzle = Tables<'puzzles'>
type PuzzleInsert = TablesInsert<'puzzles'>
type PuzzleUpdate = TablesUpdate<'puzzles'>

/**
 * Puzzle Service
 * Handles CRUD operations for crossword puzzles
 */
export class PuzzleService extends BaseService {
  /**
   * Get all crossword puzzles for a classroom
   */
  async getClassroomPuzzles(classroomId: string): Promise<Puzzle[]> {
    const { data, error } = await this.client
      .from('puzzles')
      .select('*')
      .eq('classroom_id', classroomId)
      .eq('puzzle_type', 'crossword')
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError(error)
    }

    return data || []
  }

  /**
   * Get single puzzle by ID
   */
  async getPuzzleById(id: string): Promise<Puzzle> {
    const { data, error } = await this.client
      .from('puzzles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Create new crossword puzzle
   * Automatically generates layout from words
   */
  async createPuzzle(
    classroomId: string,
    createdBy: string,
    title: string,
    description: string | null,
    words: CrosswordWordInput[],
    difficulty: string | null = null
  ): Promise<Puzzle> {
    // Sanitize inputs
    const sanitizedWords = sanitizePuzzleWords(words)

    // Generate layout
    const layout = generateCrosswordLayout(sanitizedWords)

    if (!layout) {
      throw new Error(
        'Failed to generate crossword layout. Try adjusting your words or adding more variety.'
      )
    }

    // Prepare insert data
    const insertData: PuzzleInsert = {
      classroom_id: classroomId,
      created_by: createdBy,
      title,
      description,
      puzzle_type: 'crossword',
      words: sanitizedWords as any,  // Cast to Json
      generated_layout: layout as any,
      difficulty,
      puzzle_data: null  // We're not using this field
    }

    const { data, error } = await this.client
      .from('puzzles')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Update existing puzzle
   * Regenerates layout if words changed
   */
  async updatePuzzle(
    id: string,
    updates: {
      title?: string
      description?: string | null
      words?: CrosswordWordInput[]
      difficulty?: string | null
    }
  ): Promise<Puzzle> {
    const updateData: PuzzleUpdate = {}

    // Update title if provided
    if (updates.title !== undefined) {
      updateData.title = updates.title
    }

    // Update description if provided
    if (updates.description !== undefined) {
      updateData.description = updates.description
    }

    // Update difficulty if provided
    if (updates.difficulty !== undefined) {
      updateData.difficulty = updates.difficulty
    }

    // If words changed, sanitize and regenerate layout
    if (updates.words) {
      const sanitizedWords = sanitizePuzzleWords(updates.words)
      const layout = generateCrosswordLayout(sanitizedWords)

      if (!layout) {
        throw new Error(
          'Failed to generate crossword layout with updated words. Try different words.'
        )
      }

      updateData.words = sanitizedWords as any
      updateData.generated_layout = layout as any
    }

    const { data, error } = await this.client
      .from('puzzles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Delete puzzle
   */
  async deletePuzzle(id: string): Promise<void> {
    const { error } = await this.client
      .from('puzzles')
      .delete()
      .eq('id', id)

    if (error) {
      this.handleError(error)
    }
  }

  /**
   * Preview layout generation without saving
   * Useful for "Generate Preview" button in UI
   */
  async previewLayout(words: CrosswordWordInput[]): Promise<CrosswordLayout | null> {
    const sanitizedWords = sanitizePuzzleWords(words)
    return generateCrosswordLayout(sanitizedWords)
  }
}

// Export singleton
export const puzzleService = new PuzzleService()
```

---

## 📋 **PHASE 5: Store Layer** (45 min)

### **5.1 Puzzle Store**

**File:** `src/stores/puzzles.ts`

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { puzzleService } from '@/services/api/puzzle.service'
import type { Tables } from '@/types/database.types'
import type { CrosswordWordInput, CrosswordLayout, PuzzleDifficulty } from '@/types/puzzle.types'

type Puzzle = Tables<'puzzles'>

export const usePuzzleStore = defineStore('puzzle', () => {
  // ============================================
  // State
  // ============================================
  const puzzles = ref<Puzzle[]>([])
  const currentPuzzle = ref<Puzzle | null>(null)
  const previewLayout = ref<CrosswordLayout | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ============================================
  // Getters
  // ============================================
  const puzzleCount = computed(() => puzzles.value.length)
  const hasPuzzles = computed(() => puzzles.value.length > 0)

  const puzzlesByDifficulty = computed(() => (difficulty: PuzzleDifficulty) => {
    return puzzles.value.filter(p => p.difficulty === difficulty)
  })

  const currentPuzzleWords = computed((): CrosswordWordInput[] => {
    if (!currentPuzzle.value?.words) return []
    return currentPuzzle.value.words as CrosswordWordInput[]
  })

  const currentPuzzleLayout = computed((): CrosswordLayout | null => {
    if (!currentPuzzle.value?.generated_layout) return null
    return currentPuzzle.value.generated_layout as CrosswordLayout
  })

  // ============================================
  // Actions
  // ============================================

  /**
   * Fetch all puzzles for a classroom
   */
  const fetchPuzzles = async (classroomId: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await puzzleService.getClassroomPuzzles(classroomId)
      puzzles.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch puzzles'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch single puzzle by ID
   */
  const fetchPuzzleById = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await puzzleService.getPuzzleById(id)
      currentPuzzle.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch puzzle'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new puzzle
   */
  const createPuzzle = async (
    classroomId: string,
    createdBy: string,
    title: string,
    description: string | null,
    words: CrosswordWordInput[],
    difficulty: PuzzleDifficulty | null = null
  ) => {
    loading.value = true
    error.value = null
    try {
      const newPuzzle = await puzzleService.createPuzzle(
        classroomId,
        createdBy,
        title,
        description,
        words,
        difficulty
      )
      puzzles.value.unshift(newPuzzle)
      return newPuzzle
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create puzzle'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update existing puzzle
   */
  const updatePuzzle = async (
    id: string,
    updates: {
      title?: string
      description?: string | null
      words?: CrosswordWordInput[]
      difficulty?: PuzzleDifficulty | null
    }
  ) => {
    loading.value = true
    error.value = null
    try {
      const updated = await puzzleService.updatePuzzle(id, updates)

      // Update in list
      const index = puzzles.value.findIndex(p => p.id === id)
      if (index !== -1) {
        puzzles.value[index] = updated
      }

      // Update current if it's the same puzzle
      if (currentPuzzle.value?.id === id) {
        currentPuzzle.value = updated
      }

      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update puzzle'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete puzzle
   */
  const deletePuzzle = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await puzzleService.deletePuzzle(id)
      puzzles.value = puzzles.value.filter(p => p.id !== id)
      if (currentPuzzle.value?.id === id) {
        currentPuzzle.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete puzzle'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Generate layout preview without saving
   */
  const generatePreview = async (words: CrosswordWordInput[]) => {
    loading.value = true
    error.value = null
    try {
      const layout = await puzzleService.previewLayout(words)
      previewLayout.value = layout
      return layout
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to generate preview'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Clear preview layout
   */
  const clearPreview = () => {
    previewLayout.value = null
  }

  /**
   * Clear error message
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Clear current puzzle
   */
  const clearCurrent = () => {
    currentPuzzle.value = null
  }

  return {
    // State
    puzzles,
    currentPuzzle,
    previewLayout,
    loading,
    error,

    // Getters
    puzzleCount,
    hasPuzzles,
    puzzlesByDifficulty,
    currentPuzzleWords,
    currentPuzzleLayout,

    // Actions
    fetchPuzzles,
    fetchPuzzleById,
    createPuzzle,
    updatePuzzle,
    deletePuzzle,
    generatePreview,
    clearPreview,
    clearError,
    clearCurrent,
  }
})
```

---

## 📋 **PHASE 6: Composables** (30 min)

### **6.1 usePuzzle Composable**

**File:** `src/composables/usePuzzle.ts`

```typescript
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePuzzleStore } from '@/stores/puzzles'
import { useAuthStore } from '@/stores/auth'

export function usePuzzle() {
  const router = useRouter()
  const puzzleStore = usePuzzleStore()
  const authStore = useAuthStore()

  // Check if current user can edit puzzle
  const canEditPuzzle = computed(() => {
    if (!puzzleStore.currentPuzzle || !authStore.user) return false
    return puzzleStore.currentPuzzle.created_by === authStore.user.id
  })

  // Navigation helpers
  const goToPuzzleList = (classroomId: string) => {
    router.push({
      name: 'teacher-puzzles',
      params: { classroomId }
    })
  }

  const goToCreatePuzzle = (classroomId: string) => {
    router.push({
      name: 'create-puzzle',
      params: { classroomId }
    })
  }

  const goToEditPuzzle = (classroomId: string, puzzleId: string) => {
    router.push({
      name: 'edit-puzzle',
      params: { classroomId, puzzleId }
    })
  }

  return {
    canEditPuzzle,
    goToPuzzleList,
    goToCreatePuzzle,
    goToEditPuzzle,
  }
}
```

---

## 📋 **PHASE 7: Router & Guards** (30 min)

### **7.1 Update Router Configuration**

**File:** `src/router/index.ts`

Add these routes after the existing teacher routes:

```typescript
{
  path: '/classroom/:classroomId/puzzles',
  name: 'teacher-puzzles',
  component: () => import('@/views/TeacherPuzzlesPage.vue'),
  meta: { requiresAuth: true, role: ['teacher'] },
  beforeEnter: composeGuards([authGuard, roleGuard, classroomAccessGuard])
},
{
  path: '/classroom/:classroomId/puzzles/create',
  name: 'create-puzzle',
  component: () => import('@/views/CreatePuzzlePage.vue'),
  meta: { requiresAuth: true, role: ['teacher'] },
  beforeEnter: composeGuards([authGuard, roleGuard, classroomAccessGuard])
},
{
  path: '/classroom/:classroomId/puzzles/:puzzleId/edit',
  name: 'edit-puzzle',
  component: () => import('@/views/EditPuzzlePage.vue'),
  meta: { requiresAuth: true, role: ['teacher'] },
  beforeEnter: composeGuards([authGuard, roleGuard, classroomAccessGuard, puzzleOwnerGuard])
},
{
  path: '/classroom/:classroomId/puzzles/:puzzleId',
  name: 'view-puzzle',
  component: () => import('@/views/ViewPuzzlePage.vue'),
  meta: { requiresAuth: true, role: ['teacher'] },
  beforeEnter: composeGuards([authGuard, roleGuard, classroomAccessGuard])
}
```

### **7.2 Create Puzzle Owner Guard**

**File:** `src/router/guards/puzzle-owner.guard.ts`

```typescript
import type { RouteLocationNormalized } from 'vue-router'
import { usePuzzleStore } from '@/stores/puzzles'
import { useAuthStore } from '@/stores/auth'

/**
 * Guard to ensure teacher owns the puzzle they're trying to edit
 */
export async function puzzleOwnerGuard(to: RouteLocationNormalized) {
  const puzzleStore = usePuzzleStore()
  const authStore = useAuthStore()

  const puzzleId = to.params.puzzleId as string
  const classroomId = to.params.classroomId as string

  try {
    // Fetch puzzle to check ownership
    await puzzleStore.fetchPuzzleById(puzzleId)

    if (!puzzleStore.currentPuzzle) {
      return {
        name: 'teacher-puzzles',
        params: { classroomId }
      }
    }

    // Check if current user owns this puzzle
    if (puzzleStore.currentPuzzle.created_by !== authStore.user?.id) {
      return {
        name: 'teacher-puzzles',
        params: { classroomId }
      }
    }

    return true
  } catch (error) {
    console.error('Puzzle owner guard error:', error)
    return {
      name: 'teacher-puzzles',
      params: { classroomId }
    }
  }
}
```

### **7.3 Export Guard**

**File:** `src/router/guards/index.ts`

Add to exports:

```typescript
export { puzzleOwnerGuard } from './puzzle-owner.guard'
```

---

## 📋 **PHASE 8: Components** (4-5 hours)

### **8.1 Main Pages**

#### **8.1.1 Teacher Puzzles List Page**

**File:** `src/views/TeacherPuzzlesPage.vue`

```vue
<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-4">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Crossword Puzzles</h1>
        <p class="text-muted-foreground">
          Create and manage crossword puzzles for your students
        </p>
      </div>

      <!-- Filters and Actions Bar -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <!-- Search -->
          <div class="relative flex-1 sm:max-w-md">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="search"
              placeholder="Search puzzles by title..."
              class="pl-8"
            />
          </div>

          <!-- Difficulty Filter -->
          <Select v-model="selectedDifficulty">
            <SelectTrigger class="w-full sm:w-[180px]">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Create Button -->
        <Button @click="handleCreatePuzzle">
          <Plus class="mr-2 h-4 w-4" />
          Create Puzzle
        </Button>
      </div>

      <!-- Puzzles Table -->
      <div class="flex-1 min-h-0 rounded-xl border bg-card overflow-hidden">
        <div class="h-full overflow-auto">
          <Table>
            <TableHeader class="sticky top-0 z-10 bg-card shadow-sm">
              <TableRow>
                <TableHead class="w-[250px]">Title</TableHead>
                <TableHead class="w-[120px]">Difficulty</TableHead>
                <TableHead class="w-[100px]">Words</TableHead>
                <TableHead class="w-[150px]">Created</TableHead>
                <TableHead>Description</TableHead>
                <TableHead class="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <!-- Loading State -->
              <template v-if="puzzleStore.loading">
                <TableRow v-for="i in 5" :key="i">
                  <TableCell><Skeleton class="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton class="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton class="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton class="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton class="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton class="h-5 w-20" /></TableCell>
                </TableRow>
              </template>

              <!-- Empty State -->
              <TableRow v-else-if="filteredPuzzles.length === 0">
                <TableCell colspan="6" class="h-32 text-center">
                  <div class="flex flex-col items-center justify-center space-y-2">
                    <Puzzle class="h-12 w-12 text-muted-foreground" />
                    <p class="text-sm text-muted-foreground">
                      No puzzles found. Create your first crossword puzzle to get started.
                    </p>
                  </div>
                </TableCell>
              </TableRow>

              <!-- Puzzle Rows -->
              <TableRow
                v-else
                v-for="puzzle in filteredPuzzles"
                :key="puzzle.id"
                class="cursor-pointer hover:bg-muted/50"
                @click="handleViewPuzzle(puzzle.id)"
              >
                <TableCell class="font-medium">{{ puzzle.title }}</TableCell>
                <TableCell>
                  <DifficultyBadge
                    v-if="puzzle.difficulty"
                    :difficulty="puzzle.difficulty as PuzzleDifficulty"
                  />
                  <span v-else class="text-xs text-muted-foreground">-</span>
                </TableCell>
                <TableCell>
                  <span class="text-sm">{{ getWordCount(puzzle) }}</span>
                </TableCell>
                <TableCell>
                  <span class="text-sm text-muted-foreground">
                    {{ formatDate(puzzle.created_at) }}
                  </span>
                </TableCell>
                <TableCell>
                  <span class="text-sm text-muted-foreground line-clamp-1">
                    {{ puzzle.description || '-' }}
                  </span>
                </TableCell>
                <TableCell class="text-right" @click.stop>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon">
                        <MoreVertical class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="handleViewPuzzle(puzzle.id)">
                        <Eye class="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="handleEditPuzzle(puzzle.id)">
                        <Pencil class="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        class="text-destructive"
                        @click="handleDeletePuzzle(puzzle)"
                      >
                        <Trash class="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="isDeleteDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Puzzle</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ puzzleToDelete?.title }}"? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="isDeleteDialogOpen = false">Cancel</Button>
          <Button variant="destructive" @click="confirmDelete" :disabled="puzzleStore.loading">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePuzzleStore } from '@/stores/puzzles'
import { usePuzzle } from '@/composables/usePuzzle'
import { toast } from 'vue-sonner'
import { getErrorMessage } from '@/utils/errors'
import type { Tables } from '@/types/database.types'
import type { PuzzleDifficulty } from '@/types/puzzle.types'
import MainLayout from '@/layouts/MainLayout.vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import DifficultyBadge from '@/components/puzzles/DifficultyBadge.vue'
import { Search, Plus, Eye, Pencil, Trash, MoreVertical, Puzzle } from 'lucide-vue-next'

type Puzzle = Tables<'puzzles'>

const route = useRoute()
const puzzleStore = usePuzzleStore()
const { goToCreatePuzzle, goToEditPuzzle } = usePuzzle()

const classroomId = computed(() => route.params.classroomId as string)

// Search and filters
const searchQuery = ref('')
const selectedDifficulty = ref('all')

// Delete dialog
const isDeleteDialogOpen = ref(false)
const puzzleToDelete = ref<Puzzle | null>(null)

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: { name: 'dashboard', params: { classroomId: classroomId.value } } },
  { label: 'Puzzles' },
])

// Filtered puzzles
const filteredPuzzles = computed(() => {
  let filtered = puzzleStore.puzzles

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((p) => p.title.toLowerCase().includes(query))
  }

  // Difficulty filter
  if (selectedDifficulty.value !== 'all') {
    filtered = filtered.filter((p) => p.difficulty === selectedDifficulty.value)
  }

  return filtered
})

// Handlers
const handleCreatePuzzle = () => {
  goToCreatePuzzle(classroomId.value)
}

const handleViewPuzzle = (puzzleId: string) => {
  // Navigate to view page (will create in next section)
  router.push({
    name: 'view-puzzle',
    params: { classroomId: classroomId.value, puzzleId },
  })
}

const handleEditPuzzle = (puzzleId: string) => {
  goToEditPuzzle(classroomId.value, puzzleId)
}

const handleDeletePuzzle = (puzzle: Puzzle) => {
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
    toast.error(getErrorMessage(error))
  }
}

// Utility functions
const getWordCount = (puzzle: Puzzle): number => {
  if (!puzzle.words) return 0
  return Array.isArray(puzzle.words) ? puzzle.words.length : 0
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Lifecycle
onMounted(async () => {
  try {
    await puzzleStore.fetchPuzzles(classroomId.value)
  } catch (error) {
    toast.error(getErrorMessage(error))
  }
})
</script>
```

#### **8.1.2 Create Puzzle Page**

**File:** `src/views/CreatePuzzlePage.vue`

```vue
<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-6">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Create Crossword Puzzle</h1>
        <p class="text-muted-foreground">
          Add words and clues to generate a crossword puzzle
        </p>
      </div>

      <!-- Form Content -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <!-- Left: Form -->
        <Card class="flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>Puzzle Details</CardTitle>
            <CardDescription>Enter puzzle information and word list</CardDescription>
          </CardHeader>
          <CardContent class="flex-1 overflow-auto space-y-6">
            <!-- Title -->
            <div class="space-y-2">
              <Label for="title">Title *</Label>
              <Input
                id="title"
                v-model="formData.title"
                placeholder="e.g., Biology Chapter 5 Review"
                :class="{ 'border-destructive': errors.title }"
              />
              <p v-if="errors.title" class="text-sm text-destructive">{{ errors.title }}</p>
            </div>

            <!-- Description -->
            <div class="space-y-2">
              <Label for="description">Description (Optional)</Label>
              <Textarea
                id="description"
                v-model="formData.description"
                placeholder="Brief description of the puzzle..."
                rows="3"
              />
            </div>

            <!-- Difficulty -->
            <div class="space-y-2">
              <Label for="difficulty">Difficulty (Optional)</Label>
              <Select v-model="formData.difficulty">
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Words Section -->
            <Separator />

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold">Words & Clues</h3>
                  <p class="text-sm text-muted-foreground">
                    Minimum {{ PUZZLE_CONSTANTS.MIN_WORDS }} words required
                  </p>
                </div>
                <Button size="sm" @click="addWord">
                  <Plus class="h-4 w-4 mr-2" />
                  Add Word
                </Button>
              </div>

              <!-- Word Entry List -->
              <div class="space-y-3">
                <div
                  v-for="(word, index) in formData.words"
                  :key="index"
                  class="border rounded-lg p-4 space-y-3"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">Word {{ index + 1 }}</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      @click="removeWord(index)"
                      :disabled="formData.words.length <= PUZZLE_CONSTANTS.MIN_WORDS"
                    >
                      <Trash class="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div class="grid grid-cols-1 gap-3">
                    <div class="space-y-1">
                      <Label>Answer *</Label>
                      <Input
                        v-model="word.text"
                        placeholder="e.g., PHOTOSYNTHESIS"
                        @input="() => validateWordAtIndex(index)"
                        :class="{ 'border-destructive': wordErrors[index]?.text }"
                      />
                      <p v-if="wordErrors[index]?.text" class="text-xs text-destructive">
                        {{ wordErrors[index].text }}
                      </p>
                    </div>

                    <div class="space-y-1">
                      <Label>Clue *</Label>
                      <Textarea
                        v-model="word.clue"
                        placeholder="e.g., Process by which plants make food"
                        rows="2"
                        @input="() => validateWordAtIndex(index)"
                        :class="{ 'border-destructive': wordErrors[index]?.clue }"
                      />
                      <p v-if="wordErrors[index]?.clue" class="text-xs text-destructive">
                        {{ wordErrors[index].clue }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter class="border-t">
            <div class="flex gap-2 w-full">
              <Button variant="outline" @click="handleCancel" class="flex-1">Cancel</Button>
              <Button @click="handleGeneratePreview" :disabled="!canGeneratePreview" class="flex-1">
                <Eye class="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </CardFooter>
        </Card>

        <!-- Right: Preview -->
        <Card class="flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Generated crossword layout
              <span v-if="puzzleStore.previewLayout" class="text-xs">
                ({{ puzzleStore.previewLayout.words.length }} words placed)
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent class="flex-1 overflow-auto">
            <!-- Preview Loading -->
            <div v-if="puzzleStore.loading" class="flex items-center justify-center h-full">
              <div class="text-center space-y-2">
                <Loader2 class="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p class="text-sm text-muted-foreground">Generating layout...</p>
              </div>
            </div>

            <!-- Preview Empty State -->
            <div
              v-else-if="!puzzleStore.previewLayout"
              class="flex items-center justify-center h-full"
            >
              <div class="text-center space-y-2">
                <Puzzle class="h-12 w-12 mx-auto text-muted-foreground" />
                <p class="text-sm text-muted-foreground">
                  Click "Preview" to see your crossword layout
                </p>
              </div>
            </div>

            <!-- Preview Grid -->
            <CrosswordGrid
              v-else
              :layout="puzzleStore.previewLayout"
              :readonly="true"
              :showNumbers="true"
            />
          </CardContent>
          <CardFooter class="border-t">
            <Button
              @click="handleSave"
              :disabled="!puzzleStore.previewLayout || puzzleStore.loading"
              class="w-full"
            >
              <Save class="h-4 w-4 mr-2" />
              Save Puzzle
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePuzzleStore } from '@/stores/puzzles'
import { useAuthStore } from '@/stores/auth'
import { usePuzzle } from '@/composables/usePuzzle'
import { toast } from 'vue-sonner'
import { getErrorMessage } from '@/utils/errors'
import { validatePuzzleWords } from '@/utils/crossword-validation'
import type { CrosswordWordInput, PuzzleDifficulty } from '@/types/puzzle.types'
import { PUZZLE_CONSTANTS } from '@/types/puzzle.types'
import MainLayout from '@/layouts/MainLayout.vue'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import CrosswordGrid from '@/components/puzzles/CrosswordGrid.vue'
import { Plus, Trash, Eye, Save, Puzzle, Loader2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const puzzleStore = usePuzzleStore()
const authStore = useAuthStore()
const { goToPuzzleList } = usePuzzle()

const classroomId = computed(() => route.params.classroomId as string)

// Form data
const formData = reactive({
  title: '',
  description: '',
  difficulty: null as PuzzleDifficulty | null,
  words: [
    { text: '', clue: '' },
    { text: '', clue: '' },
    { text: '', clue: '' },
  ] as CrosswordWordInput[],
})

// Validation errors
const errors = reactive({
  title: '',
})

const wordErrors = ref<Record<number, { text?: string; clue?: string }>>({})

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: { name: 'dashboard', params: { classroomId: classroomId.value } } },
  { label: 'Puzzles', to: { name: 'teacher-puzzles', params: { classroomId: classroomId.value } } },
  { label: 'Create' },
])

// Computed
const canGeneratePreview = computed(() => {
  return (
    formData.title.trim().length > 0 &&
    formData.words.length >= PUZZLE_CONSTANTS.MIN_WORDS &&
    formData.words.every((w) => w.text.trim() && w.clue.trim())
  )
})

// Methods
const addWord = () => {
  if (formData.words.length >= PUZZLE_CONSTANTS.MAX_WORDS) {
    toast.error(`Maximum ${PUZZLE_CONSTANTS.MAX_WORDS} words allowed`)
    return
  }
  formData.words.push({ text: '', clue: '' })
}

const removeWord = (index: number) => {
  if (formData.words.length <= PUZZLE_CONSTANTS.MIN_WORDS) {
    toast.error(`Minimum ${PUZZLE_CONSTANTS.MIN_WORDS} words required`)
    return
  }
  formData.words.splice(index, 1)
  delete wordErrors.value[index]
}

const validateWordAtIndex = (index: number) => {
  const word = formData.words[index]
  const errs: { text?: string; clue?: string } = {}

  if (word.text && !/^[a-zA-Z]+$/.test(word.text.trim())) {
    errs.text = 'Only letters allowed'
  }

  wordErrors.value[index] = errs
}

const validateForm = (): boolean => {
  errors.title = ''

  if (!formData.title.trim()) {
    errors.title = 'Title is required'
    return false
  }

  const validation = validatePuzzleWords(formData.words)

  if (!validation.isValid) {
    toast.error('Please fix validation errors')
    return false
  }

  if (validation.warnings && validation.warnings.length > 0) {
    validation.warnings.forEach((warning) => toast.warning(warning))
  }

  return true
}

const handleGeneratePreview = async () => {
  if (!validateForm()) return

  try {
    await puzzleStore.generatePreview(formData.words)

    if (!puzzleStore.previewLayout) {
      toast.error('Failed to generate layout. Try adjusting your words.')
    } else {
      toast.success('Preview generated successfully!')
    }
  } catch (error) {
    toast.error(getErrorMessage(error))
  }
}

const handleSave = async () => {
  if (!puzzleStore.previewLayout) {
    toast.error('Please generate a preview first')
    return
  }

  if (!validateForm()) return

  try {
    await puzzleStore.createPuzzle(
      classroomId.value,
      authStore.user!.id,
      formData.title,
      formData.description || null,
      formData.words,
      formData.difficulty
    )

    toast.success('Puzzle created successfully!')
    goToPuzzleList(classroomId.value)
  } catch (error) {
    toast.error(getErrorMessage(error))
  }
}

const handleCancel = () => {
  goToPuzzleList(classroomId.value)
}
</script>
```

#### **8.1.3 Edit Puzzle Page**

**File:** `src/views/EditPuzzlePage.vue`

```vue
<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-6">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Edit Crossword Puzzle</h1>
        <p class="text-muted-foreground">Modify puzzle details and word list</p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center h-64">
        <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      </div>

      <!-- Form Content (same as CreatePuzzlePage but pre-filled) -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <!-- Left: Form (same structure as create) -->
        <Card class="flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>Puzzle Details</CardTitle>
            <CardDescription>Edit puzzle information and word list</CardDescription>
          </CardHeader>
          <CardContent class="flex-1 overflow-auto space-y-6">
            <!-- Same form fields as CreatePuzzlePage -->
            <!-- ... (code omitted for brevity, same structure) -->
          </CardContent>
          <CardFooter class="border-t">
            <div class="flex gap-2 w-full">
              <Button variant="outline" @click="handleCancel" class="flex-1">Cancel</Button>
              <Button @click="handleGeneratePreview" :disabled="!canGeneratePreview" class="flex-1">
                <Eye class="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </CardFooter>
        </Card>

        <!-- Right: Preview (same as create) -->
        <Card class="flex flex-col overflow-hidden">
          <!-- ... same preview structure ... -->
          <CardFooter class="border-t">
            <Button
              @click="handleUpdate"
              :disabled="!puzzleStore.previewLayout || puzzleStore.loading"
              class="w-full"
            >
              <Save class="h-4 w-4 mr-2" />
              Update Puzzle
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
// Similar to CreatePuzzlePage but with:
// 1. onMounted fetch puzzle data
// 2. Pre-fill form with existing data
// 3. handleUpdate instead of handleSave

import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePuzzleStore } from '@/stores/puzzles'
import { usePuzzle } from '@/composables/usePuzzle'
import { toast } from 'vue-sonner'
import { getErrorMessage } from '@/utils/errors'
import type { CrosswordWordInput } from '@/types/puzzle.types'

const route = useRoute()
const puzzleStore = usePuzzleStore()
const { goToPuzzleList } = usePuzzle()

const classroomId = computed(() => route.params.classroomId as string)
const puzzleId = computed(() => route.params.puzzleId as string)

const isLoading = ref(true)
const formData = reactive({
  title: '',
  description: '',
  difficulty: null as string | null,
  words: [] as CrosswordWordInput[],
})

const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: { name: 'dashboard', params: { classroomId: classroomId.value } } },
  { label: 'Puzzles', to: { name: 'teacher-puzzles', params: { classroomId: classroomId.value } } },
  { label: 'Edit' },
])

onMounted(async () => {
  try {
    await puzzleStore.fetchPuzzleById(puzzleId.value)

    if (puzzleStore.currentPuzzle) {
      formData.title = puzzleStore.currentPuzzle.title
      formData.description = puzzleStore.currentPuzzle.description || ''
      formData.difficulty = puzzleStore.currentPuzzle.difficulty
      formData.words = (puzzleStore.currentPuzzle.words as CrosswordWordInput[]) || []

      // Load existing layout as preview
      if (puzzleStore.currentPuzzle.generated_layout) {
        puzzleStore.previewLayout = puzzleStore.currentPuzzle.generated_layout as any
      }
    }
  } catch (error) {
    toast.error(getErrorMessage(error))
    goToPuzzleList(classroomId.value)
  } finally {
    isLoading.value = false
  }
})

const handleUpdate = async () => {
  try {
    await puzzleStore.updatePuzzle(puzzleId.value, {
      title: formData.title,
      description: formData.description || null,
      words: formData.words,
      difficulty: formData.difficulty as any,
    })

    toast.success('Puzzle updated successfully!')
    goToPuzzleList(classroomId.value)
  } catch (error) {
    toast.error(getErrorMessage(error))
  }
}

const handleCancel = () => {
  goToPuzzleList(classroomId.value)
}

// ... rest similar to CreatePuzzlePage
</script>
```

#### **8.1.4 View Puzzle Page (Read-Only)**

**File:** `src/views/ViewPuzzlePage.vue`

```vue
<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-6">
      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center h-64">
        <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      </div>

      <template v-else-if="puzzleStore.currentPuzzle">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <h1 class="text-3xl font-bold tracking-tight">
                {{ puzzleStore.currentPuzzle.title }}
              </h1>
              <DifficultyBadge
                v-if="puzzleStore.currentPuzzle.difficulty"
                :difficulty="puzzleStore.currentPuzzle.difficulty as PuzzleDifficulty"
              />
            </div>
            <p v-if="puzzleStore.currentPuzzle.description" class="text-muted-foreground">
              {{ puzzleStore.currentPuzzle.description }}
            </p>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" @click="handleEdit">
              <Pencil class="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" @click="handleBack">Back to List</Button>
          </div>
        </div>

        <!-- Content -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          <!-- Crossword Grid (2 columns) -->
          <Card class="lg:col-span-2 flex flex-col overflow-hidden">
            <CardHeader>
              <CardTitle>Crossword Grid</CardTitle>
            </CardHeader>
            <CardContent class="flex-1 overflow-auto">
              <CrosswordGrid
                v-if="puzzleStore.currentPuzzleLayout"
                :layout="puzzleStore.currentPuzzleLayout"
                :readonly="true"
                :showNumbers="true"
              />
            </CardContent>
          </Card>

          <!-- Clues (1 column) -->
          <Card class="flex flex-col overflow-hidden">
            <CardHeader>
              <CardTitle>Clues</CardTitle>
            </CardHeader>
            <CardContent class="flex-1 overflow-auto">
              <CrosswordCluesList
                v-if="puzzleStore.currentPuzzleLayout"
                :layout="puzzleStore.currentPuzzleLayout"
              />
            </CardContent>
          </Card>
        </div>
      </template>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePuzzleStore } from '@/stores/puzzles'
import { usePuzzle } from '@/composables/usePuzzle'
import { toast } from 'vue-sonner'
import { getErrorMessage } from '@/utils/errors'
import type { PuzzleDifficulty } from '@/types/puzzle.types'
import MainLayout from '@/layouts/MainLayout.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import CrosswordGrid from '@/components/puzzles/CrosswordGrid.vue'
import CrosswordCluesList from '@/components/puzzles/CrosswordCluesList.vue'
import DifficultyBadge from '@/components/puzzles/DifficultyBadge.vue'
import { Pencil, Loader2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const puzzleStore = usePuzzleStore()
const { goToPuzzleList, goToEditPuzzle } = usePuzzle()

const classroomId = computed(() => route.params.classroomId as string)
const puzzleId = computed(() => route.params.puzzleId as string)

const isLoading = ref(true)

const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: { name: 'dashboard', params: { classroomId: classroomId.value } } },
  { label: 'Puzzles', to: { name: 'teacher-puzzles', params: { classroomId: classroomId.value } } },
  { label: puzzleStore.currentPuzzle?.title || 'View' },
])

onMounted(async () => {
  try {
    await puzzleStore.fetchPuzzleById(puzzleId.value)
  } catch (error) {
    toast.error(getErrorMessage(error))
    goToPuzzleList(classroomId.value)
  } finally {
    isLoading.value = false
  }
})

const handleEdit = () => {
  goToEditPuzzle(classroomId.value, puzzleId.value)
}

const handleBack = () => {
  goToPuzzleList(classroomId.value)
}
</script>
```

### **8.2 Reusable Components**

#### **8.2.1 Crossword Grid Component**

**File:** `src/components/puzzles/CrosswordGrid.vue`

```vue
<template>
  <div class="crossword-container">
    <div
      class="crossword-grid"
      :style="{
        gridTemplateColumns: `repeat(${layout.cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${layout.rows}, ${cellSize}px)`,
      }"
    >
      <div
        v-for="(row, rowIndex) in layout.cells"
        :key="`row-${rowIndex}`"
        v-for="(cell, colIndex) in row"
        :key="`cell-${rowIndex}-${colIndex}`"
        class="crossword-cell"
        :class="{
          'cell-black': cell.isBlack,
          'cell-white': !cell.isBlack,
        }"
      >
        <!-- Cell number -->
        <span v-if="cell.number && showNumbers" class="cell-number">{{ cell.number }}</span>

        <!-- Cell letter -->
        <span v-if="!cell.isBlack && cell.letter" class="cell-letter">{{ cell.letter }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CrosswordLayout } from '@/types/puzzle.types'

interface Props {
  layout: CrosswordLayout
  readonly?: boolean
  showNumbers?: boolean
  cellSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  showNumbers: true,
  cellSize: 40,
})
</script>

<style scoped>
.crossword-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.crossword-grid {
  display: grid;
  gap: 0;
  border: 2px solid hsl(var(--border));
}

.crossword-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid hsl(var(--border));
  font-family: monospace;
  font-weight: 600;
}

.cell-black {
  background-color: hsl(var(--muted));
}

.cell-white {
  background-color: hsl(var(--background));
}

.cell-number {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 0.625rem;
  color: hsl(var(--muted-foreground));
}

.cell-letter {
  font-size: 1.25rem;
  text-transform: uppercase;
}
</style>
```

#### **8.2.2 Crossword Clues List Component**

**File:** `src/components/puzzles/CrosswordCluesList.vue`

```vue
<template>
  <div class="space-y-6">
    <!-- Across Clues -->
    <div class="space-y-2">
      <h3 class="font-semibold text-lg">Across</h3>
      <div class="space-y-1">
        <div
          v-for="word in layout.acrossWords"
          :key="word.id"
          class="text-sm"
        >
          <span class="font-medium">{{ word.number }}.</span>
          <span class="ml-2 text-muted-foreground">{{ word.clue }}</span>
        </div>
      </div>
    </div>

    <!-- Down Clues -->
    <div class="space-y-2">
      <h3 class="font-semibold text-lg">Down</h3>
      <div class="space-y-1">
        <div
          v-for="word in layout.downWords"
          :key="word.id"
          class="text-sm"
        >
          <span class="font-medium">{{ word.number }}.</span>
          <span class="ml-2 text-muted-foreground">{{ word.clue }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CrosswordLayout } from '@/types/puzzle.types'

interface Props {
  layout: CrosswordLayout
}

defineProps<Props>()
</script>
```

#### **8.2.3 Difficulty Badge Component**

**File:** `src/components/puzzles/DifficultyBadge.vue`

```vue
<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="colorClass"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PuzzleDifficulty } from '@/types/puzzle.types'
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/types/puzzle.types'

interface Props {
  difficulty: PuzzleDifficulty
}

const props = defineProps<Props>()

const label = computed(() => DIFFICULTY_LABELS[props.difficulty])
const colorClass = computed(() => DIFFICULTY_COLORS[props.difficulty])
</script>
```

---

## 📋 **PHASE 9: Navigation Integration** (10 min)

### **9.1 Update Navigation Config**

**File:** `src/config/navigation.ts`

The navigation already has a "Puzzles" entry (line 111-114). Verify it points to the correct route:

```typescript
{
  title: 'Puzzles',
  url: '/puzzles',  // This will be prefixed with /classroom/:classroomId by the layout
  icon: Puzzle,
}
```

No changes needed if navigation is already correct!

---

## 📋 **PHASE 10: Package Installation** (5 min)

### **10.1 Install NPM Package**

```bash
npm install crossword-layout-generator
```

### **10.2 Verify Installation**

```bash
npm list crossword-layout-generator
```

---

## 📋 **PHASE 11: Testing Strategy** (Optional but Recommended)

### **11.1 Service Tests**

**File:** `src/services/api/__tests__/puzzle.service.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { puzzleService } from '../puzzle.service'
import { supabase } from '@/lib/supabaseClient'

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('PuzzleService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getClassroomPuzzles', () => {
    it('should fetch puzzles for a classroom', async () => {
      const mockPuzzles = [
        { id: '1', title: 'Test Puzzle', puzzle_type: 'crossword' }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPuzzles, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await puzzleService.getClassroomPuzzles('classroom-1')

      expect(result).toEqual(mockPuzzles)
      expect(supabase.from).toHaveBeenCalledWith('puzzles')
      expect(mockQuery.eq).toHaveBeenCalledWith('classroom_id', 'classroom-1')
      expect(mockQuery.eq).toHaveBeenCalledWith('puzzle_type', 'crossword')
    })
  })
})
```

### **11.2 Utility Tests**

**File:** `src/utils/__tests__/crossword-validation.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { validatePuzzleWords, sanitizePuzzleWords } from '../crossword-validation'

describe('crossword-validation', () => {
  describe('validatePuzzleWords', () => {
    it('should pass valid puzzle words', () => {
      const words = [
        { text: 'CAT', clue: 'A feline animal' },
        { text: 'DOG', clue: 'A canine animal' },
        { text: 'BIRD', clue: 'Has wings' },
      ]

      const result = validatePuzzleWords(words)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail with too few words', () => {
      const words = [
        { text: 'CAT', clue: 'A feline' },
      ]

      const result = validatePuzzleWords(words)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('sanitizePuzzleWords', () => {
    it('should uppercase and trim words', () => {
      const words = [
        { text: '  cat  ', clue: '  A feline  ' },
      ]

      const result = sanitizePuzzleWords(words)

      expect(result[0].text).toBe('CAT')
      expect(result[0].clue).toBe('A feline')
    })
  })
})
```

---

## 📋 **PHASE 12: Implementation Checklist**

### **Database**
- [ ] Run migration to add `words`, `generated_layout`, `difficulty` columns
- [ ] Verify RLS policies exist and are correct
- [ ] Regenerate `database.types.ts` with new fields
- [ ] Test database queries in Supabase dashboard

### **Dependencies**
- [ ] Install `crossword-layout-generator` via npm
- [ ] Verify package is in `package.json`

### **Types & Utilities**
- [ ] Create `src/types/puzzle.types.ts` with all interfaces
- [ ] Create `src/utils/crossword-generator.ts` with generation logic
- [ ] Create `src/utils/crossword-validation.ts` with validation logic
- [ ] Test utility functions with sample data

### **Service Layer**
- [ ] Create `src/services/api/puzzle.service.ts`
- [ ] Implement all CRUD methods
- [ ] Test service methods (manual or unit tests)

### **Store Layer**
- [ ] Update `src/stores/puzzles.ts` with full implementation
- [ ] Test store actions in dev tools

### **Composables**
- [ ] Create `src/composables/usePuzzle.ts`
- [ ] Test navigation helpers

### **Router**
- [ ] Add puzzle routes to `src/router/index.ts`
- [ ] Create `src/router/guards/puzzle-owner.guard.ts`
- [ ] Export guard in `src/router/guards/index.ts`
- [ ] Test route navigation

### **Components**
- [ ] Create `src/views/TeacherPuzzlesPage.vue` (list)
- [ ] Create `src/views/CreatePuzzlePage.vue` (create)
- [ ] Create `src/views/EditPuzzlePage.vue` (edit)
- [ ] Create `src/views/ViewPuzzlePage.vue` (view)
- [ ] Create `src/components/puzzles/CrosswordGrid.vue`
- [ ] Create `src/components/puzzles/CrosswordCluesList.vue`
- [ ] Create `src/components/puzzles/DifficultyBadge.vue`
- [ ] Test each component in isolation

### **Navigation**
- [ ] Verify `src/config/navigation.ts` has Puzzles entry
- [ ] Test navigation from sidebar

### **End-to-End Testing**
- [ ] Create a new puzzle with 5 words
- [ ] Preview the generated layout
- [ ] Save the puzzle
- [ ] Edit the puzzle
- [ ] View the puzzle (read-only)
- [ ] Delete the puzzle
- [ ] Test validation errors (empty fields, invalid characters)
- [ ] Test with minimum words (3)
- [ ] Test with many words (20+)

### **Code Quality**
- [ ] Run `npm run type-check` - should pass
- [ ] Run `npm run build` - should succeed
- [ ] Run `npm run lint` - fix any issues
- [ ] Run `npm run test:unit` - if tests written
- [ ] Review code follows CLAUDE.md architecture

### **Polish**
- [ ] Add loading states to all async operations
- [ ] Add error handling with toast notifications
- [ ] Add confirmation dialogs for destructive actions
- [ ] Test responsive design on mobile
- [ ] Add keyboard shortcuts (optional)

---

## 📊 **Estimated Timeline**

| Phase | Time | Cumulative |
|-------|------|------------|
| 1. Database Migration | 15 min | 15 min |
| 2. Type Definitions | 20 min | 35 min |
| 3. Utilities | 45 min | 1h 20m |
| 4. Service Layer | 30 min | 1h 50m |
| 5. Store Layer | 45 min | 2h 35m |
| 6. Composables | 30 min | 3h 05m |
| 7. Router & Guards | 30 min | 3h 35m |
| 8. Components | 4-5 hours | 7h 35m - 8h 35m |
| 9. Navigation | 10 min | 7h 45m - 8h 45m |
| 10. Package Install | 5 min | 7h 50m - 8h 50m |
| 11. Testing (optional) | 2 hours | 9h 50m - 10h 50m |
| 12. QA & Polish | 2-3 hours | 11h 50m - 13h 50m |

**Total: 12-14 hours for complete implementation**

---

## 🎯 **Success Criteria**

✅ **Functional Requirements**
- Teachers can create crossword puzzles with 3-50 words
- Teachers can preview generated layout before saving
- Teachers can edit existing puzzles (regenerates layout)
- Teachers can view puzzles in read-only mode
- Teachers can delete puzzles with confirmation
- Teachers can filter puzzles by difficulty
- Teachers can search puzzles by title

✅ **Technical Requirements**
- All code follows PeakMark clean architecture
- Proper separation of `words` and `generated_layout`
- Type-safe throughout with TypeScript
- Error handling with user-friendly messages
- Loading states for all async operations
- Responsive design (mobile + desktop)
- No direct Supabase calls outside services
- RLS policies properly configured

✅ **User Experience**
- Intuitive word entry form
- Clear validation error messages
- Confirmation dialogs for destructive actions
- Smooth navigation between pages
- Fast layout generation (< 2 seconds)
- Professional-looking crossword grid

---

## 🚀 **Next Steps After Completion**

### **Phase 2: Student Features** (Future)
1. Student puzzle list (published only)
2. Interactive puzzle player
3. Answer validation
4. Hint system
5. Progress tracking
6. Completion analytics

### **Phase 3: Advanced Features** (Future)
1. Puzzle templates by subject
2. Import/export word lists
3. Print-friendly view
4. Collaborative solving
5. Leaderboard
6. Badges & achievements

---

## 📝 **Notes & Best Practices**

### **Layout Generation**
- The `crossword-layout-generator` library may not place all words
- Check `layout.words.length` vs input words length
- Inform user if some words couldn't be placed
- Suggest adding more intersecting letters

### **Performance**
- Layout generation is synchronous and can be slow with 30+ words
- Consider adding a loading indicator
- Cache generated layouts in database (we do this!)

### **Data Integrity**
- Always sanitize words (trim, uppercase)
- Validate before generating layout
- Handle generation failures gracefully
- Don't lose user input on errors

### **Security**
- RLS policies ensure teachers only see their puzzles
- Validate ownership on edit/delete
- Sanitize all user inputs
- Prevent XSS in clues/descriptions

---

## 🆘 **Troubleshooting**

### **Layout generation fails**
- Check word variety (need intersections)
- Reduce word count
- Use shorter words
- Check for typos in words

### **TypeScript errors**
- Ensure `database.types.ts` regenerated
- Cast Json types when needed: `as CrosswordLayout`
- Check all imports

### **RLS policy issues**
- Verify teacher is authenticated
- Check `classroom_id` matches user's classroom
- Review policy in Supabase dashboard

### **Component not rendering**
- Check route configuration
- Verify component imports
- Check console for errors
- Ensure data is loaded before rendering

---

**End of Implementation Plan**
