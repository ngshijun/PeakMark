import type { Session, User, AuthChangeEvent, Subscription } from '@supabase/supabase-js'
import { AppError, handleAuthError } from '@/utils/errors'
import { BaseService } from './base.service'

/**
 * Authentication service
 * Handles all auth-related API calls
 */
export class AuthService extends BaseService {
  /**
   * Get the current session
   */
  async getSession(): Promise<Session | null> {
    const {
      data: { session },
      error,
    } = await this.client.auth.getSession()

    if (error) {
      throw new AppError(error.message, error.name, error.status)
    }

    return session
  }

  /**
   * Sign up a new user
   */
  async signUp(
    email: string,
    password: string,
    metaData: { full_name: string; dob: string; role: string },
  ): Promise<void> {
    const { error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: metaData,
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      handleAuthError(error)
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithPassword(email: string, password: string): Promise<User> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      handleAuthError(error)
    }

    if (!data.user) {
      throw new AppError('No user returned from sign in', 'AUTH_ERROR', 401)
    }

    return data.user
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut()

    if (error) {
      handleAuthError(error)
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      handleAuthError(error)
    }
  }

  /**
   * Update user password (used after clicking reset link)
   */
  async updatePassword(newPassword: string): Promise<User> {
    const { data, error } = await this.client.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      handleAuthError(error)
    }

    if (!data.user) {
      throw new AppError('No user returned from password update', 'AUTH_ERROR', 401)
    }

    return data.user
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void | Promise<void>,
  ): Subscription {
    const {
      data: { subscription },
    } = this.client.auth.onAuthStateChange(callback)

    return subscription
  }
}

// Export a singleton instance
export const authService = new AuthService()
