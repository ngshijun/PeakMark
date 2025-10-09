import { describe, it, expect, beforeEach, vi } from 'vitest'
import { calculateStudentStats } from '../stats'
import type { QuestionAttempt } from '../stats'

describe('calculateStudentStats', () => {
  beforeEach(() => {
    // Reset date mocks before each test
    vi.useRealTimers()
  })

  it('should return zero stats for empty attempts array', () => {
    const result = calculateStudentStats([])

    expect(result).toEqual({
      questionsAnswered: 0,
      accuracyRate: 0,
      studyStreak: 0,
      setsCompleted: 0,
    })
  })

  it('should calculate questions answered correctly', () => {
    const attempts: QuestionAttempt[] = [
      { is_correct: true, created_at: '2025-01-01T10:00:00Z' },
      { is_correct: false, created_at: '2025-01-01T11:00:00Z' },
      { is_correct: true, created_at: '2025-01-01T12:00:00Z' },
    ]

    const result = calculateStudentStats(attempts)

    expect(result.questionsAnswered).toBe(3)
  })

  it('should calculate accuracy rate correctly', () => {
    const attempts: QuestionAttempt[] = [
      { is_correct: true, created_at: '2025-01-01T10:00:00Z' },
      { is_correct: true, created_at: '2025-01-01T11:00:00Z' },
      { is_correct: false, created_at: '2025-01-01T12:00:00Z' },
      { is_correct: true, created_at: '2025-01-01T13:00:00Z' },
    ]

    const result = calculateStudentStats(attempts)

    // 3 correct out of 4 = 75%
    expect(result.accuracyRate).toBe(75)
  })

  it('should calculate accuracy rate as 100% when all answers are correct', () => {
    const attempts: QuestionAttempt[] = [
      { is_correct: true, created_at: '2025-01-01T10:00:00Z' },
      { is_correct: true, created_at: '2025-01-01T11:00:00Z' },
      { is_correct: true, created_at: '2025-01-01T12:00:00Z' },
    ]

    const result = calculateStudentStats(attempts)

    expect(result.accuracyRate).toBe(100)
  })

  it('should calculate accuracy rate as 0% when all answers are incorrect', () => {
    const attempts: QuestionAttempt[] = [
      { is_correct: false, created_at: '2025-01-01T10:00:00Z' },
      { is_correct: false, created_at: '2025-01-01T11:00:00Z' },
    ]

    const result = calculateStudentStats(attempts)

    expect(result.accuracyRate).toBe(0)
  })

  it('should calculate study streak for consecutive days', () => {
    // Mock today's date
    const mockToday = new Date('2025-01-05T12:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockToday)

    const attempts: QuestionAttempt[] = [
      { is_correct: true, created_at: '2025-01-05T10:00:00Z' }, // Today
      { is_correct: true, created_at: '2025-01-04T10:00:00Z' }, // Yesterday
      { is_correct: true, created_at: '2025-01-03T10:00:00Z' }, // 2 days ago
      { is_correct: true, created_at: '2025-01-02T10:00:00Z' }, // 3 days ago
    ]

    const result = calculateStudentStats(attempts)

    expect(result.studyStreak).toBe(4)
  })

  it('should calculate study streak when activity is only today', () => {
    const mockToday = new Date('2025-01-05T12:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockToday)

    const attempts: QuestionAttempt[] = [
      { is_correct: true, created_at: '2025-01-05T10:00:00Z' },
      { is_correct: true, created_at: '2025-01-05T11:00:00Z' },
      { is_correct: true, created_at: '2025-01-05T12:00:00Z' },
    ]

    const result = calculateStudentStats(attempts)

    expect(result.studyStreak).toBe(1)
  })

  it('should return 0 streak if last activity was more than 1 day ago', () => {
    const mockToday = new Date('2025-01-05T12:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockToday)

    const attempts: QuestionAttempt[] = [
      { is_correct: true, created_at: '2025-01-03T10:00:00Z' }, // 2 days ago
      { is_correct: true, created_at: '2025-01-02T10:00:00Z' }, // 3 days ago
    ]

    const result = calculateStudentStats(attempts)

    expect(result.studyStreak).toBe(0)
  })

  it('should break streak when there is a gap in consecutive days', () => {
    const mockToday = new Date('2025-01-05T12:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockToday)

    const attempts: QuestionAttempt[] = [
      { is_correct: true, created_at: '2025-01-05T10:00:00Z' }, // Today
      { is_correct: true, created_at: '2025-01-04T10:00:00Z' }, // Yesterday
      // Gap here - no activity on Jan 3
      { is_correct: true, created_at: '2025-01-02T10:00:00Z' }, // 3 days ago
      { is_correct: true, created_at: '2025-01-01T10:00:00Z' }, // 4 days ago
    ]

    const result = calculateStudentStats(attempts)

    // Streak should only count today and yesterday
    expect(result.studyStreak).toBe(2)
  })

  it('should count streak starting from yesterday', () => {
    const mockToday = new Date('2025-01-05T12:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockToday)

    const attempts: QuestionAttempt[] = [
      { is_correct: true, created_at: '2025-01-04T10:00:00Z' }, // Yesterday
      { is_correct: true, created_at: '2025-01-03T10:00:00Z' }, // 2 days ago
      { is_correct: true, created_at: '2025-01-02T10:00:00Z' }, // 3 days ago
    ]

    const result = calculateStudentStats(attempts)

    expect(result.studyStreak).toBe(3)
  })

  it('should handle multiple attempts on the same day', () => {
    const mockToday = new Date('2025-01-05T12:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockToday)

    const attempts: QuestionAttempt[] = [
      { is_correct: true, created_at: '2025-01-05T10:00:00Z' },
      { is_correct: true, created_at: '2025-01-05T11:00:00Z' },
      { is_correct: true, created_at: '2025-01-05T14:00:00Z' },
      { is_correct: true, created_at: '2025-01-04T10:00:00Z' },
      { is_correct: true, created_at: '2025-01-04T15:00:00Z' },
    ]

    const result = calculateStudentStats(attempts)

    // Should count as 2 day streak (today and yesterday)
    expect(result.studyStreak).toBe(2)
  })

  it('should always return setsCompleted as 0 (not yet implemented)', () => {
    const attempts: QuestionAttempt[] = [{ is_correct: true, created_at: '2025-01-01T10:00:00Z' }]

    const result = calculateStudentStats(attempts)

    expect(result.setsCompleted).toBe(0)
  })
})
