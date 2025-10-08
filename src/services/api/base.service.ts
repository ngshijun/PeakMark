import { supabase } from '@/lib/supabaseClient'
import { AppError, handleSupabaseError } from '@/utils/errors'
import type { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js'

/**
 * Base service class with common API methods
 * Provides error handling, type safety, and consistent patterns for all services
 */
export class BaseService {
  /**
   * Execute a query and return data with type safety
   * @throws AppError if the query fails
   */
  protected async query<T>(
    queryBuilder: Promise<PostgrestSingleResponse<T>>,
  ): Promise<T> {
    const { data, error } = await queryBuilder

    if (error) {
      this.handleError(error)
    }

    if (data === null) {
      throw new AppError('No data returned from query', 'NO_DATA', 404)
    }

    return data
  }

  /**
   * Execute an insert operation
   * @throws AppError if the insert fails
   */
  protected async insert<T>(
    queryBuilder: Promise<PostgrestSingleResponse<T>>,
  ): Promise<T> {
    return this.query(queryBuilder)
  }

  /**
   * Execute an update operation
   * @throws AppError if the update fails
   */
  protected async update<T>(
    queryBuilder: Promise<PostgrestSingleResponse<T>>,
  ): Promise<T> {
    return this.query(queryBuilder)
  }

  /**
   * Execute a delete operation
   * @throws AppError if the delete fails
   */
  protected async delete(
    queryBuilder: Promise<PostgrestSingleResponse<void>>,
  ): Promise<void> {
    const { error } = await queryBuilder

    if (error) {
      this.handleError(error)
    }
  }

  /**
   * Handle Supabase errors and convert to AppError
   * @throws AppError with appropriate message and code
   */
  protected handleError(error: PostgrestError): never {
    return handleSupabaseError(error)
  }

  /**
   * Get the Supabase client instance
   */
  protected get client() {
    return supabase
  }
}
