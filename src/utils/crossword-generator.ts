/**
 * Crossword Generator Utility
 * Pure functions for crossword puzzle generation
 *
 * Replaces generateCrossword with the improved placement algorithm while
 * keeping the input/output structure unchanged.
 */

export interface WordEntry {
  id: string
  answer: string
  clue: string
}

export interface PlacedWord {
  word: string
  clue: string
  row: number
  col: number
  direction: 'across' | 'down'
  number: number
}

export interface CrosswordResult {
  grid: string[][]
  placedWords: PlacedWord[]
}

/**
 * Check if a word can be placed at the given position
 * (kept for compatibility; note: generateCrossword uses its own checks)
 */
export function canPlaceWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down',
  size: number,
): boolean {
  if (direction === 'across') {
    if (col < 0 || col + word.length > size || row < 0 || row >= size) return false

    const gridRow = grid[row]
    if (!gridRow) return false

    // Check before and after
    if (col > 0 && gridRow[col - 1] !== '') return false
    if (col + word.length < size && gridRow[col + word.length] !== '') return false

    for (let i = 0; i < word.length; i++) {
      const cell = gridRow[col + i]
      if (cell !== '' && cell !== word[i]) return false

      // Check above and below (except at intersection points)
      if (cell === '') {
        const aboveRow = grid[row - 1]
        const belowRow = grid[row + 1]
        if (row > 0 && aboveRow && aboveRow[col + i] !== '') return false
        if (row < size - 1 && belowRow && belowRow[col + i] !== '') return false
      }
    }
  } else {
    if (row < 0 || row + word.length > size || col < 0 || col >= size) return false

    // Check before and after
    const beforeRow = grid[row - 1]
    const afterRow = grid[row + word.length]
    if (row > 0 && beforeRow && beforeRow[col] !== '') return false
    if (row + word.length < size && afterRow && afterRow[col] !== '') return false

    for (let i = 0; i < word.length; i++) {
      const currentRow = grid[row + i]
      if (!currentRow) return false

      const cell = currentRow[col]
      if (cell !== '' && cell !== word[i]) return false

      // Check left and right (except at intersection points)
      if (cell === '') {
        if (col > 0 && currentRow[col - 1] !== '') return false
        if (col < size - 1 && currentRow[col + 1] !== '') return false
      }
    }
  }
  return true
}

/**
 * Place a word on the grid at the given position
 */
export function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down',
): void {
  for (let i = 0; i < word.length; i++) {
    const char = word[i]
    if (!char) continue

    if (direction === 'across') {
      const gridRow = grid[row]
      if (gridRow) {
        gridRow[col + i] = char
      }
    } else {
      const gridRow = grid[row + i]
      if (gridRow) {
        gridRow[col] = char
      }
    }
  }
}

/**
 * Find the placed word that starts at the given position
 */
export function getWordStartAt(
  placedWords: PlacedWord[],
  row: number,
  col: number,
): PlacedWord | undefined {
  return placedWords.find((w) => w.row === row && w.col === col)
}

/* ----------------- New algorithm implementation ----------------- */

/**
 * Small RNG wrapper so runs are reproducible if desired.
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
  // Park-Miller LCG
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647
    return (this.seed - 1) / 2147483646
  }
  randInt(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive)
  }
  shuffle<T>(arr: T[]): T[] {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.randInt(i + 1)
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
}

/**
 * Internal builder: mirrors the algorithm used in the TypeScript utility.
 * Words are represented as [answer, clue, row?, col?, vertical?]
 */
class CrosswordBuilder {
  size: number
  empty: string
  available: Array<[string, string]>
  grid: string[][]
  letCoords: Map<string, Array<[number, number, boolean]>>
  current: Array<[string, string, number, number, boolean]>
  bestGrid: string[][]
  bestPlaced: Array<[string, string, number, number, boolean]>
  rng: RNG

