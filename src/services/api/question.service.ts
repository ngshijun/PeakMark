import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { BaseService } from './base.service'
import { storageService } from './storage.service'

type Question = Tables<'questions'>
type QuestionInsert = TablesInsert<'questions'>
type QuestionUpdate = TablesUpdate<'questions'>
type QuestionAttempt = Tables<'question_attempts'>
type QuestionAttemptInsert = TablesInsert<'question_attempts'>
type StudentElo = Tables<'student_elo'>

export interface EloUpdateResult {
  student_elo_before: number
  student_elo_after: number
  student_elo_change: number
  question_elo_before: number
  question_elo_after: number
  question_elo_change: number
  expected_score: number
  actual_score: number
}

export interface NextQuestionResult {
  question_id: string
  question_text: string
  options: string[]
  correct_answer: number
  image: string | null
  explanation: string | null
  question_elo: number
  student_elo: number
  expected_success_rate: number
}

/**
 * Question service
 * Handles question CRUD operations, question attempts, and ELO-based adaptive learning
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
    const { data, error } = await this.client.from('questions').insert(question).select().single()

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
    // First, get the question to check if it has an image
    const question = await this.getQuestionById(id)

    // Delete from database
    const { error } = await this.client.from('questions').delete().eq('id', id)

    if (error) {
      this.handleError(error)
    }

    // Delete associated image from storage if it exists
    if (question && question.image) {
      try {
        await storageService.deleteQuestionImage(question.image)
      } catch (error) {
        // Log error but don't fail the deletion
        console.error('Failed to delete question image from storage:', error)
      }
    }
  }

  /**
   * Upload question image to storage
   * @param file - The image file to upload
   * @param classroomId - The classroom ID
   * @param questionId - The question ID
   * @returns The public URL of the uploaded image
   */
  async uploadQuestionImage(file: File, classroomId: string, questionId: string): Promise<string> {
    return await storageService.uploadQuestionImage(file, classroomId, questionId)
  }

  /**
   * Delete question image from storage
   * @param imageUrl - The public URL of the image to delete
   */
  async deleteQuestionImage(imageUrl: string): Promise<void> {
    return await storageService.deleteQuestionImage(imageUrl)
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

  /**
   * Get questions by category
   */
  async getByCategory(categoryId: string): Promise<Question[]> {
    const { data, error } = await this.client
      .from('questions')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })

    if (error) this.handleError(error)
    return data || []
  }

  /**
   * Get next adaptive question for student (calls database function)
   */
  async getNextQuestion(
    studentId: string,
    categoryId: string,
    classroomId: string,
    recentQuestionIds: string[] = [],
    eloRange: number = 150,
  ): Promise<NextQuestionResult | null> {
    const { data, error } = await this.client.rpc('get_next_question', {
      p_student_id: studentId,
      p_category_id: categoryId,
      p_classroom_id: classroomId,
      p_recent_question_ids: recentQuestionIds,
      p_elo_range: eloRange,
    })
    if (error) this.handleError(error)

    // The function returns an array, get first result
    if (!data || data.length === 0) return null
    return data[0] as NextQuestionResult
  }

  /**
   * Submit answer and update ELOs atomically (calls database function)
   */
  async submitAnswer(
    questionId: string,
    studentId: string,
    categoryId: string,
    classroomId: string,
    isCorrect: boolean,
    selectedAnswer?: number,
  ): Promise<EloUpdateResult> {
    const { data, error } = await this.client.rpc('update_elos_atomic', {
      p_question_id: questionId,
      p_student_id: studentId,
      p_category_id: categoryId,
      p_classroom_id: classroomId,
      p_is_correct: isCorrect,
      p_selected_answer: selectedAnswer,
    })

    if (error) this.handleError(error)

    if (!data) {
      throw new Error('No data returned from ELO update')
    }

    return data as unknown as EloUpdateResult
  }

  /**
   * Get student's ELO for a category
   */
  async getStudentElo(
    studentId: string,
    categoryId: string,
    classroomId: string,
  ): Promise<StudentElo | null> {
    const { data, error } = await this.client
      .from('student_elo')
      .select('*')
      .eq('user_id', studentId)
      .eq('category_id', categoryId)
      .eq('classroom_id', classroomId)
      .maybeSingle()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Get all student ELOs for a classroom
   */
  async getStudentElosByClassroom(studentId: string, classroomId: string): Promise<StudentElo[]> {
    const { data, error } = await this.client
      .from('student_elo')
      .select('*')
      .eq('user_id', studentId)
      .eq('classroom_id', classroomId)

    if (error) this.handleError(error)
    return data || []
  }

  /**
   * Ensure a student_elo entry exists for the given student, category, and classroom
   * If the entry doesn't exist, create it with default ELO of 1500
   * @returns The existing or newly created StudentElo entry
   */
  async ensureStudentElo(
    studentId: string,
    categoryId: string,
    classroomId: string,
  ): Promise<StudentElo> {
    // First, check if entry exists
    const existing = await this.getStudentElo(studentId, categoryId, classroomId)

    if (existing) {
      return existing
    }

    // If not, create a new entry with default ELO
    const { data, error } = await this.client
      .from('student_elo')
      .insert({
        user_id: studentId,
        category_id: categoryId,
        classroom_id: classroomId,
        elo_rating: 1500,
        total_attempts: 0,
        total_correct: 0,
      })
      .select()
      .single()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Get student's attempt history for a category
   */
  async getStudentAttempts(
    studentId: string,
    categoryId: string,
    limit: number = 50,
  ): Promise<QuestionAttempt[]> {
    const { data, error } = await this.client
      .from('question_attempts')
      .select('*')
      .eq('attempted_by', studentId)
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) this.handleError(error)
    return data || []
  }

  /**
   * Get question statistics
   */
  async getQuestionStats(questionId: string): Promise<{
    total_attempts: number
    total_correct: number
    correct_rate: number
    current_elo: number
  }> {
    const question = await this.getQuestionById(questionId)
    if (!question) {
      throw new Error('Question not found')
    }

    return {
      total_attempts: question.total_attempts,
      total_correct: question.total_corrects,
      correct_rate:
        question.total_attempts > 0 ? question.total_corrects / question.total_attempts : 0,
      current_elo: question.elo,
    }
  }

  /**
   * Get category statistics for student
   */
  async getCategoryStatsForStudent(
    studentId: string,
    categoryId: string,
  ): Promise<{
    total_attempts: number
    total_correct: number
    accuracy: number
    current_elo: number
    elo_change: number
  }> {
    // Get student ELO
    const { data: studentElo } = await this.client
      .from('student_elo')
      .select('*')
      .eq('user_id', studentId)
      .eq('category_id', categoryId)
      .maybeSingle()

    // Get recent attempts to calculate ELO change
    const { data: recentAttempts } = await this.client
      .from('question_attempts')
      .select('student_elo_before, student_elo_after')
      .eq('attempted_by', studentId)
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })
      .limit(10)

    const totalAttempts = studentElo?.total_attempts || 0
    const totalCorrect = studentElo?.total_correct || 0
    const currentElo = studentElo?.elo_rating || 1500

    // Calculate ELO change from last 10 attempts
    let eloChange = 0
    if (recentAttempts && recentAttempts.length > 0) {
      const firstElo = recentAttempts[recentAttempts.length - 1]?.student_elo_before || currentElo
      eloChange = currentElo - firstElo
    }

    return {
      total_attempts: totalAttempts,
      total_correct: totalCorrect,
      accuracy: totalAttempts > 0 ? totalCorrect / totalAttempts : 0,
      current_elo: currentElo,
      elo_change: eloChange,
    }
  }
}

// Export a singleton instance
export const questionService = new QuestionService()
