import { questionService } from '@/services/api/question.service'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import type { EloUpdateResult, NextQuestionResult } from '@/services/api/question.service'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

type Question = Tables<'questions'>
type QuestionInsert = TablesInsert<'questions'>
type QuestionUpdate = TablesUpdate<'questions'>
type StudentElo = Tables<'student_elo'>
type QuestionAttempt = Tables<'question_attempts'>

export const useQuestionStore = defineStore('question', () => {
  const questions = ref<Question[]>([])
  const selectedQuestion = ref<Question | null>(null)
  const currentPracticeQuestion = ref<NextQuestionResult | null>(null)
  const recentQuestionIds = ref<string[]>([])
  const studentElos = ref<StudentElo[]>([])
  const attempts = ref<QuestionAttempt[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Practice session state
  const practiceStats = ref({
    questionsAttempted: 0,
    correctAnswers: 0,
    currentStreak: 0,
    lastEloChange: 0,
  })

  // Getters
  const questionCount = computed(() => questions.value.length)
  const hasQuestions = computed(() => questions.value.length > 0)

  const practiceAccuracy = computed(() => {
    if (practiceStats.value.questionsAttempted === 0) return 0
    return (practiceStats.value.correctAnswers / practiceStats.value.questionsAttempted) * 100
  })

  // Fetch all questions
  const fetchQuestions = async (classroomId: string) => {
    loading.value = true
    error.value = null

    try {
      const data = await questionService.getQuestions(classroomId)
      questions.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch a single question by ID
  const fetchQuestionById = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const data = await questionService.getQuestionById(id)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create a new question
  const createQuestion = async (question: QuestionInsert) => {
    loading.value = true
    error.value = null

    try {
      const data = await questionService.createQuestion(question)
      questions.value.unshift(data)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Upload question image
  const uploadQuestionImage = async (file: File, classroomId: string, questionId: string) => {
    loading.value = true
    error.value = null

    try {
      const imageUrl = await questionService.uploadQuestionImage(file, classroomId, questionId)
      return imageUrl
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete question image from storage
  const deleteQuestionImage = async (imageUrl: string) => {
    try {
      await questionService.deleteQuestionImage(imageUrl)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    }
  }

  // Update an existing question
  const updateQuestion = async (id: string, updates: QuestionUpdate) => {
    loading.value = true
    error.value = null

    try {
      const data = await questionService.updateQuestion(id, updates)
      const index = questions.value.findIndex((q) => q.id === id)
      if (index !== -1) {
        questions.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete a question
  const deleteQuestion = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await questionService.deleteQuestion(id)
      questions.value = questions.value.filter((q) => q.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Clear error
  const clearError = () => {
    error.value = null
  }

  // Practice & ELO Methods
  const startPractice = () => {
    practiceStats.value = {
      questionsAttempted: 0,
      correctAnswers: 0,
      currentStreak: 0,
      lastEloChange: 0,
    }
    recentQuestionIds.value = []
    currentPracticeQuestion.value = null
  }

  const getNextPracticeQuestion = async (
    studentId: string,
    categoryId: string,
    classroomId: string,
  ) => {
    loading.value = true
    error.value = null
    try {
      const question = await questionService.getNextQuestion(
        studentId,
        categoryId,
        classroomId,
        recentQuestionIds.value,
      )

      if (!question) {
        throw new Error('No more questions available in this category')
      }

      currentPracticeQuestion.value = question

      // Add to recent questions (keep last 10)
      recentQuestionIds.value.unshift(question.question_id)
      if (recentQuestionIds.value.length > 10) {
        recentQuestionIds.value = recentQuestionIds.value.slice(0, 10)
      }

      return question
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get next question'
      throw err
    } finally {
      loading.value = false
    }
  }

  const submitAnswer = async (
    questionId: string,
    studentId: string,
    categoryId: string,
    classroomId: string,
    selectedAnswer: number,
    correctAnswer: number,
  ): Promise<EloUpdateResult> => {
    loading.value = true
    error.value = null
    try {
      const isCorrect = selectedAnswer === correctAnswer

      const result = await questionService.submitAnswer(
        questionId,
        studentId,
        categoryId,
        classroomId,
        isCorrect,
        selectedAnswer,
      )

      // Update practice stats
      practiceStats.value.questionsAttempted++
      if (isCorrect) {
        practiceStats.value.correctAnswers++
        practiceStats.value.currentStreak++
      } else {
        practiceStats.value.currentStreak = 0
      }
      practiceStats.value.lastEloChange = result.student_elo_change

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to submit answer'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchStudentElo = async (studentId: string, categoryId: string, classroomId: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionService.getStudentElo(studentId, categoryId, classroomId)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch student ELO'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchStudentElosByClassroom = async (studentId: string, classroomId: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionService.getStudentElosByClassroom(studentId, classroomId)
      studentElos.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch student ELOs'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchStudentAttempts = async (studentId: string, categoryId: string, limit?: number) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionService.getStudentAttempts(studentId, categoryId, limit)
      attempts.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch attempts'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getCategoryStats = async (studentId: string, categoryId: string) => {
    loading.value = true
    error.value = null
    try {
      const stats = await questionService.getCategoryStatsForStudent(studentId, categoryId)
      return stats
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch category stats'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchByCategory = async (categoryId: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionService.getByCategory(categoryId)
      questions.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch questions by category'
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearPractice = () => {
    currentPracticeQuestion.value = null
    recentQuestionIds.value = []
    practiceStats.value = {
      questionsAttempted: 0,
      correctAnswers: 0,
      currentStreak: 0,
      lastEloChange: 0,
    }
  }

  return {
    // State
    questions,
    selectedQuestion,
    currentPracticeQuestion,
    recentQuestionIds,
    studentElos,
    attempts,
    practiceStats,
    loading,
    error,

    // Getters
    questionCount,
    hasQuestions,
    practiceAccuracy,

    // Actions
    fetchQuestions,
    fetchQuestionById,
    fetchByCategory,
    createQuestion,
    uploadQuestionImage,
    deleteQuestionImage,
    updateQuestion,
    deleteQuestion,

    // Practice & ELO
    startPractice,
    getNextPracticeQuestion,
    submitAnswer,
    fetchStudentElo,
    fetchStudentElosByClassroom,
    fetchStudentAttempts,
    getCategoryStats,
    clearPractice,

    // Utilities
    clearError,
  }
})
