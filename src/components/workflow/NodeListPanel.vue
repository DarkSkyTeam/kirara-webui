<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NCard,
  NInput,
  NIcon,
  NCollapse,
  NCollapseItem,
  NEmpty,
  NScrollbar,
  NTag,
  NTooltip,
  NText,
  NDivider
} from 'naive-ui'
import { SearchOutline, AppsOutline, FilterOutline } from '@vicons/ionicons5'
import { useVueFlow } from '@vue-flow/core'
import type { BlockType } from '@/api/block'
import { getTypeColor } from '@/utils/node-colors'

const props = defineProps<{
  blockTypes: BlockType[]
}>()

const { addNodes, getNodes, project } = useVueFlow()

// 搜索功能
const searchQuery = ref('')
const isSearching = computed(() => searchQuery.value.trim().length > 0)

// 按类别分组的区块类型
const groupedBlockTypes = computed(() => {
  const groups: Record<string, BlockType[]> = {}

  // 过滤搜索结果
  const filteredTypes = props.blockTypes.filter(blockType => {
    if (!isSearching.value) return true

    const query = searchQuery.value.toLowerCase()
    return (
      blockType.type_name.toLowerCase().includes(query) ||
      blockType.label.toLowerCase().includes(query) ||
      blockType.description?.toLowerCase().includes(query)
    )
  })

  // 按 groupId 分组
  filteredTypes.forEach(blockType => {
    // 从 type_name 中提取 groupId (通常是第一部分)
    const groupId = blockType.type_name.split(':')[0] || '其他'
    if (!groups[groupId]) {
      groups[groupId] = []
    }
    groups[groupId].push(blockType)
  })

  return groups
})

// 获取分组的排序
const sortedGroupKeys = computed(() => {
  const keys = Object.keys(groupedBlockTypes.value)

  // 自定义排序逻辑
  const groupOrder = ['internal', 'system', 'mcp', 'game']

  return keys.sort((a, b) => {
    const indexA = groupOrder.indexOf(a)
    const indexB = groupOrder.indexOf(b)

    if (indexA !== -1 && indexB !== -1) return indexA - indexB
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1
    return a.localeCompare(b)
  })
})

// 获取分组的显示名称
const getGroupDisplayName = (groupId: string) => {
  const groupNameMap: Record<string, string> = {
    'internal': '内部组件',
    'system': '系统组件',
    'mcp': 'MCP组件',
    'game': '娱乐组件'
  }

  return groupNameMap[groupId] || groupId
}

// 拖拽开始处理
const onDragStart = (event: DragEvent, blockType: BlockType) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', JSON.stringify(blockType))
    event.dataTransfer.effectAllowed = 'move'
  }
}

// 处理拖放到画布上
const onDrop = (event: DragEvent) => {
  if (!event.dataTransfer) return

  const data = event.dataTransfer.getData('application/vueflow')
  if (!data) return

  try {
    const blockType = JSON.parse(data) as BlockType

    // 获取画布上的位置
    const { x, y } = project({ x: event.clientX, y: event.clientY })

    // 生成唯一ID
    const existingNodes = getNodes.value
    const baseName = blockType.type_name.split(':').pop() || 'node'
    let newId = baseName
    let counter = 1

    while (existingNodes.some(node => node.id === newId)) {
      newId = `${baseName}_${counter}`
      counter++
    }

    // 创建新节点
    const newNode = {
      id: newId,
      type: 'custom',
      position: { x, y },
      data: {
        label: blockType.label,
        blockType: blockType,
        config: {},
        inputs: blockType.inputs,
        outputs: blockType.outputs
      }
    }

    addNodes([newNode])
  } catch (error) {
    console.error('添加节点失败:', error)
  }
}

// 根据类型获取颜色样式
const getBlockTypeColor = (blockType: BlockType) => {
  // 如果有输出，使用第一个输出的类型颜色
  if (blockType.outputs && blockType.outputs.length > 0) {
    return getTypeColor(blockType.outputs[0].type).color_on
  }
  // 如果有输入，使用第一个输入的类型颜色
  if (blockType.inputs && blockType.inputs.length > 0) {
    return getTypeColor(blockType.inputs[0].type).color_on
  }
  // 默认颜色
  return '#909399'
}

