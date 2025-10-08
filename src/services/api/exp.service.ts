import type { Tables } from '@/types/database.types'
import { BaseService } from './base.service'

type ExpRow = Tables<'student_exp'>

/**
 * Experience and leveling service
 * Handles student experience points and classroom-specific exp
 */
export class ExpService extends BaseService {
  /**
   * Get student experience for a specific classroom
   */
  async getStudentExp(studentId: string, classroomId: string): Promise<ExpRow | null> {
    const { data, error } = await this.client
      .from('student_exp')
      .select('*')
      .eq('student_id', studentId)
      .eq('classroom_id', classroomId)
      .maybeSingle()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Create student experience record for a classroom
   */
  async createStudentExp(studentId: string, classroomId: string): Promise<ExpRow> {
    const { data, error } = await this.client
      .from('student_exp')
      .insert({
        student_id: studentId,
        classroom_id: classroomId,
        exp: 0,
      })
      .select()
      .single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Update student experience for a classroom
   */
  async updateStudentExp(studentId: string, classroomId: string, exp: number): Promise<ExpRow> {
    const { data, error } = await this.client
      .from('student_exp')
      .update({ exp })
      .eq('student_id', studentId)
      .eq('classroom_id', classroomId)
      .select()
      .single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Add experience points to a student's total
   */
  async addExpToStudent(
    studentId: string,
    classroomId: string,
    expToAdd: number,
  ): Promise<ExpRow> {
    // First get current exp
    const currentExp = await this.getStudentExp(studentId, classroomId)

    if (!currentExp) {
      // Create new exp record if it doesn't exist
      return this.createStudentExp(studentId, classroomId)
    }

    // Update with new total
    const newExp = currentExp.exp + expToAdd
    return this.updateStudentExp(studentId, classroomId, newExp)
  }
}

// Export a singleton instance
export const expService = new ExpService()
