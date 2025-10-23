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

      <!-- Filter Tabs -->
      <div class="flex gap-2">
        <Button
          :variant="filterTab === 'available' ? 'default' : 'outline'"
          @click="filterTab = 'available'"
        >
          Available
        </Button>
        <Button
          :variant="filterTab === 'completed' ? 'default' : 'outline'"
          @click="filterTab = 'completed'"
        >
          Completed
        </Button>
      </div>

      <!-- Problem Sets Grid -->
      <div class="flex-1 min-h-0">
        <div v-if="questionSetsStore.loading" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="i in 6" :key="i" class="rounded-xl border bg-card p-6">
            <Skeleton class="h-6 w-3/4 mb-2" />
            <Skeleton class="h-4 w-full mb-4" />
            <Skeleton class="h-10 w-full" />
          </div>
        </div>

        <div
          v-else-if="filteredSets.length === 0"
          class="flex flex-col items-center justify-center h-full text-center py-12"
        >
          <FileText class="h-12 w-12 text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">No problem sets found</h3>
          <p class="text-sm text-muted-foreground">
            {{
              filterTab === 'available'
                ? 'No available problem sets at the moment'
                : "You haven't completed any problem sets yet"
            }}
          </p>
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-4">
          <div
            v-for="set in filteredSets"
            :key="set.id"
            class="rounded-xl border bg-card p-6 hover:bg-accent/50 transition-colors"
          >
            <!-- Title -->
            <h3 class="text-lg font-semibold mb-2 line-clamp-2">
              {{ set.name }}
            </h3>

            <!-- Description -->
            <p class="text-sm text-muted-foreground mb-4 line-clamp-2">
              {{ set.description || 'No description' }}
            </p>

            <!-- Stats -->
            <div class="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              <div class="flex items-center gap-1">
                <FileQuestion class="h-3.5 w-3.5" />
                <span>{{ set.total_points }} questions</span>
              </div>
            </div>

            <!-- Attempt Info -->
            <div v-if="getAttemptInfo(set.id)" class="mb-4 p-3 rounded-lg bg-muted/50">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium">Your Score</span>
                <Badge variant="default">
                  {{ getAttemptInfo(set.id)?.score }}/{{ getAttemptInfo(set.id)?.total_questions }}
                </Badge>
              </div>
              <div class="text-xs text-muted-foreground">
                {{
                  formatPercentage(
                    getAttemptInfo(set.id)!.score ?? 0,
                    getAttemptInfo(set.id)!.total_questions ?? 0,
                  )
                }}%
              </div>
            </div>

            <!-- Action Button -->
            <Button v-if="!getAttemptInfo(set.id)" @click="startAttempt(set.id)" class="w-full">
              Start Problem Set
            </Button>
            <Button
              v-else
              @click="viewResults(getAttemptInfo(set.id)!.id)"
              variant="outline"
              class="w-full"
            >
              View Results
            </Button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigation } from '@/composables/useNavigation'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useQuestionSetsStore } from '@/stores/question-sets'
import { FileQuestion, FileText } from 'lucide-vue-next'

const breadcrumbs = [{ label: 'Problem Sets' }]

const router = useRouter()
const authStore = useAuthStore()
const questionSetsStore = useQuestionSetsStore()
const { selectedClassroomId } = useNavigation()

// State
const filterTab = ref<'available' | 'completed'>('available')

// Computed
const filteredSets = computed(() => {
  const attempts = questionSetsStore.studentAttempts

  if (filterTab.value === 'available') {
    // Show sets that haven't been attempted or are not completed
    return questionSetsStore.publishedQuestionSets.filter((set) => {
      const attempt = attempts.find((a) => a.question_set_id === set.id && a.is_completed)
      return !attempt
    })
  } else {
    // Show sets that have completed attempts
    const completedSetIds = attempts.filter((a) => a.is_completed).map((a) => a.question_set_id)

    return questionSetsStore.publishedQuestionSets.filter((set) => completedSetIds.includes(set.id))
  }
})

// Methods
const getAttemptInfo = (questionSetId: string) => {
  const attempt = questionSetsStore.studentAttempts.find(
    (a) => a.question_set_id === questionSetId && a.is_completed,
  )
  return attempt
}

const formatPercentage = (score: number, total: number) => {
  if (total === 0) return 0
  return Math.round((score / total) * 100)
}

const startAttempt = async (questionSetId: string) => {
  try {
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
  } catch (error) {
    console.error('Error starting attempt:', error)
    toast.error('Failed to start problem set')
  }
}

const viewResults = (attemptId: string) => {
  router.push({
    name: 'problem-set-results',
    params: {
      classroomId: selectedClassroomId.value,
      attemptId,
    },
  })
}

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
