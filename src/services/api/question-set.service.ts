import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { BaseService } from './base.service'
import { storageService } from './storage.service'

type QuestionSet = Tables<'question_sets'>
type QuestionSetInsert = TablesInsert<'question_sets'>
type QuestionSetUpdate = TablesUpdate<'question_sets'>

type QuestionSetQuestion = Tables<'question_set_questions'>
type QuestionSetQuestionInsert = TablesInsert<'question_set_questions'>
type QuestionSetQuestionUpdate = TablesUpdate<'question_set_questions'>

type QuestionSetAttempt = Tables<'question_set_attempts'>
type QuestionSetAttemptInsert = TablesInsert<'question_set_attempts'>
type QuestionSetAttemptUpdate = TablesUpdate<'question_set_attempts'>

type QuestionSetAnswer = Tables<'question_set_answers'>
type QuestionSetAnswerInsert = TablesInsert<'question_set_answers'>
type QuestionSetAnswerUpdate = TablesUpdate<'question_set_answers'>

export interface QuestionSetWithQuestions extends QuestionSet {
  questions: QuestionSetQuestion[]
}

export interface AttemptWithAnswers extends QuestionSetAttempt {
  answers: QuestionSetAnswer[]
  question_set?: QuestionSet
}

/**
 * Question Set service
 * Handles problem set CRUD operations, questions, and student attempts
 */
export class QuestionSetService extends BaseService {
  // ============================================
  // QUESTION SET OPERATIONS
  // ============================================

  /**
   * Get all question sets for a classroom
   */
  async getQuestionSets(classroomId: string): Promise<QuestionSet[]> {
    const { data, error } = await this.client
      .from('question_sets')
      .select('*')
      .eq('classroom_id', classroomId)
      .order('created_at', { ascending: false })

    if (error) this.handleError(error)
    return data || []
  }

