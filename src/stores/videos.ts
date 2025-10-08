import { videoService } from '@/services/api/video.service'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

type Video = Tables<'videos'>
type VideoInsert = TablesInsert<'videos'>
type VideoUpdate = TablesUpdate<'videos'>

export const useVideoStore = defineStore('video', () => {
  const videos = ref<Video[]>([])
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

  // Fetch videos by subject and year
  const fetchVideosBySubjectYear = async (subject: string, year: string) => {
    loading.value = true
    error.value = null

    try {
      const data = await videoService.getVideosBySubjectYear(subject, year)
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
    loading,
    error,

    // Actions
    fetchVideos,
    fetchStudentVideos,
    fetchVideosBySubjectYear,
    fetchVideoById,
    createVideo,
    updateVideo,
    deleteVideo,
    clearError,
  }
})
