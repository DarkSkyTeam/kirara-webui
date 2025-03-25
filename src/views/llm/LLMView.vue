<script setup lang="ts">
import { ref, watch, computed, onMounted, h } from 'vue'
import {
  NFormItem,
  NSwitch,
  NButton,
  NSpace,
  NModal,
  NCard,
  useMessage,
  NInput,
  NForm,
  NIcon,
  NEmpty,
  NInputGroup,
  NSelect,
  NList,
  NListItem,
  NThing,
  NTag,
  NAvatar,
  NScrollbar,
  NText,
  NSpin,
  NCheckboxGroup,
  NCheckbox,
  NDivider,
  NTooltip,
  NMarquee,
  type FormItemRule
} from 'naive-ui'
import { llmApi } from '@/api/llm'
import type { LLMBackend, ConfigSchema } from '@/api/llm'
import ModelListForm from '@/components/form/ModelListForm.vue'
import {
  AddOutline as AddIcon,
  SearchOutline as SearchIcon,
  CheckmarkCircleOutline as CheckIcon,
  CloseCircleOutline as CloseIcon,
  RefreshOutline as RefreshIcon
} from '@vicons/ionicons5'
import DynamicConfigForm from '@/components/form/DynamicConfigForm.vue'

const $message = useMessage()
const isAutoDetectModelsSupported = ref(false)
const showConfirmModal = ref(false)
const autoDetectLoading = ref(false)
const selectedAdapter = ref('')
const adapters = ref<LLMBackend[]>([])
const adapterTypes = ref<string[]>([])
const searchQuery = ref('')
const configSchema = ref<ConfigSchema | null>(null)
const loading = ref(false)
const formRef = ref<InstanceType<typeof NForm> | null>(null)

// 模型编辑相关
const showModelModal = ref(false)
const modelEditMode = ref<'add' | 'edit'>('add')
const modelEditIndex = ref(-1)
const currentModel = ref({
  id: '',
})

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
        // adapter name 不能与已有的 adapter name 重复
        if (value !== originalAdapterName.value && adapters.value.some(adapter => adapter.name === value)) {
          return Promise.reject(new Error('配置名称已存在'))
        }
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

// 模型能力选项
const modelCapabilities = [
  { label: '文本生成', value: 'text-generation' },
  { label: '聊天对话', value: 'chat' },
  { label: '代码生成', value: 'code-generation' },
  { label: '图像生成', value: 'image-generation' },
  { label: '语音识别', value: 'speech-recognition' },
  { label: '语音合成', value: 'text-to-speech' },
  { label: '文本嵌入', value: 'embeddings' }
]

// 当前选中的适配器实例
const currentAdapter = ref<LLMBackend | null>(null)

// 保存原始适配器名称
const originalAdapterName = ref('')

// 获取适配器类型和实例
const fetchAdapters = async () => {
  try {
    const typesResponse = await llmApi.getAdapterTypes()
    adapterTypes.value = Array.isArray(typesResponse) ? typesResponse : typesResponse.types

    const adaptersResponse = await llmApi.getBackends()
    adapters.value = Array.isArray(adaptersResponse) ? adaptersResponse : adaptersResponse.data.backends
  } catch (error: any) {
    $message.error(`加载适配器失败: ${error.message || error}`)
  }
}

// 过滤后的适配器列表
const filteredAdapters = computed(() => {
  if (!searchQuery.value) return adapters.value
  const query = searchQuery.value.toLowerCase()
  return adapters.value.filter(adapter =>
    adapter.name.toLowerCase().includes(query) ||
    adapter.adapter.toLowerCase().includes(query)
  )
})

// 获取适配器配置模式
const fetchAdapterConfigSchema = async (adapterType: string) => {
  try {
    loading.value = true
    const { configSchema: configSchemaData } = await llmApi.getAdapterConfigSchema(adapterType)
    configSchema.value = configSchemaData
  } catch (error: any) {
    $message.error(`获取适配器配置模式失败: ${error.message || error}`)
    configSchema.value = null
  } finally {
    loading.value = false
  }
}

