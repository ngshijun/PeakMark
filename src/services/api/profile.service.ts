import type { Tables } from '@/types/database.types'
import { calculateStudentStats } from '@/utils/stats'
import type { StudentStats } from '@/utils/stats'
import { BaseService } from './base.service'

type UserRow = Tables<'users'>
type QuestionAttempt = Tables<'question_attempts'>

export type { StudentStats }

/**
 * User profile service
 * Handles user profile and statistics operations
 */
export class ProfileService extends BaseService {
  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserRow> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserRow>): Promise<UserRow> {
    const { data, error } = await this.client
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Get question attempts for a user
   */
  async getQuestionAttempts(userId: string): Promise<QuestionAttempt[]> {
    const { data, error } = await this.client
      .from('question_attempts')
      .select('*')
      .eq('attempted_by', userId)
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError(error)
    }

    return data || []
  }

  /**
   * Calculate student statistics from question attempts
   * This method processes the raw data and returns calculated stats
   */
  async getStudentStatistics(userId: string): Promise<StudentStats> {
    const attempts = await this.getQuestionAttempts(userId)
    return calculateStudentStats(attempts)
  }
}

// Export a singleton instance
export const profileService = new ProfileService()
