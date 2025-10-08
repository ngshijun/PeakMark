import type { Tables } from '@/types/database.types'
import { BaseService } from './base.service'

type UserRow = Tables<'users'>
type QuestionAttempt = Tables<'question_attempts'>

export interface StudentStats {
  questionsAnswered: number
  accuracyRate: number
  studyStreak: number
  setsCompleted: number
}

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

    if (!attempts || attempts.length === 0) {
      return {
        questionsAnswered: 0,
        accuracyRate: 0,
        studyStreak: 0,
        setsCompleted: 0,
      }
    }

    // Calculate questions answered
    const questionsAnswered = attempts.length

    // Calculate accuracy rate
    const correctAnswers = attempts.filter((a) => a.is_correct).length
    const accuracyRate = Math.round((correctAnswers / questionsAnswered) * 100)

    // Calculate study streak (consecutive days with activity)
    const uniqueDates: string[] = [
      ...new Set(attempts.map((a) => new Date(a.created_at).toDateString())),
    ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    let studyStreak = 0
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    if (uniqueDates.length > 0) {
      // Only count streak if activity is today or yesterday
      if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
        studyStreak = 1
        for (let i = 1; i < uniqueDates.length; i++) {
          const currentDateStr = uniqueDates[i - 1]
          const prevDateStr = uniqueDates[i]
          if (!currentDateStr || !prevDateStr) continue

          const currentDate = new Date(currentDateStr)
          const prevDate = new Date(prevDateStr)
          const diffTime = currentDate.getTime() - prevDate.getTime()
          const diffDays = Math.round(diffTime / 86400000)

          if (diffDays === 1) {
            studyStreak++
          } else {
            break
          }
        }
      }
    }

    return {
      questionsAnswered,
      accuracyRate,
      studyStreak,
      setsCompleted: 0, // TODO: Implement when practice sets are added
    }
  }
}

// Export a singleton instance
export const profileService = new ProfileService()