// 处理适配器选择
const handleAdapterSelect = async (adapter: LLMBackend) => {
  selectedAdapter.value = adapter.name
  currentAdapter.value = {
    name: '',
    adapter: '',
    config: {},
    enable: true,
    models: []
  }
  currentAdapter.value = { ...adapter }
  originalAdapterName.value = adapter.name
  await fetchAdapterConfigSchema(adapter.adapter)
}

// 创建新配置
const handleCreateAdapter = async (adapter: string | null = null) => {
  currentAdapter.value = {
    name: '',
    adapter: adapter ?? '',
    config: {},
    enable: true,
    models: []
  }
  // 创建新配置时，清空原始名称
  originalAdapterName.value = ''
}

const isCreating = computed(() => {
  const existingAdapter = adapters.value.find(
    a => a.name === originalAdapterName.value
  )
  return !existingAdapter
})

// 保存配置
const handleSave = async () => {
  try {
    await formRef.value?.validate()
  } catch (error: any) {
    $message.error(`保存失败: 请检查配置信息填写是否正确`)
    return false
  }
  try {

    if (!currentAdapter.value?.name || !currentAdapter.value?.adapter) {
      throw new Error('请输入完整的配置信息')
    }

    // 验证 DynamicConfigForm
    const isValid = await dynamicConfigForm.value?.validateForm()
    if (!isValid) {
      return false // 如果验证失败，停止保存
    }

    if (isCreating.value) {
      await llmApi.createBackend(currentAdapter.value)
      $message.success('创建成功')
    } else {
      await llmApi.updateBackend(originalAdapterName.value, currentAdapter.value)
      $message.success('保存成功')
    }
    await fetchAdapters()
    // 更新原始名称为新名称
    originalAdapterName.value = currentAdapter.value.name
    return true
  } catch (error: any) {
    $message.error(`保存失败: ${error.message || '未知错误'}`)
    return false
  }
}

// 切换启用状态
const toggleEnable = async () => {
  try {
    if (!currentAdapter.value) {
      throw new Error('当前配置为空')
    }
    currentAdapter.value.enable = !currentAdapter.value.enable
    await handleSave()
  } catch (error: any) {
    currentAdapter.value!!.enable = !currentAdapter.value!!.enable // 恢复状态
    throw error
  }
}

// 自动检测模型
const handleAutoDetectModels = async () => {
  showConfirmModal.value = true
}

const confirmAutoDetect = async () => {
  autoDetectLoading.value = true
  try {
    if (await handleSave()) {
      currentAdapter.value!!.models = (await llmApi.getBackendModels(currentAdapter.value!!.name)).models
      await handleSave() // 保存检测到的模型列表
    }
  } catch (error: any) {
    $message.error(`自动检测模型失败: ${error.message || error}`)
  } finally {
    autoDetectLoading.value = false
    showConfirmModal.value = false
  }
}

const cancelAutoDetect = () => {
  showConfirmModal.value = false
}

// 监听适配器类型变化
watch(() => currentAdapter.value?.adapter, async (newAdapter) => {
  if (newAdapter) {
    await fetchAdapterConfigSchema(newAdapter)
  }
})

watch(() => currentAdapter.value, async (newAdapter) => {
  if (newAdapter?.adapter && newAdapter?.name) {
    isAutoDetectModelsSupported.value = (
      await llmApi.getAdapterSupportsAutoDetectModels(newAdapter.adapter)
    ).supportsAutoDetectModels
  } else {
    isAutoDetectModelsSupported.value = true
  }
}, { deep: true })

// 处理添加模型
const handleAddModel = () => {
  modelEditMode.value = 'add'
  modelEditIndex.value = -1
  currentModel.value = {
    id: '',
  }
  showModelModal.value = true
}

// 处理编辑模型
const handleEditModel = (index: number, model: string) => {
  modelEditMode.value = 'edit'
  modelEditIndex.value = index
  currentModel.value = { id: model }
  showModelModal.value = true
}