  constructor(size: number, inputs: WordEntry[], rng?: RNG, emptyChar = '') {
    this.size = size
    this.empty = emptyChar
    this.available = inputs.map((i) => [String(i.answer).toUpperCase(), String(i.clue ?? '')])
    this.grid = Array.from({ length: size }, () => Array.from({ length: size }, () => this.empty))
    this.letCoords = new Map()
    this.current = []
    this.bestGrid = this.grid.map((r) => r.slice())
    this.bestPlaced = []
    this.rng = rng ?? new RNG()
  }

  private cellOccupied(row: number, col: number) {
    return this.grid[row][col] !== this.empty
  }

  private setWord(wordRec: [string, string, number, number, boolean], row: number, col: number, vertical: boolean) {
    wordRec[2] = row
    wordRec[3] = col
    wordRec[4] = vertical
    this.current.push(wordRec)

    let r = row
    let c = col
    for (const ch of wordRec[0]) {
      this.grid[r][c] = ch
      const existing = this.letCoords.get(ch) ?? []
      if (!existing.some((e) => e[0] === r && e[1] === c && e[2] === vertical)) {
        existing.push([r, c, vertical])
      }
      this.letCoords.set(ch, existing)
      if (vertical) r += 1
      else c += 1
    }
  }

  private firstWord(word: [string, string]) {
    const vertical = this.rng.randInt(2) === 1
    let row: number
    let col: number
    if (vertical) {
      row = this.rng.randInt(Math.max(1, this.size - word[0].length + 1))
      col = this.rng.randInt(this.size)
    } else {
      row = this.rng.randInt(this.size)
      col = this.rng.randInt(Math.max(1, this.size - word[0].length + 1))
    }
    const rec: [string, string, number, number, boolean] = [word[0], word[1], row, col, vertical]
    this.setWord(rec, row, col, vertical)
  }

  private checkScoreHoriz(word: [string, string], row: number, col: number, wordLength: number): number {
    const cellOccupied = this.cellOccupied.bind(this)
    if ((col !== 0 && cellOccupied(row, col - 1)) || (col + wordLength !== this.size && cellOccupied(row, col + wordLength))) {
      return 0
    }
    let score = 1
    for (let i = 0; i < wordLength; i++) {
      const activeCell = this.grid[row][col]
      if (activeCell === this.empty) {
        if ((row + 1 !== this.size && cellOccupied(row + 1, col)) || (row !== 0 && cellOccupied(row - 1, col))) {
          return 0
        }
      } else if (activeCell === word[0][i]) {
        score += 1
      } else {
        return 0
      }
      col += 1
    }
    return score
  }

  private checkScoreVert(word: [string, string], row: number, col: number, wordLength: number): number {
    const cellOccupied = this.cellOccupied.bind(this)
    if ((row !== 0 && cellOccupied(row - 1, col)) || (row + wordLength !== this.size && cellOccupied(row + wordLength, col))) {
      return 0
    }
    let score = 1
    for (let i = 0; i < wordLength; i++) {
      const activeCell = this.grid[row][col]
      if (activeCell === this.empty) {
        if ((col + 1 !== this.size && cellOccupied(row, col + 1)) || (col !== 0 && cellOccupied(row, col - 1))) {
          return 0
        }
      } else if (activeCell === word[0][i]) {
        score += 1
      } else {
        return 0
      }
      row += 1
    }
    return score
  }

  private getCoords(word: [string, string]): [number, number, boolean, number] | undefined {
    const wordLength = word[0].length
    const coordlist: Array<[number, number, boolean, number]> = []

    // For each letter in the word, see if that letter exists on the grid and test placement
    for (let letIndex = 0; letIndex < wordLength; letIndex++) {
      const ch = word[0][letIndex]
      const coords = this.letCoords.get(ch) ?? []
      for (const item of coords) {
        const [rowc, colc, vertc] = item
        if (vertc) {
          // existing is vertical -> try place horizontally crossing it
          if (colc - letIndex >= 0 && (colc - letIndex) + wordLength <= this.size) {
            const row = rowc
            const col = colc - letIndex
            const score = this.checkScoreHoriz(word, row, col, wordLength)
            if (score) coordlist.push([row, col, false, score])
          }
        } else {
          // existing is horizontal -> try place vertically crossing it
          if (rowc - letIndex >= 0 && (rowc - letIndex) + wordLength <= this.size) {
            const row = rowc - letIndex
            const col = colc
            const score = this.checkScoreVert(word, row, col, wordLength)
            if (score) coordlist.push([row, col, true, score])
          }
        }
      }
    }

    if (coordlist.length === 0) return undefined
    coordlist.sort((a, b) => b[3] - a[3])
    return coordlist[0]
  }

