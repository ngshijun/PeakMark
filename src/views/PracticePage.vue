<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="space-y-6">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Practice Questions</h1>
        <p class="text-muted-foreground">Select a year and subject to start practicing</p>
      </div>

      <!-- Selection and Recent Practice Grid -->
      <div class="grid gap-6 md:grid-cols-2">
        <!-- Selection Card -->
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Practice Set</CardTitle>
            <CardDescription>
              Select the year level and subject you want to practice
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="grid grid-cols-2 gap-6">
              <!-- Year Selection -->
              <div class="space-y-2">
                <Label for="year">Year Level</Label>
                <Select v-model="selectedYear">
                  <SelectTrigger id="year" class="w-full">
                    <SelectValue placeholder="Select year level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="year in YEARS" :key="year" :value="year">
                      {{ year }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Subject Selection -->
              <div class="space-y-2">
                <Label for="subject">Subject</Label>
                <Select v-model="selectedSubject" :disabled="!selectedYear">
                  <SelectTrigger id="subject" class="w-full">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="subject in SUBJECTS" :key="subject" :value="subject">
                      {{ subject }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <!-- Info Preview -->
            <div v-if="selectedYear && selectedSubject" class="rounded-lg border bg-muted/50 p-4">
              <div class="flex items-start gap-3">
                <FileText class="h-5 w-5 text-muted-foreground mt-0.5" />
                <div class="space-y-1">
                  <p class="text-sm font-medium">Practice Set Ready</p>
                  <p class="text-sm text-muted-foreground">
                    Questions available for {{ selectedYearLabel }} - {{ selectedSubjectLabel }}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              class="w-full"
              :disabled="!selectedYear || !selectedSubject"
              @click="startPractice"
            >
              <PlayCircle class="mr-2 h-4 w-4" />
              Start Practice
            </Button>
          </CardFooter>
        </Card>

        <!-- Recent Practice -->
        <Card>
          <CardHeader>
            <CardTitle>Recent Practice</CardTitle>
            <CardDescription>Continue from where you left off</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="loadingSessions" class="text-center py-8">
              <p class="text-sm text-muted-foreground">Loading sessions...</p>
            </div>
            <div v-else-if="recentPractice.length === 0" class="text-center py-8">
              <p class="text-sm text-muted-foreground">No active practice sessions</p>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="practice in recentPractice"
                :key="practice.id"
                class="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                @click="continuePractice(practice.id)"
              >
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen class="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p class="font-medium">{{ practice.year }} - {{ practice.subject }}</p>
                    <p class="text-sm text-muted-foreground">
                      {{ practice.questions_attempted }} questions attempted
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import MainLayout from '@/layouts/MainLayout.vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import type { Tables } from '@/types/database.types'
import { SUBJECTS, YEARS } from '@/types/constants'
import { BookOpen, FileText, PlayCircle } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

type PracticeSession = Tables<'practice_session'>

const router = useRouter()
const authStore = useAuthStore()
const breadcrumbs = [{ label: 'Practice' }]

// Selection state
const selectedYear = ref<string>('')
const selectedSubject = ref<string>('')

// Recent practice sessions
const recentPractice = ref<PracticeSession[]>([])
const loadingSessions = ref(false)

// Computed labels
const selectedYearLabel = computed(() => {
  return YEARS.find((y) => y === selectedYear.value) || ''
})

const selectedSubjectLabel = computed(() => {
  return SUBJECTS.find((s) => s === selectedSubject.value) || ''
})

// Fetch recent practice sessions
const fetchRecentSessions = async () => {
  const userId = authStore.user?.id
  if (!userId) return

  loadingSessions.value = true

  try {
    const { data, error } = await supabase
      .from('practice_session')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(5)

    if (error) throw error
    recentPractice.value = data || []
  } catch (err) {
    console.error('Error fetching recent sessions:', err)
  } finally {
    loadingSessions.value = false
  }
}

// Start practice
const startPractice = () => {
  // Check if there's already an active session for this year and subject
  const existingSession = recentPractice.value.find(
    (session) => session.year === selectedYear.value && session.subject === selectedSubject.value
  )

  if (existingSession) {
    // Resume existing session instead of creating new one
    continuePractice(existingSession.id)
    return
  }

  // Create new session
  router.push({
    path: '/practice/questions',
    query: {
      year: selectedYear.value,
      subject: selectedSubject.value,
    },
  })
}

// Continue practice
const continuePractice = (sessionId: string) => {
  router.push({
    path: '/practice/questions',
    query: {
      sessionId,
    },
  })
}

// Initialize
onMounted(() => {
  fetchRecentSessions()
})
</script>
