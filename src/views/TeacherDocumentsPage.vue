<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-4">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Documents</h1>
        <p class="text-muted-foreground">Upload and organize documents for your classroom</p>
      </div>

      <!-- Actions Bar -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <!-- Search Input -->
        <div class="relative flex-1 sm:max-w-md">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            type="search"
            placeholder="Search documents..."
            class="pl-8"
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
          <Button variant="outline" @click="isFolderDialogOpen = true">
            <FolderPlus class="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <Button @click="isUploadDialogOpen = true">
            <Upload class="mr-2 h-4 w-4" />
            Upload File
          </Button>
        </div>
      </div>

      <!-- Documents Grid -->
      <div class="flex-1 min-h-0 rounded-xl border bg-card overflow-hidden">
        <div class="h-full overflow-auto">
          <div
            v-if="documentStore.loading"
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
            v-else-if="filteredDocuments.length === 0"
            class="flex items-center justify-center h-full text-center"
          >
            <div class="space-y-2">
              <FileText class="mx-auto h-12 w-12 text-muted-foreground" />
              <p class="text-muted-foreground">
                {{
                  searchQuery ? 'No documents found' : 'No documents yet. Upload your first file!'
                }}
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
                <ContextMenuItem
                  @click="document.type === 'file' ? downloadFile(document) : editFolder(document)"
                >
                  <Download v-if="document.type === 'file'" class="mr-2 h-4 w-4" />
                  <Pencil v-else class="mr-2 h-4 w-4" />
                  {{ document.type === 'folder' ? 'Edit' : 'Download' }}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem @click="openDeleteDialog(document)" class="text-destructive">
                  <Trash2 class="mr-2 h-4 w-4" />
                  Delete {{ document.type === 'folder' ? 'Folder' : 'File' }}
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
            <SelectTrigger class="w-[5rem] h-9">
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

    <!-- Create/Update Folder Dialog -->
    <Dialog :open="isFolderDialogOpen" @update:open="closeFolderDialog">
      <DialogContent class="sm:max-w-[27rem]">
        <DialogHeader>
          <DialogTitle>{{ editingFolder ? 'Edit Folder' : 'Create New Folder' }}</DialogTitle>
          <DialogDescription>{{
            editingFolder ? 'Update folder name' : 'Enter a name for the new folder'
          }}</DialogDescription>
        </DialogHeader>

        <form @submit.prevent="handleFolderAction" class="space-y-4">
          <div class="space-y-2">
            <Label for="folderName">Folder Name</Label>
            <Input
              id="folderName"
              v-model="newFolderName"
              placeholder="Enter folder name"
              :disabled="isSubmitting"
              @keydown.enter.prevent="handleFolderAction"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              @click="closeFolderDialog"
              :disabled="isSubmitting"
            >
              Cancel
            </Button>
            <Button type="submit" :disabled="!newFolderName || isSubmitting">
              {{
                isSubmitting
                  ? editingFolder
                    ? 'Updating...'
                    : 'Creating...'
                  : editingFolder
                    ? 'Update'
                    : 'Create'
              }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Upload File Dialog -->
    <Dialog :open="isUploadDialogOpen" @update:open="closeUploadDialog">
      <DialogContent class="sm:max-w-[27rem]">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Select a file to upload (max {{ MAX_FILE_SIZE }}MB)
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div
            class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            @click="triggerFileInput"
            @dragover.prevent
            @drop.prevent="handleFileDrop"
          >
            <Upload class="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <p class="text-sm text-muted-foreground mb-1">Click to select or drag and drop</p>
            <p class="text-xs text-muted-foreground">Maximum file size: {{ MAX_FILE_SIZE }}MB</p>
            <input
              ref="fileInputRef"
              type="file"
              class="hidden"
              @change="handleFileSelect"
              :disabled="isSubmitting"
            />
          </div>

          <div v-if="selectedFile" class="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <FileText class="h-8 w-8 text-muted-foreground" />
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">{{ selectedFile.name }}</p>
              <p class="text-xs text-muted-foreground">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
            <Button variant="ghost" size="sm" @click="selectedFile = null" :disabled="isSubmitting">
              <X class="h-4 w-4" />
            </Button>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              @click="closeUploadDialog"
              :disabled="isSubmitting"
            >
              Cancel
            </Button>
            <Button @click="handleUploadFile" :disabled="!selectedFile || isSubmitting">
              {{ isSubmitting ? 'Uploading...' : 'Upload' }}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog :open="isDeleteDialogOpen" @update:open="(val) => (isDeleteDialogOpen = val)">
      <DialogContent>
        <DialogHeader>
          <DialogTitle
            >Delete {{ documentToDelete?.type === 'folder' ? 'Folder' : 'File' }}</DialogTitle
          >
          <DialogDescription>
            Are you sure you want to delete "{{ documentToDelete?.name }}"?
            <span v-if="documentToDelete?.type === 'folder'" class="block mt-2 text-destructive">
              This will also delete all files and folders inside it.
            </span>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="isDeleteDialogOpen = false" :disabled="isSubmitting">
            Cancel
          </Button>
          <Button variant="destructive" @click="confirmDelete" :disabled="isSubmitting">
            {{ isSubmitting ? 'Deleting...' : 'Delete' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Document Preview Dialog -->
    <DocumentPreviewDialog
      :open="isPreviewDialogOpen"
      :document="documentToPreview"
      @update:open="(val) => (isPreviewDialogOpen = val)"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import DocumentPreviewDialog from '@/components/DocumentPreviewDialog.vue'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useNavigation } from '@/composables/useNavigation'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useDocumentStore } from '@/stores/documents'
import { MAX_FILE_SIZE } from '@/types/constants'
import type { Tables } from '@/types/database.types'
import {
  Download,
  File,
  FileCode,
  FileImage,
  FileText,
  Folder,
  FolderPlus,
  Pencil,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

type Document = Tables<'documents'>

const documentStore = useDocumentStore()
const authStore = useAuthStore()
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

const isFolderDialogOpen = ref(false)
const isUploadDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const newFolderName = ref('')
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const editingFolder = ref<Document | null>(null)
const documentToDelete = ref<Document | null>(null)
const isDeletingId = ref<string | null>(null)
const isPreviewDialogOpen = ref(false)
const documentToPreview = ref<Document | null>(null)

const isSubmitting = computed(() => documentStore.loading)

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

const handleDocumentClick = (document: Document) => {
  if (document.type === 'folder') {
    navigateToFolder(document.id)
  } else {
    documentToPreview.value = document
    isPreviewDialogOpen.value = true
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

const handleFolderAction = () => {
  if (editingFolder.value) {
    handleUpdateFolder()
  } else {
    handleCreateFolder()
  }
}

const editFolder = (folder: Document) => {
  editingFolder.value = folder
  newFolderName.value = folder.name
  isFolderDialogOpen.value = true
}

const handleCreateFolder = async () => {
  if (!newFolderName.value.trim() || !selectedClassroomId.value) return

  try {
    await documentStore.createFolder(
      newFolderName.value.trim(),
      selectedClassroomId.value,
      authStore.user!.id,
      documentStore.currentFolderId,
    )
    toast.success('Folder created successfully')
    closeFolderDialog()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to create folder')
  }
}

const handleUpdateFolder = async () => {
  if (!editingFolder.value || !newFolderName.value.trim()) return

  try {
    await documentStore.updateFolder(editingFolder.value!.id, {
      name: newFolderName.value.trim(),
    })
    toast.success('Folder updated successfully')
    closeFolderDialog()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to update folder')
  }
}

const closeFolderDialog = () => {
  if (isSubmitting.value) return
  isFolderDialogOpen.value = false
  newFolderName.value = ''
  editingFolder.value = null
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    selectedFile.value = file
  }
}

const handleFileDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0]
  if (file) {
    selectedFile.value = file
  }
}

const handleUploadFile = async () => {
  if (!selectedFile.value || !selectedClassroomId.value) return

  try {
    await documentStore.uploadDocument(
      selectedFile.value,
      selectedClassroomId.value,
      authStore.user!.id,
      documentStore.currentFolderId,
    )
    toast.success('File uploaded successfully')
    closeUploadDialog()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to upload file')
  }
}

const closeUploadDialog = () => {
  if (isSubmitting.value) return
  isUploadDialogOpen.value = false
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const downloadFile = (document: Document) => {
  if (document.file_url) {
    window.open(document.file_url, '_blank')
  }
}

const openDeleteDialog = (document: Document) => {
  documentToDelete.value = document
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!documentToDelete.value || isDeletingId.value) return

  try {
    await documentStore.deleteDocument(documentToDelete.value.id)
    toast.success(
      `${documentToDelete.value.type === 'folder' ? 'Folder' : 'File'} deleted successfully`,
    )
    isDeleteDialogOpen.value = false
    documentToDelete.value = null
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to delete')
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
