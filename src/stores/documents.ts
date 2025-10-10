import { documentService } from '@/services/api/document.service'
import { storageService } from '@/services/api/storage.service'
import type { Tables, TablesInsert } from '@/types/database.types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

type Document = Tables<'documents'>
type DocumentInsert = TablesInsert<'documents'>

export const useDocumentStore = defineStore('document', () => {
  const documents = ref<Document[]>([])
  const currentFolderId = ref<string | null>(null)
  const folderPath = ref<Document[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed: Get documents in current folder
  const currentFolderDocuments = computed(() => {
    return documents.value
  })

  // Computed: Get folders only
  const folders = computed(() => {
    return documents.value.filter((doc) => doc.type === 'folder')
  })

  // Computed: Get files only
  const files = computed(() => {
    return documents.value.filter((doc) => doc.type === 'file')
  })

  /**
   * Fetch documents for a specific classroom and folder
   */
  const fetchDocuments = async (classroomId: string, parentId?: string | null) => {
    loading.value = true
    error.value = null

    try {
      const data = await documentService.getDocumentsByClassroom(classroomId, parentId)
      documents.value = data
      currentFolderId.value = parentId || null

      // Update folder path if navigating to a folder
      if (parentId) {
        const path = await documentService.getFolderPath(parentId)
        folderPath.value = path
      } else {
        folderPath.value = []
      }

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch documents'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new folder
   */
  const createFolder = async (
    name: string,
    classroomId: string,
    createdBy: string,
    parentId?: string | null,
  ) => {
    loading.value = true
    error.value = null

    try {
      const newFolder = await documentService.createFolder(name, classroomId, createdBy, parentId)
      documents.value.unshift(newFolder)
      return newFolder
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create folder'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Upload a document file
   */
  const uploadDocument = async (
    file: File,
    classroomId: string,
    createdBy: string,
    parentId?: string | null,
  ) => {
    loading.value = true
    error.value = null

    try {
      // First, create a placeholder document record to get the ID
      const documentData: DocumentInsert = {
        name: file.name,
        type: 'file',
        classroom_id: classroomId,
        created_by: createdBy,
        parent_id: parentId || null,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
      }

      const newDocument = await documentService.createDocument(documentData)

      // Upload the file to storage
      const fileUrl = await storageService.uploadDocument(file, classroomId, newDocument.id)

      // Extract file path from URL
      const url = new URL(fileUrl)
      const pathParts = url.pathname.split('/')
      const bucketIndex = pathParts.indexOf('documents')
      const filePath = pathParts.slice(bucketIndex + 1).join('/')

      // Update the document record with file URL and path
      const updatedDocument = await documentService.updateDocument(newDocument.id, {
        file_url: fileUrl,
        file_path: filePath,
      })

      // Add to the list
      documents.value.unshift(updatedDocument)

      return updatedDocument
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to upload document'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a document or folder
   */
  const deleteDocument = async (documentId: string) => {
    loading.value = true
    error.value = null

    try {
      // Find the document first
      const document = documents.value.find((d) => d.id === documentId)

      if (!document) {
        throw new Error('Document not found')
      }

      // If it's a file, delete from storage first
      if (document.type === 'file' && document.file_url) {
        await storageService.deleteDocument(document.file_url)
      }

      // If it's a folder, delete all files in it recursively
      if (document.type === 'folder') {
        const descendants = await documentService.getFolderDescendants(documentId)
        const fileDescendants = descendants.filter((d) => d.type === 'file' && d.file_url)

        // Delete all files from storage
        await Promise.all(
          fileDescendants.map((file) => storageService.deleteDocument(file.file_url!)),
        )
      }

      // Delete from database (CASCADE will handle children)
      await documentService.deleteDocument(documentId)

      // Remove from local state
      documents.value = documents.value.filter((d) => d.id !== documentId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete document'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Navigate to a folder
   */
  const navigateToFolder = async (classroomId: string, folderId: string | null) => {
    await fetchDocuments(classroomId, folderId)
  }

  /**
   * Rename a document or folder
   */
  const renameDocument = async (documentId: string, newName: string) => {
    loading.value = true
    error.value = null

    try {
      const updatedDocument = await documentService.updateDocument(documentId, { name: newName })

      // Update local state
      const index = documents.value.findIndex((d) => d.id === documentId)
      if (index !== -1) {
        documents.value[index] = updatedDocument
      }

      return updatedDocument
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to rename document'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Clear error
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Reset store state
   */
  const resetState = () => {
    documents.value = []
    currentFolderId.value = null
    folderPath.value = []
    error.value = null
  }

  return {
    // State
    documents,
    currentFolderId,
    folderPath,
    loading,
    error,

    // Getters
    currentFolderDocuments,
    folders,
    files,

    // Actions
    fetchDocuments,
    createFolder,
    uploadDocument,
    deleteDocument,
    navigateToFolder,
    renameDocument,
    clearError,
    resetState,
  }
})
