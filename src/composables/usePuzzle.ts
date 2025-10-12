import { useRouter } from 'vue-router'

/**
 * Composable for puzzle-related operations and navigation
 */
export function usePuzzle() {
  const router = useRouter()

  /**
   * Navigate to puzzle solving page
   */
  const goToPuzzleSolve = (classroomId: string, puzzleId: string) => {
    router.push({
      name: 'puzzle-solve',
      params: {
        classroomId,
        puzzleId,
      },
    })
  }

  /**
   * Navigate back to puzzles list
   */
  const goToPuzzlesList = (classroomId: string) => {
    router.push({
      name: 'puzzles',
      params: {
        classroomId,
      },
    })
  }

  return {
    // Navigation methods
    goToPuzzleSolve,
    goToPuzzlesList,
  }
}
