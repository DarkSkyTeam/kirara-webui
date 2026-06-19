import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto'

export const useThemeStore = defineStore('theme', () => {
  const themeMode = ref<ThemeMode>((localStorage.getItem('theme') as ThemeMode) || 'auto')
  const systemDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)

  const isDark = computed(() => {
    if (themeMode.value === 'auto') return systemDark.value
    return themeMode.value === 'dark'
  })

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const onSystemChange = (e: MediaQueryListEvent) => {
    systemDark.value = e.matches
  }
  mediaQuery.addEventListener('change', onSystemChange)

  watch(isDark, (dark) => {
    document.documentElement.classList.toggle('dark', dark)
  }, { immediate: true })

  const setTheme = (mode: ThemeMode) => {
    themeMode.value = mode
    localStorage.setItem('theme', mode)
  }

  return { themeMode, isDark, setTheme }
})
