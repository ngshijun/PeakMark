import { videoService } from '@/services/api/video.service'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

type Video = Tables<'videos'>
type VideoInsert = TablesInsert<'videos'>
type VideoUpdate = TablesUpdate<'videos'>

export const useVideoStore = defineStore('video', () => {
  const videos = ref<Video[]>([])
  const folderPath = ref<Video[]>([])
  const currentFolderId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch all videos
  const fetchVideos = async () => {
    loading.value = true
    error.value = null

    try {
      const data = await videoService.getVideos()
      videos.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch videos by folder
  const fetchVideosByFolder = async (classroomId: string, parentId: string | null = null) => {
    loading.value = true
    error.value = null

    try {
      const data = await videoService.getVideosByFolder(classroomId, parentId)
      videos.value = data
      currentFolderId.value = parentId
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Navigate to a folder
  const navigateToFolder = async (classroomId: string, folderId: string | null) => {
    loading.value = true
    error.value = null

    try {
      // Fetch folder path for breadcrumbs
      if (folderId) {
        folderPath.value = await videoService.getFolderPath(folderId)
      } else {
        folderPath.value = []
      }

      // Fetch videos in this folder
      await fetchVideosByFolder(classroomId, folderId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create a folder
  const createFolder = async (
    title: string,
    classroomId: string,
    createdBy: string,
    parentId: string | null = null,
  ) => {
    loading.value = true
    error.value = null

    try {
      const data = await videoService.createFolder(title, classroomId, createdBy, parentId)
      videos.value.unshift(data)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update a folder
  const updateFolder = async (id: string, updates: VideoUpdate) => {
    loading.value = true
    error.value = null

    try {
      const data = await videoService.updateFolder(id, updates)
      const index = videos.value.findIndex((v) => v.id === id)
      if (index !== -1) {
        videos.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch videos for student (from enrolled classrooms)
  const fetchStudentVideos = async (studentId: string) => {
    loading.value = true
    error.value = null

    try {
      const data = await videoService.getStudentVideos(studentId)
      videos.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch a single video by ID
  const fetchVideoById = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const data = await videoService.getVideoById(id)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create a new video
  const createVideo = async (video: VideoInsert) => {
    loading.value = true
    error.value = null

    try {
      const data = await videoService.createVideo(video)
      videos.value.unshift(data)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update an existing video
  const updateVideo = async (id: string, updates: VideoUpdate) => {
    loading.value = true
    error.value = null

    try {
      const data = await videoService.updateVideo(id, updates)
      const index = videos.value.findIndex((v) => v.id === id)
      if (index !== -1) {
        videos.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete a video
  const deleteVideo = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await videoService.deleteVideo(id)
      videos.value = videos.value.filter((v) => v.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Clear error
  const clearError = () => {
    error.value = null
  }

  return {
    // State
    videos,
    folderPath,
    currentFolderId,
    loading,
    error,

    // Actions
    fetchVideos,
    fetchVideosByFolder,
    navigateToFolder,
    createFolder,
    updateFolder,
    fetchStudentVideos,
    fetchVideoById,
    createVideo,
    updateVideo,
    deleteVideo,
    clearError,
  }
})
