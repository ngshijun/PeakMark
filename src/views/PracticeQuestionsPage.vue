<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="space-y-6">
      <!-- Header with Progress -->
      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <h1 class="text-3xl font-bold tracking-tight">Practice Session</h1>
          <p class="text-muted-foreground">
            {{ currentSession?.subject }} - {{ currentSession?.year }}
          </p>
        </div>
        <Button @click="handleEndSession">
          <X class="mr-2 h-4 w-4" />
          End Session
        </Button>
      </div>

      <!-- Progress Stats -->
      <Card>
        <CardContent>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText class="h-5 w-5 text-primary" />
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Attempted</p>
                <p class="text-2xl font-bold">{{ currentSession?.questions_attempted || 0 }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Target class="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Difficulty</p>
                <p class="text-2xl font-bold">{{ currentQuestion?.difficulty || '-' }}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Question Card -->
      <Card v-if="currentQuestion">
        <CardHeader>
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-2">
              <CardTitle>Question {{ (currentSession?.questions_attempted || 0) + 1 }}</CardTitle>
              <CheckCircle v-if="showResult && isCorrect" class="h-5 w-5 text-green-500" />
              <XCircle v-if="showResult && !isCorrect" class="h-5 w-5 text-red-500" />
            </div>
            <Badge variant="outline">{{ currentQuestion.subject }}</Badge>
          </div>
        </CardHeader>
        <CardContent class="space-y-6">
          <!-- Question Image (if exists) -->
          <div v-if="currentQuestion.image" class="rounded-lg border overflow-hidden">
            <img :src="currentQuestion.image" :alt="'Question image'" class="w-full h-auto" />
          </div>

          <!-- Question Text -->
          <div class="space-y-2">
            <Label class="text-base font-medium">{{ currentQuestion.question }}</Label>
          </div>

          <!-- Answer Options -->
          <RadioGroup v-model="selectedAnswer" class="space-y-3" :disabled="showResult">
            <div
              v-for="(option, index) in currentQuestion.options"
              :key="index"
              class="flex items-center space-x-3 rounded-lg border p-4 transition-colors"
              :class="{
                'border-primary bg-primary/5': selectedAnswer === index && !showResult,
                'cursor-pointer hover:bg-muted/50': !showResult,
                'border-green-500 bg-green-500/10':
                  showResult && index === currentQuestion.correct_answer,
                'border-red-500 bg-red-500/10':
                  showResult && index === selectedAnswer && !isCorrect,
                'cursor-not-allowed opacity-60':
                  showResult &&
                  index !== currentQuestion.correct_answer &&
                  index !== selectedAnswer,
              }"
              @click="!showResult && (selectedAnswer = index)"
            >
              <RadioGroupItem :value="index" :id="`option-${index}`" :disabled="showResult" />
              <Label
                :for="`option-${index}`"
                class="flex-1"
                :class="{ 'cursor-pointer': !showResult, 'cursor-not-allowed': showResult }"
              >
                {{ option }}
              </Label>
              <CheckCircle
                v-if="showResult && index === currentQuestion.correct_answer"
                class="h-5 w-5 text-green-500"
              />
              <XCircle
                v-if="showResult && index === selectedAnswer && !isCorrect"
                class="h-5 w-5 text-red-500"
              />
            </div>
          </RadioGroup>

          <!-- Result Feedback -->
          <div v-if="showResult && currentQuestion.explanation" class="space-y-4">
            <!-- Explanation -->
            <div class="rounded-lg border bg-muted/50 p-4">
              <p class="text-sm font-medium mb-2">Explanation</p>
              <p class="text-sm text-muted-foreground">{{ currentQuestion.explanation }}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            v-if="!showResult"
            class="w-full"
            :disabled="selectedAnswer === null || isSubmitting"
            @click="handleSubmitAnswer"
          >
            <Send class="mr-2 h-4 w-4" />
            {{ isSubmitting ? 'Submitting...' : 'Submit Answer' }}
          </Button>
          <Button v-else class="w-full" @click="handleNextQuestion" :disabled="loading">
            {{ hasMoreQuestions ? 'Next Question' : 'Finish Session' }}
            <ArrowRight class="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <!-- Error State -->
      <Card v-if="practiceStore.error && !loading">
        <CardContent class="pt-6 text-center space-y-4">
          <div class="flex justify-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle class="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div class="space-y-2">
            <h3 class="text-xl font-bold">Unable to Start Practice</h3>
            <p class="text-sm text-muted-foreground">
              {{ practiceStore.error }}
            </p>
          </div>
          <Button @click="router.push('/practice')"> Return to Practice </Button>
        </CardContent>
      </Card>

      <!-- No Questions Available -->
      <Card
        v-if="!currentQuestion && !loading && !showResult && currentSession && !practiceStore.error"
      >
        <CardContent class="pt-6 text-center space-y-4">
          <div class="flex justify-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText class="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div class="space-y-2">
            <h3 class="text-xl font-bold">No Questions Available</h3>
            <p class="text-muted-foreground">
              {{ currentSession.subject }} - {{ currentSession.year }}
            </p>
            <p class="text-sm text-muted-foreground">
              There are no questions available for your current skill level, or all questions have
              been completed. Try a different subject or year.
            </p>
          </div>
          <Button @click="handleEndSession"> Return to Practice </Button>
        </CardContent>
      </Card>

      <!-- Loading State -->
      <Card v-if="loading && !currentQuestion">
        <CardHeader>
          <div class="flex items-start justify-between">
            <Skeleton class="h-7 w-32" />
            <Skeleton class="h-6 w-20 rounded-full" />
          </div>
        </CardHeader>
        <CardContent class="space-y-6">
          <div class="space-y-2">
            <Skeleton class="h-5 w-full" />
            <Skeleton class="h-5 w-3/4" />
          </div>
          <div class="space-y-3">
            <Skeleton class="h-16 w-full rounded-lg" />
            <Skeleton class="h-16 w-full rounded-lg" />
            <Skeleton class="h-16 w-full rounded-lg" />
            <Skeleton class="h-16 w-full rounded-lg" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton class="h-10 w-full" />
        </CardFooter>
      </Card>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import MainLayout from '@/layouts/MainLayout.vue'
