import { describe, it, expect, beforeEach, vi } from 'vitest'
import { profileService } from '../profile.service'
import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

// Mock stats utility
vi.mock('@/utils/stats', () => ({
  calculateStudentStats: vi.fn((attempts) => ({
    questionsAnswered: attempts.length,
    accuracyRate: 75,
    studyStreak: 3,
    setsCompleted: 0,
  })),
}))

describe('ProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserProfile', () => {
    it('should fetch user profile by ID', async () => {
      const mockProfile = {
        id: 'user-1',
        full_name: 'John Doe',
        dob: '2000-01-01',
        role: 'student',
        email: 'john@example.com',
      }

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await profileService.getUserProfile('user-1')

      expect(supabase.from).toHaveBeenCalledWith('users')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-1')
      expect(result).toEqual(mockProfile)
    })

    it('should throw AppError when user not found', async () => {
      const mockError = {
        message: 'User not found',
        code: 'PGRST116',
        details: '',
        hint: '',
      }

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      await expect(profileService.getUserProfile('nonexistent-id')).rejects.toThrow(AppError)
    })
  })

  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      const updates = {
        full_name: 'Jane Doe',
        dob: '2001-02-02',
      }

      const mockUpdatedProfile = {
        id: 'user-1',
        ...updates,
        role: 'student',
        email: 'jane@example.com',
        updated_at: new Date().toISOString(),
      }

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await profileService.updateUserProfile('user-1', updates)

      expect(supabase.from).toHaveBeenCalledWith('users')
      expect(mockQuery.update).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-1')
      expect(result).toEqual(mockUpdatedProfile)
    })

    it('should include updated_at timestamp', async () => {
      const updates = { full_name: 'Jane Doe' }
      let capturedUpdate: any

      const mockQuery = {
        update: vi.fn((data) => {
          capturedUpdate = data
          return mockQuery
        }),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-1', ...updates },
          error: null,
        }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      await profileService.updateUserProfile('user-1', updates)

      expect(capturedUpdate).toHaveProperty('updated_at')
      expect(capturedUpdate.updated_at).toBeTruthy()
    })
  })

  describe('getQuestionAttempts', () => {
    it('should fetch question attempts for a user', async () => {
      const mockAttempts = [
        {
          id: 'attempt-1',
          question_id: 'q1',
          attempted_by: 'user-1',
          is_correct: true,
          created_at: '2025-01-01T10:00:00Z',
        },
        {
          id: 'attempt-2',
          question_id: 'q2',
          attempted_by: 'user-1',
          is_correct: false,
          created_at: '2025-01-01T11:00:00Z',
        },
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockAttempts, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await profileService.getQuestionAttempts('user-1')

      expect(supabase.from).toHaveBeenCalledWith('question_attempts')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('attempted_by', 'user-1')
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockAttempts)
    })

    it('should return empty array when no attempts found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await profileService.getQuestionAttempts('user-1')

      expect(result).toEqual([])
    })
  })

  describe('getStudentStatistics', () => {
    it('should calculate statistics from question attempts', async () => {
      const mockAttempts = [
        {
          id: 'attempt-1',
          question_id: 'q1',
          attempted_by: 'user-1',
          is_correct: true,
          created_at: '2025-01-01T10:00:00Z',
        },
        {
          id: 'attempt-2',
          question_id: 'q2',
          attempted_by: 'user-1',
          is_correct: true,
          created_at: '2025-01-01T11:00:00Z',
        },
        {
          id: 'attempt-3',
          question_id: 'q3',
          attempted_by: 'user-1',
          is_correct: false,
          created_at: '2025-01-01T12:00:00Z',
        },
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockAttempts, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await profileService.getStudentStatistics('user-1')

      expect(result).toEqual({
        questionsAnswered: 3,
        accuracyRate: 75,
        studyStreak: 3,
        setsCompleted: 0,
      })
    })

    it('should return zero stats when no attempts exist', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      // Mock the calculateStudentStats to return zeros for empty array
      const { calculateStudentStats } = await import('@/utils/stats')
      vi.mocked(calculateStudentStats).mockReturnValue({
        questionsAnswered: 0,
        accuracyRate: 0,
        studyStreak: 0,
        setsCompleted: 0,
      })

      const result = await profileService.getStudentStatistics('user-1')

      expect(result).toEqual({
        questionsAnswered: 0,
        accuracyRate: 0,
        studyStreak: 0,
        setsCompleted: 0,
      })
    })
  })
})
