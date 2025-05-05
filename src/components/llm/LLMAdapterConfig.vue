<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue'
import {
  NForm,
  NFormItem,
  NSwitch,
  NInput,
  NSelect,
  NCard,
  NButton,
  NSpace,
  NScrollbar,
  NSpin,
  NIcon,
  NTooltip
} from 'naive-ui'
import {
  AddOutline as AddIcon,
  RefreshOutline as RefreshIcon
} from '@vicons/ionicons5'
import type { FormItemRule, FormInst } from 'naive-ui'
import type { LLMBackend, ConfigSchema } from '@/api/llm'
import ModelListForm from '@/components/form/ModelListForm.vue'
import DynamicConfigForm from '@/components/form/DynamicConfigForm.vue'
import type { ModelInfo } from '@/components/form/types'

const props = defineProps<{
  adapter: LLMBackend | null,
  adapterTypes: string[],
  configSchema: ConfigSchema | null,
  loading: boolean,
  isCreating: boolean,
  isAutoDetectModelsSupported: boolean,
  modelAbilities: Record<string, { label: string; value: number }[]>
}>()

const emit = defineEmits<{
  (e: 'save'): void,
  (e: 'delete'): void,
  (e: 'add-model'): void,
  (e: 'edit-model', index: number, model: ModelInfo): void,
  (e: 'auto-detect-models'): void
}>()

const formRef = ref<FormInst | null>(null)
const dynamicConfigForm = ref<InstanceType<typeof DynamicConfigForm> | null>(null)

const adapterRules = {
  name: [
    {
      required: true,
      message: '请输入配置名称',
      trigger: 'blur'
    },
    {
      required: true,
      validator: (rule: FormItemRule, value: string) => {
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  adapter: {
    required: true,
    message: '请选择接口类型',
    trigger: 'blur'
  },
}

const validateForm = async (): Promise<boolean> => {
  try {
    await formRef.value?.validate()
    const isValid = await dynamicConfigForm.value?.validateForm()
    return !!isValid
  } catch (error) {
    return false
  }
}

const handleSave = async () => {
  if (await validateForm()) {
    emit('save')
  }
}

const handleDelete = () => {
  emit('delete')
}

const handleAddModel = () => {
  emit('add-model')
}

const handleEditModel = (index: number, model: ModelInfo) => {
  emit('edit-model', index, model)
}

const handleAutoDetectModels = () => {
  emit('auto-detect-models')
}
</script>

<template>
  <div class="content-area bg" v-if="adapter">
    <div class="content-header">
      <h2>模型管理</h2>
      <n-space>
        <n-button @click="handleDelete" type="error" v-if="!isCreating">
          删除配置
        </n-button>
        <n-button @click="handleSave" type="primary">
          保存配置
        </n-button>
      </n-space>
    </div>

    <n-scrollbar style="height: var(--n-window-height);">
      <div class="content-body">
        <n-card class="config-section" title="基本信息">
          <n-form :model="adapter" label-placement="left" label-width="120" class="form" :rules="adapterRules"
            ref="formRef">
            <n-form-item label="配置名称" path="name" feedback="用于区分不同的配置，必须保持唯一" required>
              <n-input v-model:value="adapter.name" placeholder="请输入配置名称" />
            </n-form-item>

            <n-form-item label="接口类型" path="adapter" feedback="指定模型供应商，使用与模型供应商一致的 API 接口请求模型" required>
              <n-select v-model:value="adapter.adapter"
                :options="adapterTypes.map(type => ({ label: type, value: type }))" placeholder="请选择接口类型" />
            </n-form-item>

            <n-form-item label="启用" path="enable">
              <n-switch v-model:value="adapter.enable" />
            </n-form-item>

            <n-spin :show="loading">
              <dynamic-config-form :schema="configSchema" v-model="adapter.config"
                v-if="configSchema && adapter?.adapter" ref="dynamicConfigForm" />
            </n-spin>
          </n-form>
        </n-card>

        <n-card class="config-section" title="模型列表">
          <template #header-extra>
            <n-space>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button type="primary" @click="handleAutoDetectModels" :disabled="!isAutoDetectModelsSupported"
                    size="small" class="action-button">
                    <template #icon>
                      <n-icon><refresh-icon /></n-icon>
                    </template>
                    自动检测
                  </n-button>
                </template>
                <div v-if="!isAutoDetectModelsSupported">
                  <p>当前 API 不支持自动检测模型列表，请手动添加模型。</p>
                </div>
                <div v-else>
                  <p>当前 API 支持自动检测模型列表，请确保 API 信息正确填写，然后点击这里。</p>
                </div>
              </n-tooltip>
              <n-button type="primary" @click="handleAddModel" size="small" class="action-button">
                <template #icon>
                  <n-icon><add-icon /></n-icon>
                </template>
                添加模型
              </n-button>
            </n-space>
          </template>

          <ModelListForm v-model:value="adapter.models" @edit="handleEditModel" :model-abilities="modelAbilities" />
        </n-card>
      </div>
    </n-scrollbar>
  </div>
</template>

<style scoped>
.content-area {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: var(--card-bg-color);
  border-bottom: 1px solid var(--border-color);
  height: var(--sidebar-title-height);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.content-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--text-color);
  position: relative;
}

.content-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.action-button {
  transition: all 0.3s ease;
}

.action-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.config-section {
  margin-bottom: 20px;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>