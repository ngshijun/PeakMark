import { MAX_FILE_SIZE, MAX_IMAGE_SIZE } from '@/types/constants'
import { BaseService } from './base.service'
import { AppError } from '@/utils/errors'

/**
 * Storage service
 * Handles file upload/download operations with Supabase Storage
 */
export class StorageService extends BaseService {
  private readonly QUESTION_IMAGES_BUCKET = 'question-images'
  private readonly DOCUMENTS_BUCKET = 'documents'
  private readonly AVATARS_BUCKET = 'avatars'

  /**
   * Upload a question image to storage
   * @param file - The image file to upload
   * @param classroomId - The classroom ID for organizing files
   * @param questionId - The question ID for unique naming
   * @returns The public URL of the uploaded image
   */
  async uploadQuestionImage(file: File, classroomId: string, questionId: string): Promise<string> {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new AppError('File must be an image', 'INVALID_FILE_TYPE', 400)
    }

    // Validate file size
    const MAX_SIZE = MAX_IMAGE_SIZE * 1024 * 1024
    if (file.size > MAX_SIZE) {
      throw new AppError('File size must be less than 5MB', 'FILE_TOO_LARGE', 400)
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const filePath = `${classroomId}/${questionId}-${timestamp}.${fileExt}`

    // Upload to storage
    const { data, error } = await this.client.storage
      .from(this.QUESTION_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw new AppError(`Failed to upload image: ${error.message}`, 'STORAGE_UPLOAD_ERROR', 500)
    }

    // Get public URL
    const { data: urlData } = this.client.storage
      .from(this.QUESTION_IMAGES_BUCKET)
      .getPublicUrl(data.path)

    return urlData.publicUrl
  }

  /**
   * Delete a question image from storage
   * @param imageUrl - The public URL of the image to delete
   */
  async deleteQuestionImage(imageUrl: string): Promise<void> {
    if (!imageUrl) return

    // Extract file path from URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/')
    const bucketIndex = pathParts.indexOf(this.QUESTION_IMAGES_BUCKET)

    if (bucketIndex === -1) {
      throw new AppError('Invalid image URL', 'INVALID_URL', 400)
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/')

    // Delete from storage
    const { error } = await this.client.storage.from(this.QUESTION_IMAGES_BUCKET).remove([filePath])

    if (error) {
      throw new AppError(`Failed to delete image: ${error.message}`, 'STORAGE_DELETE_ERROR', 500)
    }
  }

  /**
   * Get public URL for a question image
   * @param filePath - The storage file path
   * @returns The public URL
   */
  getQuestionImageUrl(filePath: string): string {
    const { data } = this.client.storage.from(this.QUESTION_IMAGES_BUCKET).getPublicUrl(filePath)

    return data.publicUrl
  }

  /**
   * Upload a document to storage
   * @param file - The document file to upload
   * @param classroomId - The classroom ID for organizing files
   * @param documentId - The document ID for unique naming
   * @returns The public URL of the uploaded document
   */
  async uploadDocument(file: File, classroomId: string, documentId: string): Promise<string> {
    // Validate file size
    const MAX_SIZE = MAX_FILE_SIZE * 1024 * 1024
    if (file.size > MAX_SIZE) {
      throw new AppError('File size must be less than 10MB', 'FILE_TOO_LARGE', 400)
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const filePath = `${classroomId}/${documentId}-${timestamp}.${fileExt}`

    // Upload to storage
    const { data, error } = await this.client.storage
      .from(this.DOCUMENTS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw new AppError(`Failed to upload document: ${error.message}`, 'STORAGE_UPLOAD_ERROR', 500)
    }

    // Get public URL
    const { data: urlData } = this.client.storage
      .from(this.DOCUMENTS_BUCKET)
      .getPublicUrl(data.path)

    return urlData.publicUrl
  }

  /**
   * Delete a document from storage
   * @param fileUrl - The public URL of the document to delete
   */
  async deleteDocument(fileUrl: string): Promise<void> {
    if (!fileUrl) return

    // Extract file path from URL
    const url = new URL(fileUrl)
    const pathParts = url.pathname.split('/')
    const bucketIndex = pathParts.indexOf(this.DOCUMENTS_BUCKET)

    if (bucketIndex === -1) {
      throw new AppError('Invalid document URL', 'INVALID_URL', 400)
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/')

    // Delete from storage
    const { error } = await this.client.storage.from(this.DOCUMENTS_BUCKET).remove([filePath])

    if (error) {
      throw new AppError(`Failed to delete document: ${error.message}`, 'STORAGE_DELETE_ERROR', 500)
    }
  }

  /**
   * Get public URL for a document
   * @param filePath - The storage file path
   * @returns The public URL
   */
  getDocumentUrl(filePath: string): string {
    const { data } = this.client.storage.from(this.DOCUMENTS_BUCKET).getPublicUrl(filePath)

    return data.publicUrl
  }

  /**
   * Upload an avatar image to storage
   * @param file - The image file to upload
   * @param userId - The user ID for unique naming
   * @returns The public URL of the uploaded avatar
   */
  async uploadAvatar(file: File, userId: string): Promise<string> {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new AppError('File must be an image', 'INVALID_FILE_TYPE', 400)
    }

    // Validate file size (5MB max)
    const MAX_SIZE = MAX_IMAGE_SIZE * 1024 * 1024
    if (file.size > MAX_SIZE) {
      throw new AppError('File size must be less than 5MB', 'FILE_TOO_LARGE', 400)
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const filePath = `${userId}/avatar-${timestamp}.${fileExt}`

    // Upload to storage
    const { data, error } = await this.client.storage
      .from(this.AVATARS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Allow overwriting old avatars
      })

    if (error) {
      throw new AppError(`Failed to upload avatar: ${error.message}`, 'STORAGE_UPLOAD_ERROR', 500)
    }

    // Get public URL
    const { data: urlData } = this.client.storage.from(this.AVATARS_BUCKET).getPublicUrl(data.path)

    return urlData.publicUrl
  }

  /**
   * Delete an avatar from storage
   * @param avatarUrl - The public URL of the avatar to delete
   */
  async deleteAvatar(avatarUrl: string): Promise<void> {
    if (!avatarUrl) return

    // Extract file path from URL
    const url = new URL(avatarUrl)
    const pathParts = url.pathname.split('/')
    const bucketIndex = pathParts.indexOf(this.AVATARS_BUCKET)

    if (bucketIndex === -1) {
      throw new AppError('Invalid avatar URL', 'INVALID_URL', 400)
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/')

    // Delete from storage
    const { error } = await this.client.storage.from(this.AVATARS_BUCKET).remove([filePath])

    if (error) {
      throw new AppError(`Failed to delete avatar: ${error.message}`, 'STORAGE_DELETE_ERROR', 500)
    }
  }

  /**
   * Get public URL for an avatar
   * @param filePath - The storage file path
   * @returns The public URL
   */
  getAvatarUrl(filePath: string): string {
    const { data } = this.client.storage.from(this.AVATARS_BUCKET).getPublicUrl(filePath)

    return data.publicUrl
  }
}

// Export a singleton instance
export const storageService = new StorageService()
