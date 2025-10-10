<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-4">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Documents</h1>
        <p class="text-muted-foreground">Browse and download classroom documents</p>
      </div>

      <!-- Search Bar -->
      <div class="relative max-w-md">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input v-model="searchQuery" type="search" placeholder="Search documents..." class="pl-8" />
      </div>

      <!-- Documents Grid -->
      <div class="flex-1 min-h-0 rounded-xl border bg-card overflow-hidden">
        <div class="h-full overflow-auto">
          <div
            v-if="documentStore.loading"
            class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-4"
          >
            <div v-for="i in 8" :key="i" class="rounded-lg border bg-card p-4">
              <Skeleton class="h-12 w-12 mb-3" />
              <Skeleton class="h-5 w-3/4 mb-2" />
              <Skeleton class="h-4 w-1/2" />
            </div>
          </div>

          <div
            v-else-if="filteredDocuments.length === 0"
            class="flex items-center justify-center h-full text-center"
          >
            <div class="space-y-2">
              <FileText class="mx-auto h-12 w-12 text-muted-foreground" />
              <p class="text-muted-foreground">
                {{ searchQuery ? 'No documents found' : 'No documents available yet' }}
              </p>
            </div>
          </div>

          <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-4">
            <ContextMenu v-for="document in paginatedDocuments" :key="document.id">
              <ContextMenuTrigger as-child>
                <div
                  class="group rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
                  @click="handleDocumentClick(document)"
                >
                  <!-- Folder Icon -->
                  <div
                    v-if="document.type === 'folder'"
                    class="aspect-video bg-muted flex items-center justify-center"
                  >
                    <Folder class="h-16 w-16 text-blue-500" />
                  </div>

                  <!-- File Icon -->
                  <div v-else class="aspect-video bg-muted flex items-center justify-center">
                    <component
                      :is="getFileIcon(document.mime_type)"
                      class="h-16 w-16 text-gray-500"
                    />
                  </div>

                  <!-- Document Info -->
                  <div class="p-4 flex flex-col flex-1">
                    <div class="flex-1 space-y-3">
                      <div>
                        <h3 class="font-semibold line-clamp-2 mb-1">{{ document.name }}</h3>
                        <div
                          v-if="document.type === 'file'"
                          class="text-sm text-muted-foreground space-y-1"
                        >
                          <p v-if="document.file_size">
                            {{ formatFileSize(document.file_size) }}
                          </p>
                          <p>{{ formatDate(document.created_at) }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent class="w-48">
                <ContextMenuItem v-if="document.type === 'file'" @click="downloadFile(document)">
                  <Download class="mr-2 h-4 w-4" />
                  Download
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredDocuments.length > 0" class="grid grid-cols-3 items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</span>
          <Select v-model="itemsPerPageString">
            <SelectTrigger class="w-[80px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
            :total="filteredDocuments.length"
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
            Math.min(currentPage * itemsPerPage, filteredDocuments.length)
          }}
          of {{ filteredDocuments.length }}
        </p>
      </div>
    </div>

    <!-- Document Preview Dialog -->
    <DocumentPreviewDialog
      :open="isPreviewOpen"
      :document="documentToPreview"
      @update:open="(val) => (isPreviewOpen = val)"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
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
import DocumentPreviewDialog from '@/components/DocumentPreviewDialog.vue'
import { useNavigation } from '@/composables/useNavigation'
import MainLayout from '@/layouts/MainLayout.vue'
import { useDocumentStore } from '@/stores/documents'
import type { Tables } from '@/types/database.types'
import { Download, File, FileCode, FileImage, FileText, Folder, Search } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

type Document = Tables<'documents'>

const documentStore = useDocumentStore()
const { selectedClassroomId } = useNavigation()

const breadcrumbs = computed(() => {
  const crumbs = [{ label: 'Documents', onClick: () => navigateToFolder(null) }]

  documentStore.folderPath.forEach((folder) => {
    crumbs.push({
      label: folder.name,
      onClick: () => navigateToFolder(folder.id),
    })
  })

  return crumbs
})

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(parseInt(localStorage.getItem('documentsItemsPerPage') || '12'))
const itemsPerPageString = computed({
  get: () => String(itemsPerPage.value),
  set: (value: string) => {
    itemsPerPage.value = parseInt(value)
    currentPage.value = 1
    localStorage.setItem('documentsItemsPerPage', value)
  },
})

const filteredDocuments = computed(() => {
  if (!searchQuery.value) {
    return documentStore.documents
  }

  return documentStore.documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const totalPages = computed(() => {
  return Math.ceil(filteredDocuments.value.length / itemsPerPage.value)
})

const paginatedDocuments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredDocuments.value.slice(start, end)
})

watch(searchQuery, () => {
  currentPage.value = 1
})

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return File
  if (mimeType.startsWith('image/')) return FileImage
  if (mimeType.includes('pdf')) return FileText
  if (mimeType.includes('word') || mimeType.includes('document')) return FileText
  if (mimeType.includes('code') || mimeType.includes('text')) return FileCode
  return File
}

const isPreviewOpen = ref(false)
const documentToPreview = ref<Document | null>(null)

const handleDocumentClick = (document: Document) => {
  if (document.type === 'folder') {
    navigateToFolder(document.id)
  } else {
    documentToPreview.value = document
    isPreviewOpen.value = true
  }
}

const navigateToFolder = async (folderId: string | null) => {
  if (!selectedClassroomId.value) return

  try {
    await documentStore.navigateToFolder(selectedClassroomId.value, folderId)
    currentPage.value = 1
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to navigate to folder')
  }
}

const downloadFile = (document: Document) => {
  if (document.file_url) {
    window.open(document.file_url, '_blank')
  }
}

onMounted(async () => {
  if (!selectedClassroomId.value) return

  try {
    await documentStore.fetchDocuments(selectedClassroomId.value, null)
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to load documents')
  }
})
</script>
