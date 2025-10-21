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

export interface CollaboratorWithUser {
  id: string
  user_id: string
  classroom_id: string
  joined_at: string
  users?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export interface ClassroomWithRole extends ClassroomWithMemberCount {
  userRole?: 'owner' | 'collaborator'
}

/**
 * Classroom service
 * Handles all classroom-related API operations
 */
export class ClassroomService extends BaseService {
  /**
   * Get all classrooms created by a teacher (owned + collaborated)
   */
  async getTeacherClassrooms(teacherId: string): Promise<ClassroomWithRole[]> {
    // Get owned classrooms
    const { data: ownedData, error: ownedError } = await this.client
      .from('classrooms')
      .select(
        `
        *,
        classroom_members(count)
      `,
      )
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })

    if (ownedError) {
      this.handleError(ownedError)
    }

    const ownedClassrooms: ClassroomWithRole[] = (ownedData || []).map((classroom) => {
      const rawData = classroom as unknown as Classroom & {
        classroom_members: { count: number }[] | null
      }
      return {
        ...rawData,
        member_count: rawData.classroom_members?.[0]?.count || 0,
        userRole: 'owner' as const,
      }
    })

    // Get collaborated classrooms
    const collaboratedClassrooms = await this.getCollaboratedClassrooms(teacherId)

    // Combine and return
    return [...ownedClassrooms, ...collaboratedClassrooms]
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
      .eq('user_id', studentId)
      .eq('role', 'student')
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
   * Get all public classrooms that a student can join
   * Excludes classrooms the student is already a member of
   */
  async getPublicClassrooms(studentId?: string): Promise<ClassroomWithMemberCount[]> {
    let query = this.client
      .from('classrooms')
      .select(
        `
        *,
        classroom_members(count),
        users!classrooms_teacher_id_fkey(
          full_name
        )
      `,
      )
      .eq('is_public', true)
      .eq('allow_new_students', true)
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      this.handleError(error)
    }

    const classrooms = (data || []).map((classroom) => {
      const rawData = classroom as unknown as Classroom & {
        classroom_members: { count: number }[] | null
        users?: { full_name?: string }
      }
      return {
        ...rawData,
        member_count: rawData.classroom_members?.[0]?.count || 0,
        teacher_name: rawData.users?.full_name || 'Unknown Teacher',
      }
    })

    // If studentId is provided, filter out classrooms the student is already a member of
    if (studentId) {
      const { data: memberships } = await this.client
        .from('classroom_members')
        .select('classroom_id')
        .eq('user_id', studentId)
        .eq('role', 'student')

      const memberClassroomIds = new Set(memberships?.map((m) => m.classroom_id) || [])
      return classrooms.filter((c) => !memberClassroomIds.has(c.id))
    }

    return classrooms
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
   * Get all members of a classroom (students only)
   */
  async getClassroomMembers(classroomId: string): Promise<ClassroomMemberWithUser[]> {
    const { data, error } = await this.client
      .from('classroom_members')
      .select(
        `
        *,
        users!classroom_members_user_id_fkey(
          id,
          full_name,
          created_at
        )
      `,
      )
      .eq('classroom_id', classroomId)
      .eq('role', 'student')
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
        users!classroom_members_user_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `,
      )
      .eq('classroom_id', classroomId)
      .eq('role', 'student')
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
        user_id: studentId,
        role: 'student',
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
      .eq('user_id', studentId)
      .eq('role', 'student')

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
      .eq('user_id', studentId)
      .eq('role', 'student')
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

  /**
   * Get classrooms where teacher is a collaborator
   */
  async getCollaboratedClassrooms(teacherId: string): Promise<ClassroomWithRole[]> {
    const { data, error } = await this.client
      .from('classroom_members')
      .select(
        `
        classrooms!classroom_members_classroom_id_fkey(
          *,
          classroom_members(count),
          users!classrooms_teacher_id_fkey(
            full_name
          )
        )
      `,
      )
      .eq('user_id', teacherId)
      .eq('role', 'collaborator')
      .order('joined_at', { ascending: false })

    if (error) {
      this.handleError(error)
    }

    return (data || []).map((member) => {
      const rawData = member as unknown as {
        classrooms: Classroom & {
          classroom_members: { count: number }[] | null
          users?: { full_name?: string }
        }
      }
      return {
        ...rawData.classrooms,
        member_count: rawData.classrooms.classroom_members?.[0]?.count || 0,
        teacher_name: rawData.classrooms.users?.full_name || 'Unknown Teacher',
        userRole: 'collaborator' as const,
      }
    })
  }

  /**
   * Get all collaborators for a classroom
   */
  async getCollaborators(classroomId: string): Promise<CollaboratorWithUser[]> {
    const { data, error } = await this.client
      .from('classroom_members')
      .select(
        `
        *,
        users!classroom_members_user_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `,
      )
      .eq('classroom_id', classroomId)
      .eq('role', 'collaborator')
      .order('joined_at', { ascending: false })

    if (error) {
      this.handleError(error)
    }

    return data || []
  }

  /**
   * Add a teacher as collaborator to a classroom
   */
  async addCollaborator(classroomId: string, teacherId: string): Promise<ClassroomMember> {
    const { data, error } = await this.client
      .from('classroom_members')
      .insert({
        classroom_id: classroomId,
        user_id: teacherId,
        role: 'collaborator',
      })
      .select()
      .single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Remove a collaborator from a classroom
   */
  async removeCollaborator(classroomId: string, teacherId: string): Promise<void> {
    const { error } = await this.client
      .from('classroom_members')
      .delete()
      .eq('classroom_id', classroomId)
      .eq('user_id', teacherId)
      .eq('role', 'collaborator')

    if (error) {
      this.handleError(error)
    }
  }

  /**
   * Check if a user is a collaborator in a classroom
   */
  async isCollaborator(classroomId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('classroom_members')
      .select('id')
      .eq('classroom_id', classroomId)
      .eq('user_id', userId)
      .eq('role', 'collaborator')
      .maybeSingle()

    if (error) {
      return false
    }

    return !!data
  }

  /**
   * Check if a user is the owner of a classroom
   */
  async isOwner(classroomId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('classrooms')
      .select('id')
      .eq('id', classroomId)
      .eq('teacher_id', userId)
      .maybeSingle()

    if (error) {
      return false
    }

    return !!data
  }
}

// Export a singleton instance
export const classroomService = new ClassroomService()
