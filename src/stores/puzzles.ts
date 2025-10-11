import { puzzleService } from '@/services/api/puzzle.service'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

type Puzzle = Tables<'puzzles'>
type PuzzleInsert = TablesInsert<'puzzles'>
type PuzzleUpdate = TablesUpdate<'puzzles'>

export const usePuzzleStore = defineStore('puzzle', () => {
  const puzzles = ref<Puzzle[]>([])
  const selectedPuzzle = ref<Puzzle | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all puzzles in a classroom
   */
  const fetchPuzzles = async (classroomId: string): Promise<Puzzle[]> => {
    loading.value = true
    error.value = null

    try {
      const data = await puzzleService.getPuzzlesByClassroom(classroomId)
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
   * Fetch a single puzzle by ID
   */
  const fetchPuzzleById = async (id: string): Promise<Puzzle | null> => {
    loading.value = true
    error.value = null

    try {
      const data = await puzzleService.getPuzzleById(id)
      selectedPuzzle.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch puzzle'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new puzzle
   */
  const createPuzzle = async (puzzleData: PuzzleInsert): Promise<Puzzle> => {
    loading.value = true
    error.value = null

    try {
      const newPuzzle = await puzzleService.createPuzzle(puzzleData)
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
   * Update a puzzle
   */
  const updatePuzzle = async (id: string, updates: PuzzleUpdate): Promise<Puzzle> => {
    loading.value = true
    error.value = null

    try {
      const updatedPuzzle = await puzzleService.updatePuzzle(id, updates)
      const index = puzzles.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        puzzles.value[index] = updatedPuzzle
      }
      if (selectedPuzzle.value?.id === id) {
        selectedPuzzle.value = updatedPuzzle
      }
      return updatedPuzzle
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update puzzle'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a puzzle
   */
  const deletePuzzle = async (id: string): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      await puzzleService.deletePuzzle(id)
      puzzles.value = puzzles.value.filter((p) => p.id !== id)
      if (selectedPuzzle.value?.id === id) {
        selectedPuzzle.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete puzzle'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Clear error
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Clear selected puzzle
   */
  const clearSelected = () => {
    selectedPuzzle.value = null
  }

  /**
   * Reset store state
   */
  const resetState = () => {
    puzzles.value = []
    selectedPuzzle.value = null
    error.value = null
  }

  return {
    // State
    puzzles,
    selectedPuzzle,
    loading,
    error,

    // Actions
    fetchPuzzles,
    fetchPuzzleById,
    createPuzzle,
    updatePuzzle,
    deletePuzzle,
    clearError,
    clearSelected,
    resetState,
  }
})
