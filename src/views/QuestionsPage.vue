<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-4">
      <!-- Search and Filters Bar -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <!-- Search Input -->
          <div class="relative flex-1 sm:max-w-md">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="search"
              placeholder="Search questions by content or keyword..."
              class="pl-8"
            />
          </div>

          <!-- Subject Filter -->
          <Select v-model="selectedSubject">
            <SelectTrigger class="w-full sm:w-[180px]">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="mathematics">Mathematics</SelectItem>
              <SelectItem value="science">Science</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="history">History</SelectItem>
            </SelectContent>
          </Select>

          <!-- Difficulty Filter -->
          <Select v-model="selectedDifficulty">
            <SelectTrigger class="w-full sm:w-[180px]">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Create Question Button -->
        <Button @click="isCreateDialogOpen = true">
          <Plus class="mr-2 h-4 w-4" />
          Create Question
        </Button>
      </div>

      <!-- Questions List/Table -->
      <div class="flex-1 rounded-xl border bg-card p-6">
        <p class="text-sm text-muted-foreground">
          Questions will be displayed here based on search and filters.
        </p>
      </div>
    </div>

    <!-- Create Question Dialog -->
    <Dialog v-model:open="isCreateDialogOpen">
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Question</DialogTitle>
          <DialogDescription>
            Add a new question to your question pool. Fill in all the required fields.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-6">
          <!-- Subject and Difficulty -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label class="text-sm font-medium">
                Subject <span class="text-destructive">*</span>
              </Label>
              <Select v-model="newQuestion.subject">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label class="text-sm font-medium">Difficulty Level</Label>
              <Select v-model="newQuestion.difficulty">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy (1)</SelectItem>
                  <SelectItem value="medium">Medium (3)</SelectItem>
                  <SelectItem value="hard">Hard (5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Question Content -->
          <div class="space-y-2">
            <Label class="text-sm font-medium">
              Question Content <span class="text-destructive">*</span>
            </Label>
            <Textarea
              v-model="newQuestion.content"
              placeholder="Enter your question here..."
              class="min-h-[100px] resize-none"
            />
          </div>

          <!-- Image Upload -->
          <div class="space-y-2">
            <Label class="text-sm font-medium">Image (Optional)</Label>
            <div class="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                @click="() => imageInput?.click()"
                class="w-full"
              >
                <Upload class="mr-2 h-4 w-4" />
                {{ newQuestion.image ? 'Change Image' : 'Upload Image' }}
              </Button>
              <input
                ref="imageInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleImageUpload"
              />
              <Button
                v-if="newQuestion.image"
                type="button"
                variant="ghost"
                size="icon"
                @click="removeImage"
              >
                <X class="h-4 w-4" />
              </Button>
            </div>
            <div v-if="newQuestion.image" class="mt-2">
              <img
                :src="newQuestion.image"
                alt="Question image"
                class="max-h-32 rounded-md border"
              />
            </div>
          </div>

          <!-- Answer Options -->
          <div class="space-y-2">
            <Label class="text-sm font-medium">
              Answer Options <span class="text-destructive">*</span>
            </Label>
            <RadioGroup v-model="newQuestion.correctAnswer" class="space-y-2">
              <div
                v-for="(option, index) in newQuestion.options"
                :key="index"
                class="flex items-center gap-2"
              >
                <RadioGroupItem :value="String(index)" :id="`option-${index}`" />
                <Label :for="`option-${index}`" class="sr-only"
                  >Option {{ String.fromCharCode(65 + index) }}</Label
                >
                <span class="text-sm font-medium min-w-[20px]">{{
                  String.fromCharCode(65 + index)
                }}</span>
                <Input
                  v-model="newQuestion.options[index]"
                  :placeholder="`Option ${String.fromCharCode(65 + index)}`"
                  class="flex-1"
                />
                <Button
                  v-if="newQuestion.options.length > 2"
                  variant="ghost"
                  size="icon"
                  @click="removeOption(index)"
                  class="h-8 w-8"
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>
            </RadioGroup>
            <Button variant="outline" size="sm" @click="addOption" class="mt-2">
              <Plus class="mr-2 h-4 w-4" />
              Add Option
            </Button>
          </div>

          <!-- Explanation (Optional) -->
          <div class="space-y-2">
            <Label class="text-sm font-medium">Explanation (Optional)</Label>
            <Textarea
              v-model="newQuestion.explanation"
              placeholder="Provide an explanation for the correct answer..."
              class="min-h-[100px] resize-none"
            />
          </div>
        </div>

        <DialogFooter class="gap-2 sm:justify-between">
          <Button variant="outline" @click="isPreviewOpen = true" class="sm:mr-auto">
            <Eye class="mr-2 h-4 w-4" />
            Preview
          </Button>
          <div class="flex gap-2">
            <Button variant="outline" @click="isCreateDialogOpen = false">Cancel</Button>
            <Button @click="handleCreateQuestion">Create Question</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Preview Dialog -->
    <Dialog v-model:open="isPreviewOpen">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Question Preview</DialogTitle>
          <DialogDescription> This is how your question will appear to students </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 rounded-lg border bg-muted/30 p-6">
          <!-- Question Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium capitalize text-muted-foreground">
                {{ newQuestion.subject || 'Subject' }}
              </span>
              <span class="text-xs text-muted-foreground">•</span>
              <span class="text-xs font-medium capitalize text-muted-foreground">
                {{ newQuestion.difficulty || 'Difficulty' }}
              </span>
            </div>
          </div>

          <!-- Question Content -->
          <div class="space-y-4">
            <p class="text-base font-medium">
              {{ newQuestion.content || 'Your question will appear here...' }}
            </p>

            <!-- Image Preview -->
            <div v-if="newQuestion.image" class="my-4">
              <img
                :src="newQuestion.image"
                alt="Question image"
                class="max-w-full rounded-md border"
              />
            </div>

            <!-- Answer Options Preview -->
            <div class="space-y-2">
              <div
                v-for="(option, index) in newQuestion.options.filter((o) => o.trim())"
                :key="index"
                :class="[
                  'flex items-center gap-3 rounded-md border p-3 transition-colors',
                  newQuestion.correctAnswer === String(index)
                    ? 'border-primary bg-primary/5'
                    : 'bg-card',
                ]"
              >
                <div class="flex h-6 w-6 items-center justify-center rounded-full border">
                  <span class="text-xs font-medium">{{ String.fromCharCode(65 + index) }}</span>
                </div>
                <span class="text-sm">{{ option }}</span>
              </div>
            </div>

            <!-- Explanation Preview -->
            <div v-if="newQuestion.explanation" class="rounded-md border bg-card p-4">
              <p class="text-xs font-semibold text-muted-foreground uppercase mb-2">Explanation</p>
              <p class="text-sm">{{ newQuestion.explanation }}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isPreviewOpen = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Plus, X, Upload, Eye } from 'lucide-vue-next'

