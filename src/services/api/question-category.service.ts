import { BaseService } from './base.service'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

type QuestionCategory = Tables<'question_categories'>
type QuestionCategoryInsert = TablesInsert<'question_categories'>
type QuestionCategoryUpdate = TablesUpdate<'question_categories'>

export class QuestionCategoryService extends BaseService {
  /**
   * Get all categories for a classroom
   */
  async getCategoriesByClassroom(classroomId: string): Promise<QuestionCategory[]> {
    const { data, error } = await this.client
      .from('question_categories')
      .select('*')
      .eq('classroom_id', classroomId)
      .order('name', { ascending: true })

    if (error) this.handleError(error)
    return data || []
  }

  /**
   * Get category by ID
   */
  async getById(id: string): Promise<QuestionCategory> {
    const { data, error } = await this.client
      .from('question_categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Create a new category
   */
  async create(input: QuestionCategoryInsert): Promise<QuestionCategory> {
    const { data, error } = await this.client
      .from('question_categories')
      .insert(input)
      .select()
      .single()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Update a category
   */
  async updateCategory(id: string, updates: QuestionCategoryUpdate): Promise<QuestionCategory> {
    const { data, error } = await this.client
      .from('question_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) this.handleError(error)
    return data
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.client.from('question_categories').delete().eq('id', id)

    if (error) this.handleError(error)
  }

  /**
   * Check if category name exists in classroom
   */
  async existsByName(classroomId: string, name: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('question_categories')
      .select('id')
      .eq('classroom_id', classroomId)
      .eq('name', name)
      .maybeSingle()

    if (error) return false
    return !!data
  }

  /**
   * Get category with question count
   */
  async getCategoryWithStats(categoryId: string): Promise<{
    category: QuestionCategory
    questionCount: number
    averageElo: number
  }> {
    // Get category
    const category = await this.getById(categoryId)

    // Get question stats
    const { data: stats } = await this.client
      .from('questions')
      .select('elo')
      .eq('category_id', categoryId)

    const questionCount = stats?.length || 0
    const averageElo =
      questionCount > 0 ? stats!.reduce((sum, q) => sum + q.elo, 0) / questionCount : 1500

    return {
      category,
      questionCount,
      averageElo: Math.round(averageElo),
    }
  }
}

export const questionCategoryService = new QuestionCategoryService()
