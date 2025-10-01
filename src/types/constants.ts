export const SUBJECTS = ['Math', 'Science', 'English'] as const
export const YEARS = [
  'Primary 1',
  'Primary 2',
  'Primary 3',
  'Primary 4',
  'Primary 5',
  'Primary 6',
] as const
export const DIFFICULTY = ['1', '2', '3', '4', '5'] as const

export type Subject = (typeof SUBJECTS)[number]
export type Year = (typeof YEARS)[number]
export type Difficulty = (typeof DIFFICULTY)[number]
