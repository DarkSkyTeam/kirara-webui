<script setup lang="ts">
import { h, ref, computed } from 'vue'
import { NButton, NIcon, NCard, NAvatar, NEmpty, NDivider } from 'naive-ui'
import { CloseOutline, PencilOutline } from '@vicons/ionicons5'
import type { ModelInfo } from './types'

const props = defineProps<{
  value: ModelInfo[]
  modelAbilities: Record<string, { label: string; value: number }[]>
}>()

const emit = defineEmits<{
  'update:value': [value: ModelInfo[]]
  edit: [index: number, model: ModelInfo]
}>()

const updateValue = (newValue: ModelInfo[]) => {
  emit('update:value', newValue)
}

const handleEdit = (index: number) => {
  emit('edit', index, props.value[index])
}

const getRandomLetter = (str: string) => {
  if (!str) return 'M'
  const letters = str.replace(/[^a-zA-Z]/g, '') // 过滤掉非字母字符
  if (!letters.length) return 'M'
  const randomIndex = Math.floor(Math.random() * letters.length)
  return letters.charAt(randomIndex).toUpperCase()
}

// 模型类型中文映射
const modelTypeMap: Record<string, string> = {
  llm: '语言模型',
  embedding: '嵌入模型',
  image_generation: '图像生成',
  audio: '音频生成'
}

// 按模型类型分组
const groupedModels = computed(() => {
  const groups: Record<string, ModelInfo[]> = {}

  // 初始化所有已知类型的空数组
  Object.keys(modelTypeMap).forEach((type) => {
    groups[type] = []
  })

  // 分组模型
  props.value.forEach((model) => {
    const type = model.type || 'unknown'
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(model)
  })

  // 过滤掉空数组
  return Object.entries(groups)
    .filter(([_, models]) => models.length > 0)
    .sort(([typeA], [typeB]) => {
      // 自定义排序顺序
      const order = ['llm', 'embedding', 'imageGeneration', 'audioGeneration']
      return order.indexOf(typeA) - order.indexOf(typeB)
    })
})

const renderModelCard = (model: ModelInfo, index: number) => {
  const removeItem = () => {
    const newValue = [...props.value]
    newValue.splice(index, 1)
    updateValue(newValue)
  }

  // 获取模型类型对应的能力列表
  const modelTypeAbilities = props.modelAbilities[model.type] || []

  // 获取模型已启用的能力
  const enabledAbilities = modelTypeAbilities
    .filter((ability) => (model.ability & ability.value) !== 0)
    .map((ability) => ability.label)

  // 获取模型类型的中文名称

  return h(
    NCard,
    {
      class: 'model-card',
      bordered: false,
      size: 'small',
      hoverable: true
    },
    {
      default: () =>
        h(
          'div',
          {
            class: 'model-card-content'
          },
          [
            h('div', { class: 'model-card-header' }, [
              h(
                NAvatar,
                {
                  round: true,
                  size: 'medium',
                  color: getRandomColor(model.id),
                  class: 'model-avatar'
                },
                { default: () => getRandomLetter(model.id) || 'M' }
              ),
              h('div', { class: 'model-card-title' }, [
                h('div', { class: 'model-name' }, model.id || '未命名模型')
              ]),
              h('div', { class: 'model-card-actions' }, [
                h(
                  NButton,
                  {
                    text: true,
                    size: 'small',
                    class: 'edit-button',
                    onClick: () => handleEdit(index)
                  },
                  {
                    icon: () => h(NIcon, null, { default: () => h(PencilOutline) })
                  }
                ),
                h(
                  NButton,
                  {
                    text: true,
                    type: 'error',
                    size: 'small',
                    onClick: removeItem,
                    disabled: props.value.length === 1,
                    class: 'delete-button'
                  },
                  {
                    icon: () => h(NIcon, null, { default: () => h(CloseOutline) })
                  }
                )
              ])
            ]),
            h('div', { class: 'model-abilities-container' }, [
              enabledAbilities.length > 0
                ? h(
                    'div',
                    { class: 'model-abilities' },
                    enabledAbilities.map((ability) => h('div', { class: 'ability-tag' }, ability))
                  )
                : h('div', { class: 'no-abilities' }, '无能力设置')
            ])
          ]
        )
    }
  )
}

