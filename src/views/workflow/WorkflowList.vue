<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  NSpace,
  NCard,
  NButton,
  NDataTable,
  NPopconfirm,
  useMessage,
  NEmpty,
  NSkeleton,
  NTag,
  NTooltip,
  NIcon,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NBadge
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { listWorkflows, deleteWorkflow, getWorkflow, createWorkflow } from '@/api/workflow'
import {
  CreateOutline,
  TrashOutline,
  AddOutline,
  CopyOutline,
  DownloadOutline
} from '@vicons/ionicons5'
import WorkflowForm from '@/components/workflow/WorkflowForm.vue'
import type { ComponentPublicInstance } from 'vue'
import type { FormValidate } from 'naive-ui/es/form/src/interface'

const router = useRouter()
const message = useMessage()

interface Workflow {
  group_id: string
  workflow_id: string
  name: string
  description: string
  block_count: number
  metadata?: Record<string, any>
}

const workflows = ref<Workflow[]>([])
const loading = ref(false)
const deleting = ref<string>('')
const showCopyModal = ref(false)
const copyLoading = ref(false)
const currentWorkflow = ref<Workflow | null>(null)
const copyFormRef = ref<WorkflowFormInstance | null>(null)

interface WorkflowFormInstance extends ComponentPublicInstance {
  validate: FormValidate
  getFormData: () => {
    workflowId: string
    name: string
    description: string
  }
}