// 获取节点短ID
const getShortId = (typeName: string) => {
  const parts = typeName.split(':')
  return parts[parts.length - 1] || typeName
}
</script>

<template>
  <div class="node-list-panel">
    <div class="panel-header">
      <NIcon size="18" class="header-icon">
        <AppsOutline />
        </NIcon>
        <span class="header-title">节点列表</span>
      </div>

    <div class="search-container">
      <NInput v-model:value="searchQuery" placeholder="搜索节点..." clearable class="search-input">
        <template #prefix>
          <NIcon>
            <SearchOutline />
          </NIcon>
        </template>
      </NInput>
    </div>

    <div class="node-list-scrollbar">

      <NScrollbar>
        <div v-if="Object.keys(groupedBlockTypes).length === 0" class="empty-state">
          <NEmpty description="没有找到匹配的节点" />
        </div>

        <NCollapse arrow-placement="right" :default-expanded-names="sortedGroupKeys" class="node-list-collapse">
          <NCollapseItem v-for="groupId in sortedGroupKeys" :key="groupId" :title="getGroupDisplayName(groupId)"
            :name="groupId">
            <div class="node-list">
              <div v-for="blockType in groupedBlockTypes[groupId]" :key="blockType.type_name" class="node-item"
                draggable="true" @dragstart="onDragStart($event, blockType)">
                <div class="custom-node" :style="{ borderLeft: `3px solid ${getBlockTypeColor(blockType)}` }">
                  <div class="custom-node-header">
                    <div class="header-content">
                      <span class="node-label">{{ blockType.label }}</span>
                      <span class="node-id" :title="blockType.type_name">#{{ getShortId(blockType.type_name) }}</span>
                    </div>
                  </div>

                  <div class="custom-node-body">
                    <div v-if="blockType.description" class="node-description">
                      {{ blockType.description }}
                    </div>

                    <div class="node-meta">

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </NCollapseItem>
        </NCollapse>
      </NScrollbar>
    </div>

    <div class="drag-hint">
      <NIcon size="16" class="hint-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
          <path d="M18 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
          <path d="M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
          <path d="M10 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
          <path d="M18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
          <path d="M8 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
        </svg>
      </NIcon>
      <span>拖拽节点到画布中</span>
    </div>
  </div>
</template>

<style scoped>
.node-list-panel {
  width: 340px;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 0;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 14px;
}

.header-icon {
  color: #1890ff;
}

.header-title {
  font-weight: 600;
  font-size: 16px;
  color: #1f2937;
}

.search-container {
  margin: 12px;
}

.search-input {
  border-radius: 8px;
}

.node-list-scrollbar {
  flex: 1;
  height: calc(100vh - 180px);
  overflow: auto;
}

.node-list-collapse {
  margin: 0 auto;
  width: 300px;
}

.empty-state {
  padding: 20px 0;
  display: flex;
  justify-content: center;
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-item {
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
}

.node-item:active {
  cursor: grabbing;
}

/* 自定义节点样式 - 参考 CustomNode.vue */
.custom-node {
  background: linear-gradient(to bottom, #f8f9fa, #ffffff);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.node-item:hover .custom-node {
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.custom-node-header {
  padding: 10px 14px;
  font-weight: 500;
  color: #333;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  font-size: 14px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-label {
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-id {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  background-color: rgba(0, 0, 0, 0.04);
  padding: 2px 5px;
  border-radius: 4px;
  margin-left: 6px;
  font-family: monospace;
  cursor: default;
  flex-shrink: 0;
}

.custom-node-body {
  display: flex;
  flex-direction: column;
}

.node-description {
  padding: 10px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drag-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background-color: #f9fafb;
  border-radius: 6px;
  margin-top: 12px;
  font-size: 12px;
  color: #6b7280;
}

.hint-icon {
  color: #9ca3af;
}
</style>