// 保存模型
const saveModel = () => {
  if (!currentModel.value.id) {
    $message.error('请填写模型ID')
    return
  }

  if (!currentAdapter.value?.models) {
    currentAdapter.value!!.models = []
  }

  if (modelEditMode.value === 'add') {
    currentAdapter.value!!.models.push(currentModel.value.id)
  } else {
    currentAdapter.value!!.models[modelEditIndex.value] = currentModel.value.id
  }

  showModelModal.value = false
  $message.success(`${modelEditMode.value === 'add' ? '添加' : '编辑'}模型成功`)
}

const showDeleteConfirmModal = ref(false)

// 删除配置
const handleDelete = () => {
  showDeleteConfirmModal.value = true
}

const confirmDelete = async () => {
  try {
    if (!currentAdapter.value?.name) {
      throw new Error('当前配置为空')
    }
    await llmApi.deleteBackend(currentAdapter.value.name)
    $message.success('删除成功')
    currentAdapter.value = null
  } catch (error: any) {
    $message.error(`删除失败: ${error.message || '未知错误'}`)
  } finally {
    await fetchAdapters()
    showDeleteConfirmModal.value = false
  }
}

const cancelDelete = () => {
  showDeleteConfirmModal.value = false
}

const isEmptyAdapter = computed(() => adapters.value.length === 0)

const getAdapterIcon = (adapter: string) => {
  return `/assets/icons/llm/${adapter.toLowerCase()}.webp`
}

// 初始化加载
onMounted(() => {
  fetchAdapters()
})

</script>

