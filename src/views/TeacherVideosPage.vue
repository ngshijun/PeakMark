<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-4">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Videos</h1>
        <p class="text-muted-foreground">Upload and manage video resources for your classroom</p>
      </div>

      <!-- Filters and Actions -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <!-- Search Input -->
        <div class="relative flex-1 sm:max-w-md">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input v-model="searchQuery" type="search" placeholder="Search videos..." class="pl-8" />
        </div>

        <!-- Upload Video Button -->
        <Button @click="isUploadDialogOpen = true">
          <Plus class="mr-2 h-4 w-4" />
          Upload Video
        </Button>
      </div>

      <!-- Videos Grid -->
      <div class="flex-1 min-h-0 rounded-xl border bg-card overflow-hidden">
        <div class="h-full overflow-auto">
          <div
            v-if="videoStore.loading"
            class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-4"
          >
            <div v-for="i in 8" :key="i" class="rounded-lg border bg-card overflow-hidden">
              <Skeleton class="aspect-video w-full" />
              <div class="p-4 space-y-2">
                <Skeleton class="h-5 w-3/4" />
                <Skeleton class="h-4 w-1/2" />
              </div>
            </div>
          </div>

          <div
            v-else-if="filteredVideos.length === 0"
            class="flex items-center justify-center h-full text-center"
          >
            <div class="space-y-2">
              <Video class="mx-auto h-12 w-12 text-muted-foreground" />
              <p class="text-muted-foreground">
                {{ searchQuery ? 'No videos found' : 'No videos yet. Upload your first video!' }}
              </p>
            </div>
          </div>

          <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-4">
            <div
              v-for="video in paginatedVideos"
              :key="video.id"
              class="group rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
            >
              <!-- Video Thumbnail -->
              <div class="relative aspect-video bg-muted">
                <img
                  :src="`https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`"
                  :alt="video.title"
                  class="w-full h-full object-cover"
                />
                <div
                  class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Button variant="secondary" size="sm" @click="openVideo(video)">
                    <Play class="mr-2 h-4 w-4" />
                    Watch
                  </Button>
                </div>
              </div>

              <!-- Video Info -->
              <div class="p-4 flex flex-col flex-1">
                <div class="flex-1 space-y-3">
                  <div>
                    <h3 class="font-semibold line-clamp-2 mb-1">{{ video.title }}</h3>
                    <p class="text-sm text-muted-foreground line-clamp-2">
                      {{ video.description || 'No description' }}
                    </p>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    class="flex-1"
                    @click="editVideo(video)"
                    :disabled="isDeletingId === video.id"
                  >
                    <Pencil class="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    @click="() => openDeleteDialog(video)"
                    :disabled="isDeletingId === video.id"
                  >
                    <Trash2 class="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredVideos.length > 0" class="grid grid-cols-3 items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</span>
          <Select v-model="itemsPerPageString">
            <SelectTrigger class="w-[80px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8">8</SelectItem>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="48">48</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex justify-center">
          <Pagination
            v-if="totalPages > 1"
            v-slot="{ page }"
            :items-per-page="itemsPerPage"
            :total="filteredVideos.length"
            :sibling-count="1"
            :show-edges="true"
            v-model:page="currentPage"
          >
            <PaginationContent v-slot="{ items }">
              <PaginationPrevious />

              <template v-for="(item, index) in items" :key="index">
                <PaginationEllipsis v-if="item.type === 'ellipsis'" :index="index" />
                <PaginationItem v-else :value="item.value" :is-active="item.value === page">
                  {{ item.value }}
                </PaginationItem>
              </template>

              <PaginationNext />
            </PaginationContent>
          </Pagination>
        </div>

        <p class="flex items-center justify-end text-sm text-muted-foreground whitespace-nowrap">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }}-{{
            Math.min(currentPage * itemsPerPage, filteredVideos.length)
          }}
          of {{ filteredVideos.length }}
        </p>
      </div>
    </div>

    <!-- Upload/Edit Video Dialog -->
    <Dialog :open="isUploadDialogOpen" @update:open="closeUploadDialog">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{{ editingVideo ? 'Edit Video' : 'Upload Video' }}</DialogTitle>
          <DialogDescription>
            {{ editingVideo ? 'Update video details' : 'Add a new YouTube video to the library' }}
          </DialogDescription>
        </DialogHeader>

        <form @submit="onSubmit" class="space-y-4">
          <FormField
            v-slot="{ componentField }"
            name="youtubeUrl"
            :validateOnBlur="hasAttemptSubmit"
            :validateOnModelUpdate="hasAttemptSubmit"
          >
            <FormItem>
              <FormLabel>YouTube URL <span class="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input
                  v-bind="componentField"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  :disabled="isSubmitting"
                />
              </FormControl>
              <FormDescription>Paste a YouTube video URL</FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField
            v-slot="{ componentField }"
            name="title"
            :validateOnBlur="hasAttemptSubmit"
            :validateOnModelUpdate="hasAttemptSubmit"
          >
            <FormItem>
              <FormLabel>Title <span class="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input
                  v-bind="componentField"
                  placeholder="Enter video title"
                  :disabled="isSubmitting"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField
            v-slot="{ componentField }"
            name="description"
            :validateOnBlur="hasAttemptSubmit"
            :validateOnModelUpdate="hasAttemptSubmit"
          >
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  v-bind="componentField"
                  placeholder="Enter video description (optional)"
                  rows="3"
                  :disabled="isSubmitting"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              @click="closeUploadDialog"
              :disabled="isSubmitting"
            >
              Cancel
            </Button>
            <Button type="submit" :disabled="isSubmitting" @click="hasAttemptSubmit = true">
              {{
                isSubmitting
                  ? editingVideo
                    ? 'Updating...'
                    : 'Uploading...'
                  : editingVideo
                    ? 'Update'
                    : 'Upload'
              }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog :open="isDeleteDialogOpen" @update:open="(val) => (isDeleteDialogOpen = val)">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Video</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ videoToDelete?.title }}"? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            @click="isDeleteDialogOpen = false"
            :disabled="isDeletingId !== null"
          >
            Cancel
          </Button>
          <Button variant="destructive" @click="confirmDelete" :disabled="isDeletingId !== null">
            {{ isDeletingId !== null ? 'Deleting...' : 'Delete' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Watch Video Dialog -->
    <Dialog :open="isWatchDialogOpen" @update:open="(val) => (isWatchDialogOpen = val)">
      <DialogContent class="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>{{ watchingVideo?.title }}</DialogTitle>
          <DialogDescription v-if="watchingVideo?.description">
            {{ watchingVideo.description }}
          </DialogDescription>
        </DialogHeader>
        <div class="aspect-video w-full">
          <iframe
            v-if="watchingVideo"
            :src="`https://www.youtube.com/embed/${watchingVideo.youtube_video_id}`"
            class="w-full h-full rounded-lg"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      </DialogContent>
    </Dialog>
  </MainLayout>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useNavigation } from '@/composables/useNavigation'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useClassroomStore } from '@/stores/classrooms'
