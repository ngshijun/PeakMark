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

      <!-- Search and Actions Bar -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
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

          <!-- Status Filter -->
          <Select v-model="statusFilter">
            <SelectTrigger class="w-full sm:w-[11.25rem]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Create Button -->
        <Button @click="createNewQuestionSet">
          <Plus class="mr-2 h-4 w-4" />
          Create Problem Set
        </Button>
      </div>

      <!-- Problem Sets Grid -->
      <div class="flex-1 min-h-0">
        <div v-if="questionSetsStore.loading" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="i in 6" :key="i" class="rounded-xl border bg-card p-6">
            <Skeleton class="h-6 w-3/4 mb-2" />
            <Skeleton class="h-4 w-full mb-4" />
            <Skeleton class="h-4 w-1/2" />
          </div>
        </div>

        <div
          v-else-if="filteredQuestionSets.length === 0"
          class="flex flex-col items-center justify-center h-full text-center py-12"
        >
          <FileText class="h-12 w-12 text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">No problem sets found</h3>
          <p class="text-sm text-muted-foreground mb-4">
            Create your first problem set to get started
          </p>
          <Button @click="createNewQuestionSet">
            <Plus class="mr-2 h-4 w-4" />
            Create Problem Set
          </Button>
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-4">
          <ContextMenu v-for="set in filteredQuestionSets" :key="set.id">
            <ContextMenuTrigger as-child>
              <div
                class="rounded-xl border bg-card p-6 hover:bg-accent/50 transition-colors cursor-pointer"
                @click="viewQuestionSet(set.id)"
              >
                <!-- Status Badge -->
                <div class="flex items-start justify-between mb-3">
                  <Badge :variant="set.is_published ? 'default' : 'secondary'">
                    {{ set.is_published ? 'Published' : 'Draft' }}
                  </Badge>
                  <div class="text-xs text-muted-foreground">
                    {{ formatDate(set.created_at) }}
                  </div>
                </div>

                <!-- Title -->
                <h3 class="text-lg font-semibold mb-2 line-clamp-2">
                  {{ set.name }}
                </h3>

                <!-- Description -->
                <p class="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {{ set.description || 'No description' }}
                </p>

                <!-- Stats -->
                <div class="flex items-center gap-4 text-xs text-muted-foreground">
                  <div class="flex items-center gap-1">
                    <FileQuestion class="h-3.5 w-3.5" />
                    <span>{{ set.total_points }} questions</span>
                  </div>
                  <div v-if="set.is_published" class="flex items-center gap-1">
                    <Users class="h-3.5 w-3.5" />
                    <span>View attempts</span>
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
import {
  Eye,
  EyeOff,
  FileQuestion,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-vue-next'

const breadcrumbs = [{ label: 'Problem Sets' }]

const router = useRouter()
const questionSetsStore = useQuestionSetsStore()
const { selectedClassroomId } = useNavigation()

// State
const searchQuery = ref('')
const statusFilter = ref('all')
const isDeleteDialogOpen = ref(false)
const setToDelete = ref<string | null>(null)

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
