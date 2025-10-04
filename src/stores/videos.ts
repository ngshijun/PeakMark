import { supabase } from '@/lib/supabaseClient'
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

    const { data, error: fetchError } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })

    loading.value = false

    if (fetchError) {
      error.value = fetchError.message
      throw fetchError
    }

    videos.value = data || []
    return data
  }

  // Fetch videos by subject and year
  const fetchVideosBySubjectYear = async (subject: string, year: string) => {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('videos')
      .select('*')
      .eq('subject', subject)
      .eq('year', year)
      .order('created_at', { ascending: false })

    loading.value = false

    if (fetchError) {
      error.value = fetchError.message
      throw fetchError
    }

    return data || []
  }

  // Fetch a single video by ID
  const fetchVideoById = async (id: string) => {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    loading.value = false

    if (fetchError) {
      error.value = fetchError.message
      throw fetchError
    }

    return data
  }

  // Create a new video
  const createVideo = async (video: VideoInsert) => {
    loading.value = true
    error.value = null

    const { data, error: createError } = await supabase
      .from('videos')
      .insert(video)
      .select()
      .single()

    loading.value = false

    if (createError) {
      error.value = createError.message
      throw createError
    }

    if (data) {
      videos.value.unshift(data)
    }

    return data
  }

  // Update an existing video
  const updateVideo = async (id: string, updates: VideoUpdate) => {
    loading.value = true
    error.value = null

    const { data, error: updateError } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    loading.value = false

    if (updateError) {
      error.value = updateError.message
      throw updateError
    }

    if (data) {
      const index = videos.value.findIndex((v) => v.id === id)
      if (index !== -1) {
        videos.value[index] = data
      }
    }

    return data
  }

  // Delete a video
  const deleteVideo = async (id: string) => {
    loading.value = true
    error.value = null

    const { error: deleteError } = await supabase.from('videos').delete().eq('id', id)

    loading.value = false

    if (deleteError) {
      error.value = deleteError.message
      throw deleteError
    }

    videos.value = videos.value.filter((v) => v.id !== id)
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
    fetchVideosBySubjectYear,
    fetchVideoById,
    createVideo,
    updateVideo,
    deleteVideo,
    clearError,
  }
})
