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
            <p class="text-sm text-muted-foreground">
              {{
                isCollaborator
                  ? 'View classroom configuration (read-only)'
                  : 'Update your classroom configuration'
              }}
            </p>
            <Badge v-if="isCollaborator" variant="secondary" class="mt-2">
              Collaborator - Settings are read-only
            </Badge>
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
                    :disabled="isSubmitting || isCollaborator"
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
                    :disabled="isSubmitting || isCollaborator"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField
              v-slot="{ value, handleChange }"
              name="is_public"
              :validateOnBlur="hasAttemptSubmit"
              :validateOnModelUpdate="hasAttemptSubmit"
            >
              <FormItem>
                <div class="flex items-center justify-between rounded-lg border p-4">
                  <div class="space-y-0.5">
                    <FormLabel class="text-sm font-medium">Public Classroom</FormLabel>
                    <div class="text-sm text-muted-foreground">
                      Make this classroom discoverable to all students
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      :model-value="value"
                      @update:model-value="handleChange"
                      :disabled="isSubmitting || isCollaborator"
                    />
                  </FormControl>
                </div>
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
                      :disabled="isSubmitting || isCollaborator"
                    />
                  </FormControl>
                </div>
              </FormItem>
            </FormField>

            <div v-if="!isCollaborator" class="flex justify-end">
              <Button type="submit" :disabled="isSubmitting" @click="hasAttemptSubmit = true">
                {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
              </Button>
            </div>
          </form>
        </div>

        <!-- Collaborators Section (Owner only) -->
        <div v-if="isOwner" class="rounded-lg border bg-card p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold">Collaborators</h2>
              <p class="text-sm text-muted-foreground">
                Invite other teachers to collaborate on this classroom
              </p>
            </div>
            <Button @click="openInviteDialog">
              <UserPlus class="mr-2 h-4 w-4" />
              Invite Collaborator
            </Button>
          </div>

          <!-- Collaborators List -->
          <div v-if="classroomStore.collaborators.length > 0" class="space-y-2">
            <div
              v-for="collaborator in classroomStore.collaborators"
              :key="collaborator.id"
              class="flex items-center justify-between rounded-lg border p-4"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <span class="text-sm font-medium">
                    {{ collaborator.users?.full_name?.charAt(0).toUpperCase() || '?' }}
                  </span>
                </div>
                <div>
                  <p class="text-sm font-medium">
                    {{ collaborator.users?.full_name || 'Unknown' }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    Joined {{ new Date(collaborator.joined_at).toLocaleDateString() }}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                @click="handleRemoveCollaborator(collaborator.user_id)"
                :disabled="classroomStore.loading"
              >
                <UserMinus class="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div v-else class="text-center py-8 text-sm text-muted-foreground">
            No collaborators yet. Invite teachers to help manage this classroom.
          </div>
        </div>

        <!-- Leave Classroom (Collaborator only) -->
        <div
          v-if="isCollaborator && canLeaveClassroom"
          class="rounded-lg border bg-card p-6 space-y-4"
        >
          <div>
            <h2 class="text-xl font-semibold">Leave Classroom</h2>
            <p class="text-sm text-muted-foreground">
              You can leave this classroom at any time. You won't have access to it anymore.
            </p>
          </div>
          <div class="flex items-center justify-between rounded-lg border p-4">
            <div class="space-y-0.5">
              <div class="text-sm font-medium">Leave as Collaborator</div>
              <div class="text-sm text-muted-foreground">Remove yourself from this classroom</div>
            </div>
            <Button variant="destructive" @click="handleLeaveClassroom"> Leave Classroom </Button>
          </div>
        </div>

        <!-- Danger Zone (Owner only) -->
        <div v-if="isOwner" class="rounded-lg border border-destructive bg-card p-6 space-y-4">
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
            <Button variant="outline" @click="closeDeleteDialog" :disabled="isSubmitting">
              Cancel
            </Button>
            <Button variant="destructive" @click="confirmDelete" :disabled="isSubmitting">
              {{ isSubmitting ? 'Deleting...' : 'Delete' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Invite Collaborator Dialog -->
      <Dialog :open="isInviteDialogOpen" @update:open="closeInviteDialog">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Collaborator</DialogTitle>
            <DialogDescription>
              Enter the email address of the teacher you want to invite as a collaborator.
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">Email Address</label>
              <Input
                v-model="inviteEmail"
                type="email"
                placeholder="teacher@example.com"
                :disabled="classroomStore.loading"
                @keyup.enter="handleInviteCollaborator"
              />
              <p class="text-xs text-muted-foreground">
                The teacher must have an account on the platform.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="closeInviteDialog" :disabled="classroomStore.loading">
              Cancel
            </Button>
            <Button
              @click="handleInviteCollaborator"
              :disabled="classroomStore.loading || !inviteEmail.trim()"
            >
              {{ classroomStore.loading ? 'Inviting...' : 'Send Invite' }}
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
import { Badge } from '@/components/ui/badge'
import { useNavigation } from '@/composables/useNavigation'
import { useClassroomRole } from '@/composables/useClassroomRole'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useClassroomStore } from '@/stores/classrooms'
import type { Tables } from '@/types/database.types'
import { toTypedSchema } from '@vee-validate/zod'
import { Copy, UserMinus, UserPlus, X } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import * as z from 'zod'
import { getErrorMessage } from '@/utils/errors'

type Classroom = Tables<'classrooms'>

const route = useRoute()
const authStore = useAuthStore()
const classroomStore = useClassroomStore()
const { goToClassroomSelection } = useNavigation()

const classroomId = computed(() => route.params.classroomId as string)
const { isOwner, isCollaborator, canEditSettings, canLeaveClassroom } = useClassroomRole(
  classroomId.value,
)

const classroom = ref<Classroom | null>(null)
const isDeleteDialogOpen = ref(false)
const isInviteDialogOpen = ref(false)
const inviteEmail = ref('')
const hasAttemptSubmit = ref(false)

// Breadcrumbs
const breadcrumbs = computed(() => [{ label: 'Settings' }])

// Form Schema
const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, 'Classroom name is required'),
    description: z.string().optional(),
    is_public: z.boolean(),
    allow_new_students: z.boolean(),
  }),
)

