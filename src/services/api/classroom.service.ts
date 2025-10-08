import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { BaseService } from './base.service'

type Classroom = Tables<'classrooms'>
type ClassroomInsert = TablesInsert<'classrooms'>
type ClassroomUpdate = TablesUpdate<'classrooms'>
type ClassroomMember = Tables<'classroom_members'>

export interface ClassroomWithMemberCount extends Classroom {
  member_count?: number
  teacher_name?: string
}

export interface ClassroomMemberWithUser extends ClassroomMember {
  users?: {
    id: string
    full_name: string
    created_at: string | null
  }
}

/**
 * Classroom service
 * Handles all classroom-related API operations
 */
export class ClassroomService extends BaseService {
  /**
   * Get all classrooms created by a teacher
   */
  async getTeacherClassrooms(teacherId: string): Promise<ClassroomWithMemberCount[]> {
    const { data, error } = await this.client
      .from('classrooms')
      .select(
        `
        *,
        classroom_members(count)
      `,
      )
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError(error)
    }

    return (data || []).map((classroom) => {
      const rawData = classroom as unknown as Classroom & { classroom_members: { count: number } | null }
      return {
        ...rawData,
        member_count: rawData.classroom_members?.count || 0,
      }
    })
  }

  /**
   * Get all classrooms a student is enrolled in
   */
  async getStudentClassrooms(studentId: string): Promise<ClassroomWithMemberCount[]> {
    const { data, error } = await this.client
      .from('classroom_members')
      .select(
        `
        classrooms!classroom_members_classroom_id_fkey(
          *,
          users!classrooms_teacher_id_fkey(
            full_name
          )
        )
      `,
      )
      .eq('student_id', studentId)
      .order('joined_at', { ascending: false })

    if (error) {
      this.handleError(error)
    }

    return (data || []).map((member) => {
      const rawData = member as unknown as { classrooms: Classroom & { users?: { full_name?: string } } }
      return {
        ...rawData.classrooms,
        teacher_name: rawData.classrooms?.users?.full_name || 'Unknown Teacher',
      }
    })
  }

  /**
   * Get a single classroom by ID
   */
  async getClassroomById(id: string): Promise<Classroom> {
    const { data, error } = await this.client
      .from('classrooms')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Create a new classroom
   */
  async createClassroom(classroom: ClassroomInsert): Promise<Classroom> {
    const { data, error } = await this.client
      .from('classrooms')
      .insert(classroom)
      .select()
      .single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Update a classroom
   */
  async updateClassroom(id: string, updates: ClassroomUpdate): Promise<Classroom> {
    const { data, error } = await this.client
      .from('classrooms')
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
   * Delete a classroom
   */
  async deleteClassroom(id: string): Promise<void> {
    const { error } = await this.client.from('classrooms').delete().eq('id', id)

    if (error) {
      this.handleError(error)
    }
  }

  /**
   * Get all members of a classroom
   */
  async getClassroomMembers(classroomId: string): Promise<ClassroomMemberWithUser[]> {
    const { data, error } = await this.client
      .from('classroom_members')
      .select(
        `
        *,
        users!classroom_members_student_id_fkey(
          id,
          full_name,
          created_at
        )
      `,
      )
      .eq('classroom_id', classroomId)
      .order('joined_at', { ascending: false })

    if (error) {
      this.handleError(error)
    }

    return data || []
  }

  /**
   * Add a student to a classroom
   */
  async addMember(classroomId: string, studentId: string): Promise<ClassroomMember> {
    const { data, error } = await this.client
      .from('classroom_members')
      .insert({
        classroom_id: classroomId,
        student_id: studentId,
      })
      .select()
      .single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Remove a student from a classroom
   */
  async removeMember(classroomId: string, studentId: string): Promise<void> {
    const { error } = await this.client
      .from('classroom_members')
      .delete()
      .eq('classroom_id', classroomId)
      .eq('student_id', studentId)

    if (error) {
      this.handleError(error)
    }
  }

  /**
   * Check if a student is a member of a classroom
   */
  async checkMembership(classroomId: string, studentId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('classroom_members')
      .select('id')
      .eq('classroom_id', classroomId)
      .eq('student_id', studentId)
      .maybeSingle()

    if (error) {
      this.handleError(error)
    }

    return !!data
  }

  /**
   * Check if a classroom exists
   */
  async classroomExists(classroomId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('classrooms')
      .select('id')
      .eq('id', classroomId)
      .maybeSingle()

    if (error) {
      return false
    }

    return !!data
  }

  /**
   * Check if a user has access to a classroom
   * TODO: Move to permissions service in Phase 2
   */
  async hasAccessToClassroom(
    userId: string,
    classroomId: string,
    role: string,
  ): Promise<boolean> {
    try {
      // Teachers: check if they own the classroom
      if (role === 'teacher') {
        const { data } = await this.client
          .from('classrooms')
          .select('id')
          .eq('id', classroomId)
          .eq('teacher_id', userId)
          .maybeSingle()
        return !!data
      }

      // Students: check if they are a member
      if (role === 'student') {
        const { data } = await this.client
          .from('classroom_members')
          .select('id')
          .eq('classroom_id', classroomId)
          .eq('student_id', userId)
          .maybeSingle()
        return !!data
      }

      // Admins have access to all classrooms
      if (role === 'admin') {
        return true
      }

      return false
    } catch {
      return false
    }
  }
}

// Export a singleton instance
export const classroomService = new ClassroomService()
