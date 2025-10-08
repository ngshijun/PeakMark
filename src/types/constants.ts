export const SUBJECTS = ['Math', 'Science', 'English'] as const
export const DIFFICULTY = ['1', '2', '3', '4', '5'] as const

export const EXP_PER_QUESTION = 10

export type Subject = (typeof SUBJECTS)[number]
export type Difficulty = (typeof DIFFICULTY)[number]
