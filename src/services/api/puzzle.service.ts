import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { BaseService } from './base.service'

type Puzzle = Tables<'puzzles'>
type PuzzleInsert = TablesInsert<'puzzles'>
type PuzzleUpdate = TablesUpdate<'puzzles'>

/**
 * Puzzle service
 * Handles puzzle CRUD and retrieval operations with folder structure support
 */
export class PuzzleService extends BaseService {
  /**
   * Get all puzzles
   */
  async getPuzzles(): Promise<Puzzle[]> {
    const { data, error } = await this.client
      .from('puzzles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError(error)
    }

    return data || []
  }

  /**
   * Get a single puzzle by ID
   */
  async getPuzzleById(id: string): Promise<Puzzle | null> {
    const { data, error } = await this.client.from('puzzles').select('*').eq('id', id).maybeSingle()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Get all puzzles in a classroom
   */
  async getPuzzlesByClassroom(classroomId: string): Promise<Puzzle[]> {
    const { data, error } = await this.client
      .from('puzzles')
      .select('*')
      .eq('classroom_id', classroomId)
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError(error)
    }

    return data || []
  }

  /**
   * Get puzzles for a student (from enrolled classrooms)
   */
  async getStudentPuzzles(studentId: string): Promise<Puzzle[]> {
    // First get enrolled classroom IDs
    const { data: memberships, error: memberError } = await this.client
      .from('classroom_members')
      .select('classroom_id')
      .eq('student_id', studentId)

    if (memberError) {
      this.handleError(memberError)
    }

    const classroomIds = memberships?.map((m) => m.classroom_id) || []

    if (classroomIds.length === 0) {
      return []
    }

    // Fetch videos from those classrooms
    const { data, error } = await this.client
      .from('puzzles')
      .select('*')
      .in('classroom_id', classroomIds)
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError(error)
    }

    return data || []
  }

  /**
   * Create a new puzzle
   */
  async createPuzzle(puzzle: PuzzleInsert): Promise<Puzzle> {
    const { data, error } = await this.client.from('puzzles').insert(puzzle).select().single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Update a puzzle
   */
  async updatePuzzle(id: string, updates: PuzzleUpdate): Promise<Puzzle> {
    const { data, error } = await this.client
      .from('puzzles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Delete a puzzle
   */
  async deletePuzzle(id: string): Promise<void> {
    const { error } = await this.client.from('puzzles').delete().eq('id', id)

    if (error) {
      this.handleError(error)
    }
  }
}

// Export a singleton instance
export const puzzleService = new PuzzleService()
