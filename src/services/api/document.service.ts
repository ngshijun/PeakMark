import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { BaseService } from './base.service'

type Document = Tables<'documents'>
type DocumentInsert = TablesInsert<'documents'>
type DocumentUpdate = TablesUpdate<'documents'>

/**
 * Document service
 * Handles document and folder CRUD operations
 */
export class DocumentService extends BaseService {
  /**
   * Get all documents in a classroom
   * Optionally filter by parent_id to get documents in a specific folder
   */
  async getDocumentsByClassroom(
    classroomId: string,
    parentId?: string | null,
  ): Promise<Document[]> {
    let query = this.client
      .from('documents')
      .select('*')
      .eq('classroom_id', classroomId)
      .order('type', { ascending: false }) // folders first
      .order('name', { ascending: true })

    // Filter by parent_id (null for root level)
    if (parentId === null || parentId === undefined) {
      query = query.is('parent_id', null)
    } else {
      query = query.eq('parent_id', parentId)
    }

    const { data, error } = await query

    if (error) {
      this.handleError(error)
    }

    return data || []
  }

  /**
   * Get a single document by ID
   */
  async getDocumentById(id: string): Promise<Document | null> {
    const { data, error } = await this.client
      .from('documents')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Get all documents in a classroom (no parent filter)
   * Useful for search functionality
   */
  async getAllDocumentsInClassroom(classroomId: string): Promise<Document[]> {
    const { data, error } = await this.client
      .from('documents')
      .select('*')
      .eq('classroom_id', classroomId)
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError(error)
    }

    return data || []
  }

  /**
   * Create a new folder
   */
  async createFolder(
    name: string,
    classroomId: string,
    createdBy: string,
    parentId?: string | null,
  ): Promise<Document> {
    const folderData: DocumentInsert = {
      name,
      type: 'folder',
      classroom_id: classroomId,
      created_by: createdBy,
      parent_id: parentId || null,
    }

    const { data, error } = await this.client.from('documents').insert(folderData).select().single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Update a folder
   */
  async updateFolder(id: string, updates: DocumentUpdate): Promise<Document> {
    const { data, error } = await this.client
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Create a new document (file)
   */
  async createDocument(documentData: DocumentInsert): Promise<Document> {
    const { data, error } = await this.client
      .from('documents')
      .insert(documentData)
      .select()
      .single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Update a document
   */
  async updateDocument(id: string, updates: DocumentUpdate): Promise<Document> {
    const { data, error } = await this.client
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Delete a document or folder
   * Note: Database CASCADE will delete all children if it's a folder
   */
  async deleteDocument(id: string): Promise<void> {
    const { error } = await this.client.from('documents').delete().eq('id', id)

    if (error) {
      this.handleError(error)
    }
  }

  /**
   * Get folder path (breadcrumbs) from root to current folder
   */
  async getFolderPath(folderId: string): Promise<Document[]> {
    const path: Document[] = []
    let currentId: string | null = folderId

    while (currentId) {
      const folder = await this.getDocumentById(currentId)
      if (!folder) break

      path.unshift(folder)
      currentId = folder.parent_id
    }

    return path
  }

  /**
   * Get all descendants of a folder (for calculating total size, etc.)
   */
  async getFolderDescendants(folderId: string): Promise<Document[]> {
    const descendants: Document[] = []
    const queue: string[] = [folderId]

    while (queue.length > 0) {
      const currentId = queue.shift()!
      const { data, error } = await this.client
        .from('documents')
        .select('*')
        .eq('parent_id', currentId)

      if (error) {
        this.handleError(error)
      }

      if (data) {
        descendants.push(...data)
        // Add folder IDs to queue to fetch their children
        const folderIds = data.filter((d) => d.type === 'folder').map((d) => d.id)
        queue.push(...folderIds)
      }
    }

    return descendants
  }
}

// Export a singleton instance
export const documentService = new DocumentService()