import { usePracticeStore } from '@/stores/practice'
import { ArrowRight, CheckCircle, FileText, Send, Target, X, XCircle } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const practiceStore = usePracticeStore()

const breadcrumbs = [{ label: 'Practice', to: '/practice' }, { label: 'Questions' }]

// Component state
const selectedAnswer = ref<number | null>(null)
const showResult = ref(false)
const isCorrect = ref(false)
const isSubmitting = ref(false)
const previousElo = ref(0)

// Get reactive refs from store
const { currentSession, currentQuestion, studentElo, loading, questionQueue, answeredQuestions } =
  storeToRefs(practiceStore)

const hasMoreQuestions = computed(() => {
  return questionQueue.value.some((q) => !answeredQuestions.value.has(q.id))
})

// Methods
const handleSubmitAnswer = async () => {
  if (selectedAnswer.value === null) return

  isSubmitting.value = true
  previousElo.value = studentElo.value

  try {
    const correct = await practiceStore.submitAnswer(selectedAnswer.value)
    isCorrect.value = correct
    showResult.value = true
  } catch (err) {
    console.error('Error submitting answer:', err)
  } finally {
    isSubmitting.value = false
  }
}

const handleNextQuestion = () => {
  const hasMore = practiceStore.nextQuestion()

  if (!hasMore) {
    // No more questions, end session
    handleEndSession()
    return
  }

  // Reset state for next question
  selectedAnswer.value = null
  showResult.value = false
  isCorrect.value = false
}

const handleEndSession = async () => {
  try {
    await practiceStore.endSession()
    router.push('/practice')
  } catch (err) {
    console.error('Error ending session:', err)
  }
}

// Initialize
onMounted(async () => {
  const { year, subject, sessionId } = route.query

  try {
    if (sessionId) {
      // Resume existing session
      await practiceStore.resumeSession(sessionId as string)
    } else if (year && subject) {
      // Start new session
      await practiceStore.startSession(subject as string, year as string)
    } else {
      // Invalid route, redirect back
      router.push('/practice')
    }
  } catch (err) {
    console.error('Error initializing practice session:', err)
    // Don't redirect immediately - let the error state show in UI
    // User can click "Return to Practice" button
  }
})
</script>
