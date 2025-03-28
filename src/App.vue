<script setup lang="ts">
import { RouterView } from 'vue-router'
import { 
  NLoadingBarProvider, 
  NDialogProvider, 
  NMessageProvider, 
  NConfigProvider, 
  lightTheme, 
  NModalProvider,
  useLoadingBar
} from 'naive-ui'
import HelloWorld from './components/HelloWorld.vue'
import AppLayout from './layouts/AppLayout.vue'
import { createTheme } from 'naive-ui'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'

hljs.registerLanguage('json', json)


const theme = {
  common: {
    primaryColor: '#007AFF',
    primaryColorHover: '#0063CC',
    primaryColorPressed: '#005AB3',
    borderRadius: '10px',
    fontSize: '14px',
  },
  Button: {
    textColor: '#007AFF',
    borderRadius: '8px',
    heightMedium: '38px',
    fontWeight: '500',
  },
  Card: {
    borderRadius: '12px',
  },
  Dialog: {
    borderRadius: '12px',
  },
  Input: {
    borderRadius: '8px',
  }
}

</script>

<template>
  <n-config-provider :theme-overrides="theme" abstract :hljs="hljs">
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
  --primary-color: #007AFF;
  --secondary-color: #5856D6;
  --success-color: #34C759;
  --warning-color: #FF9500;
  --error-color: #FF3B30;
  --background-color: #F2F2F7;
  --text-primary: #000000;
  --text-secondary: #8E8E93;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  background-color: var(--background-color);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
