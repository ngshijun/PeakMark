import { computed, ref } from 'vue'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme-preference'

// Global reactive theme state (shared across all components)
const theme = ref<Theme>('light')

// Initialize theme from localStorage immediately
const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
if (stored && (stored === 'light' || stored === 'dark')) {
  theme.value = stored
}

export function useTheme() {
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

  // Apply initial theme
  applyTheme()

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  }
}
