/**
 * Crossword Generator Utility (TypeScript, strict)
 *
 * - Improved placement algorithm (ported from Python)
 * - generateCrossword(words, gridSize, seed?)
 * - Centers the resulting puzzle in the grid
 *
 * This file is written to be strict-type friendly.
 */

export interface WordEntry {
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
  unusedWords: WordEntry[]
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

/**
 * Small RNG wrapper (Park–Miller LCG) to allow reproducible runs
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
 * Internal builder class. Words are stored internally as tuple:
 * [answer, clue, row?, col?, vertical?]
 */
class CrosswordBuilder {
  readonly size: number
  readonly empty: string
  readonly available: Array<[string, string]>
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

  private cellOccupied(row: number, col: number): boolean {
    if (row < 0 || row >= this.size) return false
    const rowArr = this.grid[row]
    if (!rowArr) return false
    if (col < 0 || col >= rowArr.length) return false
    return rowArr[col] !== this.empty
  }

  private setWord(
    wordRec: [string, string, number, number, boolean],
    row: number,
    col: number,
    vertical: boolean,
  ): void {
    wordRec[2] = row
    wordRec[3] = col
    wordRec[4] = vertical
    this.current.push(wordRec)

    let r = row
    let c = col
    for (const ch of wordRec[0]) {
      // guard indexes
      if (r < 0 || r >= this.size || c < 0 || c >= this.size) {
        // Shouldn't happen if checks are correct; just skip if out of bounds
        if (vertical) r += 1
        else c += 1
        continue
      }
      const rowArr = this.grid[r]
      if (rowArr) {
        rowArr[c] = ch
      }
      const existing = this.letCoords.get(ch) ?? []
      if (!existing.some((e) => e[0] === r && e[1] === c && e[2] === vertical)) {
        existing.push([r, c, vertical])
      }
      this.letCoords.set(ch, existing)
      if (vertical) r += 1
      else c += 1
    }
  }

