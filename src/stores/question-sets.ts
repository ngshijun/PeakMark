import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { questionSetService } from '@/services/api/question-set.service'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import type {
  QuestionSetWithQuestions,
  AttemptWithAnswers,
} from '@/services/api/question-set.service'

type QuestionSet = Tables<'question_sets'>
type QuestionSetInsert = TablesInsert<'question_sets'>
type QuestionSetUpdate = TablesUpdate<'question_sets'>

type QuestionSetQuestion = Tables<'question_set_questions'>
type QuestionSetQuestionInsert = TablesInsert<'question_set_questions'>
type QuestionSetQuestionUpdate = TablesUpdate<'question_set_questions'>

type QuestionSetAttempt = Tables<'question_set_attempts'>
type QuestionSetAnswer = Tables<'question_set_answers'>
type QuestionSetAnswerInsert = TablesInsert<'question_set_answers'>

export const useQuestionSetsStore = defineStore('questionSets', () => {
  // ============================================
  // STATE
  // ============================================

  // Question Sets
  const questionSets = ref<QuestionSet[]>([])
  const selectedQuestionSet = ref<QuestionSetWithQuestions | null>(null)

  // Questions
  const currentQuestions = ref<QuestionSetQuestion[]>([])

  // Attempts (Student)
  const currentAttempt = ref<QuestionSetAttempt | null>(null)
  const currentAnswers = ref<Map<string, number>>(new Map()) // questionId -> selectedAnswer
  const attemptResults = ref<AttemptWithAnswers | null>(null)
  const studentAttempts = ref<AttemptWithAnswers[]>([])

  // Teacher Analytics
  const questionSetStats = ref<{
    total_attempts: number
    completed_attempts: number
    average_score: number
    average_percentage: number
  } | null>(null)

  // UI State
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ============================================
  // GETTERS
  // ============================================

  const questionSetCount = computed(() => questionSets.value.length)
  const hasQuestionSets = computed(() => questionSets.value.length > 0)

  const publishedQuestionSets = computed(() => questionSets.value.filter((qs) => qs.is_published))

  const draftQuestionSets = computed(() => questionSets.value.filter((qs) => !qs.is_published))

  const hasActiveAttempt = computed(
    () => currentAttempt.value && !currentAttempt.value.is_completed,
  )

  const attemptProgress = computed(() => {
    if (!currentAttempt.value) return 0
    const answered = currentAnswers.value.size
    const total = currentAttempt.value.total_questions ?? 0
    return total > 0 ? (answered / total) * 100 : 0
  })

  // ============================================
  // QUESTION SET ACTIONS
  // ============================================

  const fetchQuestionSets = async (classroomId: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionSetService.getQuestionSets(classroomId)
      questionSets.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch question sets'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchPublishedQuestionSets = async (classroomId: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionSetService.getPublishedQuestionSets(classroomId)
      questionSets.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch question sets'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchQuestionSetById = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionSetService.getQuestionSetById(id)
      if (data) {
        selectedQuestionSet.value = { ...data, questions: [] }
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch question set'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchQuestionSetWithQuestions = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionSetService.getQuestionSetWithQuestions(id)
      selectedQuestionSet.value = data
      if (data) {
        currentQuestions.value = data.questions
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch question set'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createQuestionSet = async (input: QuestionSetInsert) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionSetService.createQuestionSet(input)
      questionSets.value.unshift(data)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create question set'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateQuestionSet = async (id: string, updates: QuestionSetUpdate) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionSetService.updateQuestionSet(id, updates)
      const index = questionSets.value.findIndex((qs) => qs.id === id)
      if (index !== -1) {
        questionSets.value[index] = data
      }
      if (selectedQuestionSet.value?.id === id) {
        selectedQuestionSet.value = { ...selectedQuestionSet.value, ...data }
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update question set'
      throw err
    } finally {
      loading.value = false
    }
  }

  const togglePublishStatus = async (id: string, isPublished: boolean) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionSetService.togglePublishStatus(id, isPublished)
      const index = questionSets.value.findIndex((qs) => qs.id === id)
      if (index !== -1) {
        questionSets.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update publish status'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteQuestionSet = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await questionSetService.deleteQuestionSet(id)
      questionSets.value = questionSets.value.filter((qs) => qs.id !== id)
      if (selectedQuestionSet.value?.id === id) {
        selectedQuestionSet.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete question set'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // QUESTION ACTIONS
  // ============================================

  const fetchQuestions = async (questionSetId: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionSetService.getQuestionsBySet(questionSetId)
      currentQuestions.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch questions'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createQuestion = async (input: QuestionSetQuestionInsert) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionSetService.createQuestion(input)
      currentQuestions.value.push(data)
      if (selectedQuestionSet.value) {
        selectedQuestionSet.value.questions.push(data)
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create question'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateQuestion = async (id: string, updates: QuestionSetQuestionUpdate) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionSetService.updateQuestion(id, updates)
      const index = currentQuestions.value.findIndex((q) => q.id === id)
      if (index !== -1) {
        currentQuestions.value[index] = data
      }
      if (selectedQuestionSet.value) {
        const qIndex = selectedQuestionSet.value.questions.findIndex((q) => q.id === id)
        if (qIndex !== -1) {
          selectedQuestionSet.value.questions[qIndex] = data
        }
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update question'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteQuestion = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await questionSetService.deleteQuestion(id)
      currentQuestions.value = currentQuestions.value.filter((q) => q.id !== id)
      if (selectedQuestionSet.value) {
        selectedQuestionSet.value.questions = selectedQuestionSet.value.questions.filter(
          (q) => q.id !== id,
        )
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete question'
      throw err
    } finally {
      loading.value = false
    }
  }

  const reorderQuestions = async (
    questionSetId: string,
    questionOrders: Array<{ id: string; order: number }>,
  ) => {
    loading.value = true
    error.value = null
    try {
      await questionSetService.reorderQuestions(questionSetId, questionOrders)
      // Update local state
      const updatedQuestions = currentQuestions.value.map((q) => {
        const newOrder = questionOrders.find((qo) => qo.id === q.id)
        return newOrder ? { ...q, order: newOrder.order } : q
      })
      currentQuestions.value = updatedQuestions.sort((a, b) => a.order - b.order)
      if (selectedQuestionSet.value) {
        selectedQuestionSet.value.questions = [...currentQuestions.value]
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder questions'
      throw err
    } finally {
      loading.value = false
    }
  }

  const uploadQuestionImage = async (file: File, classroomId: string, questionId: string) => {
    loading.value = true
    error.value = null
    try {
      const imageUrl = await questionSetService.uploadQuestionImage(file, classroomId, questionId)
      return imageUrl
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to upload image'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteQuestionImage = async (imageUrl: string) => {
    try {
      await questionSetService.deleteQuestionImage(imageUrl)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete image'
      throw err
    }
  }

  // ============================================
  // ATTEMPT ACTIONS (Student)
  // ============================================

  const startAttempt = async (questionSetId: string, studentId: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionSetService.startAttempt(questionSetId, studentId)
      currentAttempt.value = data
      currentAnswers.value = new Map()
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start attempt'
      throw err
    } finally {
      loading.value = false
    }
  }

  const checkActiveAttempt = async (studentId: string, questionSetId: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionSetService.getActiveAttempt(studentId, questionSetId)
      currentAttempt.value = data
      if (data) {
        // Load existing answers
        const answers = await questionSetService.getAttemptAnswers(data.id)
        currentAnswers.value = new Map(
          answers
            .filter((a) => a.selected_answer !== null)
            .map((a) => [a.question_id, a.selected_answer!]),
        )
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to check active attempt'
      throw err
    } finally {
      loading.value = false
    }
  }

  const recordAnswer = async (questionId: string, selectedAnswer: number) => {
    if (!currentAttempt.value) {
      throw new Error('No active attempt')
    }

    loading.value = true
    error.value = null
    try {
      // Check if question exists in selectedQuestionSet
      const question = selectedQuestionSet.value?.questions.find((q) => q.id === questionId)
      if (!question) {
        throw new Error('Question not found')
      }

      const isCorrect = selectedAnswer === question.correct_answer

      const answerInput: QuestionSetAnswerInsert = {
        attempt_id: currentAttempt.value.id,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
      }

      const data = await questionSetService.recordAnswer(answerInput)

      // Update local state
      currentAnswers.value.set(questionId, selectedAnswer)

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to record answer'
      throw err
    } finally {
      loading.value = false
    }
  }

  const submitAttempt = async () => {
    if (!currentAttempt.value) {
      throw new Error('No active attempt')
    }

    loading.value = true
    error.value = null
    try {
      const data = await questionSetService.submitAttempt(currentAttempt.value.id)
      currentAttempt.value = data

      // Fetch full results
      const results = await questionSetService.getAttemptWithDetails(data.id)
      attemptResults.value = results

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to submit attempt'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchAttemptResults = async (attemptId: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionSetService.getAttemptWithDetails(attemptId)
      attemptResults.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch attempt results'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchStudentAttempts = async (studentId: string, classroomId: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionSetService.getStudentAttemptsInClassroom(studentId, classroomId)
      studentAttempts.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch student attempts'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // TEACHER ANALYTICS
  // ============================================

  const fetchQuestionSetStats = async (questionSetId: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionSetService.getQuestionSetStats(questionSetId)
      questionSetStats.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch stats'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // UTILITIES
  // ============================================

  const clearError = () => {
    error.value = null
  }

  const clearSelectedQuestionSet = () => {
    selectedQuestionSet.value = null
    currentQuestions.value = []
  }

  const clearAttempt = () => {
    currentAttempt.value = null
    currentAnswers.value = new Map()
    attemptResults.value = null
  }

  return {
    // State
    questionSets,
    selectedQuestionSet,
    currentQuestions,
    currentAttempt,
    currentAnswers,
    attemptResults,
    studentAttempts,
    questionSetStats,
    loading,
    error,

    // Getters
    questionSetCount,
    hasQuestionSets,
    publishedQuestionSets,
    draftQuestionSets,
    hasActiveAttempt,
    attemptProgress,

    // Question Set Actions
    fetchQuestionSets,
    fetchPublishedQuestionSets,
    fetchQuestionSetById,
    fetchQuestionSetWithQuestions,
    createQuestionSet,
    updateQuestionSet,
    togglePublishStatus,
    deleteQuestionSet,

    // Question Actions
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    uploadQuestionImage,
    deleteQuestionImage,

    // Attempt Actions
    startAttempt,
    checkActiveAttempt,
    recordAnswer,
    submitAttempt,
    fetchAttemptResults,
    fetchStudentAttempts,

    // Teacher Analytics
    fetchQuestionSetStats,

    // Utilities
    clearError,
    clearSelectedQuestionSet,
    clearAttempt,
  }
})