// Form
const { handleSubmit, resetForm } = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: '',
    description: '',
    is_public: false,
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
      is_public: formValues.is_public,
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
  if (isSubmitting.value) return
  isDeleteDialogOpen.value = false
}

const confirmDelete = async () => {
  if (!classroom.value) return

  try {
    await classroomStore.deleteClassroom(classroom.value.id)

    toast.success('Classroom deleted successfully')
    goToClassroomSelection()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete classroom'
    toast.error(errorMessage)
  }
}

// Collaborator management
const openInviteDialog = () => {
  inviteEmail.value = ''
  isInviteDialogOpen.value = true
}

const closeInviteDialog = () => {
  if (classroomStore.loading) return
  inviteEmail.value = ''
  isInviteDialogOpen.value = false
}

const handleInviteCollaborator = async () => {
  if (!classroom.value || !inviteEmail.value.trim()) return

  try {
    await classroomStore.inviteCollaborator(classroom.value.id, inviteEmail.value.trim())
    toast.success('Collaborator invited successfully')
    closeInviteDialog()
  } catch (error) {
    toast.error(getErrorMessage(error))
  }
}

const handleRemoveCollaborator = async (userId: string) => {
  if (!classroom.value) return

  try {
    await classroomStore.removeCollaborator(classroom.value.id, userId)
    toast.success('Collaborator removed successfully')
  } catch (error) {
    toast.error(getErrorMessage(error))
  }
}

const handleLeaveClassroom = async () => {
  if (!classroom.value || !authStore.user) return

  try {
    await classroomStore.leaveAsCollaborator(authStore.user.id, classroom.value.id)
    toast.success('You have left the classroom')
    goToClassroomSelection()
  } catch (error) {
    toast.error(getErrorMessage(error))
  }
}

onMounted(async () => {
  try {
    const classroomIdParam = route.params.classroomId as string

    classroom.value = await classroomStore.fetchClassroomSettings(classroomIdParam)
    resetForm({
      values: {
        name: classroom.value.name,
        description: classroom.value.description || '',
        is_public: classroom.value.is_public,
        allow_new_students: classroom.value.allow_new_students,
      },
    })

    // Fetch collaborators if user is owner
    if (isOwner.value) {
      await classroomStore.fetchCollaborators(classroomIdParam)
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load classroom settings'
    toast.error(errorMessage)
  }
})
</script>