  private firstWord(word: [string, string]): void {
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

  private checkScoreHoriz(
    word: [string, string],
    row: number,
    col: number,
    wordLength: number,
  ): number {
    const cellOccupied = this.cellOccupied.bind(this)
    if (
      (col !== 0 && cellOccupied(row, col - 1)) ||
      (col + wordLength !== this.size && cellOccupied(row, col + wordLength))
    ) {
      return 0
    }
    let score = 1
    for (let i = 0; i < wordLength; i++) {
      // guard bounds
      if (row < 0 || row >= this.size) return 0
      const rowArr = this.grid[row]
      if (!rowArr) return 0
      if (col < 0 || col >= rowArr.length) return 0

      const activeCell = rowArr[col] ?? this.empty
      if (activeCell === this.empty) {
        if (
          (row + 1 !== this.size && cellOccupied(row + 1, col)) ||
          (row !== 0 && cellOccupied(row - 1, col))
        ) {
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

  private checkScoreVert(
    word: [string, string],
    row: number,
    col: number,
    wordLength: number,
  ): number {
    const cellOccupied = this.cellOccupied.bind(this)
    if (
      (row !== 0 && cellOccupied(row - 1, col)) ||
      (row + wordLength !== this.size && cellOccupied(row + wordLength, col))
    ) {
      return 0
    }
    let score = 1
    for (let i = 0; i < wordLength; i++) {
      if (row < 0 || row >= this.size) return 0
      const rowArr = this.grid[row]
      if (!rowArr) return 0
      if (col < 0 || col >= rowArr.length) return 0

      const activeCell = rowArr[col] ?? this.empty
      if (activeCell === this.empty) {
        if (
          (col + 1 !== this.size && cellOccupied(row, col + 1)) ||
          (col !== 0 && cellOccupied(row, col - 1))
        ) {
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
      const ch = String(word[0][letIndex])
      const coords = this.letCoords.get(ch) ?? []
      for (const item of coords) {
        const [rowc, colc, vertc] = item
        if (vertc) {
          // existing is vertical -> try place horizontally crossing it
          if (colc - letIndex >= 0 && colc - letIndex + wordLength <= this.size) {
            const row = rowc
            const col = colc - letIndex
            const score = this.checkScoreHoriz(word, row, col, wordLength)
            if (score) coordlist.push([row, col, false, score])
          }
        } else {
          // existing is horizontal -> try place vertically crossing it
          if (rowc - letIndex >= 0 && rowc - letIndex + wordLength <= this.size) {
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

  private addWords(word: [string, string]): void {
    const coords = this.getCoords(word)
    if (!coords) return
    const [row, col, vertical] = coords
    const rec: [string, string, number, number, boolean] = [word[0], word[1], row, col, vertical]
    this.setWord(rec, row, col, vertical)
  }

  /**
   * Compute best placement within time budget (seconds).
   */
  compute(timeBudgetSeconds = 1.0): {
    grid: string[][]
    placed: Array<[string, string, number, number, boolean]>
  } {
    this.bestGrid = this.grid.map((r) => r.slice())
    this.bestPlaced = []
    const start = Date.now()
    const budgetMs = Math.max(1, Math.floor(timeBudgetSeconds * 1000))

    while (Date.now() - start < budgetMs) {
      // reset temporary state
      this.letCoords.clear()
      this.current = []
      this.grid = Array.from({ length: this.size }, () =>
        Array.from({ length: this.size }, () => this.empty),
      )

      // place first word if available
      if (this.available.length > 0) {
        // TS can't infer available[0] is defined otherwise, assert it
        this.firstWord(this.available[0] as [string, string])
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
        // copy current as best
        this.bestPlaced = this.current.map(
          (c) => c.slice() as [string, string, number, number, boolean],
        )
        this.bestGrid = this.grid.map((r) => r.slice())
      }

      if (this.bestPlaced.length === this.available.length) break
    }

    return { grid: this.bestGrid, placed: this.bestPlaced }
  }
}

/* ----------------- Exported generateCrossword ----------------- */

/**
 * Generate a crossword puzzle from a list of words using the improved algorithm.
 * Input/output structure remains the same as before.
 *
 * Added:
 *  - seed?: number  -- for reproducible placement
 *  - centers the placed puzzle in the returned grid
 */
export function generateCrossword(
  words: WordEntry[],
  gridSize: number,
  seed?: number,
): CrosswordResult | null {
  if (!words || words.length === 0) return null

  // ensure uppercase answers and keep clues
  const inputs: WordEntry[] = words.map((w) => ({
    answer: String(w.answer).toUpperCase(),
    clue: String(w.clue ?? ''),
  }))

  // quick fail if longest word doesn't fit at all
  const longest = inputs.reduce((m, it) => Math.max(m, it.answer.length), 0)
  if (longest > gridSize) {
    // cannot place the longest word in the grid
    return null
  }

  const rng = new RNG(seed)
  const builder = new CrosswordBuilder(gridSize, inputs, rng, '')

  // use a small time budget (1s default).
  const { grid: rawGrid, placed: rawPlaced } = builder.compute(0.5)

  // Prepare empty grid to return if nothing placed
  const emptyGrid = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => ''),
  )

  if (!rawPlaced || rawPlaced.length === 0) {
    return { grid: emptyGrid, placedWords: [], unusedWords: [] }
  }

  // Compute bounding box of used cells in rawGrid
  let minR = gridSize
  let maxR = -1
  let minC = gridSize
  let maxC = -1
  for (let r = 0; r < gridSize; r++) {
    const rowArr = rawGrid[r]
    if (!rowArr) continue
    for (let c = 0; c < gridSize; c++) {
      const cell = rowArr[c] ?? ''
      if (cell !== '') {
        if (r < minR) minR = r
        if (r > maxR) maxR = r
        if (c < minC) minC = c
        if (c > maxC) maxC = c
      }
    }
  }

  if (maxR < minR || maxC < minC) {
    // nothing placed
    return { grid: emptyGrid, placedWords: [], unusedWords: [] }
  }

  const usedHeight = maxR - minR + 1
  const usedWidth = maxC - minC + 1

  // compute shifts to center bounding box within the full grid
  const targetTop = Math.floor((gridSize - usedHeight) / 2)
  const targetLeft = Math.floor((gridSize - usedWidth) / 2)

  const rowShift = targetTop - minR
  const colShift = targetLeft - minC

  // Create centered grid and place letters from rawGrid shifted by (rowShift, colShift)
  const centeredGrid: string[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => ''),
  )
  for (let r = minR; r <= maxR; r++) {
    const rowArr = rawGrid[r]
    if (!rowArr) continue
    for (let c = minC; c <= maxC; c++) {
      const ch = rowArr[c] ?? ''
      if (ch !== '') {
        const nr = r + rowShift
        const nc = c + colShift
        if (nr >= 0 && nr < gridSize) {
          const destRow = centeredGrid[nr]
          if (destRow && nc >= 0 && nc < destRow.length) {
            destRow[nc] = ch
          }
        }
      }
    }
  }

  const unusedWords = inputs.filter((w) => !rawPlaced.some((p) => p[0] === w.answer))

  // Convert placed internal format [word, clue, row, col, vertical] -> PlacedWord[]
  const placedWords: PlacedWord[] = rawPlaced.map((p) => ({
    word: p[0],
    clue: p[1],
    row: p[2] + rowShift,
    col: p[3] + colShift,
    direction: p[4] ? 'down' : 'across',
    number: 0, // assigned below
  }))

  // Sort by row,col for numbering (same-start position -> same number)
  placedWords.sort((a, b) => a.row - b.row || a.col - b.col)

  const positionNumbers = new Map<string, number>()
  let currentNumber = 1
  for (const pw of placedWords) {
    const key = `${pw.row},${pw.col}`
    if (!positionNumbers.has(key)) {
      positionNumbers.set(key, currentNumber++)
    }
    // non-null assertion safe because we just set or previously set
    pw.number = positionNumbers.get(key) as number
  }

  return { grid: centeredGrid, placedWords, unusedWords }
}
