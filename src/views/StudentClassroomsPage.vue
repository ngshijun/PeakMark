<template>
  <ClassroomSelectionLayout>
    <div class="flex flex-col space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight">My Classrooms</h1>
          <p class="text-muted-foreground">View and join classrooms</p>
        </div>
        <Button @click="isJoinDialogOpen = true">
          <Plus class="mr-2 h-4 w-4" />
          Join Classroom
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
            v-else-if="classroomStore.enrolledClassrooms.length === 0"
            class="flex items-center justify-center h-full text-center"
          >
            <div class="space-y-2">
              <School class="mx-auto h-12 w-12 text-muted-foreground" />
              <p class="text-muted-foreground">You haven't joined any classrooms yet</p>
              <Button variant="outline" @click="isJoinDialogOpen = true">Join a Classroom</Button>
            </div>
          </div>

          <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-4">
            <div
              v-for="classroom in classroomStore.enrolledClassrooms"
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

                <!-- Teacher Info -->
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserCircle class="h-4 w-4" />
                  <span>{{ classroom.teacher_name || 'Unknown Teacher' }}</span>
                </div>

                <!-- Actions -->
                <div class="pt-2">
                  <Button class="w-full" @click="viewClassroom(classroom)">
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

    <!-- Join Classroom Dialog -->
    <Dialog :open="isJoinDialogOpen" @update:open="closeJoinDialog">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Join Classroom</DialogTitle>
          <DialogDescription> Enter the invite code provided by your teacher </DialogDescription>
        </DialogHeader>

        <form @submit="onJoinSubmit" class="space-y-4">
          <FormField
            v-slot="{ componentField }"
            name="inviteCode"
            :validateOnBlur="hasAttemptSubmit"
            :validateOnModelUpdate="hasAttemptSubmit"
          >
            <FormItem>
              <FormLabel>Invite Code <span class="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input
                  v-bind="componentField"
                  placeholder="Enter 8-character code"
                  class="font-mono uppercase"
                  maxlength="8"
                  :disabled="isJoining"
                />
              </FormControl>
              <FormDescription>The code is case-insensitive</FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" @click="closeJoinDialog" :disabled="isJoining">
              Cancel
            </Button>
            <Button type="submit" :disabled="isJoining" @click="hasAttemptSubmit = true">
              {{ isJoining ? 'Joining...' : 'Join' }}
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
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import ClassroomSelectionLayout from '@/layouts/ClassroomSelectionLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useClassroomStore, type ClassroomWithMemberCount } from '@/stores/classrooms'
import { useClassroomSelectionStore } from '@/stores/classroomSelection'
import { toTypedSchema } from '@vee-validate/zod'
import { Plus, School, UserCircle } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import * as z from 'zod'

const classroomStore = useClassroomStore()
const authStore = useAuthStore()
const classroomSelectionStore = useClassroomSelectionStore()
const router = useRouter()

const isJoinDialogOpen = ref(false)
const hasAttemptSubmit = ref(false)
const isJoining = ref(false)

// Form Schema
const formSchema = toTypedSchema(
  z.object({
    inviteCode: z.string().length(8, 'Invite code must be exactly 8 characters'),
  }),
)

// Form
const { handleSubmit, resetForm } = useForm({
  validationSchema: formSchema,
  initialValues: {
    inviteCode: '',
  },
})

// Reset form when dialog closes
watch(isJoinDialogOpen, (newVal) => {
  if (!newVal) {
    hasAttemptSubmit.value = false
    resetForm({
      values: {
        inviteCode: '',
      },
    })
  }
})

const onJoinSubmit = handleSubmit(async (formValues) => {
  isJoining.value = true
  try {
    await classroomStore.joinClassroom(authStore.user!.id, formValues.inviteCode)
    toast.success('Successfully joined classroom')
    isJoinDialogOpen.value = false
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to join classroom'
    toast.error(errorMessage)
  } finally {
    isJoining.value = false
  }
})

const closeJoinDialog = () => {
  if (isJoining.value) return
  isJoinDialogOpen.value = false
}

const viewClassroom = (classroom: ClassroomWithMemberCount) => {
  classroomSelectionStore.selectClassroom(classroom)
  router.push({ name: 'dashboard' })
}

onMounted(async () => {
  try {
    await classroomStore.fetchStudentClassrooms(authStore.user!.id)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load classrooms'
    toast.error(errorMessage)
  }
})
</script>
