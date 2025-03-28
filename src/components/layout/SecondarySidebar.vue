<script setup lang="ts">
import { computed, h, watch } from 'vue'
import { NMenu, NDivider } from 'naive-ui'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()
const router = useRouter()
const emit = defineEmits<{
  (e: 'hasContent', hasContent: boolean): void
}>()

// 根据当前路由获取二级菜单配置
const menuOptions = computed<MenuOption[]>(() => {
  const currentPath = route.path.split('/')[1]
  
  switch (currentPath) {
    case 'im':
      return [
      ]
    case 'llm':
      return []
    case 'workflow':
      return [
        {
          label: () => '工作流列表',
          key: 'workflow-list',
          path: '/workflow'
        },
        {
          label: () => '触发规则',
          key: 'workflow-dispatch-rules',
          path: '/workflow/dispatch-rules'
        },
        {
          label: () => '模板管理',
          key: 'workflow-templates',
          path: '/workflow/templates'
        }
      ]
    case 'plugins':
      return []
    case 'memory':
      return [
        {
          label: () => '记忆管理',
          key: 'memory-list',
          path: '/memory'
        },
        {
          label: () => '记忆检索',
          key: 'memory-search',
          path: '/memory/search'
        }
      ]
    case 'tracing':
      return [
        {
          label: () => 'LLM 请求记录',
          key: 'tracing-llm',
          path: '/tracing/llm'
        }
      ]
    default:
      return []
  }
})

// 当前选中的菜单项
const activeKey = computed(() => {
  const pathParts = route.path.split('/')
  if (pathParts.length > 2) {
    return `${pathParts[1]}-${pathParts[2]}`
  }
  return `${pathParts[1]}-${getDefaultSubModule(pathParts[1])}`
})

// 获取模块的默认子模块
const getDefaultSubModule = (module: string) => {
  switch (module) {
    case 'im':
      return 'platforms'
    case 'llm':
      return 'backends'
    case 'workflow':
      return 'list'
    case 'plugins':
      return 'installed'
    case 'memory':
      return 'list'
    case 'tracing':
      return 'llm'
    default:
      return ''
  }
}

const getMenuTitle = (key: string) => {
  switch (key) {
    case 'workflow':
      return '工作流'
    case 'plugins':
      return '插件'
    case 'memory':
      return '记忆'
    case 'tracing':
      return '系统记录'
    default:
      return ''
      
  }
}
// 监听菜单变化，更新当前路由
const handleUpdateValue = (key: string) => {
  const selectedMenu = menuOptions.value.find(option => option.key === key);
  if (selectedMenu && selectedMenu.path) {
    router.push(selectedMenu.path);
  }
}

watch(() => menuOptions.value, () => {
  if (menuOptions.value.length === 0) {
    emit('hasContent', false)
  } else {
    emit('hasContent', true)
  }
}, { immediate: true })
</script>

<template>
  <div v-if="menuOptions.length > 0" class="secondary-menu-container">
    <div class="secondary-menu-header">
      <h3 class="secondary-menu-title">{{ getMenuTitle(appStore.currentModule) }}</h3>
    </div>
    <n-menu
      :value="activeKey"
      :options="menuOptions"
      @update:value="handleUpdateValue"
      class="secondary-menu"
    />
  </div>
</template>

<style scoped>
.secondary-menu-header {
  padding: 0 24px;
  height: var(--sidebar-title-height);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
}

.secondary-menu-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.secondary-menu {
  margin-top: 8px;
}

:deep(.n-menu-item) {
  height: 40px;
  margin: 4px 12px;
  border-radius: var(--border-radius-small);
}

:deep(.n-menu-item-content) {
  padding: 0 12px;
}

:deep(.n-menu-item-content-header) {
  font-size: 14px;
  font-weight: 500;
}
</style> 