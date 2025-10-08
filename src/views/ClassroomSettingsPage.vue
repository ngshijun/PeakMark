<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-4">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Classroom Settings</h1>
        <p class="text-muted-foreground">Manage your classroom settings and preferences</p>
      </div>

      <!-- Loading State -->
      <div v-if="classroomStore.loading" class="flex-1 min-h-0 overflow-auto space-y-6">
        <div class="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton class="h-6 w-1/3" />
          <Skeleton class="h-10 w-full" />
        </div>
        <div class="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton class="h-6 w-1/3" />
          <Skeleton class="h-20 w-full" />
        </div>
      </div>

      <!-- Settings Content -->
      <div v-else-if="classroom" class="flex-1 min-h-0 overflow-auto space-y-6">
        <!-- Invitation Code Section -->
        <div class="rounded-lg border bg-card p-6 space-y-4">
          <div>
            <h2 class="text-xl font-semibold">Invitation Code</h2>
            <p class="text-sm text-muted-foreground">
              Share this code with students to join your classroom
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Input :model-value="classroom.id" readonly class="font-mono bg-muted" />
            <Button @click="copyInvitationCode" variant="outline" size="icon">
              <Copy class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- Classroom Settings -->
        <div class="rounded-lg border bg-card p-6 space-y-4">
          <div>
            <h2 class="text-xl font-semibold">Classroom Settings</h2>
            <p class="text-sm text-muted-foreground">Update your classroom configuration</p>
          </div>

          <form @submit="onSubmit" class="space-y-4">
            <FormField
              v-slot="{ componentField }"
              name="name"
              :validateOnBlur="hasAttemptSubmit"
              :validateOnModelUpdate="hasAttemptSubmit"
            >
              <FormItem>
                <FormLabel>Name <span class="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    placeholder="e.g. Grade 10 Mathematics"
                    :disabled="isSubmitting"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField
              v-slot="{ componentField }"
              name="description"
              :validateOnBlur="hasAttemptSubmit"
              :validateOnModelUpdate="hasAttemptSubmit"
            >
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    v-bind="componentField"
                    placeholder="Enter classroom description (optional)"
                    rows="3"
                    :disabled="isSubmitting"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField
              v-slot="{ value, handleChange }"
              name="allow_new_students"
              :validateOnBlur="hasAttemptSubmit"
              :validateOnModelUpdate="hasAttemptSubmit"
            >
              <FormItem>
                <div class="flex items-center justify-between rounded-lg border p-4">
                  <div class="space-y-0.5">
                    <FormLabel class="text-sm font-medium">Allow New Students</FormLabel>
                    <div class="text-sm text-muted-foreground">
                      Students can join using the invitation code
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      :model-value="value"
                      @update:model-value="handleChange"
                      :disabled="isSubmitting"
                    />
                  </FormControl>
                </div>
              </FormItem>
            </FormField>

            <div class="flex justify-end">
              <Button type="submit" :disabled="isSubmitting" @click="hasAttemptSubmit = true">
                {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
              </Button>
            </div>
          </form>
        </div>

        <!-- Danger Zone -->
        <div class="rounded-lg border border-destructive bg-card p-6 space-y-4">
          <div>
            <h2 class="text-xl font-semibold text-destructive">Danger Zone</h2>
            <p class="text-sm text-muted-foreground">Irreversible actions for this classroom</p>
          </div>

          <div class="flex items-center justify-between rounded-lg border p-4">
            <div class="space-y-0.5">
              <div class="text-sm font-medium">Delete Classroom</div>
              <div class="text-sm text-muted-foreground">
                Permanently delete this classroom and all associated data
              </div>
            </div>
            <Button variant="destructive" @click="openDeleteDialog">Delete Classroom</Button>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="flex-1 min-h-0 flex items-center justify-center">
        <div class="rounded-lg border bg-card p-6 text-center">
          <p class="text-muted-foreground">Classroom not found</p>
        </div>
      </div>

      <!-- Delete Confirmation Dialog -->
      <Dialog :open="isDeleteDialogOpen" @update:open="closeDeleteDialog">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Classroom</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{{ classroom?.name }}"? This action cannot be undone.
              All students will be removed from the classroom.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" @click="closeDeleteDialog" :disabled="isDeleting">
              Cancel
            </Button>
            <Button variant="destructive" @click="confirmDelete" :disabled="isDeleting">
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useNavigation } from '@/composables/useNavigation'
import MainLayout from '@/layouts/MainLayout.vue'
import { useClassroomStore } from '@/stores/classrooms'
import type { Tables } from '@/types/database.types'
import { toTypedSchema } from '@vee-validate/zod'
import { Copy } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import * as z from 'zod'

type Classroom = Tables<'classrooms'>

const route = useRoute()
const classroomStore = useClassroomStore()
const { goToClassroomSelection } = useNavigation()

const classroom = ref<Classroom | null>(null)
const isDeleteDialogOpen = ref(false)
const isDeleting = ref(false)
const hasAttemptSubmit = ref(false)

// Breadcrumbs
const breadcrumbs = computed(() => [{ label: 'Settings' }])

// Form Schema
const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, 'Classroom name is required'),
    description: z.string().optional(),
    allow_new_students: z.boolean(),
  }),
)

// Form
const { handleSubmit, resetForm } = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: '',
    description: '',
    allow_new_students: true,
  },
})

const isSubmitting = computed(() => classroomStore.loading)

// Copy invitation code
const copyInvitationCode = async () => {
  if (!classroom.value) return

  try {
    await navigator.clipboard.writeText(classroom.value.id)
    toast.success('Invitation code copied to clipboard')
  } catch {
    toast.error('Failed to copy invitation code')
  }
}

// Update classroom settings
const onSubmit = handleSubmit(async (formValues) => {
  if (!classroom.value) return

  try {
    const updates = {
      name: formValues.name,
      description: formValues.description || null,
      allow_new_students: formValues.allow_new_students,
    }

    await classroomStore.updateClassroom(classroom.value.id, updates)

    // Update local state
    classroom.value = { ...classroom.value, ...updates }

    toast.success('Classroom updated successfully')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update classroom'
    toast.error(errorMessage)
  }
})

// Delete classroom
const openDeleteDialog = () => {
  isDeleteDialogOpen.value = true
}

const closeDeleteDialog = () => {
  if (isDeleting.value) return
  isDeleteDialogOpen.value = false
}

const confirmDelete = async () => {
  if (!classroom.value) return

  isDeleting.value = true

  try {
    await classroomStore.deleteClassroom(classroom.value.id)

    toast.success('Classroom deleted successfully')
    goToClassroomSelection()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete classroom'
    toast.error(errorMessage)
  } finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
  try {
    classroom.value = await classroomStore.fetchClassroomSettings(
      route.params.classroomId as string,
    )
    resetForm({
      values: {
        name: classroom.value.name,
        description: classroom.value.description || '',
        allow_new_students: classroom.value.allow_new_students,
      },
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load classroom settings'
    toast.error(errorMessage)
  }
})
</script>
