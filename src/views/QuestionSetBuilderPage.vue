<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">
            {{ isEditMode ? 'Edit Problem Set' : 'Create Problem Set' }}
          </h1>
          <p class="text-muted-foreground">
            {{ isEditMode ? 'Update your problem set' : 'Create a new problem set with questions' }}
          </p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" @click="goBack">Cancel</Button>
          <Button variant="outline" @click="saveDraft" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Draft' }}
          </Button>
          <Button @click="publishQuestionSet" :disabled="saving || !canPublish">
            {{ saving ? 'Publishing...' : 'Publish' }}
          </Button>
        </div>
      </div>

      <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Left Panel: Problem Set Info -->
        <div class="lg:col-span-1 space-y-4">
          <div class="rounded-xl border bg-card p-6 space-y-4">
            <h2 class="text-lg font-semibold">Problem Set Details</h2>

            <!-- Name -->
            <div class="space-y-2">
              <Label for="name">Name *</Label>
              <Input
                id="name"
                v-model="questionSetForm.name"
                placeholder="Enter problem set name"
              />
            </div>

            <!-- Description -->
            <div class="space-y-2">
              <Label for="description">Description</Label>
              <Textarea
                id="description"
                v-model="questionSetForm.description"
                placeholder="Enter description"
                rows="4"
              />
            </div>

            <!-- Settings -->
            <div class="space-y-3 pt-2">
              <h3 class="text-sm font-medium">Settings</h3>

              <div class="flex items-center justify-between">
                <Label for="show-explanations" class="text-sm font-normal">
                  Show explanations after submission
                </Label>
                <Switch
                  id="show-explanations"
                  v-model:checked="questionSetForm.show_explanations"
                />
              </div>
            </div>

            <!-- Stats -->
            <div v-if="isEditMode" class="pt-4 border-t space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Total Questions:</span>
                <span class="font-medium">{{ questions.length }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Status:</span>
                <Badge :variant="isPublished ? 'default' : 'secondary'">
                  {{ isPublished ? 'Published' : 'Draft' }}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel: Questions -->
        <div class="lg:col-span-2 space-y-4 overflow-y-auto">
          <div class="rounded-xl border bg-card p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold">Questions</h2>
              <Button @click="addQuestion" size="sm">
                <Plus class="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>

            <!-- Empty State -->
            <div
              v-if="questions.length === 0"
              class="text-center py-12 border-2 border-dashed rounded-lg"
            >
              <FileQuestion class="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p class="text-sm text-muted-foreground mb-4">
                No questions yet. Add your first question to get started.
              </p>
              <Button @click="addQuestion" variant="outline">
                <Plus class="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>

            <!-- Questions List -->
            <div v-else class="space-y-3">
              <div
                v-for="(question, index) in questions"
                :key="question.id || index"
                class="border rounded-lg p-4 space-y-3"
              >
                <div class="flex items-start justify-between">
                  <div class="flex items-start gap-3 flex-1">
                    <div
                      class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm flex-shrink-0"
                    >
                      {{ index + 1 }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-sm">
                        {{ question.question || 'New Question' }}
                      </p>
                      <div class="flex flex-wrap gap-1 mt-2">
                        <Badge
                          v-for="(opt, optIndex) in question.options"
                          :key="optIndex"
                          :variant="question.correct_answer === optIndex ? 'default' : 'outline'"
                          class="text-xs"
                        >
                          {{ String.fromCharCode(65 + optIndex) }}. {{ opt.substring(0, 20)
                          }}{{ opt.length > 20 ? '...' : '' }}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-1">
                    <Button variant="ghost" size="icon" @click="editQuestion(index)">
                      <Pencil class="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" @click="deleteQuestion(index)">
                      <Trash2 class="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Question Dialog -->
    <Dialog v-model:open="isQuestionDialogOpen">
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ editingIndex !== null ? 'Edit Question' : 'Add Question' }}</DialogTitle>
        </DialogHeader>

        <div class="space-y-4">
          <!-- Question Text -->
          <div class="space-y-2">
            <Label>Question *</Label>
            <Textarea v-model="currentQuestion.question" placeholder="Enter question" rows="3" />
          </div>

          <!-- Image Upload -->
          <div class="space-y-2">
            <Label>Image (Optional)</Label>
            <div class="space-y-2">
              <Button
                type="button"
                variant="outline"
                @click="() => imageInput?.click()"
                class="w-full"
              >
                <Upload class="mr-2 h-4 w-4" />
                {{ imagePreviewUrl ? 'Change Image' : 'Upload Image' }}
              </Button>
              <input
                ref="imageInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleImageUpload"
              />
              <div v-if="imagePreviewUrl" class="relative inline-block">
                <img :src="imagePreviewUrl" alt="Preview" class="max-h-32 rounded-md border" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  @click="removeImage"
                  class="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border"
                >
                  <X class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Options -->
          <div class="space-y-2">
            <Label>Answer Options *</Label>
            <div class="space-y-2">
              <div
                v-for="(option, index) in currentQuestion.options"
                :key="index"
                class="flex items-center gap-2"
              >
                <input
                  type="radio"
                  :value="index"
                  v-model="currentQuestion.correct_answer"
                  :id="`option-${index}`"
                  class="h-4 w-4"
                />
                <Label :for="`option-${index}`" class="sr-only">Option {{ index + 1 }}</Label>
                <span class="text-sm font-medium min-w-[1.25rem]">{{
                  String.fromCharCode(65 + index)
                }}</span>
                <Input
                  v-model="currentQuestion.options[index]"
                  :placeholder="`Option ${String.fromCharCode(65 + index)}`"
                  class="flex-1"
                />
                <Button
                  v-if="currentQuestion.options.length > 2"
                  variant="ghost"
                  size="icon"
                  @click="removeOption(index)"
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" @click="addOption">
                <Plus class="mr-2 h-4 w-4" />
                Add Option
              </Button>
            </div>
          </div>

          <!-- Explanation -->
          <div class="space-y-2">
            <Label>Explanation (Optional)</Label>
            <Textarea
              v-model="currentQuestion.explanation"
              placeholder="Explain the correct answer"
              rows="3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isQuestionDialogOpen = false">Cancel</Button>
          <Button @click="saveQuestion" :disabled="!isQuestionValid">
            {{ editingIndex !== null ? 'Update' : 'Add' }} Question
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useNavigation } from '@/composables/useNavigation'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useQuestionSetsStore } from '@/stores/question-sets'
import { FileQuestion, Pencil, Plus, Trash2, Upload, X } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const questionSetsStore = useQuestionSetsStore()
const { selectedClassroomId } = useNavigation()

