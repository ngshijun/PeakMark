<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <div class="fixed top-4 right-4 z-50">
      <ThemeToggle />
    </div>
    <div class="w-full max-w-sm">
      <form @submit="onSubmit">
        <div class="flex flex-col gap-6">
          <div class="flex flex-col items-center gap-2">
            <h1 class="text-xl font-bold">Welcome to PeakMark</h1>
            <div class="text-center text-sm">
              Don't have an account?
              <router-link to="/register" class="underline underline-offset-4">
                Sign up
              </router-link>
            </div>
          </div>
          <div class="flex flex-col gap-6">
            <FormField
              v-slot="{ componentField }"
              name="email"
              :validateOnBlur="false"
              :validateOnModelUpdate="false"
            >
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="m@example.com"
                    v-bind="componentField"
                    :disabled="isSubmitting"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField
              v-slot="{ componentField }"
              name="password"
              :validateOnBlur="false"
              :validateOnModelUpdate="false"
            >
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div class="relative">
                    <Input
                      :type="showPassword ? 'text' : 'password'"
                      v-bind="componentField"
                      :disabled="isSubmitting"
                      class="pr-10"
                    />
                    <button
                      type="button"
                      @click="showPassword = !showPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      :disabled="isSubmitting"
                    >
                      <Eye v-if="!showPassword" class="h-4 w-4" />
                      <EyeOff v-else class="h-4 w-4" />
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <Button type="submit" class="w-full" :disabled="isSubmitting">
              <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ isSubmitting ? 'Logging in...' : 'Login' }}
            </Button>
          </div>
          <div
            class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border"
          >
            <span class="relative z-10 bg-background px-2 text-muted-foreground"> Or </span>
          </div>
          <Button variant="outline" class="w-full" type="button" :disabled="isSubmitting">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-4 w-4">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            <span class="ml-2">Continue with Google</span>
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useAuthStore } from '@/stores/auth'
import { toTypedSchema } from '@vee-validate/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import * as z from 'zod'

const router = useRouter()
const showPassword = ref(false)
const { signInWithPassword } = useAuthStore()

const formSchema = toTypedSchema(
  z.object({
    email: z.string().min(1, 'Email is required').email({ message: 'Invalid email address' }),
    password: z.string().min(1, 'Password is required'),
  }),
)

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: formSchema,
  initialValues: {
    email: '',
    password: '',
  },
})

const onSubmit = handleSubmit(async (values) => {
  try {
    const { error } = await signInWithPassword(values.email, values.password)
    if (error) {
      console.error('Login error:', error)
    } else {
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Login error:', error)
  }
})
</script>
