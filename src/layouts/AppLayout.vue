<template>
  <n-layout has-sider position="absolute">
    <!-- 左侧主导航栏 -->
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed="appStore.siderCollapsed"
      :collapsed-width="64"
      :width="240"
      show-trigger
      @collapse="appStore.toggleSider"
      @expand="appStore.toggleSider"
      class="main-sider"
    >
      <div class="logo-container">
        <!-- <img v-if="appStore.siderCollapsed" src="/logo-small.png" alt="Logo" class="logo-small" />
        <img v-else src="/logo.png" alt="Logo" class="logo" /> -->
        <n-avatar v-if="appStore.siderCollapsed" :size="32" round>K</n-avatar>
        <div v-else>Kirara AI</div>
      </div>
      <main-sidebar />
    </n-layout-sider>
    <!-- 二级菜单栏 -->
    <n-layout-sider
      bordered
      :width="240"
      v-show="hasSecondarySiderContent"
      @collapse="appStore.toggleSecondarySider"
      @expand="appStore.toggleSecondarySider"
      class="secondary-sider"
    >
      <secondary-sidebar @hasContent="handleHasSecondarySiderContentUpdate" />
    </n-layout-sider>

    <!-- 主内容区域 -->
    <n-layout>
      <n-layout-content class="main-content bg" :native-scrollbar="false">
        <router-view />
      </n-layout-content>
    </n-layout>
    <!-- 底部状态栏 -->
    <n-layout-footer bordered position="absolute" class="status-bar">
      <status-bar />
    </n-layout-footer>
  </n-layout>
</template>
  
<script setup lang="ts">
import { NLayout, NLayoutSider, NLayoutContent, NLayoutFooter, NAvatar } from 'naive-ui'
import { RouterView, useRoute } from 'vue-router'
import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import MainSidebar from '@/components/layout/MainSidebar.vue'
import SecondarySidebar from '@/components/layout/SecondarySidebar.vue' 
import StatusBar from '@/components/layout/StatusBar.vue'

const appStore = useAppStore()

const hasSecondarySiderContent = ref(true)

const handleHasSecondarySiderContentUpdate = (hasContent: boolean) => {
  hasSecondarySiderContent.value = hasContent
}
</script>

<style scoped>
.main-sider {
  height: 100vh;
  background: var(--sidebar-bg-color);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}

.secondary-sider {
  height: 100vh;
  background: var(--sidebar-bg-color);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  z-index: 0;
}

.main-content {
  height: calc(100vh - 28px); /* 减去状态栏高度 */
  background-color: var(--bg-color);
  overflow-y: auto;
}

.status-bar {
  height: 28px;
  padding: 4px 12px;
  font-size: 12px;
  line-height: 20px;
  z-index: 1000;
  background-color: var(--sidebar-bg-color);
  color: var(--text-color-secondary);
}

.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
  transition: all 0.2s ease;
  height: var(--sidebar-title-height);
}

.logo {
  height: 32px;
}

.logo-small {
  height: 32px;
  width: 32px;
}
</style>
