import { computed, onMounted, ref } from 'vue'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme-preference'

export function useTheme() {
  const theme = ref<Theme>('light')

  const isDark = computed(() => theme.value === 'dark')

  function applyTheme() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function setTheme(newTheme: Theme) {
    theme.value = newTheme
    localStorage.setItem(STORAGE_KEY, newTheme)
    applyTheme()
  }

  function toggleTheme() {
    setTheme(isDark.value ? 'light' : 'dark')
  }

  onMounted(() => {
    // Load theme from localStorage
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored && (stored === 'light' || stored === 'dark')) {
      theme.value = stored
    }

    // Apply initial theme
    applyTheme()
  })

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  }
}
