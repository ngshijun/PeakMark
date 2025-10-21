import type { Tables } from '@/types/database.types'
import { BaseService } from './base.service'

type User = Tables<'users'>

export interface UserWithEmail {
  id: string
  email: string
  full_name: string
  role: string | null
  avatar_url: string | null
}

/**
 * User service
 * Handles user lookup and profile operations
 */
export class UserService extends BaseService {
  /**
   * Get user by email address
   * Queries the public.users table which now has an email column
   */
  async getUserByEmail(email: string): Promise<UserWithEmail | null> {
    const { data, error } = await this.client
      .from('users')
      .select('id, email, full_name, role, avatar_url')
      .eq('email', email)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      email: data.email || '',
      full_name: data.full_name,
      role: data.role,
      avatar_url: data.avatar_url,
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      return null
    }

    return data
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: string): Promise<User[]> {
    const { data, error } = await this.client.from('users').select('*').eq('role', role)

    if (error) {
      this.handleError(error)
    }

    return data || []
  }

  /**
   * Check if user is a teacher
   */
  async isTeacher(userId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) {
      return false
    }

    return data.role === 'teacher'
  }
}

// Export a singleton instance
export const userService = new UserService()
