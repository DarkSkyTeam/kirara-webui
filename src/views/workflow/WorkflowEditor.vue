<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { routerKey, useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { getWorkflow, createWorkflow, updateWorkflow, type BlockInstance, type Wire, type WorkflowConfig } from '@/api/workflow'
import { listBlockTypes, type BlockType } from '@/api/block'
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const workflowId = ref('')
const groupId = ref('')
const name = ref('')
const description = ref('')
const blocks = ref<BlockInstance[]>([])
const wires = ref<Wire[]>([])
const config = ref<WorkflowConfig>({
  max_execution_time: 36000
})
const blockTypes = ref<BlockType[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const handleSave = async (workflowName: string, workflowDesc: string, newWorkflowId: string) => {
  const [group, workflow] = newWorkflowId.split(':')
  const data = {
    group_id: group,
    workflow_id: workflow,
    name: workflowName,
    description: workflowDesc,
    blocks: blocks.value,
    wires: wires.value,
    config: config.value
  }

  saving.value = true
  try {
    if (route.params.id) {
      await updateWorkflow(groupId.value, workflowId.value, data)
      if (groupId.value !== group || workflowId.value !== workflow) {
        groupId.value = group
        workflowId.value = workflow
        router.push(`/workflow/editor/${data.group_id}:${data.workflow_id}`)
      }
      name.value = data.name
      description.value = data.description
      blocks.value = data.blocks
      wires.value = data.wires
      // 更新页面标题
      document.title = `工作流 - ${data.name}`
      message.success('保存成功')
    } else {
      await createWorkflow(data.group_id, data.workflow_id, data)
      groupId.value = data.group_id
      workflowId.value = data.workflow_id
      description.value = data.description
      name.value = data.name
      document.title = `工作流 - ${data.name}`
      message.success('创建成功')
      router.push(`/workflow/editor/${data.group_id}:${data.workflow_id}`)
    }
  } catch (error: any) {
    message.error('保存失败')
    error.value = error.message || '保存失败'
  } finally {
    saving.value = false
  }
}

const fetchWorkflow = async () => {
  if (!route.params.id) return

  const [group, workflow] = (route.params.id as string).split(':')
  groupId.value = group
  workflowId.value = workflow

  loading.value = true
  error.value = null
  try {
    const { workflow: data } = await getWorkflow(group, workflow)
    name.value = data.name
    description.value = data.description
    blocks.value = data.blocks
    wires.value = data.wires
    // 更新页面标题
    document.title = `工作流 - ${data.name}`
  } catch (error: any) {
    message.error('获取工作流失败')
    error.value = error.message || '获取工作流失败'
  } finally {
    loading.value = false
  }
}

const fetchBlockTypes = async () => {
  try {
    const { types } = await listBlockTypes()
    blockTypes.value = types
  } catch (error) {
    message.error('获取区块类型失败')
  }
}

const handleBlocksChange = (newBlocks: any[]) => {
  blocks.value = newBlocks
}

const handleWiresChange = (newWires: any[]) => {
  wires.value = newWires
}

onMounted(() => {
  fetchWorkflow()
  fetchBlockTypes()
})
</script>

<template>
  <div class="workflow-editor">
      <WorkflowCanvas
        :blocks="blocks"
        :wires="wires"
        :block-types="blockTypes"
        :initial-name="name"
        :initial-description="description"
        :initial-workflow-id="groupId + ':' + workflowId"
        :initial-config="config"
        :loading="saving"
        @update:blocks="handleBlocksChange"
        @update:wires="handleWiresChange"
        @save="handleSave"
      />
  </div>
</template>

<style scoped>
.workflow-editor {
  width: 100%;
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  background: var(--background-color);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.loading-spinner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-result {
  margin: auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 工作流画布的动画效果 */
:deep(.workflow-canvas) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.workflow-canvas.saving) {
  filter: blur(1px);
  pointer-events: none;
}

:deep(.node) {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.node:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.connection) {
  transition: stroke-width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.connection:hover) {
  stroke-width: 3px;
}
</style> 