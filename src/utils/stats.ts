/**
 * Student statistics calculation utilities
 */

export interface QuestionAttempt {
  is_correct: boolean
  created_at: string
}

export interface StudentStats {
  questionsAnswered: number
  accuracyRate: number
  studyStreak: number
  setsCompleted: number
}

/**
 * Calculate student statistics from question attempts
 */
export function calculateStudentStats(attempts: QuestionAttempt[]): StudentStats {
  if (!attempts || attempts.length === 0) {
    return {
      questionsAnswered: 0,
      accuracyRate: 0,
      studyStreak: 0,
      setsCompleted: 0,
    }
  }

  const questionsAnswered = attempts.length
  const correctAnswers = attempts.filter((a) => a.is_correct).length
  const accuracyRate = Math.round((correctAnswers / questionsAnswered) * 100)
  const studyStreak = calculateStudyStreak(attempts)

  return {
    questionsAnswered,
    accuracyRate,
    studyStreak,
    setsCompleted: 0, // TODO: Implement when practice sets are added
  }
}

/**
 * Calculate consecutive study streak in days
 */
function calculateStudyStreak(attempts: QuestionAttempt[]): number {
  const uniqueDates = [
    ...new Set(attempts.map((a) => new Date(a.created_at).toDateString())),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  if (uniqueDates.length === 0) return 0

  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  // Only count streak if activity is today or yesterday
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return 0
  }

  let streak = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDateStr = uniqueDates[i - 1]
    const prevDateStr = uniqueDates[i]
    if (!currentDateStr || !prevDateStr) continue

    const currentDate = new Date(currentDateStr)
    const prevDate = new Date(prevDateStr)
    const diffTime = currentDate.getTime() - prevDate.getTime()
    const diffDays = Math.round(diffTime / 86400000)

    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}
