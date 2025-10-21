<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-6">
      <!-- Category Selection View -->
      <div v-if="!practiceStarted" class="space-y-4">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight">Practice Questions</h1>
          <p class="text-muted-foreground">
            Select a category to start practicing. Questions will adapt to your skill level.
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="categoryStore.loading" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card v-for="i in 6" :key="i" class="overflow-hidden">
            <CardHeader>
              <Skeleton class="h-6 w-3/4" />
            </CardHeader>
            <CardContent class="space-y-2">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-2/3" />
            </CardContent>
          </Card>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="categoryStore.categories.length === 0"
          class="text-center py-12 rounded-lg border border-dashed"
        >
          <p class="text-muted-foreground">No categories available yet.</p>
          <p class="text-sm text-muted-foreground mt-1">
            Your teacher hasn't created any question categories yet.
          </p>
        </div>

        <!-- Category Cards -->
        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card
            v-for="category in categoryStore.categories"
            :key="category.id"
            class="cursor-pointer hover:border-primary transition-colors overflow-hidden"
            @click="selectCategory(category.id)"
          >
            <CardHeader>
              <CardTitle>{{ category.name }}</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Accuracy</span>
                <span class="text-sm font-medium">{{ getAccuracyForCategory(category.id) }}%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Questions Attempted</span>
                <span class="text-sm font-medium">{{ getAttemptsForCategory(category.id) }}</span>
              </div>
            </CardContent>
            <CardFooter class="bg-muted/50 border-t">
              <Button class="w-full" size="sm">
                <Play class="mr-2 h-4 w-4" />
                Start Practice
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <!-- Practice Session View -->
      <div v-else class="flex-1 flex flex-col space-y-4">
        <!-- Header with Stats -->
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <h2 class="text-2xl font-bold">{{ selectedCategoryName }}</h2>
            <p class="text-sm text-muted-foreground">Question {{ questionIndex + 1 }}</p>
          </div>
          <Button variant="outline" @click="endPractice" size="sm">
            <X class="mr-2 h-4 w-4" />
            End Practice
          </Button>
        </div>

        <!-- Stats Bar -->
        <div class="grid gap-4 grid-cols-3">
          <Card>
            <CardHeader class="pb-2">
              <CardDescription>Current Streak</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ questionStore.practiceStats.currentStreak }}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader class="pb-2">
              <CardDescription>Accuracy</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">
                {{ Math.round(questionStore.practiceAccuracy) }}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader class="pb-2">
              <CardDescription>Questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">
                {{ questionStore.practiceStats.questionsAttempted }}
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Question Card -->
        <Card v-if="currentQuestion" class="flex-1">
          <CardContent class="space-y-6">
            <!-- Result Feedback (shown after submission) -->
            <div v-if="showingResult && lastResult" class="flex items-center gap-3">
              <div
                :class="[
                  'p-2 rounded-full',
                  lastResult.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600',
                ]"
              >
                <CheckCircle v-if="lastResult.isCorrect" class="h-5 w-5" />
                <XCircle v-else class="h-5 w-5" />
              </div>
              <div>
                <h3 class="text-lg font-bold">
                  {{ lastResult.isCorrect ? 'Correct!' : 'Incorrect' }}
                </h3>
                <p class="text-sm text-muted-foreground">
                  {{
                    lastResult.isCorrect ? 'Great job! Keep it up!' : 'Review the explanation below'
                  }}
                </p>
              </div>
            </div>

            <!-- Question Text -->
            <div class="prose dark:prose-invert max-w-none">
              <p class="text-lg font-medium">{{ currentQuestion.question_text }}</p>
            </div>

            <!-- Question Image -->
            <div v-if="currentQuestion.image" class="flex justify-center">
              <img
                :src="currentQuestion.image"
                alt="Question image"
                class="max-w-full max-h-64 rounded-lg border"
              />
            </div>

            <!-- Answer Options -->
            <div class="space-y-3">
              <button
                v-for="(option, index) in currentQuestion.options"
                :key="index"
                @click="selectAnswer(index)"
                :disabled="showingResult"
                :class="[
                  'w-full text-left p-4 rounded-lg border-2 transition-all',
                  // Correct answer (green) - always show when submitted
                  showingResult && index === currentQuestion.correct_answer
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : // Wrong answer (red) - show when user selected it and it's wrong
                      showingResult &&
                        index === selectedAnswer &&
                        selectedAnswer !== currentQuestion.correct_answer
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : // Not submitted yet - normal styling
                        selectedAnswer === index
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50',
                  showingResult && 'cursor-not-allowed',
                ]"
              >
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 font-medium',
                      // Correct answer icon
                      showingResult && index === currentQuestion.correct_answer
                        ? 'border-green-600 bg-green-600 text-white'
                        : // Wrong answer icon
                          showingResult &&
                            index === selectedAnswer &&
                            selectedAnswer !== currentQuestion.correct_answer
                          ? 'border-red-600 bg-red-600 text-white'
                          : // Not submitted yet
                            selectedAnswer === index
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border',
                    ]"
                  >
                    {{ String.fromCharCode(65 + index) }}
                  </div>
                  <span class="flex-1">{{ option }}</span>

                  <CheckCircle
                    v-if="showingResult && index === currentQuestion.correct_answer"
                    class="h-5 w-5 text-green-600"
                  />
                  <XCircle
                    v-if="
                      showingResult &&
                      index === selectedAnswer &&
                      selectedAnswer !== currentQuestion.correct_answer
                    "
                    class="h-5 text-red-600"
                  />
                </div>
              </button>
            </div>


            <div
              v-if="showingResult && currentQuestion.explanation"
              class="p-4 rounded-lg border bg-muted/30"
            >
              <p class="text-sm font-semibold mb-2">Explanation:</p>
              <p class="text-sm">{{ currentQuestion.explanation }}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              v-if="!showingResult"
              class="w-full"
              size="lg"
              :disabled="selectedAnswer === null || submitting"
              @click="submitAnswer"
            >
              {{ submitting ? 'Submitting...' : 'Submit Answer' }}
            </Button>
            <Button v-else class="w-full" size="lg" @click="nextQuestion">
              <ArrowRight class="mr-2 h-4 w-4" />
              Next Question
            </Button>
          </CardFooter>
        </Card>

        <!-- Loading Next Question -->
        <Card v-else class="flex-1">
          <CardContent class="flex items-center justify-center h-full">
            <div class="text-center space-y-4">
              <Loader2 class="h-12 w-12 animate-spin mx-auto text-primary" />
              <p class="text-muted-foreground">Loading next question...</p>
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
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigation } from '@/composables/useNavigation'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useQuestionCategoriesStore } from '@/stores/question-categories'
import { useQuestionStore } from '@/stores/questions'
import { ArrowRight, CheckCircle, Loader2, Play, X, XCircle } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

