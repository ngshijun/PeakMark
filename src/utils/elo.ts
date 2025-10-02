/**
 * ELO Rating System Utilities
 * Maps teacher difficulty (1-5) to ELO ratings for question matching
 */

const K_FACTOR = 32 // Standard ELO K-factor for rating adjustments
const DEFAULT_STUDENT_ELO = 1200 // Starting ELO for new students
const ELO_MATCH_RANGE = 200 // ±200 ELO points for question matching

/**
 * Convert teacher difficulty (1-5) to ELO rating
 * Difficulty 1 → 1000, 2 → 1100, 3 → 1200, 4 → 1300, 5 → 1400
 */
export const difficultyToElo = (difficulty: number): number => {
  return 800 + difficulty * 200
}

/**
 * Convert ELO rating back to difficulty range for querying
 * Returns min and max difficulty levels
 */
export const eloToDifficultyRange = (studentElo: number): { min: number; max: number } => {
  const minElo = studentElo - ELO_MATCH_RANGE
  const maxElo = studentElo + ELO_MATCH_RANGE

  const minDifficulty = Math.max(1, Math.floor((minElo - 800) / 200))
  const maxDifficulty = Math.min(5, Math.ceil((maxElo - 800) / 200))

  return { min: minDifficulty, max: maxDifficulty }
}

/**
 * Calculate expected score (probability of correct answer)
 * based on ELO difference between student and question
 */
export const calculateExpectedScore = (studentElo: number, questionElo: number): number => {
  return 1 / (1 + Math.pow(10, (questionElo - studentElo) / 400))
}

/**
 * Calculate new student ELO after answering a question
 * @param currentElo - Student's current ELO rating
 * @param questionElo - Question's ELO rating (derived from difficulty)
 * @param isCorrect - Whether the student answered correctly
 * @returns New ELO rating for the student
 */
export const calculateNewStudentElo = (
  currentElo: number,
  questionElo: number,
  isCorrect: boolean,
): number => {
  const expectedScore = calculateExpectedScore(currentElo, questionElo)
  const actualScore = isCorrect ? 1 : 0
  const newElo = currentElo + K_FACTOR * (actualScore - expectedScore)

  return Math.round(newElo)
}

/**
 * Calculate next review date for spaced repetition
 * Wrong answers appear again based on intervals: 1 day, 3 days, 7 days
 * @param attemptCount - Number of times this question was answered incorrectly
 */
export const calculateNextReviewDate = (attemptCount: number): Date => {
  const intervals = [1, 3, 7, 14] // days
  const daysToAdd = intervals[Math.min(attemptCount, intervals.length - 1)] || 1
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + daysToAdd)

  return nextDate
}

export const ELO_CONSTANTS = {
  K_FACTOR,
  DEFAULT_STUDENT_ELO,
  ELO_MATCH_RANGE,
}
