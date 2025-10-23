<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-6">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <Skeleton class="h-32 w-full" />
        <Skeleton class="h-48 w-full" />
      </div>

      <template v-else-if="results">
        <!-- Header with Score -->
        <div class="rounded-xl border bg-card p-8 text-center space-y-4">
          <div class="space-y-2">
            <h1 class="text-3xl font-bold">Results</h1>
            <p class="text-muted-foreground">
              {{ results.question_set?.name || 'Problem Set' }}
            </p>
          </div>

          <!-- Score Display -->
          <div class="flex items-center justify-center gap-8 py-6">
            <div class="text-center">
              <div class="text-5xl font-bold text-primary">
                {{ results.score }}
              </div>
              <div class="text-sm text-muted-foreground mt-2">Correct</div>
            </div>
            <div class="text-4xl text-muted-foreground">/</div>
            <div class="text-center">
              <div class="text-5xl font-bold">
                {{ results.total_questions }}
              </div>
              <div class="text-sm text-muted-foreground mt-2">Total</div>
            </div>
          </div>

          <!-- Percentage -->
          <div class="space-y-2">
            <div class="text-2xl font-bold">{{ percentage }}%</div>
            <div class="w-full max-w-md mx-auto bg-secondary h-3 rounded-full overflow-hidden">
              <div
                class="bg-primary h-full transition-all duration-500"
                :style="{ width: `${percentage}%` }"
              />
            </div>
          </div>

          <!-- Back Button -->
          <div class="pt-4">
            <Button @click="goBack">Back to Problem Sets</Button>
          </div>
        </div>

        <!-- Questions Review -->
        <div v-if="showExplanations" class="space-y-4">
          <h2 class="text-xl font-semibold">Review Answers</h2>

          <div
            v-for="(question, index) in questions"
            :key="question.id"
            class="rounded-xl border bg-card p-6 space-y-4"
          >
            <!-- Question Header -->
            <div class="flex gap-4">
              <div
                :class="[
                  'flex items-center justify-center w-10 h-10 rounded-full font-bold flex-shrink-0',
                  getAnswer(question.id)?.is_correct
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
                ]"
              >
                {{ index + 1 }}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <Badge :variant="getAnswer(question.id)?.is_correct ? 'default' : 'destructive'">
                    {{ getAnswer(question.id)?.is_correct ? 'Correct' : 'Incorrect' }}
                  </Badge>
                </div>
                <p class="text-base font-medium">{{ question.question }}</p>

                <!-- Image if exists -->
                <div v-if="question.image" class="mt-3">
                  <img
                    :src="question.image"
                    alt="Question image"
                    class="max-w-full max-h-64 rounded-lg border"
                  />
                </div>
              </div>
            </div>

            <!-- Answer Options -->
            <div class="space-y-2 pl-14">
              <div
                v-for="(option, optIndex) in question.options"
                :key="optIndex"
                :class="[
                  'w-full text-left p-4 rounded-lg border-2',
                  question.correct_answer === optIndex
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : getAnswer(question.id)?.selected_answer === optIndex
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-border',
                ]"
              >
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'flex items-center justify-center w-6 h-6 rounded-full border-2',
                      question.correct_answer === optIndex
                        ? 'border-green-600 bg-green-600 text-white'
                        : getAnswer(question.id)?.selected_answer === optIndex
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-muted-foreground',
                    ]"
                  >
                    <span class="text-xs font-medium">
                      {{ String.fromCharCode(65 + optIndex) }}
                    </span>
                  </div>
                  <span class="text-sm flex-1">{{ option }}</span>
                  <div class="flex gap-1">
                    <Check
                      v-if="question.correct_answer === optIndex"
                      class="h-5 w-5 text-green-600"
                    />
                    <X
                      v-if="
                        getAnswer(question.id)?.selected_answer === optIndex &&
                        !getAnswer(question.id)?.is_correct
                      "
                      class="h-5 w-5 text-red-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Explanation -->
            <div
              v-if="question.explanation"
              class="pl-14 p-4 rounded-lg bg-muted/50 border-l-4 border-primary"
            >
              <p class="text-xs font-semibold text-muted-foreground uppercase mb-1">Explanation</p>
              <p class="text-sm">{{ question.explanation }}</p>
            </div>
          </div>
        </div>

        <!-- No Explanations Message -->
        <div v-else class="rounded-xl border bg-card p-6 text-center">
          <p class="text-muted-foreground">
            Answer explanations are not available for this problem set.
          </p>
        </div>
      </template>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigation } from '@/composables/useNavigation'
import MainLayout from '@/layouts/MainLayout.vue'
import { useQuestionSetsStore } from '@/stores/question-sets'
import { Check, X } from 'lucide-vue-next'
import type { Tables } from '@/types/database.types'

type QuestionSetQuestion = Tables<'question_set_questions'>

const route = useRoute()
const router = useRouter()
const questionSetsStore = useQuestionSetsStore()
const { selectedClassroomId } = useNavigation()

const breadcrumbs = [
  { label: 'Problem Sets', href: `/classroom/${selectedClassroomId.value}/problem-sets` },
  { label: 'Results' },
]

// State
const loading = ref(true)

// Computed
const results = computed(() => questionSetsStore.attemptResults)
const showExplanations = computed(() => results.value?.question_set?.show_explanations ?? false)
const percentage = computed(() => {
  if (!results.value) return 0
  const total = results.value.total_questions ?? 0
  const score = results.value.score ?? 0
  if (total === 0) return 0
  return Math.round((score / total) * 100)
})

const questions = ref<QuestionSetQuestion[]>([])

// Methods
const goBack = () => {
  questionSetsStore.clearAttempt()
  router.push({
    name: 'problem-sets',
    params: { classroomId: selectedClassroomId.value },
  })
}

const getAnswer = (questionId: string) => {
  return results.value?.answers.find((a) => a.question_id === questionId)
}

// Lifecycle
onMounted(async () => {
  const attemptId = route.params.attemptId as string

  try {
    await questionSetsStore.fetchAttemptResults(attemptId)

    if (results.value && results.value.question_set_id) {
      const questionSet = await questionSetsStore.fetchQuestionSetWithQuestions(
        results.value.question_set_id,
      )
      if (questionSet) {
        questions.value = questionSet.questions
      }
    }
  } catch (error) {
    console.error('Error loading results:', error)
    toast.error('Failed to load results')
    goBack()
  } finally {
    loading.value = false
  }
})
</script>
