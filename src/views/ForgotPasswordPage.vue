<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <div class="fixed top-4 right-4 z-50">
      <ThemeToggle />
    </div>
    <div class="w-full max-w-sm">
      <form @submit="onSubmit">
        <div class="flex flex-col gap-6">
          <div class="flex flex-col items-center gap-2">
            <h1 class="text-xl font-bold">Reset Your Password</h1>
            <div class="text-center text-sm text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </div>
          </div>

          <div v-if="!emailSent" class="flex flex-col gap-6">
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

            <Button type="submit" class="w-full" :disabled="isSubmitting">
              <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ isSubmitting ? 'Sending...' : 'Send Reset Link' }}
            </Button>

            <div class="text-center text-sm">
              <router-link to="/login" class="underline underline-offset-4">
                Back to login
              </router-link>
            </div>
          </div>

          <div v-else class="flex flex-col gap-6">
            <div
              class="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
            >
              <p class="font-semibold mb-2">Check your email</p>
              <p>
                We've sent a password reset link to <strong>{{ submittedEmail }}</strong
                >. Please check your inbox and follow the instructions to reset your password.
              </p>
            </div>

            <Button variant="outline" class="w-full" @click="resetForm"> Send another link </Button>

            <div class="text-center text-sm">
              <router-link to="/login" class="underline underline-offset-4">
                Back to login
              </router-link>
            </div>
          </div>
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
import { Loader2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import * as z from 'zod'

const { resetPassword } = useAuthStore()
const emailSent = ref(false)
const submittedEmail = ref('')

const formSchema = toTypedSchema(
  z.object({
    email: z.string().min(1, 'Email is required').email({ message: 'Invalid email address' }),
  }),
)

const {
  handleSubmit,
  isSubmitting,
  resetForm: veeResetForm,
} = useForm({
  validationSchema: formSchema,
  initialValues: {
    email: '',
  },
})

const onSubmit = handleSubmit(async (values) => {
  try {
    await resetPassword(values.email)
    submittedEmail.value = values.email
    emailSent.value = true
  } catch (error) {
    console.error('Password reset error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    toast.error('Failed to Send Reset Link', {
      description: errorMessage || 'An error occurred. Please try again.',
    })
  }
})

const resetForm = () => {
  emailSent.value = false
  submittedEmail.value = ''
  veeResetForm()
}
</script>
