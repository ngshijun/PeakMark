<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-7xl min-w-[70rem] h-[85vh] flex flex-col p-0">
      <DialogHeader class="px-6 pt-6 pb-4 border-b">
        <div class="flex items-start gap-4">
          <div class="flex-1 min-w-0">
            <DialogTitle class="text-xl truncate">{{ document?.name }}</DialogTitle>
            <DialogDescription class="mt-1">
              <div class="flex items-center gap-3 text-sm">
                <span>{{ formatFileSize(document?.file_size || 0) }}</span>
                <span>•</span>
                <span>{{ formatDate(document?.created_at) }}</span>
              </div>
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div class="flex-1 overflow-auto bg-muted/30">
        <div v-if="isLoading" class="flex items-center justify-center h-full">
          <div class="text-center space-y-3">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p class="text-sm text-muted-foreground">Loading preview...</p>
          </div>
        </div>

        <div v-else-if="previewError" class="flex items-center justify-center h-full">
          <div class="text-center space-y-3 p-6">
            <AlertCircle class="mx-auto h-12 w-12 text-destructive" />
            <div>
              <p class="font-medium">Failed to load preview</p>
              <p class="text-sm text-muted-foreground mt-1">{{ previewError }}</p>
            </div>
          </div>
        </div>

        <!-- PDF Preview -->
        <div v-else-if="isPdf" class="h-full">
          <iframe
            :src="document?.file_url || undefined"
            class="w-full h-full border-0"
            title="PDF Preview"
          />
        </div>

        <!-- Image Preview -->
        <div v-else-if="isImage" class="h-full flex items-center justify-center p-6">
          <img
            :src="document?.file_url || undefined"
            :alt="document?.name"
            class="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>

        <!-- Text/Code Preview -->
        <div v-else-if="isText" class="h-full p-6">
          <pre
            class="bg-card rounded-lg p-4 text-sm overflow-auto h-full border"
          ><code>{{ textContent }}</code></pre>
        </div>

        <!-- Unsupported File Type -->
        <div v-else class="flex items-center justify-center h-full">
          <div class="text-center space-y-3 p-6">
            <FileText class="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <p class="font-medium">Preview not available</p>
              <p class="text-sm text-muted-foreground mt-1">
                This file type cannot be previewed. Please download it to view.
              </p>
            </div>
            <Button variant="outline" @click="downloadFile" class="mt-4">
              <Download class="mr-2 h-4 w-4" />
              Download File
            </Button>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 border-t bg-background flex justify-end">
        <Button v-if="document?.file_url" variant="outline" @click="downloadFile">
          <Download class="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Tables } from '@/types/database.types'
import { AlertCircle, Download, FileText } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

type Document = Tables<'documents'>

const props = defineProps<{
  open: boolean
  document: Document | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isLoading = ref(false)
const previewError = ref<string | null>(null)
const textContent = ref<string>('')

const isPdf = computed(() => {
  return props.document?.mime_type?.includes('pdf') || false
})

const isImage = computed(() => {
  return props.document?.mime_type?.startsWith('image/') || false
})

const isText = computed(() => {
  if (!props.document?.mime_type) return false
  return (
    props.document.mime_type.startsWith('text/') ||
    props.document.mime_type.includes('json') ||
    props.document.mime_type.includes('xml') ||
    props.document.mime_type.includes('javascript') ||
    props.document.mime_type.includes('typescript')
  )
})

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const handleOpenChange = (value: boolean) => {
  emit('update:open', value)
  if (!value) {
    // Reset state when closing
    textContent.value = ''
    previewError.value = null
    isLoading.value = false
  }
}

const downloadFile = () => {
  if (props.document?.file_url) {
    window.open(props.document.file_url, '_blank')
  }
}

const loadTextContent = async () => {
  if (!props.document?.file_url || !isText.value) return

  isLoading.value = true
  previewError.value = null

  try {
    const response = await fetch(props.document.file_url)
    if (!response.ok) throw new Error('Failed to load file')
    textContent.value = await response.text()
  } catch (error) {
    previewError.value = error instanceof Error ? error.message : 'Failed to load text content'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.document && isText.value) {
      await loadTextContent()
    }
  },
)
</script>
