/**
 * Wordsearch Generator Utility (TypeScript)
 *
 * - Generates wordsearch puzzles with configurable word placement directions
 * - Supports horizontal, vertical, diagonal, and backwards placement
 * - Fills empty cells with random letters
 * - generateWordsearch(words, gridSize, config, seed?)
 */

export interface WordEntry {
  answer: string
  hint?: string
}

export interface PlacedWord {
  word: string
  hint?: string
  startRow: number
  startCol: number
  endRow: number
  endCol: number
  direction: 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up'
  reversed: boolean
}

export interface WordsearchConfig {
  allowHorizontal: boolean
  allowVertical: boolean
  allowDiagonal: boolean
  allowBackwards: boolean
}

export interface WordsearchResult {
  grid: string[][]
  placedWords: PlacedWord[]
  unusedWords: WordEntry[]
}

/**
 * Simple RNG for reproducibility (Park–Miller LCG)
 */
class RNG {
  private seed: number

  constructor(seed?: number) {
    if (seed === undefined || seed === null) {
      this.seed = Date.now() % 2147483647
    } else {
      this.seed = seed % 2147483647
    }
    if (this.seed <= 0) this.seed += 2147483646
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647
    return (this.seed - 1) / 2147483646
  }

  randInt(maxExclusive: number): number {
    if (maxExclusive <= 0) return 0
    return Math.floor(this.next() * maxExclusive)
  }

  choice<T>(arr: T[]): T {
    return arr[this.randInt(arr.length)] as T
  }

  shuffle<T>(arr: T[]): T[] {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.randInt(i + 1)
      const tmp = a[i] as T
      a[i] = a[j] as T
      a[j] = tmp
    }
    return a
  }
}

/**
 * Direction vectors for word placement
 */
const DIRECTIONS = {
  horizontal: { dr: 0, dc: 1 },
  vertical: { dr: 1, dc: 0 },
  'diagonal-down': { dr: 1, dc: 1 },
  'diagonal-up': { dr: -1, dc: 1 },
} as const

type DirectionKey = keyof typeof DIRECTIONS

/**
 * Check if a word can be placed at a given position and direction
 */
function canPlaceWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: DirectionKey,
  reversed: boolean,
): boolean {
  const { dr, dc } = DIRECTIONS[direction]
  const wordToPlace = reversed ? word.split('').reverse().join('') : word
  const gridSize = grid.length

  for (let i = 0; i < wordToPlace.length; i++) {
    const r = row + i * dr
    const c = col + i * dc

    // Check bounds
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) {
      return false
    }

    // Check if cell is empty or matches the letter we want to place
    const currentCell = grid[r]?.[c] ?? ''
    if (currentCell !== '' && currentCell !== wordToPlace[i]) {
      return false
    }
  }

  return true
}

/**
 * Place a word on the grid
 */
function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: DirectionKey,
  reversed: boolean,
): void {
  const { dr, dc } = DIRECTIONS[direction]
  const wordToPlace = reversed ? word.split('').reverse().join('') : word

  for (let i = 0; i < wordToPlace.length; i++) {
    const r = row + i * dr
    const c = col + i * dc
    const gridRow = grid[r]
    if (gridRow) {
      gridRow[c] = wordToPlace[i]!
    }
  }
}

/**
 * Try to place a word on the grid with random position and direction
 */
function tryPlaceWord(
  grid: string[][],
  word: WordEntry,
  config: WordsearchConfig,
  rng: RNG,
  maxAttempts: number = 100,
): PlacedWord | null {
  const gridSize = grid.length
  const upperWord = word.answer.toUpperCase()

  // Build list of allowed directions
  const allowedDirections: DirectionKey[] = []
  if (config.allowHorizontal) allowedDirections.push('horizontal')
  if (config.allowVertical) allowedDirections.push('vertical')
  if (config.allowDiagonal) {
    allowedDirections.push('diagonal-down')
    allowedDirections.push('diagonal-up')
  }

  if (allowedDirections.length === 0) return null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const direction = rng.choice(allowedDirections)
    const reversed = config.allowBackwards ? rng.randInt(2) === 1 : false
    const row = rng.randInt(gridSize)
    const col = rng.randInt(gridSize)

    if (canPlaceWord(grid, upperWord, row, col, direction, reversed)) {
      placeWord(grid, upperWord, row, col, direction, reversed)

      // Calculate end position
      const { dr, dc } = DIRECTIONS[direction]
      const endRow = row + (upperWord.length - 1) * dr
      const endCol = col + (upperWord.length - 1) * dc

      return {
        word: upperWord,
        hint: word.hint,
        startRow: row,
        startCol: col,
        endRow,
        endCol,
        direction,
        reversed,
      }
    }
  }

  return null
}

/**
 * Fill empty cells with random letters
 */
function fillEmptyCells(grid: string[][], rng: RNG): void {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r]!.length; c++) {
      if (grid[r]![c] === '') {
        grid[r]![c] = alphabet[rng.randInt(alphabet.length)]!
      }
    }
  }
}

/**
 * Generate a wordsearch puzzle
 */
export function generateWordsearch(
  words: WordEntry[],
  gridSize: number,
  config: WordsearchConfig,
  seed?: number,
): WordsearchResult | null {
  if (!words || words.length === 0) return null

  // Validate that at least one direction is allowed
  if (!config.allowHorizontal && !config.allowVertical && !config.allowDiagonal) {
    throw new Error('At least one direction must be allowed')
  }

  // Ensure uppercase answers
  const inputs: WordEntry[] = words.map((w) => ({
    answer: String(w.answer).toUpperCase(),
    hint: w.hint,
  }))

  // Check if longest word fits
  const longest = inputs.reduce((m, it) => Math.max(m, it.answer.length), 0)
  if (longest > gridSize) {
    return null
  }

  const rng = new RNG(seed)
  const grid: string[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => ''),
  )

  const placedWords: PlacedWord[] = []
  const unusedWords: WordEntry[] = []

  // Shuffle words for random placement order
  const shuffledWords = rng.shuffle(inputs)

  for (const word of shuffledWords) {
    const placed = tryPlaceWord(grid, word, config, rng)
    if (placed) {
      placedWords.push(placed)
    } else {
      unusedWords.push(word)
    }
  }

  // Fill empty cells with random letters
  fillEmptyCells(grid, rng)

  return {
    grid,
    placedWords,
    unusedWords,
  }
}
