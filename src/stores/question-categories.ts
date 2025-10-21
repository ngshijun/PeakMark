import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { questionCategoryService } from '@/services/api/question-category.service'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

type QuestionCategory = Tables<'question_categories'>
type QuestionCategoryInsert = TablesInsert<'question_categories'>
type QuestionCategoryUpdate = TablesUpdate<'question_categories'>

export const useQuestionCategoriesStore = defineStore('questionCategories', () => {
  // State
  const categories = ref<QuestionCategory[]>([])
  const selectedCategory = ref<QuestionCategory | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const categoryCount = computed(() => categories.value.length)
  const hasCategories = computed(() => categories.value.length > 0)

  const getCategoryById = computed(() => {
    return (id: string) => categories.value.find((c) => c.id === id)
  })

  // Actions
  const fetchCategoriesByClassroom = async (classroomId: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionCategoryService.getCategoriesByClassroom(classroomId)
      categories.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch categories'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchById = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await questionCategoryService.getById(id)
      selectedCategory.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch category'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createCategory = async (input: QuestionCategoryInsert) => {
    loading.value = true
    error.value = null
    try {
      // Check if category name already exists
      const exists = await questionCategoryService.existsByName(input.classroom_id, input.name)
      if (exists) {
        throw new Error('A category with this name already exists in this classroom')
      }

      const newCategory = await questionCategoryService.create(input)
      categories.value.push(newCategory)
      return newCategory
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create category'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCategory = async (id: string, updates: QuestionCategoryUpdate) => {
    loading.value = true
    error.value = null
    try {
      const updated = await questionCategoryService.updateCategory(id, updates)
      const index = categories.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        categories.value[index] = updated
      }
      if (selectedCategory.value?.id === id) {
        selectedCategory.value = updated
      }
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update category'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteCategory = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await questionCategoryService.deleteCategory(id)
      categories.value = categories.value.filter((c) => c.id !== id)
      if (selectedCategory.value?.id === id) {
        selectedCategory.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete category'
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearSelected = () => {
    selectedCategory.value = null
  }

  const clearAll = () => {
    categories.value = []
    selectedCategory.value = null
    error.value = null
  }

  return {
    // State
    categories,
    selectedCategory,
    loading,
    error,

    // Getters
    categoryCount,
    hasCategories,
    getCategoryById,

    // Actions
    fetchCategoriesByClassroom,
    fetchById,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
    clearSelected,
    clearAll,
  }
})
