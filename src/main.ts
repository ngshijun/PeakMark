import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useProfileStore } from './stores/profile'

const app = createApp(App)

app.use(createPinia())
app.use(router)

const authStore = useAuthStore()
await authStore.initAuth()

// Fetch profile data if user is authenticated
const profileStore = useProfileStore()
if (authStore.user) {
  await profileStore.fetchProfile()
}

app.mount('#app')
