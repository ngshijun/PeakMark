<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">
            {{ questionSetsStore.selectedQuestionSet?.name || 'Problem Set' }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ questionSetsStore.selectedQuestionSet?.description || '' }}
          </p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" @click="handleSaveAndExit" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save & Exit' }}
          </Button>
          <Button variant="outline" @click="handleSave" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save' }}
          </Button>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-muted-foreground">Progress</span>
          <span class="font-medium"> {{ answeredCount }}/{{ totalQuestions }} answered </span>
        </div>
        <div class="w-full bg-secondary h-2 rounded-full overflow-hidden">
          <div
            class="bg-primary h-full transition-all duration-300"
            :style="{ width: `${progressPercentage}%` }"
          />
        </div>
      </div>

      <!-- Questions -->
      <div class="flex-1 min-h-0 overflow-y-auto">
        <div v-if="loading" class="space-y-4">
          <Skeleton class="h-48 w-full" />
        </div>

        <div v-else class="space-y-6 pb-4">
          <div
            v-for="(question, index) in questions"
            :key="question.id"
            class="rounded-xl border bg-card p-6 space-y-4"
          >
            <!-- Question Number and Text -->
            <div class="flex gap-4">
              <div
                class="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex-shrink-0"
              >
                {{ index + 1 }}
              </div>
              <div class="flex-1">
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
              <button
                v-for="(option, optIndex) in question.options"
                :key="optIndex"
                @click="selectAnswer(question.id, optIndex)"
                :class="[
                  'w-full text-left p-4 rounded-lg border-2 transition-all',
                  selectedAnswers.get(question.id) === optIndex
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent',
                ]"
              >
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all',
                      selectedAnswers.get(question.id) === optIndex
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground',
                    ]"
                  >
                    <span class="text-xs font-medium">
                      {{ String.fromCharCode(65 + optIndex) }}
                    </span>
                  </div>
                  <span class="text-sm">{{ option }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-end gap-2 pt-2 border-t">
        <Button @click="submitAttempt" :disabled="!allQuestionsAnswered || submitting" size="lg">
          {{ submitting ? 'Submitting...' : 'Submit Answers' }}
        </Button>
      </div>
    </div>

    <!-- Confirm Submit Dialog -->
    <Dialog v-model:open="showSubmitDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Problem Set?</DialogTitle>
          <DialogDescription>
            Are you sure you want to submit? You have answered {{ answeredCount }} out of
            {{ totalQuestions }} questions.
            {{ !allQuestionsAnswered ? 'Unanswered questions will be marked as incorrect.' : '' }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showSubmitDialog = false">Cancel</Button>
          <Button @click="confirmSubmit" :disabled="submitting">
            {{ submitting ? 'Submitting...' : 'Submit' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigation } from '@/composables/useNavigation'
import MainLayout from '@/layouts/MainLayout.vue'
import { useQuestionSetsStore } from '@/stores/question-sets'

const route = useRoute()
const router = useRouter()
const questionSetsStore = useQuestionSetsStore()
const { selectedClassroomId } = useNavigation()

const breadcrumbs = [
  { label: 'Problem Sets', href: `/classroom/${selectedClassroomId.value}/problem-sets` },
  { label: 'Attempt' },
]

// State
const loading = ref(true)
const submitting = ref(false)
const saving = ref(false)
const showSubmitDialog = ref(false)

// Computed
const questions = computed(() => questionSetsStore.selectedQuestionSet?.questions || [])
const selectedAnswers = computed(() => questionSetsStore.currentAnswers)
const totalQuestions = computed(() => questions.value.length)
const answeredCount = computed(() => selectedAnswers.value.size)
const progressPercentage = computed(() => {
  if (totalQuestions.value === 0) return 0
  return (answeredCount.value / totalQuestions.value) * 100
})
const allQuestionsAnswered = computed(() => answeredCount.value === totalQuestions.value)

// Methods
const goBack = () => {
  router.push({
    name: 'problem-sets',
    params: { classroomId: selectedClassroomId.value },
  })
}

const selectAnswer = (questionId: string, answerIndex: number) => {
  // Update local state only (no database write)
  questionSetsStore.selectAnswer(questionId, answerIndex)
}

const handleSave = async () => {
  if (saving.value) return

  saving.value = true
  try {
    await questionSetsStore.saveAnswers()
    toast.success('Answers saved successfully!')
  } catch (error) {
    console.error('Error saving answers:', error)
    toast.error('Failed to save answers')
  } finally {
    saving.value = false
  }
}

const handleSaveAndExit = async () => {
  if (saving.value) return

  saving.value = true
  try {
    await questionSetsStore.saveAnswers()
    toast.success('Answers saved!')
    goBack()
  } catch (error) {
    console.error('Error saving answers:', error)
    toast.error('Failed to save answers')
    saving.value = false
  }
}

const submitAttempt = () => {
  showSubmitDialog.value = true
}

const confirmSubmit = async () => {
  submitting.value = true
  try {
    await questionSetsStore.submitAttempt()
    toast.success('Problem set submitted successfully!')

    // Navigate to results page
    router.push({
      name: 'problem-set-results',
      params: {
        classroomId: selectedClassroomId.value,
        attemptId: questionSetsStore.currentAttempt?.id,
      },
    })
  } catch (error) {
    console.error('Error submitting attempt:', error)
    toast.error('Failed to submit problem set')
  } finally {
    submitting.value = false
    showSubmitDialog.value = false
  }
}

// Lifecycle
onMounted(async () => {
  const setId = route.params.setId as string
  const attemptId = route.params.attemptId as string

  try {
    // Load question set with questions
    await questionSetsStore.fetchQuestionSetWithQuestions(setId)

    // Load attempt details
    const attempt = await questionSetsStore.checkActiveAttempt(
      questionSetsStore.currentAttempt?.student_id || '',
      setId,
    )

    if (!attempt || attempt.id !== attemptId) {
      toast.error('Invalid attempt')
      goBack()
      return
    }
  } catch (error) {
    console.error('Error loading attempt:', error)
    toast.error('Failed to load problem set')
    goBack()
  } finally {
    loading.value = false
  }
})
</script>
