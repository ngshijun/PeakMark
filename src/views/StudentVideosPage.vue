<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-4">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Videos</h1>
        <p class="text-muted-foreground">Watch educational videos to enhance your learning</p>
      </div>

      <!-- Filters -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <!-- Search Input -->
        <div class="relative flex-1 sm:max-w-md">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input v-model="searchQuery" type="search" placeholder="Search videos..." class="pl-8" />
        </div>
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
                {{ searchQuery ? 'No videos found' : 'No videos available yet' }}
              </p>
            </div>
          </div>

          <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-4">
            <div
              v-for="video in paginatedVideos"
              :key="video.id"
              class="group rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
              @click="handleVideoClick(video)"
            >
              <!-- Folder Icon -->
              <div
                v-if="video.type === 'folder'"
                class="aspect-video bg-muted flex items-center justify-center"
              >
                <Folder class="h-16 w-16 text-blue-500" />
              </div>

              <!-- Video Thumbnail -->
              <div v-else class="relative aspect-video bg-muted">
                <img
                  :src="`https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`"
                  :alt="video.title"
                  class="w-full h-full object-cover"
                />
                <div
                  class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <div class="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    <Play class="h-8 w-8 text-gray-900 fill-gray-900" />
                  </div>
                </div>
              </div>

              <!-- Video/Folder Info -->
              <div class="p-4 flex flex-col flex-1">
                <div class="flex-1 space-y-3">
                  <div>
                    <h3 class="font-semibold line-clamp-2 mb-1">{{ video.title }}</h3>
                    <p
                      v-if="video.type === 'video'"
                      class="text-sm text-muted-foreground line-clamp-2"
                    >
                      {{ video.description || 'No description' }}
                    </p>
                  </div>
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
            <SelectTrigger class="w-[5rem] h-9">
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

    <!-- Watch Video Dialog -->
    <Dialog :open="isWatchDialogOpen" @update:open="(val) => (isWatchDialogOpen = val)">
      <DialogContent class="min-w-[90rem]">
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
import { computed, onMounted, ref, watch } from 'vue'
import { useVideoStore } from '@/stores/videos'
import { useNavigation } from '@/composables/useNavigation'
import MainLayout from '@/layouts/MainLayout.vue'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Search, Play, Video, Folder } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Tables } from '@/types/database.types'

const videoStore = useVideoStore()
const { selectedClassroomId } = useNavigation()

const breadcrumbs = computed(() => {
  const crumbs = [{ label: 'Videos', onClick: () => navigateToFolder(null) }]

  videoStore.folderPath.forEach((folder) => {
    crumbs.push({
      label: folder.title,
      onClick: () => navigateToFolder(folder.id),
    })
  })

  return crumbs
})

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

const isWatchDialogOpen = ref(false)
const watchingVideo = ref<Tables<'videos'> | null>(null)

const filteredVideos = computed(() => {
  if (!searchQuery.value) {
    return videoStore.videos
  }

  return videoStore.videos.filter(
    (video) =>
      video.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (video.description?.toLowerCase().includes(searchQuery.value.toLowerCase()) ?? false),
  )
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

const openVideo = (video: Tables<'videos'>) => {
  watchingVideo.value = video
  isWatchDialogOpen.value = true
}

const handleVideoClick = (video: Tables<'videos'>) => {
  if (video.type === 'folder') {
    navigateToFolder(video.id)
  } else {
    openVideo(video)
  }
}

const navigateToFolder = async (folderId: string | null) => {
  if (!selectedClassroomId.value) return

  try {
    await videoStore.navigateToFolder(selectedClassroomId.value, folderId)
    currentPage.value = 1
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to navigate to folder')
  }
}

onMounted(async () => {
  if (!selectedClassroomId.value) return

  try {
    await videoStore.navigateToFolder(selectedClassroomId.value, null)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load data'
    toast.error(errorMessage)
  }
})
</script>