const breadcrumbs = [{ label: 'Practice' }]

const questionStore = useQuestionStore()
const categoryStore = useQuestionCategoriesStore()
const authStore = useAuthStore()
const { selectedClassroomId } = useNavigation()

// State
const practiceStarted = ref(false)
const selectedCategoryId = ref<string>('')
const selectedAnswer = ref<number | null>(null)
const submitting = ref(false)
const showingResult = ref(false)
const questionIndex = ref(0)

const lastResult = ref<{
  isCorrect: boolean
  eloChange: number
  studentEloBefore: number
  studentEloAfter: number
  questionEloBefore: number
  questionEloAfter: number
} | null>(null)

// Computed
const currentQuestion = computed(() => questionStore.currentPracticeQuestion)

const selectedCategoryName = computed(() => {
  const category = categoryStore.categories.find((c) => c.id === selectedCategoryId.value)
  return category?.name || ''
})

// Helper Functions
const getAccuracyForCategory = (categoryId: string) => {
  const studentElo = questionStore.studentElos.find((e) => e.category_id === categoryId)
  if (!studentElo || !studentElo.total_attempts) return 0
  return Math.round((studentElo.total_correct! / studentElo.total_attempts!) * 100)
}

const getAttemptsForCategory = (categoryId: string) => {
  const studentElo = questionStore.studentElos.find((e) => e.category_id === categoryId)
  return studentElo?.total_attempts || 0
}

// Actions
const selectCategory = async (categoryId: string) => {
  try {
    selectedCategoryId.value = categoryId
    questionStore.startPractice()
    practiceStarted.value = true
    questionIndex.value = 0

    // Ensure student_elo entry exists before starting practice
    await questionStore.ensureStudentElo(authStore.user!.id, categoryId, selectedClassroomId.value!)

    await loadNextQuestion()
  } catch (error) {
    console.error('Error starting practice:', error)
    toast.error('Failed to start practice')
    practiceStarted.value = false
  }
}

const loadNextQuestion = async () => {
  try {
    showingResult.value = false
    selectedAnswer.value = null
    lastResult.value = null

    await questionStore.getNextPracticeQuestion(
      authStore.user!.id,
      selectedCategoryId.value,
      selectedClassroomId.value!,
    )
  } catch (error) {
    console.error('Error loading question:', error)
    toast.error('Failed to load next question')
    endPractice()
  }
}

const selectAnswer = (index: number) => {
  if (submitting.value || showingResult.value) return
  selectedAnswer.value = index
}

const submitAnswer = async () => {
  if (selectedAnswer.value === null || !currentQuestion.value) return

  submitting.value = true
  try {
    const result = await questionStore.submitAnswer(
      currentQuestion.value.question_id,
      authStore.user!.id,
      selectedCategoryId.value,
      selectedClassroomId.value!,
      selectedAnswer.value,
      currentQuestion.value.correct_answer,
    )

    const isCorrect = selectedAnswer.value === currentQuestion.value.correct_answer

    lastResult.value = {
      isCorrect,
      eloChange: result.student_elo_change,
      studentEloBefore: result.student_elo_before,
      studentEloAfter: result.student_elo_after,
      questionEloBefore: result.question_elo_before,
      questionEloAfter: result.question_elo_after,
    }

    showingResult.value = true
    questionIndex.value++
  } catch (error) {
    console.error('Error submitting answer:', error)
    toast.error('Failed to submit answer')
  } finally {
    submitting.value = false
  }
}

const nextQuestion = async () => {
  await loadNextQuestion()
}

const endPractice = async () => {
  practiceStarted.value = false
  selectedCategoryId.value = ''
  selectedAnswer.value = null
  showingResult.value = false
  questionIndex.value = 0
  lastResult.value = null
  questionStore.clearPractice()

  // Refresh student ELO data to update accuracy and questions attempted
  try {
    await questionStore.fetchStudentElosByClassroom(authStore.user!.id, selectedClassroomId.value!)
  } catch (error) {
    console.error('Error refreshing student stats:', error)
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    categoryStore.fetchCategoriesByClassroom(selectedClassroomId.value!),
    questionStore.fetchStudentElosByClassroom(authStore.user!.id, selectedClassroomId.value!),
  ])
})
</script>
