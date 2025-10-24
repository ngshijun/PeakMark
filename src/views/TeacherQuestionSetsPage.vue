<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-4">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Problem Sets</h1>
        <p class="text-muted-foreground">
          Create and manage problem sets with multiple questions for your students
        </p>
      </div>

      <!-- Actions Bar -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <!-- Search Input -->
        <div class="relative flex-1 sm:max-w-md">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            type="search"
            placeholder="Search problem sets..."
            class="pl-8"
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
          <Select v-model="statusFilter">
            <SelectTrigger class="w-[11.25rem]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Button @click="createNewQuestionSet">
            <Plus class="mr-2 h-4 w-4" />
            Create Problem Set
          </Button>
        </div>
      </div>

      <!-- Problem Sets Grid -->
      <div class="flex-1 min-h-0 rounded-xl border bg-card overflow-hidden">
        <div class="h-full overflow-auto">
          <div
            v-if="questionSetsStore.loading"
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
            v-else-if="filteredQuestionSets.length === 0"
            class="flex items-center justify-center h-full text-center"
          >
            <div class="space-y-2">
              <FileText class="mx-auto h-12 w-12 text-muted-foreground" />
              <p class="text-muted-foreground">
                {{
                  searchQuery
                    ? 'No problem sets found'
                    : 'No problem sets yet. Create your first problem set!'
                }}
              </p>
            </div>
          </div>

          <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-4">
            <ContextMenu v-for="set in paginatedQuestionSets" :key="set.id">
              <ContextMenuTrigger as-child>
                <div
                  class="group rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
                  @click="viewQuestionSet(set.id)"
                >
                  <!-- Visual -->
                  <div
                    class="aspect-video bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center relative"
                  >
                    <div class="text-center space-y-2">
                      <FileQuestion class="h-16 w-16 mx-auto text-primary/60" />
                      <div class="text-2xl font-bold text-primary/80">
                        {{ set.total_points }}
                        {{ set.total_points === 1 ? 'Question' : 'Questions' }}
                      </div>
                    </div>
                    <!-- Status Badge -->
                    <div class="absolute top-2 right-2">
                      <Badge :variant="set.is_published ? 'default' : 'secondary'">
                        {{ set.is_published ? 'Published' : 'Draft' }}
                      </Badge>
                    </div>
                  </div>

                  <!-- Problem Set Info -->
                  <div class="p-4 flex flex-col flex-1">
                    <div class="flex-1 space-y-2">
                      <div>
                        <h3 class="font-semibold line-clamp-2 mb-1">{{ set.name }}</h3>
                      </div>
                      <div class="text-sm text-muted-foreground space-y-1">
                        <p class="line-clamp-2">{{ set.description || 'No description' }}</p>
                        <p>{{ formatDate(set.created_at) }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent class="w-48">
                <ContextMenuItem @click="editQuestionSet(set.id)">
                  <Pencil class="mr-2 h-4 w-4" />
                  Edit
                </ContextMenuItem>
                <ContextMenuItem @click="togglePublish(set.id, !set.is_published)">
                  <Eye class="mr-2 h-4 w-4" v-if="!set.is_published" />
                  <EyeOff class="mr-2 h-4 w-4" v-else />
                  {{ set.is_published ? 'Unpublish' : 'Publish' }}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem @click="openDeleteDialog(set.id)" class="text-destructive">
                  <Trash2 class="mr-2 h-4 w-4" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredQuestionSets.length > 0" class="grid grid-cols-3 items-center gap-3">
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
            :total="filteredQuestionSets.length"
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
            Math.min(currentPage * itemsPerPage, filteredQuestionSets.length)
          }}
          of {{ filteredQuestionSets.length }}
        </p>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="isDeleteDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Problem Set</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this problem set? This will also delete all questions
            and student attempts. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="isDeleteDialogOpen = false">Cancel</Button>
          <Button variant="destructive" @click="confirmDelete">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
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
import { useQuestionSetsStore } from '@/stores/question-sets'
import { Eye, EyeOff, FileQuestion, FileText, Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'

const breadcrumbs = [{ label: 'Problem Sets' }]

const router = useRouter()
const questionSetsStore = useQuestionSetsStore()
const { selectedClassroomId } = useNavigation()

// State
const searchQuery = ref('')
const statusFilter = ref('all')
const isDeleteDialogOpen = ref(false)
const setToDelete = ref<string | null>(null)

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(parseInt(localStorage.getItem('problemSetsPerPage') || '12'))
const itemsPerPageString = computed({
  get: () => String(itemsPerPage.value),
  set: (value: string) => {
    itemsPerPage.value = parseInt(value)
    currentPage.value = 1
    localStorage.setItem('problemSetsPerPage', value)
  },
})

// Computed
const filteredQuestionSets = computed(() => {
  let filtered = questionSetsStore.questionSets

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (set) =>
        set.name.toLowerCase().includes(query) || set.description?.toLowerCase().includes(query),
    )
  }

  // Filter by status
  if (statusFilter.value === 'published') {
    filtered = filtered.filter((set) => set.is_published)
  } else if (statusFilter.value === 'draft') {
    filtered = filtered.filter((set) => !set.is_published)
  }

  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredQuestionSets.value.length / itemsPerPage.value)
})

const paginatedQuestionSets = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredQuestionSets.value.slice(start, end)
})

// Methods
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const createNewQuestionSet = () => {
  router.push({
    name: 'problem-sets-create',
    params: { classroomId: selectedClassroomId.value },
  })
}

const viewQuestionSet = (id: string) => {
  router.push({
    name: 'problem-sets-edit',
    params: { classroomId: selectedClassroomId.value, setId: id },
  })
}

const editQuestionSet = (id: string) => {
  router.push({
    name: 'problem-sets-edit',
    params: { classroomId: selectedClassroomId.value, setId: id },
  })
}

const togglePublish = async (id: string, isPublished: boolean) => {
  try {
    await questionSetsStore.togglePublishStatus(id, isPublished)
    toast.success(isPublished ? 'Problem set published' : 'Problem set unpublished')
  } catch (error) {
    console.error('Error toggling publish status:', error)
    toast.error('Failed to update publish status')
  }
}

const openDeleteDialog = (id: string) => {
  setToDelete.value = id
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!setToDelete.value) return

  try {
    await questionSetsStore.deleteQuestionSet(setToDelete.value)
    toast.success('Problem set deleted successfully')
    isDeleteDialogOpen.value = false
    setToDelete.value = null
  } catch (error) {
    console.error('Error deleting problem set:', error)
    toast.error('Failed to delete problem set')
  }
}

// Lifecycle
onMounted(async () => {
  if (selectedClassroomId.value) {
    try {
      await questionSetsStore.fetchQuestionSets(selectedClassroomId.value)
    } catch (error) {
      console.error('Error fetching problem sets:', error)
      toast.error('Failed to load problem sets')
    }
  }
})
</script>
