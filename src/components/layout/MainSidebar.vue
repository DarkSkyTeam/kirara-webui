<script setup lang="ts">
import { computed, h } from 'vue'
import { NMenu } from 'naive-ui'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import {
  ChatboxOutline,
  ServerOutline,
  ExtensionPuzzleOutline,
  GitNetworkOutline,
  BookOutline,
  HomeOutline,
  SettingsOutline,
  TerminalOutline,
  ImageOutline,
  AnalyticsOutline
} from '@vicons/ionicons5'
import IconMCP from '@/components/icons/IconMCP.vue'
import { NIcon } from 'naive-ui'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()
const router = useRouter()

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions: MenuOption[] = [
  {
    label: () => '快速开始',
    key: 'guide',
    icon: renderIcon(HomeOutline)
  },
  {
    label: () => '控制台',
    key: 'console',
    icon: renderIcon(TerminalOutline)
  },
  {
    label: () => '系统记录',
    key: 'tracing',
    icon: renderIcon(AnalyticsOutline)
  },
  {
    label: () => '聊天平台管理',
    key: 'im',
    icon: renderIcon(ChatboxOutline)
  },
  {
    label: () => '模型管理',
    key: 'llm',
    icon: renderIcon(ServerOutline)
  },
  {
    label: () => '工作流',
    key: 'workflow',
    icon: renderIcon(GitNetworkOutline)
  },
  {
    label: () => 'MCP',
    key: 'mcp',
    icon: renderIcon(IconMCP)
  },
  {
    label: () => '媒体管理',
    key: 'media',
    icon: renderIcon(ImageOutline)
  },
  {
    label: () => '插件管理',
    key: 'plugins',
    icon: renderIcon(ExtensionPuzzleOutline)
  },
  {
    label: () => '系统设置',
    key: 'settings',
    icon: renderIcon(SettingsOutline)
  }
]

// 当前选中的菜单项
const activeKey = computed(() => route.path.split('/')[1])

// 监听路由变化，更新当前模块
const handleUpdateValue = (key: string) => {
  router.push(`/${key}`)
  appStore.setCurrentModule(key)
}
</script>

<template>
  <n-menu
    :value="activeKey"
    :options="menuOptions"
    :collapsed="appStore.siderCollapsed"
    :collapsed-width="64"
    :collapsed-icon-size="22"
    @update:value="handleUpdateValue"
  />
</template>

<style scoped>
:deep(.n-menu-item) {
  height: 48px;
}
:deep(.n-menu-item-content__icon) {
  font-size: 20px;
}

:deep(.n-menu-item-content-header) {
  font-size: 14px;
}
</style> 