<script setup lang="ts">
import { RouterView } from 'vue-router'
import {
  NLoadingBarProvider,
  NDialogProvider,
  NMessageProvider,
  NConfigProvider,
  lightTheme,
  darkTheme,
  NModalProvider
} from 'naive-ui'
import { computed } from 'vue'
import { useThemeStore } from './stores/theme'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'

hljs.registerLanguage('json', json)

const themeStore = useThemeStore()

const themeOverrides = {
  common: {
    primaryColor: '#007AFF',
    primaryColorHover: '#0063CC',
    primaryColorPressed: '#005AB3',
    borderRadius: '10px',
    fontSize: '14px'
  },
  Button: {
    textColor: '#007AFF',
    borderRadius: '8px',
    heightMedium: '38px',
    fontWeight: '500'
  },
  Card: {
    borderRadius: '12px'
  },
  Dialog: {
    borderRadius: '12px'
  },
  Input: {
    borderRadius: '8px'
  }
}

const currentTheme = computed(() => (themeStore.isDark ? darkTheme : lightTheme))
</script>

<template>
  <n-config-provider :theme="currentTheme" :theme-overrides="themeOverrides" abstract :hljs="hljs">
    <n-modal-provider>
      <n-message-provider>
        <n-loading-bar-provider>
          <n-dialog-provider>
            <router-view v-slot="{ Component }">
              <component :is="Component" />
            </router-view>
          </n-dialog-provider>
        </n-loading-bar-provider>
      </n-message-provider>
    </n-modal-provider>
  </n-config-provider>
</template>

<style>
:root {
  --primary-color: #007aff;
  --secondary-color: #5856d6;
  --success-color: #34c759;
  --warning-color: #ff9500;
  --error-color: #ff3b30;
  --background-color: #f2f2f7;
  --text-primary: #000000;
  --text-secondary: #8e8e93;
}

:root.dark {
  --background-color: #121212;
  --text-primary: #e5e7eb;
  --text-secondary: #8b949e;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--background-color);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background-color 0.3s ease, color 0.3s ease;
}

#app {
  width: 100%;
  height: 100%;
}

/* 全局过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