<template>
  <div class="llm-container">
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
          <n-list-item v-for="adapter in filteredAdapters" :key="adapter.name" @click="handleAdapterSelect(adapter)"
            :class="{ active: selectedAdapter === adapter.name, 'n-list-item': true }">
            <template #prefix>
              <n-avatar width="32" round :src="getAdapterIcon(adapter.adapter)" color="var(--n-color)">
                <!-- {{ adapter.adapter.charAt(0).toUpperCase() }} -->
              </n-avatar>
            </template>
            <template #suffix>
              <n-tag :type="adapter.enable ? 'success' : 'warning'" size="small" class="status-tag">
                {{ adapter.enable ? '已启用' : '已禁用' }}
              </n-tag>
            </template>
            <n-thing :title="adapter.adapter" :description="adapter.name"
              description-style="width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
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

    <div class="content-area">
      <template v-if="currentAdapter">
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
              <n-form :model="currentAdapter" label-placement="left" label-width="120" class="form"
                :rules="adapterRules" ref="formRef">
                <n-form-item label="配置名称" path="name" feedback="用于区分不同的配置，必须保持唯一" required>
                  <n-input v-model:value="currentAdapter.name" placeholder="请输入配置名称" />
                </n-form-item>

                <n-form-item label="接口类型" path="adapter" feedback="指定模型供应商，使用与模型供应商一致的 API 接口请求模型" required>
                  <n-select v-model:value="currentAdapter.adapter"
                    :options="adapterTypes.map(type => ({ label: type, value: type }))" placeholder="请选择接口类型" />
                </n-form-item>

                <n-form-item label="启用" path="enable">
                  <n-switch v-model:value="currentAdapter.enable" />
                </n-form-item>

                <n-spin :show="loading">
                  <dynamic-config-form :schema="configSchema" v-model="currentAdapter.config"
                    v-if="configSchema && currentAdapter?.adapter" ref="dynamicConfigForm" />
                </n-spin>
              </n-form>
            </n-card>

            <n-card class="config-section" title="模型列表">
              <template #header-extra>
                <n-space>
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <n-button type="primary" @click="handleAutoDetectModels" :disabled="!isAutoDetectModelsSupported"
                        :loading="autoDetectLoading" size="small">
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
                  <n-button type="primary" @click="handleAddModel" size="small">
                    <template #icon>
                      <n-icon><add-icon /></n-icon>
                    </template>
                    添加模型
                  </n-button>
                </n-space>
              </template>

              <n-scrollbar style="height: 360px;">
                <model-list-form v-model:value="currentAdapter.models" @edit="handleEditModel" />
              </n-scrollbar>
            </n-card>
          </div>
        </n-scrollbar>
      </template>

      <div class="empty-state bg" v-else>
        <n-space vertical align="center" style="width: 100%;">
          <n-text strong style="font-size: 24px;">海量模型，一网打尽</n-text>
          <n-text style="font-size: 16px;">选择一个模型供应商，然后添加模型，即可开始使用，<a
              href="https://kirara-docs.app.lss233.com/guide/configuration/llm.html" target="_blank">查看文档</a>。</n-text>
          <div style="width: 100%; height: 120px;">
            <n-marquee auto-fill :speed="40">
              <n-space class="adapter-list-marquee">
                <n-card v-for="adapter in adapterTypes" hoverable @click="handleCreateAdapter(adapter)"
                  style="width: 120px; height: 120px; position: relative; overflow: hidden;">
                  <img :src="getAdapterIcon(adapter)" style="width: 100%; height: 100%; object-fit: contain;">
                </n-card>
              </n-space>
            </n-marquee>
          </div>
        </n-space>
      </div>
    </div>
  </div>

  <!-- 自动检测确认模态框 -->
  <n-modal v-model:show="showConfirmModal">
    <n-card style="width: 400px" title="确认" :bordered="false" size="huge" role="dialog" aria-modal="true">
      <div>自动检测前会自动保存当前配置，请确保 API 信息正确填写，然后点击继续。</div>
      <n-space justify="end" style="margin-top: 24px;">
        <n-button @click="cancelAutoDetect">取消</n-button>
        <n-button type="primary" @click="confirmAutoDetect" :loading="autoDetectLoading">
          继续
        </n-button>
      </n-space>
    </n-card>
  </n-modal>

  <!-- 删除配置确认模态框 -->
  <n-modal v-model:show="showDeleteConfirmModal">
    <n-card style="width: 400px" title="确认删除" :bordered="false" size="huge" role="dialog" aria-modal="true">
      <div>确定要删除此配置吗？删除后将无法恢复。</div>
      <n-space justify="end" style="margin-top: 24px;">
        <n-button @click="cancelDelete">取消</n-button>
        <n-button @click="confirmDelete" type="error">
          删除
        </n-button>
      </n-space>
    </n-card>
  </n-modal>

  <!-- 添加/编辑模型模态框 -->
  <n-modal v-model:show="showModelModal" preset="card" style="width: 600px"
    :title="modelEditMode === 'add' ? '添加模型' : '编辑模型'">
    <n-form :model="currentModel" label-placement="left" label-width="120">
      <n-form-item label="模型ID" path="id" required>
        <n-input v-model:value="currentModel.id" placeholder="请输入模型ID" />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="showModelModal = false">取消</n-button>
        <n-button type="primary" @click="saveModel">保存</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>
.llm-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  height: calc(100vh - 28px);
  background-color: var(--n-color);
  transition: all 0.2s ease;
  animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar {
  border-right: 1px solid var(--n-border-color);
  background-color: var(--n-card-color);
  height: calc(100vh - 28px);
}

.search-bar {
  border-bottom: 1px solid var(--n-border-color);
  height: var(--sidebar-title-height);
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.adapter-list-scroll {
  flex: 1;
  height: calc(100% - 56px - 28px);
  margin: 12px 6px;
}

.adapter-list-scroll .n-list-item {
  padding: 12px;
}

.content-area {
  display: flex;
  flex-direction: column;
  background-color: var(--n-color);
  animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);

}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: var(--n-card-color);
  border-bottom: 1px solid var(--n-border-color);
  height: var(--sidebar-title-height);
}

.content-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
}

.content-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.config-section {
  background-color: var(--n-card-color);
}

.model-list-container {
  min-height: 200px;
  max-height: calc(100vh - 400px);
}

.status-tag {
  margin-left: 8px;
}

.active {
  background: var(--n-color-hover);
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.adapter-list-marquee {
  padding: 0 6px;
}
</style>