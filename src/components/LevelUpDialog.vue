<template>
  <Dialog :open="levelUpStore.isDialogOpen" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <div class="flex flex-col items-center justify-center py-8 px-4">
        <!-- Trophy/Badge Icon with animation -->
        <div class="level-up-badge mb-6">
          <div class="relative">
            <!-- Outer glow ring -->
            <div
              class="absolute inset-0 bg-gradient-to-r from-purple-400 via-violet-400 to-purple-400 rounded-full blur-xl opacity-50 animate-pulse"
            />

            <!-- Main badge circle -->
            <div
              class="relative bg-gradient-to-br from-purple-500 to-violet-600 rounded-full w-32 h-32 flex items-center justify-center shadow-2xl border-4 border-purple-200 dark:border-purple-400 animate-bounce-in"
            >
              <!-- Trophy icon -->
              <Trophy :size="64" :stroke-width="2" class="text-white drop-shadow-lg" />
            </div>

            <!-- Sparkle decorations -->
            <div
              class="absolute -top-2 -right-2 text-purple-400 dark:text-purple-300 animate-spin-slow"
            >
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2l1.5 6 6 1.5-6 1.5L10 18l-1.5-6.5L2 10l6.5-1.5L10 2z" />
              </svg>
            </div>
            <div
              class="absolute -bottom-2 -left-2 text-violet-400 dark:text-violet-300 animate-spin-slow animation-delay-300"
            >
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2l1.5 6 6 1.5-6 1.5L10 18l-1.5-6.5L2 10l6.5-1.5L10 2z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Congratulations text -->
        <DialogTitle
          class="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 bg-clip-text text-transparent animate-fade-in"
        >
          Level Up!
        </DialogTitle>

        <!-- Level information -->
        <div v-if="levelUpStore.celebrationData" class="text-center space-y-2 animate-fade-in-up">
          <p class="text-lg text-gray-700 dark:text-gray-300">Congratulations! You've reached</p>
          <div
            class="text-5xl font-black text-transparent bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text"
          >
            Level {{ levelUpStore.celebrationData.newLevel }}
          </div>
          <p
            v-if="levelUpStore.celebrationData.classroomName"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            in {{ levelUpStore.celebrationData.classroomName }}
          </p>
        </div>

        <!-- Close button -->
        <button
          @click="handleClose"
          class="mt-8 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 animate-fade-in-up animation-delay-200"
        >
          Continue
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useLevelUpStore } from '@/stores/level-up'
import { celebrateLevelUp } from '@/utils/confetti'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Trophy } from 'lucide-vue-next'

const levelUpStore = useLevelUpStore()

// Trigger confetti when dialog opens
watch(
  () => levelUpStore.isDialogOpen,
  (isOpen) => {
    if (isOpen) {
      // Small delay to ensure dialog is visible
      setTimeout(() => {
        celebrateLevelUp()
      }, 100)
    }
  },
)

const handleClose = () => {
  levelUpStore.closeDialog()
}

const handleOpenChange = (open: boolean) => {
  if (!open) {
    levelUpStore.closeDialog()
  }
}
</script>

<style scoped>
/* Bounce in animation for badge */
@keyframes bounce-in {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.animate-bounce-in {
  animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Fade in animation */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out 0.3s both;
}

/* Fade in up animation */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out 0.5s both;
}

.animation-delay-200 {
  animation-delay: 0.7s;
}

.animation-delay-300 {
  animation-delay: 0.3s;
}

/* Slow spin for sparkles */
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
</style>