import { useVideoStore } from '@/stores/videos'
import type { Tables } from '@/types/database.types'
import { toTypedSchema } from '@vee-validate/zod'
import { Pencil, Play, Plus, Search, Trash2, Video } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import * as z from 'zod'

const breadcrumbs = [{ label: 'Videos' }]

const videoStore = useVideoStore()
const classroomStore = useClassroomStore()
const authStore = useAuthStore()
const { selectedClassroomId } = useNavigation()

const searchQuery = ref('')

// Pagination State
const currentPage = ref(1)
const itemsPerPage = ref(parseInt(localStorage.getItem('videosItemsPerPage') || '12'))
const itemsPerPageString = computed({
  get: () => String(itemsPerPage.value),
  set: (value: string) => {
    itemsPerPage.value = parseInt(value)
    currentPage.value = 1
    localStorage.setItem('videosItemsPerPage', value)
  },
})

const isUploadDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isWatchDialogOpen = ref(false)
const editingVideo = ref<Tables<'videos'> | null>(null)
const videoToDelete = ref<Tables<'videos'> | null>(null)
const watchingVideo = ref<Tables<'videos'> | null>(null)
const isDeletingId = ref<string | null>(null)
const hasAttemptSubmit = ref(false)

// Form Schema
const formSchema = toTypedSchema(
  z.object({
    youtubeUrl: z
      .string()
      .min(1, 'YouTube URL is required')
      .url('Please enter a valid URL')
      .refine((url) => {
        const patterns = [
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
          /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
        ]
        return patterns.some((pattern) => pattern.test(url))
      }, 'Please enter a valid YouTube URL'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
  }),
)

// Form
const { handleSubmit, resetForm } = useForm({
  validationSchema: formSchema,
  keepValuesOnUnmount: true,
  initialValues: {
    youtubeUrl: '',
    title: '',
    description: '',
  },
})

// Reset form when dialog closes
watch(isUploadDialogOpen, (newVal) => {
  if (!newVal) {
    editingVideo.value = null
    hasAttemptSubmit.value = false
    resetForm({
      values: {
        youtubeUrl: '',
        title: '',
        description: '',
      },
    })
  }
})

const filteredVideos = computed(() => {
  if (!selectedClassroomId.value) return []

  return videoStore.videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesClassroom = video.classroom_id === selectedClassroomId.value
    return matchesSearch && matchesClassroom
  })
})

