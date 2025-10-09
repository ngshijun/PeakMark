<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-4">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Classroom Settings</h1>
        <p class="text-muted-foreground">View classroom information and manage your membership</p>
      </div>

      <!-- Loading State -->
      <div v-if="classroomStore.loading" class="flex-1 min-h-0 overflow-auto space-y-6">
        <div class="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton class="h-6 w-1/3" />
          <Skeleton class="h-10 w-full" />
        </div>
      </div>

      <!-- Settings Content -->
      <div v-else-if="classroom" class="flex-1 min-h-0 overflow-auto space-y-6">
        <!-- Classroom Information -->
        <div class="rounded-lg border bg-card p-6 space-y-4">
          <div>
            <h2 class="text-xl font-semibold">Classroom Information</h2>
            <p class="text-sm text-muted-foreground">View details about this classroom</p>
          </div>

          <div class="space-y-3">
            <div>
              <div class="text-sm font-medium text-muted-foreground">Classroom Name</div>
              <div class="text-base">{{ classroom.name }}</div>
            </div>

            <div v-if="classroom.description">
              <div class="text-sm font-medium text-muted-foreground">Description</div>
              <div class="text-base">{{ classroom.description }}</div>
            </div>

            <div>
              <div class="text-sm font-medium text-muted-foreground">Teacher</div>
              <div class="text-base">{{ classroom.teacher_name || 'Unknown' }}</div>
            </div>

            <div>
              <div class="text-sm font-medium text-muted-foreground">Classroom Code</div>
              <div class="flex items-center gap-2 mt-1">
                <code class="text-sm font-mono bg-muted px-2 py-1 rounded">{{ classroom.id }}</code>
                <Button @click="copyClassroomCode" variant="ghost" size="sm">
                  <Copy class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="rounded-lg border border-destructive bg-card p-6 space-y-4">
          <div>
            <h2 class="text-xl font-semibold text-destructive">Leave Classroom</h2>
            <p class="text-sm text-muted-foreground">Remove yourself from this classroom</p>
          </div>

          <div class="flex items-center justify-between rounded-lg border p-4">
            <div class="space-y-0.5">
              <div class="text-sm font-medium">Leave Classroom</div>
              <div class="text-sm text-muted-foreground">
                You will lose access to all assignments and progress in this classroom
              </div>
            </div>
            <Button variant="destructive" @click="openLeaveDialog">Leave</Button>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="flex-1 min-h-0 flex items-center justify-center">
        <div class="rounded-lg border bg-card p-6 text-center">
          <p class="text-muted-foreground">Classroom not found</p>
        </div>
      </div>

      <!-- Leave Confirmation Dialog -->
      <Dialog :open="isLeaveDialogOpen" @update:open="closeLeaveDialog">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Classroom</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave "{{ classroom?.name }}"? This action cannot be undone.
              You will lose access to all assignments and your progress will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" @click="closeLeaveDialog" :disabled="isLeaving">
              Cancel
            </Button>
            <Button variant="destructive" @click="confirmLeave" :disabled="isLeaving">
              {{ isLeaving ? 'Leaving...' : 'Leave Classroom' }}
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
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigation } from '@/composables/useNavigation'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useClassroomStore } from '@/stores/classrooms'
import type { ClassroomWithMemberCount } from '@/stores/classrooms'
import { Copy } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'

const route = useRoute()
const authStore = useAuthStore()
const classroomStore = useClassroomStore()
const { goToClassroomSelection } = useNavigation()

const classroom = ref<ClassroomWithMemberCount | null>(null)
const isLeaveDialogOpen = ref(false)
const isLeaving = ref(false)

// Breadcrumbs
const breadcrumbs = computed(() => [{ label: 'Settings' }])

// Copy classroom code
const copyClassroomCode = async () => {
  if (!classroom.value) return

  try {
    await navigator.clipboard.writeText(classroom.value.id)
    toast.success('Classroom code copied to clipboard')
  } catch {
    toast.error('Failed to copy classroom code')
  }
}

// Leave classroom
const openLeaveDialog = () => {
  isLeaveDialogOpen.value = true
}

const closeLeaveDialog = () => {
  if (isLeaving.value) return
  isLeaveDialogOpen.value = false
}

const confirmLeave = async () => {
  if (!classroom.value || !authStore.user) return

  isLeaving.value = true

  try {
    await classroomStore.leaveClassroom(authStore.user.id, classroom.value.id)

    toast.success('You have left the classroom')
    goToClassroomSelection()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to leave classroom'
    toast.error(errorMessage)
  } finally {
    isLeaving.value = false
  }
}

onMounted(async () => {
  try {
    const data = await classroomStore.fetchClassroomSettings(route.params.classroomId as string)

    // Fetch student classrooms to get teacher name
    if (authStore.user) {
      await classroomStore.fetchStudentClassrooms(authStore.user.id)
      const studentClassroom = classroomStore.studentClassrooms.find(
        (c) => c.id === route.params.classroomId,
      )
      if (studentClassroom) {
        classroom.value = studentClassroom
      } else {
        classroom.value = data as ClassroomWithMemberCount
      }
    } else {
      classroom.value = data as ClassroomWithMemberCount
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load classroom settings'
    toast.error(errorMessage)
  }
})
</script>
