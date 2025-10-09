import { describe, it, expect } from 'vitest'
import {
  AppError,
  getUserFriendlyErrorMessage,
  handleSupabaseError,
  handleAuthError,
  getErrorMessage,
} from '../errors'
import type { PostgrestError } from '@supabase/supabase-js'

describe('AppError', () => {
  it('should create an error with message, code, and statusCode', () => {
    const error = new AppError('Test error', 'TEST_CODE', 400)

    expect(error.message).toBe('Test error')
    expect(error.code).toBe('TEST_CODE')
    expect(error.statusCode).toBe(400)
    expect(error.name).toBe('AppError')
  })

  it('should create an error with only message', () => {
    const error = new AppError('Test error')

    expect(error.message).toBe('Test error')
    expect(error.code).toBeUndefined()
    expect(error.statusCode).toBeUndefined()
  })

  it('should be instanceof Error', () => {
    const error = new AppError('Test error')

    expect(error instanceof Error).toBe(true)
    expect(error instanceof AppError).toBe(true)
  })
})

describe('getUserFriendlyErrorMessage', () => {
  it('should return AppError message', () => {
    const error = new AppError('Custom error message', 'CODE', 400)
    const result = getUserFriendlyErrorMessage(error)

    expect(result).toBe('Custom error message')
  })

  it('should return regular Error message', () => {
    const error = new Error('Regular error message')
    const result = getUserFriendlyErrorMessage(error)

    expect(result).toBe('Regular error message')
  })

  it('should return default message for unknown error', () => {
    const result = getUserFriendlyErrorMessage({ random: 'object' })

    expect(result).toBe('An unexpected error occurred. Please try again.')
  })

  it('should return default message for null', () => {
    const result = getUserFriendlyErrorMessage(null)

    expect(result).toBe('An unexpected error occurred. Please try again.')
  })
})

describe('handleSupabaseError', () => {
  it('should throw AppError with user-friendly message for known error codes', () => {
    const supabaseError: PostgrestError = {
      message: 'duplicate key value violates unique constraint',
      code: '23505',
      details: '',
      hint: '',
      name: 'PostgrestError',
    }

    expect(() => handleSupabaseError(supabaseError)).toThrow(AppError)
    expect(() => handleSupabaseError(supabaseError)).toThrow('This record already exists.')
  })

  it('should handle foreign key violation', () => {
    const supabaseError: PostgrestError = {
      message: 'foreign key violation',
      code: '23503',
      details: '',
      hint: '',
      name: 'PostgrestError',
    }

    expect(() => handleSupabaseError(supabaseError)).toThrow(
      'Cannot delete this record because it is referenced by other data.',
    )
  })

  it('should handle permission errors', () => {
    const supabaseError: PostgrestError = {
      message: 'permission denied',
      code: '42501',
      details: '',
      hint: '',
      name: 'PostgrestError',
    }

    expect(() => handleSupabaseError(supabaseError)).toThrow(
      'You do not have permission to perform this action.',
    )
  })

  it('should handle no rows found error', () => {
    const supabaseError: PostgrestError = {
      message: 'no rows found',
      code: 'PGRST116',
      details: '',
      hint: '',
      name: 'PostgrestError',
    }

    expect(() => handleSupabaseError(supabaseError)).toThrow('No rows found.')
  })

  it('should use original message for unknown error codes', () => {
    const supabaseError: PostgrestError = {
      message: 'Some unknown database error',
      code: '99999',
      details: '',
      hint: '',
      name: 'PostgrestError',
    }

    expect(() => handleSupabaseError(supabaseError)).toThrow('Some unknown database error')
  })

  it('should set correct error code and status', () => {
    const supabaseError: PostgrestError = {
      message: 'test error',
      code: 'PGRST116',
      details: '',
      hint: '',
      name: 'PostgrestError',
    }

    try {
      handleSupabaseError(supabaseError)
    } catch (error) {
      if (error instanceof AppError) {
        expect(error.code).toBe('PGRST116')
      }
    }
  })
})

describe('handleAuthError', () => {
  it('should throw AppError for invalid credentials', () => {
    const authError = { message: 'Invalid login credentials' }

    expect(() => handleAuthError(authError)).toThrow(AppError)
    expect(() => handleAuthError(authError)).toThrow('Invalid email or password. Please try again.')
  })

  it('should throw AppError for unconfirmed email', () => {
    const authError = { message: 'Email not confirmed' }

    expect(() => handleAuthError(authError)).toThrow(
      'Please verify your email address before logging in.',
    )
  })

  it('should throw AppError for existing user', () => {
    const authError = { message: 'User already registered' }

    expect(() => handleAuthError(authError)).toThrow('An account with this email already exists.')
  })

  it('should throw AppError for weak password', () => {
    const authError = { message: 'Password should be at least 6 characters' }

    expect(() => handleAuthError(authError)).toThrow('Password must be at least 6 characters long.')
  })

  it('should use original message for unknown auth errors', () => {
    const authError = { message: 'Some unknown auth error' }

    expect(() => handleAuthError(authError)).toThrow('Some unknown auth error')
  })

  it('should throw default message for non-object errors', () => {
    expect(() => handleAuthError('string error')).toThrow(
      'Authentication failed. Please try again.',
    )
  })

  it('should set AUTH_ERROR code and 401 status', () => {
    const authError = { message: 'Invalid login credentials' }

    try {
      handleAuthError(authError)
    } catch (error) {
      if (error instanceof AppError) {
        expect(error.code).toBe('AUTH_ERROR')
        expect(error.statusCode).toBe(401)
      }
    }
  })
})

describe('getErrorMessage', () => {
  it('should extract message from AppError', () => {
    const error = new AppError('App error message', 'CODE', 400)
    const result = getErrorMessage(error)

    expect(result).toBe('App error message')
  })

  it('should extract message from Error', () => {
    const error = new Error('Error message')
    const result = getErrorMessage(error)

    expect(result).toBe('Error message')
  })

  it('should return string error as-is', () => {
    const result = getErrorMessage('String error')

    expect(result).toBe('String error')
  })

  it('should return default message for unknown error types', () => {
    const result = getErrorMessage({ random: 'object' })

    expect(result).toBe('An unexpected error occurred')
  })

  it('should return default message for null', () => {
    const result = getErrorMessage(null)

    expect(result).toBe('An unexpected error occurred')
  })

  it('should return default message for undefined', () => {
    const result = getErrorMessage(undefined)

    expect(result).toBe('An unexpected error occurred')
  })
})
