<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-4">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Questions</h1>
        <p class="text-muted-foreground">Manage your question pool and create new questions</p>
      </div>

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

          <!-- Category Filter -->
          <Select v-model="selectedCategory">
            <SelectTrigger class="w-full sm:w-[11.25rem]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem
                v-for="category in categoryStore.categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
          <Button variant="outline" @click="isCategoryDialogOpen = true">
            <Plus class="mr-2 h-4 w-4" />
            Manage Categories
          </Button>
          <Button @click="isCreateDialogOpen = true">
            <Plus class="mr-2 h-4 w-4" />
            Create Question
          </Button>
        </div>
      </div>

      <!-- Questions Data Table -->
      <div class="flex-1 min-h-0 rounded-xl border bg-card overflow-hidden">
        <div class="h-full overflow-auto">
          <Table
            class="[&_thead_th:first-child]:pl-6 [&_tbody_td:first-child]:pl-6 [&_thead_th:last-child]:pr-6 [&_tbody_td:last-child]:pr-6"
          >
            <TableHeader class="sticky top-0 z-10 bg-card shadow-sm">
              <TableRow>
                <TableHead class="w-[8rem]">Category</TableHead>
                <TableHead class="w-[6rem]">ELO</TableHead>
                <TableHead class="min-w-[15rem]">Question</TableHead>
                <TableHead class="min-w-[12rem]">Answer Options</TableHead>
                <TableHead class="min-w-[10rem]">Correct Answer</TableHead>
                <TableHead class="min-w-[15rem]">Explanation</TableHead>
                <TableHead class="w-[8rem]">Stats</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <!-- Loading State -->
              <template v-if="questionStore.loading">
                <TableRow v-for="i in 8" :key="i">
                  <TableCell><Skeleton class="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton class="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton class="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton class="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton class="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton class="h-5 w-24" /></TableCell>
                </TableRow>
              </template>

              <!-- Empty State -->
              <TableRow v-else-if="filteredQuestions.length === 0">
                <TableCell colspan="8" class="h-24 text-center">
                  <p class="text-sm text-muted-foreground">
                    No questions found. Create your first question to get started.
                  </p>
                </TableCell>
              </TableRow>

              <!-- Questions Data -->
              <ContextMenu v-else v-for="question in paginatedQuestions" :key="question.id">
                <ContextMenuTrigger as-child>
                  <TableRow class="cursor-pointer">
                    <TableCell>
                      <span
                        class="text-xs font-medium rounded-full bg-primary/10 px-2 py-1 text-primary"
                      >
                        {{ getCategoryName(question.category_id) }}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-1">
                        <span class="text-sm font-semibold">{{ question.elo }}</span>
                        <span
                          :class="[
                            'text-xs px-1.5 py-0.5 rounded',
                            getEloDifficultyColor(question.elo),
                          ]"
                        >
                          {{ getEloDifficultyLabel(question.elo) }}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="max-w-md">
                        <p class="text-sm font-medium text-wrap">{{ question.question }}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-for="(option, index) in question.options"
                          :key="index"
                          class="text-xs px-1.5 py-0.5 rounded border bg-muted/50"
                        >
                          {{ String.fromCharCode(65 + index) }}. {{ option.substring(0, 20)
                          }}{{ option.length > 20 ? '...' : '' }}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        class="text-xs font-medium px-2 py-1 rounded bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      >
                        {{ String.fromCharCode(65 + question.correct_answer) }}.
                        {{ question.options[question.correct_answer] }}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div class="max-w-md">
                        <p class="text-sm text-muted-foreground text-wrap">
                          {{ question.explanation || '-' }}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="space-y-1">
                        <div class="text-xs text-muted-foreground">
                          {{ question.total_attempts }} attempt{{
                            question.total_attempts !== 1 ? 's' : ''
                          }}
                        </div>
                        <div class="text-xs font-medium">
                          {{
                            question.total_attempts > 0
                              ? Math.round(
                                  (question.total_corrects / question.total_attempts) * 100,
                                )
                              : 0
                          }}% correct
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </ContextMenuTrigger>
                <ContextMenuContent class="w-48">
                  <ContextMenuItem @click="editQuestion(question)">
                    <Pencil class="mr-2 h-4 w-4" />
                    Edit Question
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem @click="openDeleteDialog(question.id)" class="text-destructive">
                    <Trash2 class="mr-2 h-4 w-4" />
                    Delete Question
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </TableBody>
          </Table>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredQuestions.length > 0" class="grid grid-cols-3 items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</span>
          <Select v-model="itemsPerPageString">
            <SelectTrigger class="w-[5rem] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex justify-center">
          <Pagination
            v-if="totalPages > 1"
            v-slot="{ page }"
            :items-per-page="itemsPerPage"
            :total="filteredQuestions.length"
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
            Math.min(currentPage * itemsPerPage, filteredQuestions.length)
          }}
          of {{ filteredQuestions.length }}
        </p>
      </div>
    </div>

    <!-- Create/Edit Question Dialog -->
    <Dialog v-model:open="isCreateDialogOpen">
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ isEditMode ? 'Edit Question' : 'Create New Question' }}</DialogTitle>
          <DialogDescription>
            {{
              isEditMode
                ? 'Update the question details below.'
                : 'Add a new question to your question pool. Fill in all the required fields.'
            }}
          </DialogDescription>
        </DialogHeader>

        <form @submit="onSubmit" class="space-y-6">
          <!-- Category Selection -->
          <FormField
            v-slot="{ componentField }"
            name="category_id"
            :validateOnBlur="hasAttemptSubmit"
            :validateOnModelUpdate="hasAttemptSubmit"
          >
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select v-bind="componentField" :disabled="isSubmitting">
                <FormControl>
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem
                    v-for="category in categoryStore.categories"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription v-if="categoryStore.categories.length === 0" class="text-amber-600">
                No categories available. Please create a category first.
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

          <!-- Question Content -->
          <FormField
            v-slot="{ componentField }"
            name="question"
            :validateOnBlur="hasAttemptSubmit"
            :validateOnModelUpdate="hasAttemptSubmit"
          >
            <FormItem>
              <FormLabel>Question Content</FormLabel>
              <FormControl>
                <Textarea
                  v-bind="componentField"
                  placeholder="Enter your question here..."
                  class="min-h-[6.25rem] resize-none"
                  :disabled="isSubmitting"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <!-- Image Upload -->
          <div class="space-y-2">
            <label
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Image (Optional)
            </label>
            <div class="space-y-2">
              <Button
                type="button"
                variant="outline"
                @click="() => imageInput?.click()"
                class="w-full"
                :disabled="isSubmitting"
              >
                <Upload class="mr-2 h-4 w-4" />
                {{
                  imageFile ? 'Change Image' : imagePreviewUrl ? 'Replace Image' : 'Upload Image'
                }}
              </Button>
              <input
                ref="imageInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleImageUpload"
                :disabled="isSubmitting"
              />
              <div v-if="imagePreviewUrl" class="relative mt-2 inline-block">
                <img
                  :src="imagePreviewUrl"
                  alt="Question image preview"
                  class="max-h-32 rounded-md border"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  @click="removeImage"
                  :disabled="isSubmitting"
                  title="Remove image"
                  class="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background/80 hover:bg-destructive/10 border shadow-sm"
                >
                  <X class="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </Button>
                <p v-if="!imageFile && existingImageUrl" class="text-xs text-muted-foreground mt-1">
                  Current image
                </p>
                <p v-else-if="imageFile" class="text-xs text-muted-foreground mt-1">New image</p>
              </div>
            </div>
          </div>

          <!-- Answer Options -->
          <FormField
            name="options"
            :validateOnBlur="hasAttemptSubmit"
            :validateOnModelUpdate="hasAttemptSubmit"
          >
            <FormItem>
              <FormLabel>Answer Options</FormLabel>
              <FormControl>
                <div class="space-y-2">
                  <div
                    v-for="(_option, index) in values.options || ['', '', '', '']"
                    :key="index"
                    class="flex items-center gap-2"
                  >
                    <input
                      type="radio"
                      :value="String(index)"
                      :checked="values.correctAnswer === String(index)"
                      @change="setFieldValue('correctAnswer', String(index))"
                      :id="`option-${index}`"
                      class="h-4 w-4"
                      :disabled="isSubmitting"
                    />
                    <Label :for="`option-${index}`" class="sr-only"
                      >Option {{ String.fromCharCode(65 + index) }}</Label
                    >
                    <span class="text-sm font-medium min-w-[1.25rem]">{{
                      String.fromCharCode(65 + index)
                    }}</span>
                    <Input
                      :model-value="(values.options || ['', '', '', ''])[index]"
                      @update:model-value="
                        (newValue) => {
                          const currentOptions = [...(values.options || [])]
                          currentOptions[index] = String(newValue)
                          setFieldValue('options', currentOptions, hasAttemptSubmit)
                        }
                      "
                      :placeholder="`Option ${String.fromCharCode(65 + index)}`"
                      class="flex-1"
                      :disabled="isSubmitting"
                    />
                    <Button
                      v-if="(values.options || ['', '', '', '']).length > 2"
                      variant="ghost"
                      size="icon"
                      type="button"
                      @click="removeOption(index)"
                      class="h-8 w-8"
                      :disabled="isSubmitting"
                    >
                      <X class="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    @click="addOption"
                    class="mt-2"
                    :disabled="isSubmitting"
                  >
                    <Plus class="mr-2 h-4 w-4" />
                    Add Option
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <!-- Correct Answer (Hidden Field) -->
          <FormField v-slot="{ componentField }" name="correctAnswer">
            <FormItem class="hidden">
              <FormControl>
                <Input v-bind="componentField" type="hidden" />
              </FormControl>
            </FormItem>
          </FormField>

          <!-- Explanation (Optional) -->
          <FormField v-slot="{ componentField }" name="explanation">
            <FormItem>
              <FormLabel>Explanation (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  v-bind="componentField"
                  placeholder="Provide an explanation for the correct answer..."
                  class="min-h-[6.25rem] resize-none"
                  :disabled="isSubmitting"
                />
              </FormControl>
            </FormItem>
          </FormField>

          <DialogFooter class="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              @click="openPreview"
              class="w-full sm:w-auto sm:mr-auto"
            >
              <Eye class="mr-2 h-4 w-4" />
              Preview
            </Button>
            <div class="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                @click="isCreateDialogOpen = false"
                class="flex-1 sm:flex-none"
                :disabled="isSubmitting"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                @click="hasAttemptSubmit = true"
                class="flex-1 sm:flex-none"
                :disabled="isSubmitting"
              >
                {{
                  isSubmitting
                    ? isEditMode
                      ? 'Updating...'
                      : 'Creating...'
                    : isEditMode
                      ? 'Update Question'
                      : 'Create Question'
                }}
              </Button>
            </div>
          </DialogFooter>
        </form>
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
          <!-- Question Content -->
          <div class="space-y-4">
            <p class="text-base font-medium">
              {{ values.question || 'Your question will appear here...' }}
            </p>

            <!-- Image Preview -->
            <div v-if="imagePreviewUrl" class="my-4">
              <img
                :src="imagePreviewUrl"
                alt="Question image"
                class="max-w-full rounded-md border"
              />
            </div>

            <!-- Answer Options Preview -->
            <div class="space-y-2">
              <div
                v-for="(option, index) in (values.options || []).filter((o: string) => o.trim())"
                :key="index"
                :class="[
                  'flex items-center gap-3 rounded-md border p-3 transition-colors',
                  values.correctAnswer === String(index)
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
            <div v-if="values.explanation" class="rounded-md border bg-card p-4">
              <p class="text-xs font-semibold text-muted-foreground uppercase mb-2">Explanation</p>
              <p class="text-sm">{{ values.explanation }}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isPreviewOpen = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="isDeleteDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Question</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this question? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="cancelDelete">Cancel</Button>
          <Button variant="destructive" @click="confirmDelete">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Category Management Dialog -->
    <Dialog v-model:open="isCategoryDialogOpen">
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Create and manage question categories for better organization.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <!-- Create New Category -->
          <div class="flex gap-2">
            <Input
              v-model="newCategoryName"
              placeholder="Enter category name..."
              @keyup.enter="createCategory"
            />
            <Button @click="createCategory" :disabled="!newCategoryName.trim()">
              <Plus class="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

          <!-- Category List -->
          <div class="space-y-2">
            <div
              v-for="category in categoryStore.categories"
              :key="category.id"
              class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
            >
              <div class="flex-1">
                <div class="font-medium">{{ category.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ getQuestionCountByCategory(category.id) }} question{{
                    getQuestionCountByCategory(category.id) !== 1 ? 's' : ''
                  }}
                </div>
              </div>
              <div class="flex gap-2">
                <Button variant="ghost" size="icon" @click="editCategory(category)" class="h-8 w-8">
                  <Pencil class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  @click="deleteCategory(category.id)"
                  class="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div
              v-if="categoryStore.categories.length === 0"
              class="text-center py-8 text-muted-foreground"
            >
              No categories yet. Create your first category above.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isCategoryDialogOpen = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Category Dialog -->
    <Dialog v-model:open="isEditCategoryDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>Update the category name.</DialogDescription>
        </DialogHeader>
        <Input v-model="editCategoryName" placeholder="Category name..." />
        <DialogFooter>
          <Button variant="outline" @click="isEditCategoryDialogOpen = false">Cancel</Button>
          <Button @click="updateCategory">Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </MainLayout>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { FormDescription } from '@/components/ui/form'
import { useNavigation } from '@/composables/useNavigation'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useClassroomStore } from '@/stores/classrooms'
import { useQuestionCategoriesStore } from '@/stores/question-categories'
import { useQuestionStore } from '@/stores/questions'
import { toTypedSchema } from '@vee-validate/zod'
import { Eye, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import * as z from 'zod'

const breadcrumbs = [{ label: 'Questions' }]

const questionStore = useQuestionStore()
const categoryStore = useQuestionCategoriesStore()
const authStore = useAuthStore()
const classroomStore = useClassroomStore()
const { selectedClassroomId } = useNavigation()

// Search and Filter State
const searchQuery = ref('')
const selectedCategory = ref('all')

// Pagination State
const currentPage = ref(1)
const itemsPerPage = ref(parseInt(localStorage.getItem('itemsPerPage') || '10'))
const itemsPerPageString = computed({
  get: () => String(itemsPerPage.value),
  set: (value: string) => {
    itemsPerPage.value = parseInt(value)
    currentPage.value = 1 // Reset to first page when changing items per page
    localStorage.setItem('itemsPerPage', value)
  },
})

// Dialog State
const isCreateDialogOpen = ref(false)
const isPreviewOpen = ref(false)
const hasAttemptSubmit = ref(false)
const isDeleteDialogOpen = ref(false)
const questionToDelete = ref<string | null>(null)
const isCategoryDialogOpen = ref(false)
const isEditCategoryDialogOpen = ref(false)

// Category Management State
const newCategoryName = ref('')
const editCategoryName = ref('')
const categoryToEdit = ref<string | null>(null)

// Edit Mode State
const isEditMode = ref(false)
const questionToEdit = ref<(typeof questionStore.questions)[0] | null>(null)
const existingImageUrl = ref<string>('')

// Image Upload Ref
const imageInput = ref<HTMLInputElement | null>(null)
const imageFile = ref<File | null>(null)
const imagePreviewUrl = ref<string>('')
const imageRemovedByUser = ref(false)

// Form Schema
const formSchema = toTypedSchema(
  z.object({
    category_id: z.string().min(1, 'Please select a category'),
    question: z.string().min(1, 'Question content is required'),
    options: z.array(z.string().min(1, 'Option cannot be blank')),
    correctAnswer: z.string(),
    explanation: z.string().optional(),
  }),
)

// Form
const { handleSubmit, setFieldValue, values, resetForm } = useForm({
  validationSchema: formSchema,
  keepValuesOnUnmount: true,
  initialValues: {
    category_id: '',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '0',
    explanation: '',
  },
})

// Reset form when dialog's state changes
watch(isCreateDialogOpen, async (newValue) => {
  if (!newValue) {
    // Dialog is closing - reset everything
    resetForm({
      values: {
        category_id: '',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '0',
        explanation: '',
      },
    })

    // Reset edit mode state
    isEditMode.value = false
    questionToEdit.value = null
    existingImageUrl.value = ''

    // Reset image state
    imageFile.value = null
    imageRemovedByUser.value = false
    // Only revoke if it's a local object URL (starts with blob:)
    if (imagePreviewUrl.value && imagePreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl.value)
    }
    imagePreviewUrl.value = ''
    if (imageInput.value) {
      imageInput.value.value = ''
    }

    // Reset form validation state
    hasAttemptSubmit.value = false
  }
})

