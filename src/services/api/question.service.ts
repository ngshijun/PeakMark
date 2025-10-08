import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { BaseService } from './base.service'

type Question = Tables<'questions'>
type QuestionInsert = TablesInsert<'questions'>
type QuestionUpdate = TablesUpdate<'questions'>
type QuestionAttempt = Tables<'question_attempts'>
type QuestionAttemptInsert = TablesInsert<'question_attempts'>

/**
 * Question service
 * Handles question CRUD operations and question attempts
 */
export class QuestionService extends BaseService {
  /**
   * Get all questions for a classroom
   */
  async getQuestions(classroomId: string): Promise<Question[]> {
    const { data, error } = await this.client
      .from('questions')
      .select('*')
      .eq('classroom_id', classroomId)
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError(error)
    }

    return data || []
  }

  /**
   * Get a single question by ID
   */
  async getQuestionById(id: string): Promise<Question | null> {
    const { data, error } = await this.client
      .from('questions')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Create a new question
   */
  async createQuestion(question: QuestionInsert): Promise<Question> {
    const { data, error } = await this.client
      .from('questions')
      .insert(question)
      .select()
      .single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Update a question
   */
  async updateQuestion(id: string, updates: QuestionUpdate): Promise<Question> {
    const { data, error } = await this.client
      .from('questions')
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
   * Delete a question
   */
  async deleteQuestion(id: string): Promise<void> {
    const { error } = await this.client.from('questions').delete().eq('id', id)

    if (error) {
      this.handleError(error)
    }
  }

  /**
   * Get questions by difficulty level
   */
  async getQuestionsByDifficulty(classroomId: string, difficulty: number): Promise<Question[]> {
    const { data, error } = await this.client
      .from('questions')
      .select('*')
      .eq('classroom_id', classroomId)
      .eq('difficulty', difficulty)
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError(error)
    }

    return data || []
  }

  /**
   * Record a question attempt
   */
  async recordAttempt(attempt: QuestionAttemptInsert): Promise<QuestionAttempt> {
    const { data, error } = await this.client
      .from('question_attempts')
      .insert(attempt)
      .select()
      .single()

    if (error) {
      this.handleError(error)
    }

    return data
  }
}

// Export a singleton instance
export const questionService = new QuestionService()