const breadcrumbs = [
  { label: 'Problem Sets', href: `/classroom/${selectedClassroomId.value}/problem-sets` },
  { label: route.params.setId ? 'Edit' : 'Create' },
]

// State
const isEditMode = computed(() => !!route.params.setId)
const isPublished = ref(false)
const saving = ref(false)

const questionSetForm = ref({
  name: '',
  description: '',
  show_explanations: true,
})

const questions = ref<
  Array<{
    id?: string
    question: string
    options: string[]
    correct_answer: number
    explanation: string | null
    image: string | null
    order: number
  }>
>([])

// Question Dialog
const isQuestionDialogOpen = ref(false)
const editingIndex = ref<number | null>(null)
const currentQuestion = ref({
  question: '',
  options: ['', '', '', ''],
  correct_answer: 0,
  explanation: '',
  image: null as string | null,
})

const imageInput = ref<HTMLInputElement | null>(null)
const imageFile = ref<File | null>(null)
const imagePreviewUrl = ref('')

// Computed
const canPublish = computed(() => {
  return questionSetForm.value.name.trim() !== '' && questions.value.length > 0
})

const isQuestionValid = computed(() => {
  return (
    currentQuestion.value.question.trim() !== '' &&
    currentQuestion.value.options.every((opt) => opt.trim() !== '')
  )
})

// Methods
const goBack = () => {
  router.push({
    name: 'problem-sets',
    params: { classroomId: selectedClassroomId.value },
  })
}

const addQuestion = () => {
  currentQuestion.value = {
    question: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    explanation: '',
    image: null,
  }
  editingIndex.value = null
  imageFile.value = null
  imagePreviewUrl.value = ''
  isQuestionDialogOpen.value = true
}

const editQuestion = (index: number) => {
  const question = questions.value[index]
  if (!question) return

  currentQuestion.value = {
    question: question.question,
    options: [...question.options],
    correct_answer: question.correct_answer,
    explanation: question.explanation || '',
    image: question.image,
  }
  editingIndex.value = index
  imageFile.value = null
  imagePreviewUrl.value = question.image || ''
  isQuestionDialogOpen.value = true
}

