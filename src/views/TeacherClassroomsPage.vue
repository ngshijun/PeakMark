<template>
  <ClassroomSelectionLayout>
    <div class="flex flex-col space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight">Classrooms</h1>
          <p class="text-muted-foreground">Create and manage your classrooms</p>
        </div>
        <Button @click="openCreateDialog">
          <Plus class="mr-2 h-4 w-4" />
          Create Classroom
        </Button>
      </div>

      <!-- Classrooms Grid -->
      <div class="flex-1 min-h-0 rounded-xl border bg-card overflow-hidden">
        <div class="h-full overflow-auto">
          <div v-if="classroomStore.loading" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-4">
            <div v-for="i in 6" :key="i" class="rounded-lg border bg-card overflow-hidden">
              <div class="p-6 space-y-3">
                <Skeleton class="h-6 w-3/4" />
                <Skeleton class="h-4 w-full" />
                <Skeleton class="h-4 w-1/2" />
              </div>
            </div>
          </div>

          <div
            v-else-if="classroomStore.classrooms.length === 0"
            class="flex items-center justify-center h-full text-center"
          >
            <div class="space-y-2">
              <School class="mx-auto h-12 w-12 text-muted-foreground" />
              <p class="text-muted-foreground">No classrooms yet. Create your first classroom!</p>
            </div>
          </div>

          <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-4">
            <div
              v-for="classroom in classroomStore.classrooms"
              :key="classroom.id"
              class="group rounded-lg border bg-card hover:shadow-lg transition-shadow"
            >
              <div class="p-6 space-y-4">
                <!-- Classroom Info -->
                <div class="space-y-2">
                  <h3 class="text-xl font-semibold">{{ classroom.name }}</h3>
                  <p class="text-sm text-muted-foreground line-clamp-2">
                    {{ classroom.description || 'No description' }}
                  </p>
                </div>

                <!-- Stats -->
                <div class="flex items-center gap-4 text-sm text-muted-foreground">
                  <div class="flex items-center gap-1">
                    <Users class="h-4 w-4" />
                    <span>{{ classroom.member_count || 0 }} students</span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="pt-2">
                  <Button class="w-full" @click="selectClassroom(classroom)">
                    <School class="mr-2 h-4 w-4" />
                    Open Classroom
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Classroom Dialog -->
    <Dialog :open="isDialogOpen" @update:open="closeDialog">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Classroom</DialogTitle>
          <DialogDescription>Create a new classroom for your students</DialogDescription>
        </DialogHeader>

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

          <DialogFooter>
            <Button type="button" variant="outline" @click="closeDialog" :disabled="isSubmitting">
              Cancel
            </Button>
            <Button type="submit" :disabled="isSubmitting" @click="hasAttemptSubmit = true">
              {{ isSubmitting ? 'Creating...' : 'Create' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </ClassroomSelectionLayout>
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
import { Textarea } from '@/components/ui/textarea'
import ClassroomSelectionLayout from '@/layouts/ClassroomSelectionLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useClassroomStore, type ClassroomWithMemberCount } from '@/stores/classrooms'
import { useClassroomSelectionStore } from '@/stores/classroomSelection'
import { toTypedSchema } from '@vee-validate/zod'
import { Plus, School, Users } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import * as z from 'zod'

const classroomStore = useClassroomStore()
const authStore = useAuthStore()
const classroomSelectionStore = useClassroomSelectionStore()
const router = useRouter()

const isDialogOpen = ref(false)
const hasAttemptSubmit = ref(false)

// Form Schema
const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, 'Classroom name is required'),
    description: z.string().optional(),
  }),
)

// Form
const { handleSubmit, resetForm } = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: '',
    description: '',
  },
})

// Reset form when dialog closes
watch(isDialogOpen, (newVal) => {
  if (!newVal) {
    hasAttemptSubmit.value = false
    resetForm({
      values: {
        name: '',
        description: '',
      },
    })
  }
})

const onSubmit = handleSubmit(async (formValues) => {
  try {
    const classroomData = {
      name: formValues.name,
      description: formValues.description || null,
      teacher_id: authStore.user!.id,
    }

    await classroomStore.createClassroom(classroomData)
    toast.success('Classroom created successfully')

    closeDialog()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to save classroom'
    toast.error(errorMessage)
  }
})

const isSubmitting = computed(() => classroomStore.loading)

const openCreateDialog = () => {
  isDialogOpen.value = true
}

const closeDialog = () => {
  if (isSubmitting.value) return
  isDialogOpen.value = false
}

const selectClassroom = (classroom: ClassroomWithMemberCount) => {
  classroomSelectionStore.selectClassroom(classroom)
  router.push({ name: 'dashboard' })
}

onMounted(async () => {
  try {
    await classroomStore.fetchTeacherClassrooms(authStore.user!.id)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load classrooms'
    toast.error(errorMessage)
  }
})
</script>
