<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-4">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Problem Sets</h1>
        <p class="text-muted-foreground">
          Test your knowledge with problem sets created by your teacher
        </p>
      </div>

      <!-- Actions Bar -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
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

        <!-- Filter Dropdown -->
        <Select v-model="filterTab">
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
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
            v-else-if="filteredSets.length === 0"
            class="flex items-center justify-center h-full text-center"
          >
            <div class="space-y-2">
              <FileText class="mx-auto h-12 w-12 text-muted-foreground" />
              <p class="text-muted-foreground">
                {{
                  searchQuery
                    ? 'No problem sets found'
                    : filterTab === 'all'
                      ? 'No problem sets available'
                      : filterTab === 'available'
                        ? 'No available problem sets at the moment'
                        : filterTab === 'in-progress'
                          ? 'No problem sets in progress'
                          : "You haven't completed any problem sets yet"
                }}
              </p>
            </div>
          </div>

          <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-4">
            <div
              v-for="set in paginatedSets"
              :key="set.id"
              class="group rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
              @click="handleSetClick(set.id)"
            >
              <!-- Visual -->
              <div
                class="aspect-video bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center relative"
              >
                <div class="text-center space-y-2">
                  <FileQuestion class="h-16 w-16 mx-auto text-primary/60" />
                  <div class="text-2xl font-bold text-primary/80">
                    {{ set.total_points }} {{ set.total_points === 1 ? 'Question' : 'Questions' }}
                  </div>
                </div>
                <!-- Status Badge -->
                <div class="absolute top-2 right-2">
                  <Badge
                    v-if="getAttemptInfo(set.id)"
                    variant="default"
                    class="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 class="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                  <Badge
                    v-else-if="getInProgressAttempt(set.id)"
                    variant="default"
                    class="bg-blue-600 hover:bg-blue-700"
                  >
                    In Progress
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
                    <div
                      v-if="getAttemptInfo(set.id)"
                      class="flex items-center justify-between pt-2"
                    >
                      <span class="text-xs font-medium text-foreground">Your Score:</span>
                      <Badge variant="secondary" class="text-xs">
                        {{ getAttemptInfo(set.id)?.score }}/{{
                          getAttemptInfo(set.id)?.total_questions
                        }}
                        ({{
                          formatPercentage(
                            getAttemptInfo(set.id)!.score ?? 0,
                            getAttemptInfo(set.id)!.total_questions ?? 0,
                          )
                        }}%)
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredSets.length > 0" class="grid grid-cols-3 items-center gap-3">
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
            :total="filteredSets.length"
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
            Math.min(currentPage * itemsPerPage, filteredSets.length)
          }}
          of {{ filteredSets.length }}
        </p>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
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
import { useAuthStore } from '@/stores/auth'
import { useQuestionSetsStore } from '@/stores/question-sets'
import { CheckCircle2, FileQuestion, FileText, Search } from 'lucide-vue-next'

const breadcrumbs = [{ label: 'Problem Sets' }]

const router = useRouter()
const authStore = useAuthStore()
const questionSetsStore = useQuestionSetsStore()
const { selectedClassroomId } = useNavigation()

// State
const filterTab = ref<'all' | 'available' | 'in-progress' | 'completed'>('all')
const searchQuery = ref('')

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
const filteredSets = computed(() => {
  const attempts = questionSetsStore.studentAttempts
  let filtered = questionSetsStore.publishedQuestionSets

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (set) =>
        set.name.toLowerCase().includes(query) || set.description?.toLowerCase().includes(query),
    )
  }

  // Filter by status
  if (filterTab.value === 'all') {
    // Show all published sets
    return filtered
  } else if (filterTab.value === 'available') {
    // Show sets that haven't been attempted at all
    return filtered.filter((set) => {
      const attempt = attempts.find((a) => a.question_set_id === set.id)
      return !attempt
    })
  } else if (filterTab.value === 'in-progress') {
    // Show sets with incomplete attempts
    const inProgressSetIds = attempts.filter((a) => !a.is_completed).map((a) => a.question_set_id)

    return filtered.filter((set) => inProgressSetIds.includes(set.id))
  } else {
    // completed: Show sets with completed attempts
    const completedSetIds = attempts.filter((a) => a.is_completed).map((a) => a.question_set_id)

    return filtered.filter((set) => completedSetIds.includes(set.id))
  }
})

const totalPages = computed(() => {
  return Math.ceil(filteredSets.value.length / itemsPerPage.value)
})

const paginatedSets = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredSets.value.slice(start, end)
})

// Methods
const getAttemptInfo = (questionSetId: string) => {
  const attempt = questionSetsStore.studentAttempts.find(
    (a) => a.question_set_id === questionSetId && a.is_completed,
  )
  return attempt
}

const getInProgressAttempt = (questionSetId: string) => {
  const attempt = questionSetsStore.studentAttempts.find(
    (a) => a.question_set_id === questionSetId && !a.is_completed,
  )
  return attempt
}

const formatPercentage = (score: number, total: number) => {
  if (total === 0) return 0
  return Math.round((score / total) * 100)
}

const handleSetClick = async (questionSetId: string) => {
  try {
    const attemptInfo = getAttemptInfo(questionSetId)

    if (attemptInfo) {
      // View results
      router.push({
        name: 'problem-set-results',
        params: {
          classroomId: selectedClassroomId.value,
          attemptId: attemptInfo.id,
        },
      })
    } else {
      // Check if there's an active attempt
      const activeAttempt = await questionSetsStore.checkActiveAttempt(
        authStore.user!.id,
        questionSetId,
      )

      if (activeAttempt) {
        // Resume existing attempt
        router.push({
          name: 'problem-set-attempt',
          params: {
            classroomId: selectedClassroomId.value,
            setId: questionSetId,
            attemptId: activeAttempt.id,
          },
        })
      } else {
        // Create new attempt
        const attempt = await questionSetsStore.startAttempt(questionSetId, authStore.user!.id)
        router.push({
          name: 'problem-set-attempt',
          params: {
            classroomId: selectedClassroomId.value,
            setId: questionSetId,
            attemptId: attempt.id,
          },
        })
      }
    }
  } catch (error) {
    console.error('Error handling problem set click:', error)
    toast.error('Failed to start problem set')
  }
}

// Reset page when filter changes
watch([filterTab, searchQuery], () => {
  currentPage.value = 1
})

// Lifecycle
onMounted(async () => {
  if (selectedClassroomId.value && authStore.user) {
    try {
      await Promise.all([
        questionSetsStore.fetchPublishedQuestionSets(selectedClassroomId.value),
        questionSetsStore.fetchStudentAttempts(authStore.user.id, selectedClassroomId.value),
      ])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load problem sets')
    }
  }
})
</script>