const addOption = () => {
  const currentOptions = [...(values.options || [])]
  currentOptions.push('')
  setFieldValue('options', currentOptions, hasAttemptSubmit.value)
}

const removeOption = (index: number) => {
  const options = values.options || []
  if (options.length > 2) {
    const currentOptions = [...options]
    currentOptions.splice(index, 1)
    setFieldValue('options', currentOptions, hasAttemptSubmit.value)

    // Adjust correct answer if needed
    const correctIdx = parseInt(values.correctAnswer || '0')
    if (correctIdx >= index && correctIdx > 0) {
      setFieldValue('correctAnswer', String(correctIdx - 1))
    }
  }
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    imageFile.value = file
    // Create preview URL
    imagePreviewUrl.value = URL.createObjectURL(file)
  }
}

const removeImage = () => {
  imageFile.value = null
  if (imagePreviewUrl.value) {
    // Only revoke if it's a blob URL
    if (imagePreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl.value)
    }
    imagePreviewUrl.value = ''
  }
  if (imageInput.value) {
    imageInput.value.value = ''
  }
  // Mark that user explicitly removed the image
  if (isEditMode.value && existingImageUrl.value) {
    imageRemovedByUser.value = true
  }
}

const openPreview = () => {
  isPreviewOpen.value = true
}