// 根据字符串生成一致的颜色
const getRandomColor = (str: string) => {
  if (!str) return '#5c6ac4'

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const colors = [
    '#5c6ac4',
    '#1f93ff',
    '#18a058',
    '#f0883a',
    '#d03050',
    '#8a2be2',
    '#0eb57d',
    '#f58220',
    '#8f4cd7',
    '#13c2c2'
  ]

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// 获取模型在原数组中的索引
const getModelIndex = (model: ModelInfo) => {
  return props.value.findIndex((m) => m.id === model.id)
}
</script>

<template>
  <div class="model-list-container">
    <div v-if="value && value.length > 0" class="model-groups">
      <div v-for="[type, models] in groupedModels" :key="type" class="model-group">
        <div class="group-header">
          <span class="group-title">{{ modelTypeMap[type] || type }}</span>
          <n-divider />
        </div>
        <div class="model-list">
          <component
            :is="renderModelCard(model, getModelIndex(model))"
            v-for="model in models"
            :key="model.id || getModelIndex(model)"
          />
        </div>
      </div>
    </div>
    <div v-else class="empty-list">
      <n-empty description="请在这里添加要使用的模型" />
    </div>
  </div>
</template>

<style scoped>
.model-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.model-groups {
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  padding: 8px 0;
}

.model-group {
  position: relative;
}

.group-header {
  position: sticky;
  top: 0;
  z-index: 10;
  margin-bottom: 12px;
  padding: 8px 8px 0;
  background-color: var(--n-body-color, #fff);
}

.group-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--n-text-color);
  padding-left: 8px;
  border-left: 3px solid var(--n-primary-color, #1f93ff);
}

.model-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 0 4px;
}

.model-card {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 10px;
  overflow: hidden;
  background-color: var(--n-card-color);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  z-index: 1;
}

.model-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.06);
}

.model-card-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
}

.model-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.model-avatar {
  flex-shrink: 0;
  font-weight: 500;
  font-size: 16px;
}

.model-card-title {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 70px; /* 为操作按钮预留空间 */
}

.model-name {
  font-weight: 500;
  font-size: 15px;
  word-wrap: break-word;
  overflow: hidden;
  color: var(--n-text-color);
}

.model-type-badge {
  display: inline-block;
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 10px;
  background-color: rgba(64, 158, 255, 0.1);
  color: var(--n-primary-color);
  font-weight: 400;
  border: 1px solid rgba(64, 158, 255, 0.2);
  width: fit-content;
}

.model-abilities-container {
  padding: 2px 0;
  min-height: 32px;
}

.model-abilities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ability-tag {
  font-size: 12px;
  padding: 1px 8px;
  background-color: rgba(64, 158, 255, 0.05);
  color: var(--n-text-color);
  border-radius: 10px;
  white-space: nowrap;
  transition: all 0.2s ease;
  font-weight: 400;
  border: 1px solid rgba(128, 128, 128, 0.3);
}

.ability-tag:hover {
  background-color: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.3);
}

.no-abilities {
  font-size: 12px;
  color: var(--n-text-color-3);
  font-style: italic;
  padding: 4px 0;
}

.model-card-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

.model-card:hover .model-card-actions {
  opacity: 1;
}

.edit-button,
.delete-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.edit-button:hover {
  background-color: rgba(64, 158, 255, 0.1);
}

.delete-button:not(:disabled):hover {
  background-color: rgba(239, 71, 78, 0.1);
}

.empty-list {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 140px;
  background-color: var(--n-card-color, #fff);
  border: 2px dashed rgba(128, 128, 128, 0.3);
  border-radius: 10px;
  color: var(--n-text-color-3);
  margin: 16px 4px;
}
</style>
