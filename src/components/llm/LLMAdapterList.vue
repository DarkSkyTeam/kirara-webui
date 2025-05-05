<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue'
import {
  NInput,
  NInputGroup,
  NButton,
  NIcon,
  NList,
  NListItem,
  NThing,
  NTag,
  NAvatar,
  NScrollbar,
  NEmpty
} from 'naive-ui'
import { SearchOutline as SearchIcon, AddOutline as AddIcon } from '@vicons/ionicons5'
import type { LLMBackend } from '@/api/llm'

const props = defineProps<{
  adapters: LLMBackend[]
  selectedAdapter: string
}>()

const emit = defineEmits<{
  (e: 'select', adapter: LLMBackend): void
  (e: 'create'): void
}>()

const searchQuery = ref('')

// 过滤后的适配器列表
const filteredAdapters = computed(() => {
  if (!searchQuery.value) return props.adapters
  const query = searchQuery.value.toLowerCase()
  return props.adapters.filter(
    (adapter) =>
      adapter.name.toLowerCase().includes(query) || adapter.adapter.toLowerCase().includes(query)
  )
})

const getAdapterIcon = (adapter: string) => {
  return `/assets/icons/llm/${adapter.toLowerCase()}.webp`
}

const handleAdapterSelect = (adapter: LLMBackend) => {
  emit('select', adapter)
}

const handleCreateAdapter = () => {
  emit('create')
}
</script>

<template>
  <div class="sidebar">
    <div class="search-bar">
      <n-input-group>
        <n-input v-model:value="searchQuery" placeholder="搜索..." clearable>
          <template #prefix>
            <n-icon><search-icon /></n-icon>
          </template>
        </n-input>
        <n-button type="primary" @click="handleCreateAdapter()">
          <template #icon>
            <n-icon><add-icon /></n-icon>
          </template>
          添加
        </n-button>
      </n-input-group>
    </div>
    <n-list hoverable clickable class="adapter-list-scroll">
      <n-scrollbar>
        <n-list-item
          v-for="adapter in filteredAdapters"
          :key="adapter.name"
          @click="handleAdapterSelect(adapter)"
          :class="{ active: selectedAdapter === adapter.name, 'adapter-item': true }"
        >
          <template #prefix>
            <n-avatar
              width="32"
              round
              :src="getAdapterIcon(adapter.adapter)"
              color="var(--n-color)"
            >
            </n-avatar>
          </template>
          <template #suffix>
            <n-tag :type="adapter.enable ? 'success' : 'warning'" size="small" class="status-tag">
              {{ adapter.enable ? '已启用' : '已禁用' }}
            </n-tag>
          </template>
          <n-thing
            :title="adapter.adapter"
            :description="adapter.name"
            description-style="width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
          >
          </n-thing>
        </n-list-item>
        <n-list-item v-if="filteredAdapters.length === 0 && adapters.length > 0">
          <n-empty description="没有找到匹配的配置" />
        </n-list-item>
        <n-list-item v-if="adapters.length === 0">
          <n-empty description="暂无模型配置" />
        </n-list-item>
      </n-scrollbar>
    </n-list>
  </div>
</template>

<style scoped>
.sidebar {
  border-right: 1px solid var(--border-color);
  background-color: var(--sidebar-bg-color);
  height: calc(100vh - 28px);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 0;
}

.search-bar {
  border-bottom: 1px solid var(--border-color);
  height: var(--sidebar-title-height);
  display: flex;
  align-items: center;
  padding: 0 16px;
  background-color: var(--sidebar-bg-color);
}

.adapter-list-scroll {
  flex: 1;
  height: calc(100% - 56px - 28px);
  margin: 12px 6px;
}

.adapter-item {
  padding: 12px;
  margin: 4px 0;
  border-radius: var(--border-radius);
  transition: all var(--transition-duration) var(--transition-timing-function);
}

.adapter-item:hover {
  transform: translateX(2px);
}

.active {
  background-color: rgba(var(--primary-color-rgb), 0.1) !important;
  transform: translateX(2px);
}

.status-tag {
  margin-left: 8px;
  font-size: 0.8rem;
}
</style>