const breadcrumbs = [{ label: 'Questions' }]

// Search and Filter State
const searchQuery = ref('')
const selectedSubject = ref('all')
const selectedDifficulty = ref('all')

// Dialog State
const isCreateDialogOpen = ref(false)
const isPreviewOpen = ref(false)

// Image Upload Ref
const imageInput = ref<HTMLInputElement | null>(null)

// New Question Form State
const newQuestion = ref({
  content: '',
  subject: '',
  difficulty: '',
  options: ['', '', '', ''],
  correctAnswer: '0',
  explanation: '',
  image: '',
})

// Reset form when dialog is closed
watch(isCreateDialogOpen, (newState) => {
  if (!newState) {
    newQuestion.value = {
      content: '',
      subject: '',
      difficulty: '',
      options: ['', '', '', ''],
      correctAnswer: '0',
      explanation: '',
      image: '',
    }
  }
})

const addOption = () => {
  newQuestion.value.options.push('')
}

const removeOption = (index: number) => {
  if (newQuestion.value.options.length > 2) {
    newQuestion.value.options.splice(index, 1)
    // Adjust correct answer if needed
    const correctIdx = parseInt(newQuestion.value.correctAnswer)
    if (correctIdx >= index && correctIdx > 0) {
      newQuestion.value.correctAnswer = String(correctIdx - 1)
    }
  }
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      newQuestion.value.image = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const removeImage = () => {
  newQuestion.value.image = ''
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

const handleCreateQuestion = () => {
  // TODO: Implement question creation logic
  console.log('Creating question:', newQuestion.value)

  // Reset form
  newQuestion.value = {
    content: '',
    subject: '',
    difficulty: 'medium',
    options: ['', '', '', ''],
    correctAnswer: '0',
    explanation: '',
    image: '',
  }

  // Reset image input
  if (imageInput.value) {
    imageInput.value.value = ''
  }

  isCreateDialogOpen.value = false
}
</script>