// Computed property for filtered questions
const filteredQuestions = computed(() => {
  if (!selectedClassroomId.value) return []

  let filtered = questionStore.questions

  // Filter by selected classroom
  filtered = filtered.filter((q) => q.classroom_id === selectedClassroomId.value)

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((q) => q.question.toLowerCase().includes(query))
  }

  // Filter by category
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter((q) => q.category_id === selectedCategory.value)
  }

  return filtered
})

// Computed property for total pages
const totalPages = computed(() => {
  return Math.ceil(filteredQuestions.value.length / itemsPerPage.value)
})

// Computed property for paginated questions
const paginatedQuestions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredQuestions.value.slice(start, end)
})

// Reset to first page when filters change
watch([searchQuery, selectedCategory], () => {
  currentPage.value = 1
})

// Fetch questions and categories on mount
onMounted(async () => {
  await Promise.all([
    questionStore.fetchQuestions(selectedClassroomId.value!),
    classroomStore.fetchTeacherClassrooms(authStore.user!.id),
    categoryStore.fetchCategoriesByClassroom(selectedClassroomId.value!),
  ])
})

const onSubmit = handleSubmit(async (formValues) => {
  try {
    if (!selectedClassroomId.value) {
      toast.error('No classroom selected')
      return
    }

    const { correctAnswer, category_id, ...rest } = formValues

    // Edit Mode: Update existing question
    if (isEditMode.value && questionToEdit.value) {
      const updates: {
        question: string
        options: string[]
        correct_answer: number
        category_id: string
        explanation?: string
        image?: string | null
      } = {
        ...rest,
        correct_answer: parseInt(correctAnswer),
        category_id,
      }

      // Handle image updates
      const hasNewImage = imageFile.value !== null
      const hadOldImage = existingImageUrl.value !== ''

      // Case 1: User uploaded a new image
      if (hasNewImage) {
        // Delete old image from storage first if it exists
        if (hadOldImage) {
          try {
            await questionStore.deleteQuestionImage(existingImageUrl.value)
          } catch (deleteError) {
            console.error('Error deleting old image:', deleteError)
            // Continue with upload even if deletion fails
          }
        }

        // Upload new image
        try {
          const imageUrl = await questionStore.uploadQuestionImage(
            imageFile.value!,
            selectedClassroomId.value,
            questionToEdit.value.id,
          )
          updates.image = imageUrl
        } catch (imageError) {
          console.error('Error uploading new image:', imageError)
          toast.error('Question updated but image upload failed')
        }
      }
      // Case 2: User explicitly removed the existing image
      else if (imageRemovedByUser.value) {
        // Delete image from storage
        if (hadOldImage) {
          try {
            await questionStore.deleteQuestionImage(existingImageUrl.value)
          } catch (deleteError) {
            console.error('Error deleting image:', deleteError)
            // Continue with update even if deletion fails
          }
        }
        updates.image = null
      }
      // Case 3: No change to image (keep existing)
      else if (hadOldImage) {
        updates.image = existingImageUrl.value
      }

      // Update the question
      await questionStore.updateQuestion(questionToEdit.value.id, updates)
      toast.success('Question updated successfully')
    }
    // Create Mode: Create new question
    else {
      // Create question first (without image)
      const createdQuestion = await questionStore.createQuestion({
        ...rest,
        correct_answer: parseInt(correctAnswer),
        category_id,
        classroom_id: selectedClassroomId.value,
        created_by: authStore.user!.id,
        image: null,
      })

      // Upload image if one was selected
      if (imageFile.value && createdQuestion) {
        try {
          const imageUrl = await questionStore.uploadQuestionImage(
            imageFile.value,
            selectedClassroomId.value,
            createdQuestion.id,
          )

          // Update question with image URL
          await questionStore.updateQuestion(createdQuestion.id, {
            image: imageUrl,
          })
        } catch (imageError) {
          console.error('Error uploading image:', imageError)
          toast.error('Question created but image upload failed')
        }
      }

      toast.success('Question created successfully')
    }

    // Close dialog and reset form
    isCreateDialogOpen.value = false
    hasAttemptSubmit.value = false
  } catch (error) {
    console.error('Error saving question:', error)
    toast.error(isEditMode.value ? 'Failed to update question' : 'Failed to create question')
  }
})

