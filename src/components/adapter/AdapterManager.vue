<script setup lang="ts">
import { ref, onMounted, h, watch } from 'vue'
import {
  NCard,
  NSpace,
  NButton,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSwitch,
  NSpin,
  useMessage,
  NTooltip,
  NIcon
} from 'naive-ui'
import type { DataTableColumns, FormInst } from 'naive-ui'
import DynamicConfigForm from '@/components/form/DynamicConfigForm.vue'
import { AddOutline } from '@vicons/ionicons5'
interface AdapterBase {
  name: string
  adapter: string
  config: Record<string, any>
  [key: string]: any // 允许添加额外的字段
}

interface Props {
  title: string
  api: {
    getAdapterTypes: () => Promise<{ types: string[] }>
    getAdapters: () => Promise<{ adapters?: any[]; data?: { backends: any[] } }>
    getAdapterConfigSchema: (type: string) => Promise<{ configSchema: any }>
    createAdapter: (data: any) => Promise<any>
    updateAdapter: (name: string, data: any) => Promise<any>
    deleteAdapter: (name: string) => Promise<any>
    toggleAdapter?: (name: string, running: boolean) => Promise<any>
  }
  transformFormModel?: (model: any) => any
  modelValue: AdapterBase
}

const props = defineProps<Props>()
const $message = useMessage()
const formRef = ref<FormInst | null>(null)
const showModal = ref(false)
const modalType = ref<'create' | 'edit'>('create')
const adapterTypes = ref<string[]>([])
const adapters = ref<any[]>([])
const configSchema = ref<any>(null)
const loading = ref(false)
const processing = ref(false)

const defaultFormModel = props.modelValue

const formRules = ref<any>({
  name: [
    { required: true, message: '请输入适配器名称', trigger: 'blur' },
    {
      validator: (rule: any, value: any) => {
        if (
          adapters.value.some((adapter) => adapter.name === value && modalType.value === 'create')
        ) {
          return Promise.reject(new Error('适配器名称已存在'))
        } else {
          return Promise.resolve()
        }
      },
      trigger: 'blur'
    }
  ],
  adapter: [{ required: true, message: '请选择适配器类型', trigger: 'change' }]
})

const emit = defineEmits(['update:modelValue'])
const formModel = ref<AdapterBase>({ ...props.modelValue })

// 监听 props.modelValue 的变化
watch(
  () => props.modelValue,
  (newValue) => {
    // Do not update if all values are same
    if (JSON.stringify(formModel.value) !== JSON.stringify(newValue)) {
      formModel.value = { ...newValue }
    }
  },
  { deep: true }
)

// 重置表单
const resetForm = () => {
  formModel.value = { ...defaultFormModel }
  emit('update:modelValue', formModel.value)
}

// 修改添加适配器的点击处理
const handleAddClick = () => {
  modalType.value = 'create'
  resetForm()
  showModal.value = true
}

// 修改编辑适配器的处理
const handleEdit = (row: any) => {
  modalType.value = 'edit'
  formModel.value = {
    ...defaultFormModel,
    ...row,
    config: { ...row.config }
  }
  emit('update:modelValue', formModel.value)
  showModal.value = true
}

// 获取适配器类型
const fetchAdapterTypes = async () => {
  try {
    const { types } = await props.api.getAdapterTypes()
    adapterTypes.value = types
  } catch (error) {
    $message.error('获取适配器类型失败: ' + error)
    console.error('获取适配器类型失败:', error)
  }
}

// 获取所有适配器
const fetchAdapters = async () => {
  try {
    const response = await props.api.getAdapters()
    adapters.value = response.adapters || response.data?.backends || []
  } catch (error) {
    $message.error('获取适配器列表失败: ' + error)
    console.error('获取适配器列表失败:', error)
  }
}

// 获取适配器配置模式
const fetchAdapterConfigSchema = async (adapterType: string) => {
  try {
    loading.value = true
    const { configSchema: configSchemaData } = await props.api.getAdapterConfigSchema(adapterType)
    configSchema.value = configSchemaData
  } catch (error) {
    $message.error('获取适配器配置模式失败: ' + error)
    console.error('获取适配器配置模式失败:', error)
  } finally {
    loading.value = false
  }
}

// 监听适配器类型变化
watch(
  () => formModel.value.adapter,
  async (newAdapter) => {
    if (newAdapter) {
      if (modalType.value != 'edit') {
        const oldConfig = formModel.value.config
        const oldValues = { ...formModel.value }
        formModel.value = {
          ...defaultFormModel,
          ...oldValues,
          adapter: newAdapter,
          config: oldConfig
        }
      }
      await fetchAdapterConfigSchema(newAdapter)
    }
  }
)

watch(
  () => formModel.value,
  (newValue) => {
    // Do not update if all values are same
    if (JSON.stringify(props.modelValue) !== JSON.stringify(newValue)) {
      emit('update:modelValue', newValue)
    }
  },
  { deep: true }
)

// 监听模态框显示状态
watch(showModal, async (show) => {
  if (show) {
    if (formModel.value.adapter) {
      await fetchAdapterConfigSchema(formModel.value.adapter)
    } else {
      configSchema.value = null
    }
  }
})

