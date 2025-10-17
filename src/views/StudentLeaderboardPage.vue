<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-6">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p class="text-muted-foreground">
          See how you rank against your classmates in {{ classroom?.name || 'this classroom' }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex-1 space-y-4">
        <Card class="p-6">
          <Skeleton class="h-20 w-full" />
        </Card>
        <Card class="p-6">
          <div class="space-y-4">
            <Skeleton v-for="i in 8" :key="i" class="h-16 w-full" />
          </div>
        </Card>
      </div>

      <!-- Content -->
      <template v-else>
        <!-- Current User Stats Card -->
        <Card
          v-if="currentUserRank"
          class="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent"
        >
          <CardHeader>
            <CardTitle class="text-lg">Your Rank</CardTitle>
          </CardHeader>
          <CardContent class="pb-6">
            <div class="flex items-center gap-6">
              <!-- Rank Badge -->
              <div
                class="flex items-center justify-center w-20 h-20 rounded-full bg-primary text-primary-foreground"
              >
                <div class="text-center">
                  <div class="text-2xl font-bold">{{ currentUserRank.rank }}</div>
                  <div class="text-xs opacity-80">
                    {{ getRankSuffix(currentUserRank.rank) }}
                  </div>
                </div>
              </div>

              <!-- User Info -->
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <Avatar class="h-12 w-12">
                    <AvatarFallback class="bg-primary/10 text-primary font-medium text-lg">
                      {{ getInitials(currentUserRank.student.full_name) }}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p class="font-semibold text-lg">{{ currentUserRank.student.full_name }}</p>
                    <p class="text-sm text-muted-foreground">Level {{ currentUserRank.level }}</p>
                  </div>
                </div>

                <!-- XP Progress Bar -->
                <div class="space-y-1">
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">
                      {{ currentUserRank.student.exp.toLocaleString() }} XP
                    </span>
                    <span class="text-muted-foreground">
                      {{ currentUserRank.expForNextLevel.toLocaleString() }} XP to Level
                      {{ currentUserRank.level + 1 }}
                    </span>
                  </div>
                  <Progress :model-value="currentUserRank.expProgress" class="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Leaderboard Card -->
        <Card class="flex-1 overflow-hidden flex flex-col">
          <CardHeader class="pb-4">
            <CardTitle>Rankings</CardTitle>
            <CardDescription>
              {{ rankedStudents.length }}
              {{ rankedStudents.length === 1 ? 'student' : 'students' }} competing
            </CardDescription>
          </CardHeader>
          <CardContent class="flex-1 overflow-auto pb-6">
            <!-- Empty State -->
            <div
              v-if="rankedStudents.length === 0"
              class="flex flex-col items-center justify-center h-64 text-center"
            >
              <Trophy class="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p class="text-muted-foreground">
                No students in this classroom yet. Be the first to earn some XP!
              </p>
            </div>

            <!-- Leaderboard List -->
            <div v-else class="space-y-2">
              <div
                v-for="entry in rankedStudents"
                :key="entry.student.id"
                :class="[
                  'flex items-center gap-4 p-4 rounded-lg border transition-colors',
                  entry.isCurrentUser
                    ? 'bg-primary/5 border-primary/50'
                    : 'bg-card hover:bg-muted/50',
                ]"
              >
                <!-- Rank -->
                <div class="flex items-center justify-center w-12 h-12 shrink-0">
                  <div v-if="entry.rank <= 3" class="text-3xl">
                    {{ getRankEmoji(entry.rank) }}
                  </div>
                  <div
                    v-else
                    class="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                  >
                    <span class="font-semibold text-muted-foreground">{{ entry.rank }}</span>
                  </div>
                </div>

                <!-- Avatar & Name -->
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar class="h-10 w-10 shrink-0">
                    <AvatarFallback class="bg-primary/10 text-primary font-medium">
                      {{ getInitials(entry.student.full_name) }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="min-w-0 flex-1">
                    <p class="font-semibold truncate">
                      {{ entry.student.full_name }}
                      <span v-if="entry.isCurrentUser" class="text-primary text-sm ml-1">
                        (You)
                      </span>
                    </p>
                    <p class="text-sm text-muted-foreground">Level {{ entry.level }}</p>
                  </div>
                </div>

                <!-- XP Display -->
                <div class="text-right shrink-0">
                  <p class="font-bold text-lg">{{ entry.student.exp.toLocaleString() }}</p>
                  <p class="text-xs text-muted-foreground">XP</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </template>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { Trophy } from 'lucide-vue-next'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { classroomService, type StudentWithStats } from '@/services/api/classroom.service'
import type { ClassroomWithMemberCount } from '@/services/api/classroom.service'

const route = useRoute()
const authStore = useAuthStore()

// Breadcrumbs
const breadcrumbs = [{ label: 'Leaderboard' }]

// State
const students = ref<StudentWithStats[]>([])
const classroom = ref<ClassroomWithMemberCount | null>(null)
const loading = ref(false)

// Computed
const classroomId = computed(() => route.params.classroomId as string)

// Level calculation (same formula as useLevel composable)
const calculateLevel = (exp: number): number => {
  return Math.floor(Math.sqrt(exp / 100)) + 1
}

const calculateExpForLevel = (level: number): number => {
  const adjustedLevel = level - 1
  return adjustedLevel * adjustedLevel * 100
}

interface RankedStudent {
  student: StudentWithStats
  rank: number
  level: number
  expForCurrentLevel: number
  expForNextLevel: number
  expProgress: number
  isCurrentUser: boolean
}

const rankedStudents = computed<RankedStudent[]>(() => {
  // Sort students by exp (descending)
  const sorted = [...students.value].sort((a, b) => b.exp - a.exp)

  return sorted.map((student, index) => {
    const level = calculateLevel(student.exp)
    const expForCurrentLevel = calculateExpForLevel(level)
    const expForNextLevel = calculateExpForLevel(level + 1)
    const expInCurrentLevel = student.exp - expForCurrentLevel
    const expToNextLevel = expForNextLevel - expForCurrentLevel
    const expProgress = Math.min(100, (expInCurrentLevel / expToNextLevel) * 100)

    return {
      student,
      rank: index + 1,
      level,
      expForCurrentLevel,
      expForNextLevel,
      expProgress,
      isCurrentUser: student.id === authStore.user?.id,
    }
  })
})

const currentUserRank = computed<RankedStudent | null>(() => {
  return rankedStudents.value.find((entry) => entry.isCurrentUser) || null
})

// Methods
const fetchStudents = async () => {
  loading.value = true
  try {
    const data = await classroomService.getStudentsWithStats(classroomId.value)
    students.value = data
  } catch (error) {
    toast.error('Failed to fetch leaderboard')
    console.error('Failed to fetch students:', error)
  } finally {
    loading.value = false
  }
}

const fetchClassroom = async () => {
  try {
    const data = await classroomService.getClassroomById(classroomId.value)
    classroom.value = data
  } catch (error) {
    console.error('Failed to fetch classroom:', error)
  }
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getRankEmoji = (rank: number): string => {
  switch (rank) {
    case 1:
      return '🥇'
    case 2:
      return '🥈'
    case 3:
      return '🥉'
    default:
      return ''
  }
}

const getRankSuffix = (rank: number): string => {
  const j = rank % 10
  const k = rank % 100
  if (j === 1 && k !== 11) return `${rank}st`
  if (j === 2 && k !== 12) return `${rank}nd`
  if (j === 3 && k !== 13) return `${rank}rd`
  return `${rank}th`
}

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchStudents(), fetchClassroom()])
})
</script>
