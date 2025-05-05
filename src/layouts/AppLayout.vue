<template>
  <!-- 桌面端布局 -->
  <n-layout has-sider position="absolute" v-if="!isMobile">
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

  <!-- 移动端布局 -->
  <n-layout position="absolute" v-else>
    <!-- 顶部导航栏 -->
    <n-layout-header bordered class="mobile-header">
      <div class="mobile-header-content">
        <div class="mobile-logo">Kirara AI</div>
        <n-button quaternary circle @click="() => appStore.setShowDrawer(true)">
          <template #icon>
            <n-icon><menu-outline /></n-icon>
          </template>
        </n-button>
      </div>
    </n-layout-header>

    <!-- 主内容区域 -->
    <n-layout-content class="mobile-content bg" :native-scrollbar="false">
      <router-view />
    </n-layout-content>

    <!-- 底部状态栏 -->
    <n-layout-footer bordered position="absolute" class="status-bar">
      <status-bar />
    </n-layout-footer>

    <!-- 抽屉菜单 -->
    <n-drawer v-model:show="appStore.showDrawer" :width="240" placement="left">
      <n-drawer-content>
        <main-sidebar />
        <div v-if="hasSecondarySiderContent">
          <secondary-sidebar @hasContent="handleHasSecondarySiderContentUpdate" />
        </div>
      </n-drawer-content>
    </n-drawer>
  </n-layout>
</template>
  
<script setup lang="ts">
import { NLayout, NLayoutSider, NLayoutContent, NLayoutFooter, NAvatar, 
         NLayoutHeader, NDrawer, NDrawerContent, NButton, NIcon } from 'naive-ui'
import { RouterView, useRoute } from 'vue-router'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import MainSidebar from '@/components/layout/MainSidebar.vue'
import SecondarySidebar from '@/components/layout/SecondarySidebar.vue' 
import StatusBar from '@/components/layout/StatusBar.vue'
import { MenuOutline } from '@vicons/ionicons5'

const appStore = useAppStore()
const hasSecondarySiderContent = ref(true)
const windowWidth = ref(window.innerWidth)

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 判断是否为移动设备
const isMobile = computed(() => {
  return windowWidth.value < 768 // 可根据需要调整断点
})

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

/* 移动端样式 */
.mobile-header {
  height: 56px;
  background: var(--sidebar-bg-color);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.mobile-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 16px;
}

.mobile-logo {
  margin-left: 12px;
  font-size: 18px;
  font-weight: bold;
}

.mobile-content {
  height: calc(100vh - 56px - 28px); /* 减去顶部导航栏和状态栏高度 */
  background-color: var(--bg-color);
  overflow-y: auto;
}
</style>