const columns: DataTableColumns<Workflow> = [
  {
    title: 'ID',
    key: 'id',
    width: 200,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '名称',
    key: 'name',
    width: 200,
    render(row) {
      return h(NTooltip, null, {
        trigger: () => h('span', { class: 'workflow-name' }, row.name),
        default: () => row.name
      })
    }
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '区块数量',
    key: 'block_count',
    width: 100,
    render(row) {
      return h(
        NTag,
        {
          type: 'info',
          round: true,
          size: 'small'
        },
        {
          default: () => row.block_count
        }
      )
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    render(row) {
      const id = `${row.group_id}:${row.workflow_id}`
      return h(NSpace, null, {
        default: () => [
          h(
            NButton,
            {
              quaternary: true,
              size: 'small',
              onClick: () => handleEdit(row),
              class: 'action-button'
            },
            {
              icon: () => h(NIcon, null, { default: () => h(CreateOutline) }),
              default: () => '编辑'
            }
          ),
          h(
            NButton,
            {
              quaternary: true,
              size: 'small',
              onClick: () => handleCopy(row),
              class: 'action-button'
            },
            {
              icon: () => h(NIcon, null, { default: () => h(CopyOutline) }),
              default: () => '复制'
            }
          ),
          h(
            NPopconfirm,
            {
              onPositiveClick: () => handleDelete(row),
              class: deleting.value === id ? 'deleting' : ''
            },
            {
              trigger: () =>
                h(
                  NButton,
                  {
                    quaternary: true,
                    size: 'small',
                    type: 'error',
                    class: 'action-button'
                  },
                  {
                    icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
                    default: () => '删除'
                  }
                ),
              default: () => '确认删除该工作流？'
            }
          )
        ]
      })
    }
  }
]

const fetchWorkflows = async () => {
  loading.value = true
  try {
    const { workflows: data } = await listWorkflows()
    workflows.value = data
  } catch (error) {
    message.error('获取工作流列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  // 打开新页面
  window.open('/workflow/editor', '_blank')
}

const handleEdit = (row: Workflow) => {
  // 打开新页面
  window.open(`/workflow/editor/${row.group_id}:${row.workflow_id}`, '_blank')
}

const handleDelete = async (row: Workflow) => {
  const id = `${row.group_id}:${row.workflow_id}`
  deleting.value = id
  try {
    await deleteWorkflow(row.group_id, row.workflow_id)
    message.success('删除成功')
    await fetchWorkflows()
  } catch (error) {
    message.error('删除失败')
  } finally {
    deleting.value = ''
  }
}

const handleCopy = (row: Workflow) => {
  currentWorkflow.value = row
  showCopyModal.value = true
}

const confirmCopy = async () => {
  if (!copyFormRef.value) return

  const valid = await copyFormRef.value.validate()
  if (valid.warnings?.length || !currentWorkflow.value) return

  const formData = copyFormRef.value.getFormData()
  const [newGroupId, newWorkflowId] = formData.workflowId.split(':')

  copyLoading.value = true
  try {
    // 1. 获取原工作流详情
    const { workflow: originalWorkflow } = await getWorkflow(
      currentWorkflow.value.group_id,
      currentWorkflow.value.workflow_id
    )

    // 2. 创建新工作流
    await createWorkflow(newGroupId, newWorkflowId, {
      group_id: newGroupId,
      workflow_id: newWorkflowId,
      name: formData.name,
      description: formData.description,
      blocks: originalWorkflow.blocks,
      wires: originalWorkflow.wires
    })

    message.success('复制成功')
    showCopyModal.value = false
    fetchWorkflows()
  } catch (error: any) {
    message.error(`复制失败: ${error.message || '未知错误'}`)
  } finally {
    copyLoading.value = false
  }
}

const cancelCopy = () => {
  showCopyModal.value = false
}

const displayWorkflows = computed(() => {
  return workflows.value.map((workflow) => {
    return {
      ...workflow,
      id: workflow.group_id + ':' + workflow.workflow_id
    }
  })
})

onMounted(() => {
  fetchWorkflows()
})
</script>

<template>
  <div class="workflow-list">
    <n-card title="工作流管理" class="workflow-card">
      <template #header-extra>
        <n-button type="primary" @click="handleCreate" class="create-button">
          <template #icon>
            <n-icon>
              <AddOutline />
            </n-icon>
          </template>
          创建工作流
        </n-button>
      </template>

      <div v-if="loading" class="loading-skeleton">
        <n-skeleton text :repeat="3" />
      </div>

      <n-empty v-else-if="displayWorkflows.length === 0" description="暂无工作流">
        <template #extra>
          <n-button type="primary" @click="handleCreate" class="create-button">
            创建工作流
          </n-button>
        </template>
      </n-empty>

      <n-data-table
        v-else
        :columns="columns"
        :data="displayWorkflows"
        :loading="loading"
        class="workflow-table"
        :row-class-name="() => 'workflow-row'"
        :pagination="{
          pageSize: 10
        }"
      />
    </n-card>

    <!-- 复制工作流对话框 -->
    <n-modal v-model:show="showCopyModal" preset="dialog" title="复制工作流">
      <WorkflowForm
        ref="copyFormRef"
        :initial-data="{
          workflowId: currentWorkflow
            ? `${currentWorkflow.group_id}:${currentWorkflow.workflow_id}_copy`
            : '',
          name: currentWorkflow ? `${currentWorkflow.name} (复制)` : '',
          description: currentWorkflow?.description || ''
        }"
      />

      <template #action>
        <n-button @click="cancelCopy">取消</n-button>
        <n-button type="primary" :loading="copyLoading" @click="confirmCopy"> 确认复制 </n-button>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.workflow-list {
  height: 100%;
  padding: 16px;
}

.workflow-card {
  animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 24px;
}

.loading-skeleton {
  padding: 24px 0;
}

.workflow-table {
  border-radius: var(--border-radius);
  overflow: hidden;
}

.workflow-table :deep(.workflow-row) {
  transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.workflow-table :deep(.workflow-row:hover) {
  background-color: rgba(64, 128, 255, 0.05);
}

.workflow-name {
  font-weight: 500;
  color: var(--primary-color);
}

.action-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-button:hover {
  background-color: rgba(64, 128, 255, 0.1);
}

.deleting {
  opacity: 0.5;
  pointer-events: none;
}

.create-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 768px) {
  .workflow-list {
    padding: 0;
  }

  .workflow-card {
    margin-bottom: 16px;
  }
}
</style>
