import { BaseService } from './base.service'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

type PuzzleAttempt = Tables<'puzzle_attempts'>
type PuzzleAttemptInsert = TablesInsert<'puzzle_attempts'>
type PuzzleAttemptUpdate = TablesUpdate<'puzzle_attempts'>

export class PuzzleAttemptService extends BaseService {
  /**
   * Get all attempts for a specific puzzle by a student
   */
  async getAttemptsByPuzzle(puzzleId: string, studentId: string): Promise<PuzzleAttempt[]> {
    const { data, error } = await this.client
      .from('puzzle_attempts')
      .select('*')
      .eq('puzzle_id', puzzleId)
      .eq('attempted_by', studentId)
      .order('created_at', { ascending: false })

    if (error) this.handleError(error)
    return data || []
  }

  /**
   * Get the latest attempt for a puzzle
   */
  async getLatestAttempt(puzzleId: string, studentId: string): Promise<PuzzleAttempt | null> {
    const { data, error } = await this.client
      .from('puzzle_attempts')
      .select('*')
      .eq('puzzle_id', puzzleId)
      .eq('attempted_by', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Create a new puzzle attempt
   */
  async createAttempt(input: PuzzleAttemptInsert): Promise<PuzzleAttempt> {
    const { data, error } = await this.client
      .from('puzzle_attempts')
      .insert(input)
      .select()
      .single()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Update an existing attempt
   */
  async updateAttempt(id: string, updates: PuzzleAttemptUpdate): Promise<PuzzleAttempt> {
    const { data, error } = await this.client
      .from('puzzle_attempts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Get all attempts by a student across all puzzles in a classroom
   */
  async getStudentAttempts(studentId: string, classroomId: string): Promise<PuzzleAttempt[]> {
    const { data, error } = await this.client
      .from('puzzle_attempts')
      .select(
        `
        *,
        puzzles!inner(classroom_id)
      `,
      )
      .eq('attempted_by', studentId)
      .eq('puzzles.classroom_id', classroomId)
      .order('created_at', { ascending: false })

    if (error) this.handleError(error)
    return data || []
  }

  /**
   * Check if a student has completed a puzzle
   */
  async hasCompleted(puzzleId: string, studentId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('puzzle_attempts')
      .select('id')
      .eq('puzzle_id', puzzleId)
      .eq('attempted_by', studentId)
      .eq('is_completed', true)
      .maybeSingle()

    if (error) return false
    return !!data
  }
}

export const puzzleAttemptService = new PuzzleAttemptService()
