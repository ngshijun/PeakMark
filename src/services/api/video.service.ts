import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { BaseService } from './base.service'

type Video = Tables<'videos'>
type VideoInsert = TablesInsert<'videos'>
type VideoUpdate = TablesUpdate<'videos'>

/**
 * Video service
 * Handles video CRUD and retrieval operations
 */
export class VideoService extends BaseService {
  /**
   * Get all videos
   */
  async getVideos(): Promise<Video[]> {
    const { data, error } = await this.client
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError(error)
    }

    return data || []
  }

  /**
   * Get a single video by ID
   */
  async getVideoById(id: string): Promise<Video | null> {
    const { data, error } = await this.client.from('videos').select('*').eq('id', id).maybeSingle()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Get videos for a student (from enrolled classrooms)
   */
  async getStudentVideos(studentId: string): Promise<Video[]> {
    // First get enrolled classroom IDs
    const { data: memberships, error: memberError } = await this.client
      .from('classroom_members')
      .select('classroom_id')
      .eq('student_id', studentId)

    if (memberError) {
      this.handleError(memberError)
    }

    const classroomIds = memberships?.map((m) => m.classroom_id) || []

    if (classroomIds.length === 0) {
      return []
    }

    // Fetch videos from those classrooms
    const { data, error } = await this.client
      .from('videos')
      .select('*')
      .in('classroom_id', classroomIds)
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError(error)
    }

    return data || []
  }

  /**
   * Get videos by subject and year
   */
  async getVideosBySubjectYear(subject: string, year: string): Promise<Video[]> {
    const { data, error } = await this.client
      .from('videos')
      .select('*')
      .eq('subject', subject)
      .eq('year', year)
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError(error)
    }

    return data || []
  }

  /**
   * Create a new video
   */
  async createVideo(video: VideoInsert): Promise<Video> {
    const { data, error } = await this.client.from('videos').insert(video).select().single()

    if (error) {
      this.handleError(error)
    }

    return data
  }

  /**
   * Update a video
   */
  async updateVideo(id: string, updates: VideoUpdate): Promise<Video> {
    const { data, error } = await this.client
      .from('videos')
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
   * Delete a video
   */
  async deleteVideo(id: string): Promise<void> {
    const { error } = await this.client.from('videos').delete().eq('id', id)

    if (error) {
      this.handleError(error)
    }
  }
}

// Export a singleton instance
export const videoService = new VideoService()
