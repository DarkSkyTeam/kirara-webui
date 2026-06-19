<script setup lang="ts">
import { NButton, NButtonGroup, NIcon, NTooltip } from 'naive-ui'
import { Sunny, Moon, Contrast } from '@vicons/ionicons5'
import { useThemeStore, type ThemeMode } from '@/stores/theme'

const themeStore = useThemeStore()

const options: { mode: ThemeMode; icon: typeof Sunny; label: string }[] = [
  { mode: 'light', icon: Sunny, label: '浅色' },
  { mode: 'auto', icon: Contrast, label: '自动' },
  { mode: 'dark', icon: Moon, label: '深色' }
]
</script>

<template>
  <div class="theme-toggle">
    <n-button-group size="small">
      <n-tooltip v-for="opt in options" :key="opt.mode" trigger="hover">
        <template #trigger>
          <n-button
            :quaternary="themeStore.themeMode !== opt.mode"
            :type="themeStore.themeMode === opt.mode ? 'primary' : 'default'"
            @click="themeStore.setTheme(opt.mode)"
          >
            <template #icon>
              <n-icon><component :is="opt.icon" /></n-icon>
            </template>
          </n-button>
        </template>
        {{ opt.label }}
      </n-tooltip>
    </n-button-group>
  </div>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
}
</style>