  private addWords(word: [string, string]) {
    const coords = this.getCoords(word)
    if (!coords) return
    const [row, col, vertical] = coords
    const rec: [string, string, number, number, boolean] = [word[0], word[1], row, col, vertical]
    this.setWord(rec, row, col, vertical)
  }

  compute(timeBudgetSeconds = 1.0): { grid: string[][]; placed: Array<[string, string, number, number, boolean]> } {
    // Keep best found placement within the time budget (ms)
    this.bestGrid = this.grid.map((r) => r.slice())
    this.bestPlaced = []
    const start = Date.now()
    const budgetMs = Math.max(1, Math.floor(timeBudgetSeconds * 1000))

    while (Date.now() - start < budgetMs) {
      // reset temp state
      this.letCoords.clear()
      this.current = []
      this.grid = Array.from({ length: this.size }, () => Array.from({ length: this.size }, () => this.empty))

      // place first word if available
      if (this.available.length > 0) {
        this.firstWord(this.available[0])
      }

      // attempt to add words (two passes)
      for (let pass = 0; pass < 2; pass++) {
        for (const word of this.available) {
          // skip if already placed (match by answer text)
          const already = this.current.some((cw) => cw[0] === word[0])
          if (!already) this.addWords(word)
        }
      }

      if (this.current.length > this.bestPlaced.length) {
        this.bestPlaced = this.current.map((c) => c.slice() as [string, string, number, number, boolean])
        this.bestGrid = this.grid.map((r) => r.slice())
      }

      if (this.bestPlaced.length === this.available.length) break
    }

    return { grid: this.bestGrid, placed: this.bestPlaced }
  }
}

/* ----------------- Exported generateCrossword (new algorithm) ----------------- */

/**
 * Generate a crossword puzzle from a list of words using the improved algorithm.
 * Input/output structure remains the same as before.
 */
export function generateCrossword(words: WordEntry[], gridSize: number): CrosswordResult | null {
  if (!words || words.length === 0) return null

  // ensure uppercase answers and keep clues
  const inputs = words.map((w) => ({ id: w.id, answer: String(w.answer).toUpperCase(), clue: String(w.clue ?? '') }))

  // quick fail if longest word doesn't fit at all
  const longest = inputs.reduce((m, it) => Math.max(m, it.answer.length), 0)
  if (longest > gridSize) {
    // cannot place the longest word in the grid
    return null
  }

  const rng = new RNG()
  const builder = new CrosswordBuilder(gridSize, inputs, rng, '')

  // use a small time budget (1s default). You could expose as option later.
  const { grid, placed } = builder.compute(1.0)

  // Convert placed internal format [word, clue, row, col, vertical] -> PlacedWord[]
  const placedWords: PlacedWord[] = placed.map((p) => ({
    word: p[0],
    clue: p[1],
    row: p[2],
    col: p[3],
    direction: p[4] ? 'down' : 'across',
    number: 0, // will assign below
  }))

  // Sort by row,col for numbering (same-start position -> same number)
  placedWords.sort((a, b) => (a.row - b.row) || (a.col - b.col))

  const positionNumbers = new Map<string, number>()
  let currentNumber = 1
  for (const pw of placedWords) {
    const key = `${pw.row},${pw.col}`
    if (!positionNumbers.has(key)) {
      positionNumbers.set(key, currentNumber++)
    }
    pw.number = positionNumbers.get(key)!
  }

  // Ensure returned grid uses '' for empty cells (already does)
  return { grid, placedWords }
}
