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

export interface StudentWithStats {
  id: string
  full_name: string
  joined_at: string
  exp: number
  elo_rating: number | null
  avatar_url: string | null
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
      const rawData = classroom as unknown as Classroom & {
        classroom_members: { count: number }[] | null
      }
      return {
        ...rawData,
        member_count: rawData.classroom_members?.[0]?.count || 0,
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
      const rawData = member as unknown as {
        classrooms: Classroom & { users?: { full_name?: string } }
      }
      return {
        ...rawData.classrooms,
        teacher_name: rawData.classrooms?.users?.full_name || 'Unknown Teacher',
      }
    })
  }

  /**
   * Get a single classroom by ID
   */
  async getClassroomById(id: string): Promise<ClassroomWithMemberCount> {
    const { data, error } = await this.client
      .from('classrooms')
      .select(
        `
        *,
        users!classrooms_teacher_id_fkey(
          full_name
        )
      `,
      )
      .eq('id', id)
      .single()

    if (error) {
      this.handleError(error)
    }

    const rawData = data as unknown as Classroom & { users?: { full_name?: string } }
    return {
      ...rawData,
      teacher_name: rawData.users?.full_name || 'Unknown Teacher',
    }
  }

  /**
   * Create a new classroom
   */
  async createClassroom(classroom: ClassroomInsert): Promise<Classroom> {
    const { data, error } = await this.client.from('classrooms').insert(classroom).select().single()

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
   * Get students with their stats (exp and elo) for a classroom
   */
  async getStudentsWithStats(classroomId: string): Promise<StudentWithStats[]> {
    interface MemberWithUser {
      joined_at: string
      users: {
        id: string
        full_name: string
        avatar_url: string | null
      } | null
    }

    const { data, error } = await this.client
      .from('classroom_members')
      .select(
        `
        joined_at,
        users!classroom_members_student_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `,
      )
      .eq('classroom_id', classroomId)
      .order('joined_at', { ascending: false })

    if (error) {
      this.handleError(error)
    }

    // Get exp and elo data for all students
    const students = (data || []) as MemberWithUser[]
    const studentIds = students.map((s) => s.users?.id).filter(Boolean) as string[]

    // Fetch exp data
    const { data: expData } = await this.client
      .from('student_exp')
      .select('student_id, exp')
      .eq('classroom_id', classroomId)
      .in('student_id', studentIds)

    // Fetch elo data
    const { data: eloData } = await this.client
      .from('student_elo')
      .select('user_id, elo_rating')
      .eq('classroom_id', classroomId)
      .in('user_id', studentIds)

    // Create maps for quick lookup
    const expMap = new Map(expData?.map((e) => [e.student_id, e.exp]) || [])
    const eloMap = new Map(eloData?.map((e) => [e.user_id, e.elo_rating]) || [])

    // Combine data
    return students.map((student) => {
      const userId = student.users?.id || ''
      return {
        id: userId,
        full_name: student.users?.full_name || 'Unknown',
        joined_at: student.joined_at,
        exp: expMap.get(userId) || 0,
        elo_rating: eloMap.get(userId) || null,
        avatar_url: student.users?.avatar_url || null,
      }
    })
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
      .eq('allow_new_students', true)
      .maybeSingle()

    if (error) {
      return false
    }

    return !!data
  }
}

// Export a singleton instance
export const classroomService = new ClassroomService()
