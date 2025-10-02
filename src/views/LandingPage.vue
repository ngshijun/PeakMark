<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, BarChart3, Users, Brain } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Matching',
    description:
      'Smart algorithm adapts to your performance, matching you with questions at the right difficulty level',
  },
  {
    icon: Trophy,
    title: 'Progressive Level System',
    description:
      'Advance through levels as you master topics, with real-time difficulty adjustment',
  },
  {
    icon: BarChart3,
    title: 'Track Progress',
    description: 'Monitor your performance with detailed analytics and insights',
  },
  {
    icon: Users,
    title: 'For Teachers & Students',
    description: 'Teachers create questions, students practice and improve their skills',
  },
]
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"
  >
    <!-- Header -->
    <header class="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Trophy class="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1
            class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"
          >
            PeakMark
          </h1>
        </div>
        <div class="flex items-center gap-3">
          <Button variant="ghost" @click="router.push('/login')">Login</Button>
          <Button @click="router.push('/register')">Get Started</Button>
        </div>
      </div>
    </header>

    <!-- Theme Toggle -->
    <div class="fixed top-4 right-4 z-50">
      <ThemeToggle />
    </div>

    <!-- Hero Section -->
    <section class="container mx-auto px-4 py-20 md:py-32">
      <div class="max-w-4xl mx-auto text-center">
        <h2
          class="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent"
        >
          Reach Your Peak Performance
        </h2>
        <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          A comprehensive learning platform where teachers create questions and students practice to
          excel
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" @click="router.push('/register')" class="text-lg px-8 py-6">
            Start Learning Now
          </Button>
          <Button
            size="lg"
            variant="outline"
            @click="router.push('/login')"
            class="text-lg px-8 py-6"
          >
            Sign In
          </Button>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="container mx-auto px-4 py-16">
      <div class="max-w-6xl mx-auto">
        <h3 class="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose PeakMark?</h3>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card
            v-for="feature in features"
            :key="feature.title"
            class="border-2 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:shadow-lg"
          >
            <CardHeader>
              <component
                :is="feature.icon"
                class="w-12 h-12 mb-4 text-blue-600 dark:text-blue-400"
              />
              <CardTitle>{{ feature.title }}</CardTitle>
              <CardDescription>{{ feature.description }}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="container mx-auto px-4 py-16 mb-16">
      <Card
        class="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white"
      >
        <CardContent class="py-12 px-8 text-center">
          <h3 class="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Journey?</h3>
          <p class="text-lg md:text-xl mb-8 text-blue-50">
            Join PeakMark today and unlock your full potential
          </p>
          <Button
            size="lg"
            variant="secondary"
            @click="router.push('/register')"
            class="text-lg px-8 py-6"
          >
            Create Your Account
          </Button>
        </CardContent>
      </Card>
    </section>

    <!-- Footer -->
    <footer class="border-t bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
      <div class="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
        <p>&copy; 2025 PeakMark. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>