// Computed property for total pages
const totalPages = computed(() => {
  return Math.ceil(filteredVideos.value.length / itemsPerPage.value)
})

// Computed property for paginated videos
const paginatedVideos = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredVideos.value.slice(start, end)
})

// Reset to first page when filters change
watch(searchQuery, () => {
  currentPage.value = 1
})

const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) return match[1]
  }

  return null
}

const onSubmit = handleSubmit(async (formValues) => {
  try {
    if (!selectedClassroomId.value) {
      toast.error('No classroom selected')
      return
    }

    const videoId = extractYouTubeVideoId(formValues.youtubeUrl)
    if (!videoId) {
      toast.error('Invalid YouTube URL')
      return
    }

    const videoData = {
      title: formValues.title,
      description: formValues.description || null,
      youtube_url: formValues.youtubeUrl,
      youtube_video_id: videoId,
      classroom_id: selectedClassroomId.value,
      uploaded_by: authStore.user!.id,
    }

    if (editingVideo.value) {
      await videoStore.updateVideo(editingVideo.value.id, videoData)
      toast.success('Video updated successfully')
    } else {
      await videoStore.createVideo(videoData)
      toast.success('Video uploaded successfully')
    }

    closeUploadDialog()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to save video'
    toast.error(errorMessage)
  }
})

const isSubmitting = computed(() => videoStore.loading)

const editVideo = (video: Tables<'videos'>) => {
  editingVideo.value = video
  resetForm({
    values: {
      youtubeUrl: video.youtube_url,
      title: video.title,
      description: video.description || '',
    },
  })
  isUploadDialogOpen.value = true
}

const closeUploadDialog = () => {
  if (isSubmitting.value) return
  isUploadDialogOpen.value = false
}

const openDeleteDialog = (video: Tables<'videos'>) => {
  videoToDelete.value = video
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!videoToDelete.value || isDeletingId.value) return

  isDeletingId.value = videoToDelete.value.id

  try {
    await videoStore.deleteVideo(videoToDelete.value.id)
    toast.success('Video deleted successfully')
    isDeleteDialogOpen.value = false
    videoToDelete.value = null
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete video'
    toast.error(errorMessage)
  } finally {
    isDeletingId.value = null
  }
}

const openVideo = (video: Tables<'videos'>) => {
  watchingVideo.value = video
  isWatchDialogOpen.value = true
}

onMounted(async () => {
  try {
    await Promise.all([
      videoStore.fetchVideos(),
      classroomStore.fetchTeacherClassrooms(authStore.user!.id),
    ])
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load data'
    toast.error(errorMessage)
  }
})
</script>
