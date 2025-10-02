import { supabase } from '@/lib/supabaseClient'
import type { Tables, TablesInsert } from '@/types/database.types'
import {
  calculateNewStudentElo,
  calculateNextReviewDate,
  difficultyToElo,
  ELO_CONSTANTS,
  eloToDifficultyRange,
} from '@/utils/elo'
import { EXP_PER_QUESTION } from '@/types/constants'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { useProfileStore } from './profile'

type PracticeSession = Tables<'practice_session'>
type Question = Tables<'questions'>
type QuestionAttempt = TablesInsert<'question_attempts'>

export const usePracticeStore = defineStore('practice', () => {
  const authStore = useAuthStore()
  const profileStore = useProfileStore()

  // State
  const currentSession = ref<PracticeSession | null>(null)
  const currentQuestion = ref<Question | null>(null)
  const studentElo = ref<number>(ELO_CONSTANTS.DEFAULT_STUDENT_ELO)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Queue of questions for current session
  const questionQueue = ref<Question[]>([])
  const answeredQuestions = ref<Set<string>>(new Set())

  /**
   * Get or create student ELO for a specific subject/year
   */
  const getOrCreateStudentElo = async (
    userId: string,
    subject: string,
    year: string
  ): Promise<number> => {
    // Try to fetch existing ELO
    const { data: existingElo, error: fetchError } = await supabase
      .from('student_elo')
      .select('*')
      .eq('user_id', userId)
      .eq('subject', subject)
      .eq('year', year)
      .single()

    if (existingElo) {
      return existingElo.elo_rating
    }

    // Create new ELO record if doesn't exist
    if (fetchError?.code === 'PGRST116') {
      const { data: newElo, error: createError } = await supabase
        .from('student_elo')
        .insert({
          user_id: userId,
          subject,
          year,
          elo_rating: ELO_CONSTANTS.DEFAULT_STUDENT_ELO,
        })
        .select()
        .single()
      if (createError) throw createError
      return newElo.elo_rating
    }

    throw fetchError
  }

  /**
   * Update student ELO after answering a question
   */
  const updateStudentElo = async (
    userId: string,
    subject: string,
    year: string,
    newElo: number
  ): Promise<void> => {
    const { data, error: updateError } = await supabase
      .from('student_elo')
      .update({
        elo_rating: newElo,
      })
      .eq('user_id', userId)
      .eq('subject', subject)
      .eq('year', year)
      .select()

    if (updateError) {
      console.error('Error updating student ELO:', updateError)
      throw updateError
    }

    if (!data || data.length === 0) {
      console.error('No student ELO record found to update', { userId, subject, year })
      throw new Error('Failed to update student ELO: No matching record found')
    }

    console.log('Student ELO updated successfully:', { userId, subject, year, newElo })
  }

  /**
   * Fetch suitable questions based on student ELO
   */
  const fetchQuestionsForSession = async (
    subject: string,
    year: string,
    currentStudentElo: number
  ): Promise<Question[]> => {
    const userId = authStore.user?.id
    if (!userId) throw new Error('No user authenticated')

    // Convert student ELO to difficulty range
    const { min, max } = eloToDifficultyRange(currentStudentElo)

    const now = new Date().toISOString()

    // First fetch question IDs for this subject/year
    const { data: questionIds, error: questionIdsError } = await supabase
      .from('questions')
      .select('id')
      .eq('subject', subject)
      .eq('year', year)

    if (questionIdsError) throw questionIdsError

    const ids = questionIds?.map(q => q.id) || []

    // Parallel fetch: attempts and questions at the same time
    const [attemptsResult, questionsResult] = await Promise.all([
      // OPTIMIZED: Filter attempts by subject/year to reduce data transfer
      ids.length > 0
        ? supabase
            .from('question_attempts')
            .select('question_id, is_correct, next_review_date')
            .eq('attempted_by', userId)
            .in('question_id', ids)
        : Promise.resolve({ data: [], error: null }),
      // Fetch questions in difficulty range
      supabase
        .from('questions')
        .select('*')
        .eq('subject', subject)
        .eq('year', year)
        .gte('difficulty', min)
        .lte('difficulty', max)
    ])

    if (attemptsResult.error) throw attemptsResult.error
    if (questionsResult.error) throw questionsResult.error

    const attempts = attemptsResult.data || []
    const allQuestions = questionsResult.data || []

    // Build exclusion list (correctly answered questions) and review list
    const excludedQuestionIds = new Set<string>()
    const reviewQuestionIds: string[] = []

    attempts.forEach((attempt) => {
      if (attempt.is_correct) {
        excludedQuestionIds.add(attempt.question_id)
      } else if (attempt.next_review_date) {
        if (attempt.next_review_date <= now) {
          reviewQuestionIds.push(attempt.question_id)
        }
      }
    })

    // Filter out correctly answered questions
    let availableQuestions = allQuestions.filter(
      (q) => !excludedQuestionIds.has(q.id)
    )

    // FALLBACK: If no questions found in optimal range, expand search to all difficulties
    if (availableQuestions.length === 0) {
      const { data: fallbackQuestions, error: fallbackError } = await supabase
        .from('questions')
        .select('*')
        .eq('subject', subject)
        .eq('year', year)

      if (fallbackError) throw fallbackError

      availableQuestions = (fallbackQuestions || []).filter(
        (q) => !excludedQuestionIds.has(q.id)
      )

      // Sort by proximity to student ELO (closest difficulty first)
      const studentDifficulty = (currentStudentElo - 800) / 200
      availableQuestions.sort((a, b) => {
        const diffA = Math.abs(a.difficulty - studentDifficulty)
        const diffB = Math.abs(b.difficulty - studentDifficulty)
        return diffA - diffB
      })
    }

    // Prioritize review questions
    const reviewQuestions = availableQuestions.filter((q) => reviewQuestionIds.includes(q.id))
    const newQuestions = availableQuestions.filter((q) => !reviewQuestionIds.includes(q.id))

    // Combine: review questions first, then new questions
    return [...reviewQuestions, ...newQuestions]
  }

  /**
   * Start a new practice session
   */
  const startSession = async (subject: string, year: string): Promise<void> => {
    const userId = authStore.user?.id
    if (!userId) {
      error.value = 'No user authenticated'
      throw new Error('No user authenticated')
    }

    loading.value = true
    error.value = null

    try {
      // OPTIMIZED: Run ELO fetch and session creation in parallel
      const [currentElo, sessionResult] = await Promise.all([
        getOrCreateStudentElo(userId, subject, year),
        supabase
          .from('practice_session')
          .insert({
            user_id: userId,
            subject,
            year,
            is_active: true,
          })
          .select()
          .single()
      ])

      if (sessionResult.error) throw sessionResult.error

      studentElo.value = currentElo
      currentSession.value = sessionResult.data

      // Fetch questions based on ELO
      const questions = await fetchQuestionsForSession(subject, year, currentElo)

      if (questions.length === 0) {
        currentQuestion.value = null
        questionQueue.value = []
        error.value = 'No suitable questions available for this subject and year level'
        throw new Error('No suitable questions available for this subject and year level')
      }

      console.log("XX3", currentSession.value)

      // Load questions
      questionQueue.value = questions
      answeredQuestions.value.clear()
      currentQuestion.value = questions[0] || null
    } catch (err) {
      console.error('Error starting practice session:', err)
      error.value = err instanceof Error ? err.message : 'Failed to start session'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Submit answer for current question
   */
  const submitAnswer = async (selectedAnswer: number): Promise<boolean> => {
    const userId = authStore.user?.id
    if (!userId || !currentQuestion.value || !currentSession.value) {
      error.value = 'Invalid session state'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const question = currentQuestion.value
      const isCorrect = selectedAnswer === question.correct_answer
      const questionElo = difficultyToElo(question.difficulty)

      // Calculate new student ELO
      const newElo = calculateNewStudentElo(studentElo.value, questionElo, isCorrect)

      // Calculate next review date if incorrect
      const nextReviewDate = !isCorrect
        ? calculateNextReviewDate(answeredQuestions.value.size)
        : null

      // Record attempt
      const attempt: QuestionAttempt = {
        attempted_by: userId,
        question_id: question.id,
        session_id: currentSession.value.id,
        is_correct: isCorrect,
        student_elo_before: studentElo.value,
        student_elo_after: newElo,
        question_elo_before: questionElo,
        next_review_date: nextReviewDate?.toISOString() || null,
      }

      const { error: attemptError } = await supabase.from('question_attempts').insert(attempt)
      if (attemptError) throw attemptError

      // Update student ELO and EXP in parallel
      const currentExp = profileStore.exp
      const newExp = currentExp + EXP_PER_QUESTION

      await Promise.all([
        updateStudentElo(
          userId,
          currentSession.value.subject,
          currentSession.value.year,
          newElo
        ),
        profileStore.updateExp(newExp)
      ])

      studentElo.value = newElo

      // Update session
      const { error: sessionUpdateError } = await supabase
        .from('practice_session')
        .update({
          questions_attempted: currentSession.value.questions_attempted + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSession.value.id)

      if (sessionUpdateError) throw sessionUpdateError
      currentSession.value.questions_attempted += 1

      // Mark question as answered
      answeredQuestions.value.add(question.id)

      return isCorrect
    } catch (err) {
      console.error('Error submitting answer:', err)
      error.value = err instanceof Error ? err.message : 'Failed to submit answer'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Move to next question
   */
  const nextQuestion = (): boolean => {
    if (!questionQueue.value.length) return false

    // Find next unanswered question
    const nextQ = questionQueue.value.find((q) => !answeredQuestions.value.has(q.id))

    if (nextQ) {
      currentQuestion.value = nextQ
      return true
    }

    // No more questions available
    currentQuestion.value = null
    return false
  }

  /**
   * End current practice session
   */
  const endSession = async (): Promise<void> => {
    console.log("XX4", currentSession.value)
    if (!currentSession.value) return

    loading.value = true
    error.value = null

    try {
      const { error: updateError } = await supabase
        .from('practice_session')
        .update({
          ended_at: new Date().toISOString(),
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSession.value.id)

      if (updateError) throw updateError

      // Clear session state
      currentSession.value = null
      currentQuestion.value = null
      questionQueue.value = []
      answeredQuestions.value.clear()
      studentElo.value = ELO_CONSTANTS.DEFAULT_STUDENT_ELO
    } catch (err) {
      console.error('Error ending session:', err)
      error.value = err instanceof Error ? err.message : 'Failed to end session'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Resume an existing practice session
   */
  const resumeSession = async (sessionId: string): Promise<void> => {
    const userId = authStore.user?.id
    if (!userId) {
      error.value = 'No user authenticated'
      throw new Error('No user authenticated')
    }

    loading.value = true
    error.value = null

    try {
      // OPTIMIZED: Fetch session and answered questions in parallel
      const [sessionResult, attemptsResult] = await Promise.all([
        supabase
          .from('practice_session')
          .select('*')
          .eq('id', sessionId)
          .eq('user_id', userId)
          .single(),
        supabase
          .from('question_attempts')
          .select('question_id')
          .eq('session_id', sessionId)
      ])

      if (sessionResult.error) throw sessionResult.error
      if (attemptsResult.error) throw attemptsResult.error

      const session = sessionResult.data
      currentSession.value = session

      console.log("XX5", currentSession.value)

      const answeredIds = new Set(attemptsResult.data?.map((a) => a.question_id) || [])
      answeredQuestions.value = answeredIds

      // OPTIMIZED: Fetch ELO and questions in parallel
      const [currentElo, questions] = await Promise.all([
        getOrCreateStudentElo(userId, session.subject, session.year),
        fetchQuestionsForSession(session.subject, session.year, studentElo.value || ELO_CONSTANTS.DEFAULT_STUDENT_ELO)
      ])

      studentElo.value = currentElo
      questionQueue.value = questions

      // Find next unanswered question
      const nextQ = questions.find((q) => !answeredIds.has(q.id))
      currentQuestion.value = nextQ || null

      if (!nextQ) {
        error.value = 'No more questions available in this session'
      }
    } catch (err) {
      console.error('Error resuming session:', err)
      error.value = err instanceof Error ? err.message : 'Failed to resume session'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    currentSession,
    currentQuestion,
    studentElo,
    loading,
    error,
    questionQueue,
    answeredQuestions,

    // Actions
    startSession,
    submitAnswer,
    nextQuestion,
    endSession,
    resumeSession,
  }
})