const isSubmitting = computed(() => questionStore.loading)

// Edit question function
const editQuestion = (question: (typeof questionStore.questions)[0]) => {
  // Set edit mode
  isEditMode.value = true
  questionToEdit.value = question

  // Store existing image URL if present
  existingImageUrl.value = question.image || ''

  // Populate form with question data
  resetForm({
    values: {
      category_id: question.category_id || '',
      question: question.question,
      options: question.options,
      correctAnswer: String(question.correct_answer),
      explanation: question.explanation || '',
    },
  })

  // If question has an existing image, show it as preview
  if (question.image) {
    imagePreviewUrl.value = question.image
  }

  // Clear any file input and reset removal flag
  imageFile.value = null
  imageRemovedByUser.value = false
  if (imageInput.value) {
    imageInput.value.value = ''
  }

  // Open dialog
  isCreateDialogOpen.value = true
}

// Delete question function
const openDeleteDialog = (questionId: string) => {
  questionToDelete.value = questionId
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!questionToDelete.value) return

  try {
    await questionStore.deleteQuestion(questionToDelete.value)
    toast.success('Question deleted successfully')
    isDeleteDialogOpen.value = false
    questionToDelete.value = null
  } catch (error) {
    console.error('Error deleting question:', error)
    toast.error('Failed to delete question')
  }
}

