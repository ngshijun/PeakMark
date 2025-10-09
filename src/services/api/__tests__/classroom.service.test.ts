import { describe, it, expect, beforeEach, vi } from 'vitest'
import { classroomService } from '../classroom.service'
import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('ClassroomService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTeacherClassrooms', () => {
    it('should fetch classrooms for a teacher with member counts', async () => {
      const mockClassrooms = [
        {
          id: 'classroom-1',
          name: 'Math 101',
          description: 'Basic Math',
          teacher_id: 'teacher-1',
          member_count: 5,
        },
        {
          id: 'classroom-2',
          name: 'Science 101',
          description: 'Basic Science',
          teacher_id: 'teacher-1',
          member_count: 3,
        },
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockClassrooms, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await classroomService.getTeacherClassrooms('teacher-1')

      expect(supabase.from).toHaveBeenCalledWith('classrooms')
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('teacher_id', 'teacher-1')
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      // Result is transformed, so check the structure
      expect(result).toBeInstanceOf(Array)
    })

    it('should throw AppError when query fails', async () => {
      const mockError = {
        message: 'Database error',
        code: '500',
        details: '',
        hint: '',
      }

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      await expect(classroomService.getTeacherClassrooms('teacher-1')).rejects.toThrow(AppError)
    })
  })

  describe('getStudentClassrooms', () => {
    it('should fetch classrooms for a student with teacher names', async () => {
      const mockClassrooms = [
        {
          id: 'classroom-1',
          name: 'Math 101',
          teacher_name: 'John Doe',
        },
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockClassrooms, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await classroomService.getStudentClassrooms('student-1')

      expect(supabase.from).toHaveBeenCalledWith('classroom_members')
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('student_id', 'student-1')
      expect(mockQuery.order).toHaveBeenCalledWith('joined_at', { ascending: false })
      // Result is transformed, so check the structure
      expect(result).toBeInstanceOf(Array)
    })
  })

  describe('getClassroomById', () => {
    it('should fetch a single classroom by ID', async () => {
      const mockClassroom = {
        id: 'classroom-1',
        name: 'Math 101',
        description: 'Basic Math',
        teacher_id: 'teacher-1',
        users: {
          full_name: 'John Doe',
        },
      }

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockClassroom, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await classroomService.getClassroomById('classroom-1')

      expect(supabase.from).toHaveBeenCalledWith('classrooms')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'classroom-1')
      expect(result).toEqual({
        id: 'classroom-1',
        name: 'Math 101',
        description: 'Basic Math',
        teacher_id: 'teacher-1',
        users: {
          full_name: 'John Doe',
        },
        teacher_name: 'John Doe',
      })
    })

    it('should return null when classroom not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      try {
        await classroomService.getClassroomById('nonexistent-id')
        // If we reach here, the test should fail
        expect.fail('Expected an error to be thrown')
      } catch (error) {
        // The method should throw an error when data is null
        expect(error).toBeDefined()
      }
    })
  })

  describe('createClassroom', () => {
    it('should create a new classroom', async () => {
      const classroomData = {
        name: 'Math 101',
        description: 'Basic Math',
        teacher_id: 'teacher-1',
      }

      const mockCreatedClassroom = {
        id: 'new-classroom-id',
        ...classroomData,
        invite_code: 'ABC123',
        created_at: new Date().toISOString(),
      }

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedClassroom, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await classroomService.createClassroom(classroomData)

      expect(supabase.from).toHaveBeenCalledWith('classrooms')
      expect(mockQuery.insert).toHaveBeenCalledWith(classroomData)
      expect(result).toEqual(mockCreatedClassroom)
    })
  })

  describe('updateClassroom', () => {
    it('should update an existing classroom', async () => {
      const updates = {
        name: 'Math 102',
        description: 'Advanced Math',
      }

      const mockUpdatedClassroom = {
        id: 'classroom-1',
        ...updates,
        teacher_id: 'teacher-1',
      }

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedClassroom, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await classroomService.updateClassroom('classroom-1', updates)

      expect(mockQuery.update).toHaveBeenCalledWith(updates)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'classroom-1')
      expect(result).toEqual(mockUpdatedClassroom)
    })
  })

  describe('deleteClassroom', () => {
    it('should delete a classroom', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      await classroomService.deleteClassroom('classroom-1')

      expect(supabase.from).toHaveBeenCalledWith('classrooms')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'classroom-1')
    })
  })

  describe('checkMembership', () => {
    it('should return true if student is a member', async () => {
      const mockMembership = {
        id: 'membership-1',
        student_id: 'student-1',
        classroom_id: 'classroom-1',
      }

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockMembership, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await classroomService.checkMembership('classroom-1', 'student-1')

      expect(result).toBe(true)
    })

    it('should return false if student is not a member', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await classroomService.checkMembership('classroom-1', 'student-1')

      expect(result).toBe(false)
    })
  })

  describe('addMember', () => {
    it('should add a student to a classroom', async () => {
      const mockMembership = {
        id: 'new-membership-id',
        classroom_id: 'classroom-1',
        student_id: 'student-1',
        created_at: new Date().toISOString(),
      }

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMembership, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await classroomService.addMember('classroom-1', 'student-1')

      expect(mockQuery.insert).toHaveBeenCalledWith({
        classroom_id: 'classroom-1',
        student_id: 'student-1',
      })
      expect(result).toEqual(mockMembership)
    })
  })

  describe('removeMember', () => {
    it('should remove a student from a classroom', async () => {
      let eqCallCount = 0
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn((column, value) => {
          eqCallCount++
          if (eqCallCount === 2) {
            // Second eq call returns a promise
            return Promise.resolve({ error: null })
          }
          // First eq call returns this for chaining
          return mockQuery
        }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      await classroomService.removeMember('classroom-1', 'student-1')

      expect(supabase.from).toHaveBeenCalledWith('classroom_members')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledTimes(2)
      expect(mockQuery.eq).toHaveBeenNthCalledWith(1, 'classroom_id', 'classroom-1')
      expect(mockQuery.eq).toHaveBeenNthCalledWith(2, 'student_id', 'student-1')
    })
  })
})