// 创建或更新适配器
const handleSubmit = async () => {
  await handleSubmitActual()
  showModal.value = false
}

const handleSubmitActual = async () => {
  try {
    const errors = await formRef.value?.validate()
    if (errors?.warnings?.length) {
      $message.error('表单填写有误，请修正。')
      return
    }

    processing.value = true
    const submitData = props.transformFormModel
      ? props.transformFormModel(formModel.value)
      : formModel.value

    try {
      if (modalType.value === 'create') {
        await props.api.createAdapter(submitData)
        modalType.value = 'edit'
      } else {
        await props.api.updateAdapter(submitData.name, submitData)
      }
      $message.success('保存适配器成功')
      await fetchAdapters()
    } catch (error) {
      $message.error('保存适配器失败: ' + error)
    }
  } catch (error) {
    $message.error('保存适配器失败: ' + error)
  } finally {
    processing.value = false
  }
}

defineExpose({
  handleSubmitActual
})

// 删除适配器
const handleDelete = async (adapter: any) => {
  if (confirm(`确定要删除适配器 ${adapter.name} 吗？`)) {
    try {
      processing.value = true
      await props.api.deleteAdapter(adapter.name)
      await fetchAdapters()
      $message.success('删除适配器成功')
    } catch (error) {
      $message.error('删除适配器失败: ' + error)
    } finally {
      processing.value = false
    }
  }
}

// 切换适配器状态
const handleToggleAdapter = async (adapter: any) => {
  if (props.api.toggleAdapter) {
    try {
      processing.value = true
      await props.api.toggleAdapter(adapter.name, !adapter.is_running)
      await fetchAdapters()
      $message.success('切换适配器状态成功')
    } catch (error) {
      $message.error('切换适配器状态失败: ' + error)
    } finally {
      processing.value = false
    }
  }
}

const createColumns = (): DataTableColumns<any> => {
  const columns: DataTableColumns<any> = [
    {
      title: '名称',
      key: 'name'
    },
    {
      title: '适配器',
      key: 'adapter'
    }
  ]

  if (props.api.toggleAdapter) {
    columns.push({
      title: '状态',
      key: 'is_running',
      render(row) {
        return h(NSwitch, {
          value: row.is_running,
          onUpdateValue: () => handleToggleAdapter(row)
        })
      }
    })
  }

  columns.push({
    title: '操作',
    key: 'actions',
    render(row) {
      return h(
        NSpace,
        {},
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                onClick: () => handleEdit(row)
              },
              { default: () => '编辑' }
            ),
            h(
              NButton,
              {
                size: 'small',
                type: 'error',
                onClick: () => handleDelete(row)
              },
              { default: () => '删除' }
            )
          ]
        }
      )
    }
  })

  return columns
}

onMounted(() => {
  fetchAdapterTypes()
  fetchAdapters()
})
</script>

<template>
  <div class="adapter-manager">
    <n-space vertical :size="16">
      <n-spin :show="processing">
        <n-card :title="title">
          <template #header-extra>
            <NButton type="primary" @click="handleAddClick" class="create-button">
              <template #icon>
                <NIcon><AddOutline /></NIcon>
              </template>
              添加适配器
            </NButton>
          </template>
          <slot name="desc"></slot>
          <n-data-table :columns="createColumns()" :data="adapters" />
        </n-card>
      </n-spin>
    </n-space>

    <!-- 创建/编辑适配器表单 -->
    <n-modal v-model:show="showModal">
      <n-card
        style="width: 900px"
        :title="modalType === 'create' ? '添加适配器' : '编辑适配器'"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <div class="adapter-edit-container">
          <div class="adapter-basic-form">
            <n-form
              ref="formRef"
              :model="formModel"
              label-placement="left"
              label-width="100"
              :rules="formRules"
            >
              <n-form-item label="适配器" path="adapter">
                <n-tooltip>
                  <template #trigger>
                    <n-select
                      v-model:value="formModel.adapter"
                      :options="adapterTypes.map((type) => ({ label: type, value: type }))"
                    />
                  </template>
                  <div>
                    如果没有找到合适的适配器，可以去
                    <router-link to="/plugins/market">插件市场</router-link> 逛逛。
                  </div>
                </n-tooltip>
              </n-form-item>
              <n-form-item label="名称" path="name">
                <n-input
                  v-model:value="formModel.name"
                  placeholder="适配器名称用来区分不同的适配器"
                />
              </n-form-item>
            </n-form>
          </div>
          <div class="adapter-extra-form">
            <n-spin :show="loading">
              <dynamic-config-form
                :schema="configSchema"
                v-model="formModel.config"
                v-if="configSchema"
              />
            </n-spin>
            <slot name="extra-form-items" :model="formModel"></slot>
          </div>
        </div>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showModal = false">取消</n-button>
            <n-button type="primary" @click="handleSubmit">确定</n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<style scoped>
.adapter-manager {
  height: 100%;
}

.adapter-edit-container {
  display: flex;
  min-height: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.adapter-basic-form {
  flex: 0 0 400px;
  padding-right: 16px;
}

.adapter-extra-form {
  flex: 1;
  padding-left: 16px;
  padding-right: 16px;
  border-left: 1px solid var(--n-border-color);
}
</style>
