<template>
  <ClassroomSelectionLayout>
    <div class="flex flex-col space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight">Public Classrooms</h1>
          <p class="text-muted-foreground">Discover and join public classrooms</p>
        </div>
        <Button @click="goBack" variant="outline">
          <ArrowLeft class="mr-2 h-4 w-4" />
          Back to My Classrooms
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
            v-else-if="classroomStore.publicClassrooms.length === 0"
            class="flex items-center justify-center h-full text-center"
          >
            <div class="space-y-2">
              <School class="mx-auto h-12 w-12 text-muted-foreground" />
              <p class="text-muted-foreground">No public classrooms available at the moment</p>
              <Button variant="outline" @click="goBack">Go Back</Button>
            </div>
          </div>

          <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-4">
            <div
              v-for="classroom in classroomStore.publicClassrooms"
              :key="classroom.id"
              class="group rounded-lg border bg-card hover:shadow-lg transition-shadow"
            >
              <div class="p-6 space-y-4">
                <!-- Classroom Info -->
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <h3 class="text-xl font-semibold">{{ classroom.name }}</h3>
                    <Badge variant="secondary" class="text-xs">Public</Badge>
                  </div>
                  <p class="text-sm text-muted-foreground line-clamp-2">
                    {{ classroom.description || 'No description' }}
                  </p>
                </div>

                <!-- Teacher Info -->
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserCircle class="h-4 w-4" />
                  <span>{{ classroom.teacher_name || 'Unknown Teacher' }}</span>
                </div>

                <!-- Member Count -->
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users class="h-4 w-4" />
                  <span
                    >{{ classroom.member_count || 0 }}
                    {{ classroom.member_count === 1 ? 'member' : 'members' }}</span
                  >
                </div>

                <!-- Actions -->
                <div class="pt-2">
                  <Button
                    class="w-full"
                    @click="joinClassroom(classroom)"
                    :disabled="joiningClassroomId === classroom.id"
                  >
                    <Plus class="mr-2 h-4 w-4" />
                    {{ joiningClassroomId === classroom.id ? 'Joining...' : 'Join Classroom' }}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ClassroomSelectionLayout>
</template>

<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigation } from '@/composables/useNavigation'
import ClassroomSelectionLayout from '@/layouts/ClassroomSelectionLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useClassroomStore, type ClassroomWithMemberCount } from '@/stores/classrooms'
import { ArrowLeft, Plus, School, UserCircle, Users } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const classroomStore = useClassroomStore()
const authStore = useAuthStore()
const router = useRouter()
const { goToClassroom } = useNavigation()

const joiningClassroomId = ref<string | null>(null)

const goBack = () => {
  router.push({ name: 'classrooms' })
}

const joinClassroom = async (classroom: ClassroomWithMemberCount) => {
  if (!authStore.user) return

  joiningClassroomId.value = classroom.id

  try {
    await classroomStore.joinClassroom(authStore.user.id, classroom.id)
    toast.success(`Successfully joined ${classroom.name}`)

    // Navigate to the newly joined classroom
    goToClassroom(classroom)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to join classroom'
    toast.error(errorMessage)
  } finally {
    joiningClassroomId.value = null
  }
}

onMounted(async () => {
  if (!authStore.user) return

  try {
    await classroomStore.fetchPublicClassrooms(authStore.user.id)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load public classrooms'
    toast.error(errorMessage)
  }
})
</script>
