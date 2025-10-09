import { questionService } from '@/services/api/question.service'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

type Question = Tables<'questions'>
type QuestionInsert = TablesInsert<'questions'>
type QuestionUpdate = TablesUpdate<'questions'>

export const useQuestionStore = defineStore('question', () => {
  const questions = ref<Question[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

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

  return {
    // State
    questions,
    loading,
    error,

    // Actions
    fetchQuestions,
    fetchQuestionById,
    createQuestion,
    uploadQuestionImage,
    updateQuestion,
    deleteQuestion,
    clearError,
  }
})
