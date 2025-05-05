<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, onMounted } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NSpace,
  NButton,
  NTooltip,
  NCheckboxGroup,
  NGrid,
  NGridItem,
  NCheckbox
} from 'naive-ui'
import type { ModelInfo } from '@/components/form/types'

const props = defineProps<{
  modelInfo: ModelInfo
  modelEditMode: 'add' | 'edit'
  modelAbilities: Record<string, { label: string; value: number }[]>
}>()

const emit = defineEmits<{
  (e: 'save', model: ModelInfo): void
  (e: 'cancel'): void
}>()

const selectedAbilities = ref<number[]>([])
const currentModel = ref<ModelInfo>({ ...props.modelInfo })

// 监听父组件传入的 modelInfo 变更
watch(
  () => props.modelInfo,
  (newValue) => {
    console.log(newValue)
    currentModel.value = { ...newValue }
    selectedAbilities.value = parseAbilitiesFromValue(newValue.ability)
  },
  { deep: true }
)

// 监听模型类型变化，重置能力选择
watch(
  () => currentModel.value.type,
  () => {
    selectedAbilities.value = []
    updateModelAbility()
  }
)

// 从能力值解析出选中的能力
const parseAbilitiesFromValue = (abilityValue: number) => {
  if (!currentModel.value.type || !props.modelAbilities[currentModel.value.type]) {
    return []
  }

  const abilities = props.modelAbilities[currentModel.value.type]
  console.log(abilities)
  return abilities
    .filter((ability) => (abilityValue & ability.value) !== 0)
    .map((ability) => ability.value)
}

// 更新模型能力值
const updateModelAbility = () => {
  if (selectedAbilities.value.length === 0) {
    currentModel.value.ability = 0
    return
  }

  currentModel.value.ability = selectedAbilities.value.reduce((sum, current) => sum | current, 0)
}

const handleCancel = () => {
  emit('cancel')
}

const handleSave = () => {
  if (!currentModel.value.id) {
    return false
  }

  emit('save', currentModel.value)
}

onMounted(() => {
  selectedAbilities.value = parseAbilitiesFromValue(currentModel.value.ability)
})
</script>

<template>
  <div class="model-form-container">
    <n-form :model="currentModel" label-placement="left" label-width="120">
      <n-form-item label="模型ID" path="id" required>
        <n-input v-model:value="currentModel.id" placeholder="请输入模型ID" />
      </n-form-item>

      <n-form-item label="模型类型" path="type" required>
        <n-space>
          <n-tooltip trigger="hover" placement="top">
            <template #trigger>
              <n-button
                :type="currentModel.type === 'llm' ? 'primary' : 'default'"
                @click="currentModel.type = 'llm'"
              >
                语言模型(LLM)
              </n-button>
            </template>
            语言模型用于生成文本和对话
          </n-tooltip>
          <n-tooltip trigger="hover" placement="top">
            <template #trigger>
              <n-button
                :type="currentModel.type === 'embedding' ? 'primary' : 'default'"
                @click="currentModel.type = 'embedding'"
              >
                嵌入模型(Embedding)
              </n-button>
            </template>
            嵌入模型用于文本向量化，通常用于向量数据库的构建和召回
          </n-tooltip>
          <n-tooltip trigger="hover" placement="top">
            <template #trigger>
              <n-button
                :type="currentModel.type === 'imagegeneration' ? 'primary' : 'default'"
                @click="currentModel.type = 'imagegeneration'"
                disabled
              >
                画图模型
              </n-button>
            </template>
            用于生成和编辑图像的模型，暂不支持
          </n-tooltip>
        </n-space>
      </n-form-item>

      <n-form-item label="模型能力" path="ability">
        <n-space vertical>
          <n-checkbox-group v-model:value="selectedAbilities" @update:value="updateModelAbility">
            <n-grid
              :cols="3"
              :x-gap="12"
              :y-gap="12"
              v-if="currentModel.type && modelAbilities[currentModel.type]"
            >
              <n-grid-item
                v-for="ability in modelAbilities[currentModel.type]"
                :key="ability.value"
              >
                <n-checkbox :value="ability.value">
                  <div class="ability-label">
                    <span>{{ ability.label }}</span>
                  </div>
                </n-checkbox>
              </n-grid-item>
            </n-grid>
          </n-checkbox-group>
          <p>能力标记仅用于参考，不影响实际使用</p>
        </n-space>
      </n-form-item>
    </n-form>

    <div class="form-footer">
      <n-space justify="end">
        <n-button @click="handleCancel" class="cancel-button">取消</n-button>
        <n-button type="primary" @click="handleSave" class="confirm-button">保存</n-button>
      </n-space>
    </div>
  </div>
</template>

<style scoped>
.model-form-container {
  display: flex;
  flex-direction: column;
}

.form-footer {
  margin-top: 24px;
}

.ability-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cancel-button,
.confirm-button {
  transition: all 0.3s ease;
}

.cancel-button:hover,
.confirm-button:hover {
  transform: translateY(-2px);
}
</style>