const saveQuestion = () => {
  if (!isQuestionValid.value) return

  const questionData = {
    ...currentQuestion.value,
    order:
      editingIndex.value !== null && questions.value[editingIndex.value]
        ? questions.value[editingIndex.value]!.order
        : questions.value.length,
  }

  if (editingIndex.value !== null && questions.value[editingIndex.value]) {
    questions.value[editingIndex.value] = {
      ...questions.value[editingIndex.value]!,
      ...questionData,
    }
  } else {
    questions.value.push(questionData)
  }

  isQuestionDialogOpen.value = false
}

const deleteQuestion = (index: number) => {
  questions.value.splice(index, 1)
  // Reorder remaining questions
  questions.value.forEach((q, i) => {
    q.order = i
  })
}

const addOption = () => {
  currentQuestion.value.options.push('')
}

const removeOption = (index: number) => {
  if (currentQuestion.value.options.length <= 2) return
  currentQuestion.value.options.splice(index, 1)
  if (currentQuestion.value.correct_answer >= index) {
    currentQuestion.value.correct_answer = Math.max(0, currentQuestion.value.correct_answer - 1)
  }
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    imageFile.value = file
    imagePreviewUrl.value = URL.createObjectURL(file)
  }
}

const removeImage = () => {
  imageFile.value = null
  imagePreviewUrl.value = ''
  currentQuestion.value.image = null
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

const saveDraft = async () => {
  if (!questionSetForm.value.name.trim()) {
    toast.error('Please enter a problem set name')
    return
  }

  saving.value = true
  try {
    let questionSetId = route.params.setId as string

    // Create or update question set
    if (isEditMode.value) {
      await questionSetsStore.updateQuestionSet(questionSetId, {
        name: questionSetForm.value.name,
        description: questionSetForm.value.description || null,
        show_explanations: questionSetForm.value.show_explanations,
        total_points: questions.value.length,
      })
    } else {
      const newSet = await questionSetsStore.createQuestionSet({
        name: questionSetForm.value.name,
        description: questionSetForm.value.description || null,
        classroom_id: selectedClassroomId.value!,
        created_by: authStore.user!.id,
        show_explanations: questionSetForm.value.show_explanations,
        total_points: questions.value.length,
        is_published: false,
      })
      questionSetId = newSet.id

      // Navigate to edit mode
      router.replace({
        name: 'problem-sets-edit',
        params: { classroomId: selectedClassroomId.value, setId: questionSetId },
      })
    }

    // Save questions
    await saveQuestions(questionSetId)

    toast.success('Draft saved successfully')
  } catch (error) {
    console.error('Error saving draft:', error)
    toast.error('Failed to save draft')
  } finally {
    saving.value = false
  }
}

const publishQuestionSet = async () => {
  await saveDraft()

  if (!route.params.setId) return

  try {
    await questionSetsStore.togglePublishStatus(route.params.setId as string, true)
    isPublished.value = true
    toast.success('Problem set published successfully')
    goBack()
  } catch (error) {
    console.error('Error publishing:', error)
    toast.error('Failed to publish problem set')
  }
}

const saveQuestions = async (questionSetId: string) => {
  // For simplicity, delete all existing questions and recreate
  // In production, you'd want to handle updates more granularly
  const existingQuestions = await questionSetsStore.fetchQuestions(questionSetId)

  for (const q of existingQuestions) {
    await questionSetsStore.deleteQuestion(q.id)
  }

  // Create new questions
  for (const q of questions.value) {
    let imageUrl = q.image

    // Handle image upload
    if (imageFile.value && editingIndex.value !== null) {
      imageUrl = await questionSetsStore.uploadQuestionImage(
        imageFile.value,
        selectedClassroomId.value!,
        questionSetId,
      )
    }

    await questionSetsStore.createQuestion({
      question_set_id: questionSetId,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation || null,
      image: imageUrl,
      order: q.order,
    })
  }
}

// Lifecycle
onMounted(async () => {
  if (isEditMode.value) {
    const setId = route.params.setId as string
    try {
      const data = await questionSetsStore.fetchQuestionSetWithQuestions(setId)
      if (data) {
        questionSetForm.value = {
          name: data.name,
          description: data.description || '',
          show_explanations: data.show_explanations ?? true,
        }
        isPublished.value = data.is_published ?? false
        questions.value = data.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          image: q.image,
          order: q.order,
        }))
      }
    } catch (error) {
      console.error('Error loading question set:', error)
      toast.error('Failed to load problem set')
    }
  }
})
</script>
