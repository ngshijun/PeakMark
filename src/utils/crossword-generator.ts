/**
 * Crossword Generator Utility
 * Pure functions for crossword puzzle generation
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
 * Generate a crossword puzzle from a list of words
 */
export function generateCrossword(words: WordEntry[], gridSize: number): CrosswordResult | null {
  if (words.length === 0) return null

  const size = gridSize
  const grid: string[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(''))
  const placed: PlacedWord[] = []
  const wordList = [...words].sort((a, b) => b.answer.length - a.answer.length)

  const firstWord = wordList[0]
  if (!firstWord) return null

  // Place first word horizontally in the middle
  const startRow = Math.floor(size / 2)
  const startCol = Math.floor((size - firstWord.answer.length) / 2)

  for (let i = 0; i < firstWord.answer.length; i++) {
    const char = firstWord.answer[i]
    const gridRow = grid[startRow]
    if (char && gridRow) {
      gridRow[startCol + i] = char
    }
  }
  placed.push({
    word: firstWord.answer,
    clue: firstWord.clue,
    row: startRow,
    col: startCol,
    direction: 'across',
    number: 1,
  })

  // Try to place remaining words
  for (let i = 1; i < wordList.length; i++) {
    const word = wordList[i]
    if (!word) continue
    let wordPlaced = false

    // Try to find intersections with already placed words
    for (const placedWord of placed) {
      if (wordPlaced) break

      for (let j = 0; j < word.answer.length; j++) {
        if (wordPlaced) break

        for (let k = 0; k < placedWord.word.length; k++) {
          if (word.answer[j] === placedWord.word[k]) {
            // Found a matching letter, try to place perpendicular
            let newRow: number, newCol: number
            const newDirection = placedWord.direction === 'across' ? 'down' : 'across'

            if (placedWord.direction === 'across') {
              newRow = placedWord.row - j
              newCol = placedWord.col + k
            } else {
              newRow = placedWord.row + k
              newCol = placedWord.col - j
            }

            // Check if placement is valid
            if (canPlaceWord(grid, word.answer, newRow, newCol, newDirection, size)) {
              placeWord(grid, word.answer, newRow, newCol, newDirection)
              placed.push({
                word: word.answer,
                clue: word.clue,
                row: newRow,
                col: newCol,
                direction: newDirection,
                number: placed.length + 1,
              })
              wordPlaced = true
              break
            }
          }
        }
      }
    }
  }

  // Sort placed words by position for numbering
  placed.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row
    return a.col - b.col
  })

  // Renumber
  placed.forEach((word, idx) => {
    word.number = idx + 1
  })

  return { grid, placedWords: placed }
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
