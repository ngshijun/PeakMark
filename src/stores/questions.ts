import { supabase } from '@/lib/supabaseClient'
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
  const fetchQuestions = async () => {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })

    loading.value = false

    if (fetchError) {
      error.value = fetchError.message
      throw fetchError
    }

    questions.value = data || []
    return data
  }

  // Fetch a single question by ID
  const fetchQuestionById = async (id: string) => {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    loading.value = false

    if (fetchError) {
      error.value = fetchError.message
      throw fetchError
    }

    return data
  }

  // Create a new question
  const createQuestion = async (question: QuestionInsert) => {
    loading.value = true
    error.value = null

    const { data, error: createError } = await supabase
      .from('questions')
      .insert(question)
      .select()
      .single()

    loading.value = false

    if (createError) {
      error.value = createError.message
      throw createError
    }

    if (data) {
      questions.value.unshift(data)
    }

    return data
  }

  // Update an existing question
  const updateQuestion = async (id: string, updates: QuestionUpdate) => {
    loading.value = true
    error.value = null

    const { data, error: updateError } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    loading.value = false

    if (updateError) {
      error.value = updateError.message
      throw updateError
    }

    if (data) {
      const index = questions.value.findIndex((q) => q.id === id)
      if (index !== -1) {
        questions.value[index] = data
      }
    }

    return data
  }

  // Delete a question
  const deleteQuestion = async (id: string) => {
    loading.value = true
    error.value = null

    const { error: deleteError } = await supabase.from('questions').delete().eq('id', id)

    loading.value = false

    if (deleteError) {
      error.value = deleteError.message
      throw deleteError
    }

    questions.value = questions.value.filter((q) => q.id !== id)
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
    updateQuestion,
    deleteQuestion,
    clearError,
  }
})
