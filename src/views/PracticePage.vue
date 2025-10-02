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
                    {{ getQuestionCount() }} questions available for {{ selectedYearLabel }} -
                    {{ selectedSubjectLabel }}
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
            <div class="space-y-4">
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
                      {{ practice.progress }} of {{ practice.total }} questions
                    </p>
                  </div>
                </div>
                <Progress :model-value="(practice.progress / practice.total) * 100" class="w-24" />
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
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import MainLayout from '@/layouts/MainLayout.vue'
import { SUBJECTS, YEARS } from '@/types/constants'
import { BookOpen, FileText, PlayCircle } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const breadcrumbs = [{ label: 'Practice' }]

// Selection state
const selectedYear = ref<string>('')
const selectedSubject = ref<string>('')

// Recent practice sessions
const recentPractice = ref([
  {
    id: 1,
    year: 'Year 10',
    subject: 'Mathematics',
    progress: 5,
    total: 20,
  },
  {
    id: 2,
    year: 'Year 9',
    subject: 'Science',
    progress: 12,
    total: 15,
  },
])

// Computed labels
const selectedYearLabel = computed(() => {
  return YEARS.find((y) => y === selectedYear.value) || ''
})

const selectedSubjectLabel = computed(() => {
  return SUBJECTS.find((s) => s === selectedSubject.value) || ''
})

// Get question count (mock for now)
const getQuestionCount = () => {
  return Math.floor(Math.random() * 20) + 10 // Mock: 10-30 questions
}

// Start practice
const startPractice = () => {
  // TODO: Navigate to questions page with selected filters
  router.push({
    path: '/practice/questions',
    query: {
      year: selectedYear.value,
      subject: selectedSubject.value,
    },
  })
}

// Continue practice
const continuePractice = (id: number) => {
  // TODO: Navigate to questions page with practice session ID
  router.push({
    path: '/practice/questions',
    query: {
      sessionId: id,
    },
  })
}
</script>
