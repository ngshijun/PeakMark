/**
 * Error handling utilities
 * Provides consistent error handling and user-friendly messages
 */

import type { PostgrestError } from '@supabase/supabase-js'

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Convert API errors to user-friendly messages
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return (error as Error).message
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Handle Supabase/Postgrest errors
 */
export function handleSupabaseError(error: PostgrestError): never {
  // Map common Postgrest error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    '23505': 'This record already exists.',
    '23503': 'Cannot delete this record because it is referenced by other data.',
    '42501': 'You do not have permission to perform this action.',
    PGRST116: 'No rows found.',
    PGRST301: 'Invalid request parameters.',
  }

  const userMessage = errorMessages[error.code] || error.message

  throw new AppError(userMessage, error.code, parseInt(error.code) || 500)
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: unknown): never {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: string }).message

    // Map common auth error messages to user-friendly versions
    const authErrorMessages: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password. Please try again.',
      'Email not confirmed': 'Please verify your email address before logging in.',
      'User already registered': 'An account with this email already exists.',
      'Password should be at least 6 characters':
        'Password must be at least 6 characters long.',
    }

    const userMessage = authErrorMessages[message] || message
    throw new AppError(userMessage, 'AUTH_ERROR', 401)
  }

  throw new AppError('Authentication failed. Please try again.', 'AUTH_ERROR', 401)
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unexpected error occurred'
}