const cancelDelete = () => {
  isDeleteDialogOpen.value = false
  questionToDelete.value = null
}

// Category Management Functions
const createCategory = async () => {
  if (!newCategoryName.value.trim()) return

  try {
    await categoryStore.createCategory({
      name: newCategoryName.value.trim(),
      classroom_id: selectedClassroomId.value!,
      created_by: authStore.user!.id,
    })
    toast.success('Category created successfully')
    newCategoryName.value = ''
  } catch (error) {
    console.error('Error creating category:', error)
    toast.error('Failed to create category')
  }
}

const editCategory = (category: (typeof categoryStore.categories)[0]) => {
  categoryToEdit.value = category.id
  editCategoryName.value = category.name
  isEditCategoryDialogOpen.value = true
}

const updateCategory = async () => {
  if (!categoryToEdit.value || !editCategoryName.value.trim()) return

  try {
    await categoryStore.updateCategory(categoryToEdit.value, {
      name: editCategoryName.value.trim(),
    })
    toast.success('Category updated successfully')
    isEditCategoryDialogOpen.value = false
    categoryToEdit.value = null
    editCategoryName.value = ''
  } catch (error) {
    console.error('Error updating category:', error)
    toast.error('Failed to update category')
  }
}

const deleteCategory = async (categoryId: string) => {
  // Check if any questions use this category
  const questionsInCategory = questionStore.questions.filter((q) => q.category_id === categoryId)

  if (questionsInCategory.length > 0) {
    toast.error(
      `Cannot delete category. ${questionsInCategory.length} question(s) are using this category.`,
    )
    return
  }

  try {
    await categoryStore.deleteCategory(categoryId)
    toast.success('Category deleted successfully')
  } catch (error) {
    console.error('Error deleting category:', error)
    toast.error('Failed to delete category')
  }
}

// Helper Functions
const getCategoryName = (categoryId: string | null) => {
  if (!categoryId) return 'Uncategorized'
  const category = categoryStore.categories.find((c) => c.id === categoryId)
  return category?.name || 'Unknown'
}

const getQuestionCountByCategory = (categoryId: string) => {
  return questionStore.questions.filter((q) => q.category_id === categoryId).length
}

const getEloDifficultyLabel = (elo: number) => {
  if (elo < 1200) return 'Easy'
  if (elo < 1400) return 'Medium'
  if (elo < 1600) return 'Hard'
  if (elo < 1800) return 'V. Hard'
  return 'Expert'
}

const getEloDifficultyColor = (elo: number) => {
  if (elo < 1200) return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
  if (elo < 1400) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
  if (elo < 1600) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
  if (elo < 1800) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
  return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
}
</script>