  /**
   * Get published question sets for students
   */
  async getPublishedQuestionSets(classroomId: string): Promise<QuestionSet[]> {
    const { data, error } = await this.client
      .from('question_sets')
      .select('*')
      .eq('classroom_id', classroomId)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) this.handleError(error)
    return data || []
  }

  /**
   * Get a single question set by ID
   */
  async getQuestionSetById(id: string): Promise<QuestionSet | null> {
    const { data, error } = await this.client
      .from('question_sets')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Get question set with all questions
   */
  async getQuestionSetWithQuestions(id: string): Promise<QuestionSetWithQuestions | null> {
    const { data, error } = await this.client
      .from('question_sets')
      .select(
        `
        *,
        questions:question_set_questions(*)
      `,
      )
      .eq('id', id)
      .single()

    if (error) this.handleError(error)

    // Sort questions by order
    if (data?.questions) {
      data.questions = data.questions.sort((a, b) => a.order - b.order)
    }

    return data
  }

  /**
   * Create a new question set
   */
  async createQuestionSet(questionSet: QuestionSetInsert): Promise<QuestionSet> {
    const { data, error } = await this.client
      .from('question_sets')
      .insert(questionSet)
      .select()
      .single()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Update a question set
   */
  async updateQuestionSet(id: string, updates: QuestionSetUpdate): Promise<QuestionSet> {
    const { data, error } = await this.client
      .from('question_sets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Publish/Unpublish a question set
   */
  async togglePublishStatus(id: string, isPublished: boolean): Promise<QuestionSet> {
    return this.updateQuestionSet(id, { is_published: isPublished })
  }

  /**
   * Delete a question set (cascades to questions and attempts)
   */
  async deleteQuestionSet(id: string): Promise<void> {
    // Get all questions first to delete their images
    const questions = await this.getQuestionsBySet(id)

    // Delete the question set (cascade will handle questions and attempts)
    const { error } = await this.client.from('question_sets').delete().eq('id', id)

    if (error) this.handleError(error)

    // Clean up images from storage
    for (const question of questions) {
      if (question.image) {
        try {
          await storageService.deleteQuestionImage(question.image)
        } catch (error) {
          console.error('Failed to delete question image:', error)
        }
      }
    }
  }

  // ============================================
  // QUESTION OPERATIONS
  // ============================================

  /**
   * Get all questions for a question set
   */
  async getQuestionsBySet(questionSetId: string): Promise<QuestionSetQuestion[]> {
    const { data, error } = await this.client
      .from('question_set_questions')
      .select('*')
      .eq('question_set_id', questionSetId)
      .order('order', { ascending: true })

    if (error) this.handleError(error)
    return data || []
  }

  /**
   * Get a single question by ID
   */
  async getQuestionById(id: string): Promise<QuestionSetQuestion | null> {
    const { data, error } = await this.client
      .from('question_set_questions')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Create a new question in a question set
   */
  async createQuestion(question: QuestionSetQuestionInsert): Promise<QuestionSetQuestion> {
    const { data, error } = await this.client
      .from('question_set_questions')
      .insert(question)
      .select()
      .single()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Update a question
   */
  async updateQuestion(
    id: string,
    updates: QuestionSetQuestionUpdate,
  ): Promise<QuestionSetQuestion> {
    const { data, error } = await this.client
      .from('question_set_questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Delete a question
   */
  async deleteQuestion(id: string): Promise<void> {
    // Get the question to check for image
    const question = await this.getQuestionById(id)

    const { error } = await this.client.from('question_set_questions').delete().eq('id', id)

    if (error) this.handleError(error)

    // Delete image from storage if exists
    if (question?.image) {
      try {
        await storageService.deleteQuestionImage(question.image)
      } catch (error) {
        console.error('Failed to delete question image:', error)
      }
    }
  }

  /**
   * Reorder questions in a question set
   */
  async reorderQuestions(
    _questionSetId: string,
    questionOrders: Array<{ id: string; order: number }>,
  ): Promise<void> {
    // Update all question orders in a single transaction
    const updates = questionOrders.map((q) =>
      this.client.from('question_set_questions').update({ order: q.order }).eq('id', q.id),
    )

    await Promise.all(updates)
  }

  /**
   * Upload question image to storage
   */
  async uploadQuestionImage(file: File, classroomId: string, questionId: string): Promise<string> {
    return await storageService.uploadQuestionImage(file, classroomId, questionId)
  }

  /**
   * Delete question image from storage
   */
  async deleteQuestionImage(imageUrl: string): Promise<void> {
    return await storageService.deleteQuestionImage(imageUrl)
  }

  // ============================================
  // ATTEMPT OPERATIONS (Student)
  // ============================================

  /**
   * Start a new attempt on a question set
   */
  async startAttempt(questionSetId: string, studentId: string): Promise<QuestionSetAttempt> {
    // Get question count
    const questions = await this.getQuestionsBySet(questionSetId)

    const attempt: QuestionSetAttemptInsert = {
      question_set_id: questionSetId,
      student_id: studentId,
      total_questions: questions.length,
      score: 0,
      is_completed: false,
    }

    const { data, error } = await this.client
      .from('question_set_attempts')
      .insert(attempt)
      .select()
      .single()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Get attempt by ID
   */
  async getAttemptById(attemptId: string): Promise<QuestionSetAttempt | null> {
    const { data, error } = await this.client
      .from('question_set_attempts')
      .select('*')
      .eq('id', attemptId)
      .maybeSingle()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Get attempt with answers and question set details
   */
  async getAttemptWithDetails(attemptId: string): Promise<AttemptWithAnswers | null> {
    const { data, error } = await this.client
      .from('question_set_attempts')
      .select(
        `
        *,
        answers:question_set_answers(*),
        question_set:question_sets(*)
      `,
      )
      .eq('id', attemptId)
      .single()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Get all attempts for a student on a question set
   */
  async getStudentAttempts(
    studentId: string,
    questionSetId: string,
  ): Promise<QuestionSetAttempt[]> {
    const { data, error } = await this.client
      .from('question_set_attempts')
      .select('*')
      .eq('student_id', studentId)
      .eq('question_set_id', questionSetId)
      .order('started_at', { ascending: false })

    if (error) this.handleError(error)
    return data || []
  }

  /**
   * Get all attempts for a student in a classroom
   */
  async getStudentAttemptsInClassroom(
    studentId: string,
    classroomId: string,
  ): Promise<AttemptWithAnswers[]> {
    const { data, error } = await this.client
      .from('question_set_attempts')
      .select(
        `
        *,
        answers:question_set_answers(*),
        question_set:question_sets!inner(*)
      `,
      )
      .eq('student_id', studentId)
      .eq('question_set.classroom_id', classroomId)
      .order('started_at', { ascending: false })

    if (error) this.handleError(error)
    return data || []
  }

  /**
   * Record an answer to a question
   * Uses upsert to update existing answer or insert new one
   */
  async recordAnswer(answer: QuestionSetAnswerInsert): Promise<QuestionSetAnswer> {
    // First, check if an answer already exists for this attempt + question
    const { data: existing } = await this.client
      .from('question_set_answers')
      .select('id')
      .eq('attempt_id', answer.attempt_id)
      .eq('question_id', answer.question_id)
      .maybeSingle()

    const answerData = {
      ...answer,
      answered_at: new Date().toISOString(),
    }

    if (existing) {
      // Update existing answer
      const { data, error } = await this.client
        .from('question_set_answers')
        .update(answerData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) this.handleError(error)
      return data
    } else {
      // Insert new answer
      const { data, error } = await this.client
        .from('question_set_answers')
        .insert(answerData)
        .select()
        .single()

      if (error) this.handleError(error)
      return data
    }
  }

  /**
   * Update an answer (before submission)
   */
  async updateAnswer(id: string, updates: QuestionSetAnswerUpdate): Promise<QuestionSetAnswer> {
    const { data, error } = await this.client
      .from('question_set_answers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Get answers for an attempt
   */
  async getAttemptAnswers(attemptId: string): Promise<QuestionSetAnswer[]> {
    const { data, error } = await this.client
      .from('question_set_answers')
      .select('*')
      .eq('attempt_id', attemptId)

    if (error) this.handleError(error)
    return data || []
  }

  /**
   * Submit attempt and calculate score
   */
  async submitAttempt(attemptId: string): Promise<QuestionSetAttempt> {
    // Get attempt and answers
    const attempt = await this.getAttemptById(attemptId)
    if (!attempt) {
      throw new Error('Attempt not found')
    }

    const answers = await this.getAttemptAnswers(attemptId)
    const questions = await this.getQuestionsBySet(attempt.question_set_id)

    // Calculate score
    let score = 0
    for (const answer of answers) {
      const question = questions.find((q) => q.id === answer.question_id)
      if (question && answer.selected_answer === question.correct_answer) {
        score++
      }
    }

    // Update attempt
    const updates: QuestionSetAttemptUpdate = {
      is_completed: true,
      submitted_at: new Date().toISOString(),
      score,
    }

    const { data, error } = await this.client
      .from('question_set_attempts')
      .update(updates)
      .eq('id', attemptId)
      .select()
      .single()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Check if student has already attempted a question set
   */
  async hasAttempted(studentId: string, questionSetId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('question_set_attempts')
      .select('id')
      .eq('student_id', studentId)
      .eq('question_set_id', questionSetId)
      .maybeSingle()

    if (error) return false
    return !!data
  }

  /**
   * Get active (incomplete) attempt for student
   */
  async getActiveAttempt(
    studentId: string,
    questionSetId: string,
  ): Promise<QuestionSetAttempt | null> {
    const { data, error } = await this.client
      .from('question_set_attempts')
      .select('*')
      .eq('student_id', studentId)
      .eq('question_set_id', questionSetId)
      .eq('is_completed', false)
      .maybeSingle()

    if (error) this.handleError(error)
    return data
  }

  // ============================================
  // TEACHER ANALYTICS
  // ============================================

  /**
   * Get all attempts for a question set (for teacher)
   */
  async getQuestionSetAttempts(questionSetId: string): Promise<AttemptWithAnswers[]> {
    const { data, error } = await this.client
      .from('question_set_attempts')
      .select(
        `
        *,
        answers:question_set_answers(*)
      `,
      )
      .eq('question_set_id', questionSetId)
      .order('submitted_at', { ascending: false })

    if (error) this.handleError(error)
    return data || []
  }

  /**
   * Get question set statistics
   */
  async getQuestionSetStats(questionSetId: string): Promise<{
    total_attempts: number
    completed_attempts: number
    average_score: number
    average_percentage: number
  }> {
    const attempts = await this.getQuestionSetAttempts(questionSetId)

    const completedAttempts = attempts.filter((a) => a.is_completed)
    const totalAttempts = attempts.length

    let totalScore = 0
    let totalQuestions = 0

    for (const attempt of completedAttempts) {
      totalScore += attempt.score ?? 0
      totalQuestions += attempt.total_questions ?? 0
    }

    const averageScore = completedAttempts.length > 0 ? totalScore / completedAttempts.length : 0
    const averagePercentage = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0

    return {
      total_attempts: totalAttempts,
      completed_attempts: completedAttempts.length,
      average_score: averageScore,
      average_percentage: averagePercentage,
    }
  }
}

// Export a singleton instance
export const questionSetService = new QuestionSetService()
