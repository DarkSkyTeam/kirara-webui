<script setup lang="ts">
import { ref, onMounted, watch, computed, onBeforeUnmount, nextTick } from 'vue'
import {
  NScrollbar,
  NButton,
  NModal,
  NForm,
  NFormItem,
  NInput,
  useMessage,
  NSpin,
  NSpace,
  NIcon,
  useLoadingBar,
  NTooltip,
  NInputNumber
} from 'naive-ui'
import {
  SaveOutline,
  RefreshOutline,
  DownloadOutline,
  SettingsOutline,
  CloseOutline
} from '@vicons/ionicons5'
import { getTypeCompatibility, type BlockOutput, type BlockType } from '@/api/block'
import type { BlockInstance, Wire, WorkflowConfig } from '@/api/workflow'
import { workflowEditorModel } from '@/store/workflow-editor'
import { getTypeColor } from '@/utils/node-colors'
// 导入 vue-flow 相关组件
import { VueFlow, useVueFlow, Panel, connectionExists } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import CustomNode from './nodes/CustomNode.vue'
import CodeNode from './nodes/CodeNode.vue'
import NodeConfigPanel from './NodeConfigPanel.vue'
import NodeListPanel from './NodeListPanel.vue'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import type { Connection, Edge, EdgeUpdateEvent, Node } from '@vue-flow/core'
import { MarkerType } from '@vue-flow/core'
import { useLayout } from './useLayout'
// ==================== 属性和事件定义 ====================
const props = defineProps<{
  blocks: BlockInstance[]
  wires: Wire[]
  blockTypes: BlockType[]
  initialName?: string
  initialDescription?: string
  initialWorkflowId?: string
  initialConfig?: WorkflowConfig
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:blocks': [blocks: BlockInstance[]]
  'update:wires': [wires: Wire[]]
  'save': [name: string, description: string, workflowId: string]
}>()

// ==================== 状态管理 ====================
const typeCompatibility = ref<Record<string, Record<string, boolean>>>({})
const intent = workflowEditorModel.getIntent()
const viewState = workflowEditorModel.getViewState()

// 工具栏按钮状态
const saving = ref(false)
const importing = ref(false)
const resetting = ref(false)

// 设置对话框相关状态
const showSettingsModal = ref(false)
const message = useMessage()
const loadingBar = useLoadingBar()

const formRef = ref()
const formValue = ref({
  workflowId: '',
  name: '',
  description: '',
  config: {
    max_execution_time: 0
  }
})

// 初始化工作流ID
viewState.value.workflowId = 'user:' + Array.from({ length: 5 }, () => Math.floor(Math.random() * 36).toString(36)).join('')
viewState.value.name = formValue.value.name
viewState.value.description = formValue.value.description

// 表单验证规则
const formRules = {
  workflowId: {
    required: true,
    trigger: ['blur', 'input'],
    validator: (rule: any, value: string) => {
      if (!value) {
        return new Error('工作流ID不能为空')
      }
      if (!/^[^:]+:[^:]+$/.test(value)) {
        return new Error('工作流ID必须是 group_id:workflow_id 的格式')
      }
      return true
    }
  },
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: '工作流名称不能为空'
  }
}

// ==================== Vue Flow 相关设置 ====================
const {
  nodes,
  edges,
  removeEdges,
  addEdges,
  setNodes,
  setEdges,
  fitView,
  addNodes,
  project,
  getSelectedNodes,
  removeSelectedNodes
} = useVueFlow()

const { layout } = useLayout()
const selectedNode = computed(() => getSelectedNodes.value.length > 0 ? getSelectedNodes.value[0] : null)

// 连接验证功能
const isValidConnection = (connection: Connection) => {
  // 获取源节点和目标节点
  const sourceNode = nodes.value.find(node => node.id === connection.source)
  const targetNode = nodes.value.find(node => node.id === connection.target)
  if (!sourceNode || !targetNode) return false

  // 获取源输出和目标输入的类型
  const sourceOutput = sourceNode.data.outputs.find(output => output.name === connection.sourceHandle)
  const sourceBlockType = props.blockTypes.find(type => type.type_name === sourceNode.data.blockType.type_name)
  const targetInput = targetNode.data.inputs.find(input => input.name === connection.targetHandle)
  const targetBlockType = props.blockTypes.find(type => type.type_name === targetNode.data.blockType.type_name)
  if (!sourceOutput || !targetInput || !sourceBlockType || !targetBlockType) return false

  // 检查类型兼容性
  let sourceType = null
  let targetType = null
  // 如果是代码节点，则使用配置中的类型
  if (sourceNode.data.blockType.type_name == 'internal:code') {
    sourceType = sourceNode.data.config.outputs.find((output: any) => output.name === connection.sourceHandle)?.type
  } else {
    sourceType = sourceBlockType.outputs.find((output: any) => output.name === connection.sourceHandle)?.type
  }

  if (targetNode.data.blockType.type_name == 'internal:code') {
    targetType = targetNode.data.config.inputs.find((input: any) => input.name === connection.targetHandle)?.type
  } else {
    targetType = targetBlockType.inputs.find((input: any) => input.name === connection.targetHandle)?.type
  }
  if (!sourceType || !targetType) return false
  // 使用类型兼容性映射检查
  return typeCompatibility.value[sourceType]?.[targetType] === true
}

// 修改 onConnect 函数
const handleConnect = (params: Connection) => {
  // make sure the connection is not already exists
  if (connectionExists(params, edges.value)) {
    return
  }
  if (isValidConnection(params)) {
    const edge = buildEdge(params)
    if (edge) {
      addEdges([edge])
      updateWires()
      updateBlocks()
    }
  } else {
    message.error('类型不兼容，无法连接')
  }
}

const handleEdgeUpdate = ({ edge, connection }: EdgeUpdateEvent) => {
  if (connectionExists(connection, edges.value)) {
    return
  }
  if (isValidConnection(connection)) {
    // 删除旧的线，建立新的线
    const newEdge = buildEdge(connection)
    if (newEdge) {
      removeEdges([edge])
      if (edges.value.find(e => e.id === newEdge.id) === undefined) {
        addEdges([newEdge])
      }
      updateWires()
    }
  } else {
    message.error('类型不兼容，无法连接')
  }
}

const buildEdge = (params: Connection): Edge | null => {
  // 获取源节点类型和输出类型
  const sourceBlock = viewState.value.blocks.find(block => block.name === params.source)
  if (!sourceBlock) return null

  const blockType = props.blockTypes.find(type => type.type_name === sourceBlock.type_name)
  if (!blockType) return null

  let type = null
  if (blockType.type_name == 'internal:code') {
    type = sourceBlock.config.outputs.find((output: any) => output.name === params.sourceHandle)?.type
  } else {
    type = blockType.outputs.find((output: BlockOutput) => output.name === params.sourceHandle)?.type
  }
  if (!type) return null

  return {
    ...params,
    id: `${params.source}-${params.sourceHandle}-${params.target}-${params.targetHandle}`,
    markerEnd: MarkerType.ArrowClosed,
    style: { stroke: getTypeColor(type).color_on, strokeWidth: 2 },
    class: 'workflow-edge',
    updatable: true
  }
}

// ==================== 数据转换函数 ====================
// 将 BlockInstance 转换为 vue-flow 节点
const convertCustomNodeToVueFlowNode = (block: BlockInstance, blockType: BlockType): Node => {
  return {
    id: block.name,
    type: 'custom', // 使用自定义节点类型
      position: { x: block.position.x, y: block.position.y },
      data: {
        label: blockType.label,
        blockType: blockType,
        config: block.config || {},
        inputs: blockType.inputs,
        outputs: blockType.outputs
      }
    }
}

const convertCodeNodeToVueFlowNode = (block: BlockInstance, blockType: BlockType): Node => {
  return {
    id: block.name,
    type: 'code', // 使用自定义节点类型
      position: { x: block.position.x, y: block.position.y },
      data: {
        label: blockType.label,
        blockType: blockType,
        config: block.config || {},
        inputs: block.config?.inputs || [],
        outputs: block.config?.outputs || []
      }
    }
}

const convertBlocksToNodes = (blocks: BlockInstance[]): Node[] => {
  return blocks
    .map(block => {
      const blockType = props.blockTypes.find(type => type.type_name === block.type_name)
      if (!blockType) return null
      if (blockType.type_name == 'internal:code') {
        return convertCodeNodeToVueFlowNode(block, blockType)
      }
      return convertCustomNodeToVueFlowNode(block, blockType)
    }).filter(it => it !== null)
}

// 将 Wire 转换为 vue-flow Edge
const convertWiresToEdges = (wires: Wire[]): Edge[] => {
  return wires.map(wire => {
    const block = viewState.value.blocks.find(block => block.name === wire.source_block)
    if (!block) return null

    // 构造一个Connection对象，然后使用buildEdge函数
    const connection: Connection = {
      source: wire.source_block,
      sourceHandle: wire.source_output,
      target: wire.target_block,
      targetHandle: wire.target_input
    }

    return buildEdge(connection) as Edge
  }).filter(it => it !== null)
}

// 将 vue-flow 节点转换回 BlockInstance
const convertNodesToBlocks = (): BlockInstance[] => {
  return nodes.value.map(node => {
    return {
      type_name: node.data?.blockType?.type_name,
      name: node.id,
      config: node.data?.config || {},
      position: {
        x: Math.round(node.position.x),
        y: Math.round(node.position.y)
      }
    }
  })
}

// 将 vue-flow 边转换回 Wire
const convertEdgesToWires = (): Wire[] => {
  return edges.value.map(edge => ({
    source_block: edge.source,
    source_output: edge.sourceHandle || '',
    target_block: edge.target,
    target_input: edge.targetHandle || ''
  }))
}

// ==================== 数据更新函数 ====================

const debounce = (func: () => void, delay: number) => {
  let timer: number | null = null;
  return function (this: any, ...args: any[]) {
    return new Promise<void>((resolve) => {
      if (timer === null) {
        timer = window.setTimeout(() => {
          func.apply(this, args);
          timer = null;
          resolve();
        }, delay);
      } else {
        resolve()
      }
    });
  };
};
// 更新区块数据
const updateBlocks = debounce(() => {
  const blocks = convertNodesToBlocks()
  intent.updateBlocks(blocks)
  console.log('updateBlocks', blocks)
  emit('update:blocks', blocks)
}, 500)

// 更新连线数据
const updateWires = debounce(() => {
  const wires = convertEdgesToWires()
  intent.updateWires(wires)
  console.log('updateWires', wires)
  emit('update:wires', wires)
}, 500)

// 恢复图形
const restoreGraph = () => {
  const vueFlowNodes = convertBlocksToNodes(viewState.value.blocks)
  const vueFlowEdges = convertWiresToEdges(viewState.value.wires)

  setNodes(vueFlowNodes)
  setEdges(vueFlowEdges)
  // 如果存在 position 未设置的情况，则使用自动布局
  if (vueFlowNodes.every(block => block.position.x == 0 && block.position.y == 0)) {
    console.log('layout')
    setNodes(layout(vueFlowNodes, vueFlowEdges, 'LR'))
    nextTick(() => {
      fitView()
    })
  }
}

// ==================== 事件处理函数 ====================
// 保存处理函数
const handleSave = async () => {
  try {
    await updateBlocks()
    const errors = await formRef.value?.validate()
    if (errors?.length > 0 || !formValue.value.name || !formValue.value.workflowId) {
      message.error('工作流信息需要修改')
      showSettingsModal.value = true
      return
    }
    saving.value = true
    loadingBar.start()
    showSettingsModal.value = false
    await updateWires()
    emit('save', formValue.value.name, formValue.value.description, formValue.value.workflowId)
  } catch (error: any) {
    message.error(error?.message || '保存失败')
  } finally {
    saving.value = false
    loadingBar.finish()
  }
}

// 重置处理函数
const handleReset = () => {
  resetting.value = true
  loadingBar.start()
  // 刷新页面
  window.location.reload()
}

// 撤销处理函数
const handleUndo = () => {
  if (!viewState.value.canUndo) return
  intent.undo()
  workflowEditorModel.performActionWithoutHistory(() => {
    restoreGraph()
  })
}

// 重做处理函数
const handleRedo = () => {
  if (!viewState.value.canRedo) return
  intent.redo()
  workflowEditorModel.performActionWithoutHistory(() => {
    restoreGraph()
  })
}

// 导入处理函数
const handleImport = async () => {
  try {
    importing.value = true
    loadingBar.start()
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string)
            if (data.blocks && data.wires) {
              intent.saveToHistory()
              workflowEditorModel.performActionWithoutHistory(() => {
                const vueFlowNodes = convertBlocksToNodes(data.blocks)
                const vueFlowEdges = convertWiresToEdges(data.wires)

                setNodes(vueFlowNodes)
                setEdges(vueFlowEdges)
              })
              updateBlocks()
              updateWires()
              message.success('导入成功')
            }
          } catch (error) {
            message.error('导入失败：文件格式错误')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  } finally {
    importing.value = false
    loadingBar.finish()
  }
}

// 返回处理函数
const handleBack = () => {
  if (window.confirm('确定要离开此页面吗？您未保存的更改可能会丢失！')) {
    window.history.back()
  }
}

// 编辑信息处理函数
const handleEditInfo = () => {
  formValue.value = {
    workflowId: viewState.value.workflowId || '',
    name: viewState.value.name || '',
    description: viewState.value.description || '',
    config: viewState.value.config || {}
  }
  showSettingsModal.value = true
}

// ==================== 初始化函数 ====================
// 初始化图形数据
let _graphDataInitialized = false
const initGraphData = async () => {
  // 加载区块类型和类型兼容性映射
  const compatibility = await getTypeCompatibility()
  typeCompatibility.value = compatibility

  // 恢复数据
  if (props.blocks.length > 0 || props.wires.length > 0) {
    if (_graphDataInitialized) return
    _graphDataInitialized = true
    // 更新 viewState
    intent.initialize({
      blocks: props.blocks,
      wires: props.wires,
      blockTypes: props.blockTypes,
      name: props.initialName,
      description: props.initialDescription,
      workflowId: props.initialWorkflowId,
      config: props.initialConfig
    })
    workflowEditorModel.performActionWithoutHistory(() => {
      restoreGraph()
    })
  }
}

// 初始化属性数据
const initPropertiesData = () => {
  viewState.value.name = props.initialName || ''
  viewState.value.description = props.initialDescription || ''
  viewState.value.workflowId = props.initialWorkflowId || ''

  formValue.value = {
    workflowId: props.initialWorkflowId || ':',
    name: props.initialName || '',
    description: props.initialDescription || ''
  }
  if (formValue.value.workflowId == ':') {
    formValue.value.workflowId = 'user:' + Array.from({ length: 5 }, () => Math.floor(Math.random() * 36).toString(36)).join('')
  }
}

// ==================== 生命周期钩子和监听器 ====================

// 监听 props 变化
watch([() => props.blocks, () => props.wires, () => props.blockTypes], initGraphData, { deep: true })
watch([() => props.initialName, () => props.initialDescription, () => props.initialWorkflowId], initPropertiesData, { deep: true })

// 页面离开确认处理函数
const beforeunloadHandler = (event: BeforeUnloadEvent) => {
  event.preventDefault()
  event.returnValue = '您确定要离开此页面吗？未保存的更改可能会丢失。'
  return event.returnValue
}

// 组件挂载
onMounted(() => {
  // 注册自定义节点类型
  // const { addNodeTypes } = useVueFlow()
  // addNodeTypes({ custom: CustomNode })

  initGraphData()
  initPropertiesData()

  // 添加键盘快捷键
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      if (e.shiftKey) {
        handleRedo()
      } else {
        handleUndo()
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault()
      handleSave()
    }
  })

  // 添加离开页面时的确认提示
  window.addEventListener('beforeunload', beforeunloadHandler)
})

// 组件卸载
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeunloadHandler)
})

// 关闭节点配置面板
const closeNodeConfig = () => {
  removeSelectedNodes(getSelectedNodes.value)
}

// 添加拖放处理函数
const onDrop = (event: DragEvent) => {
  if (!event.dataTransfer) return

  const data = event.dataTransfer.getData('application/vueflow')
  if (!data) return

  try {
    const blockType = JSON.parse(data) as BlockType

    // 获取画布上的位置
    const { x, y } = project({ x: event.clientX, y: event.clientY })

    // 生成唯一ID
    const baseName = blockType.type_name.split('.').pop() || 'node'
    let newId = baseName
    let counter = 1

    while (nodes.value.some(node => node.id === newId)) {
      newId = `${baseName}_${counter}`
      counter++
    }
    var type = 'custom'
    if (blockType.type_name == 'internal:code') {
      type = 'code'
    }

    // 创建新节点
    const newNode = {
      id: newId,
      type: type,
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
    updateBlocks()
  } catch (error) {
    console.error('添加节点失败:', error)
  }
}
</script>

<template>
  <div class="workflow-canvas">
    <VueFlow :nodes="nodes" :edges="edges" fit-view-on-init @nodes-change="updateBlocks" @edges-change="updateWires"
      @edge-update="handleEdgeUpdate" @connect="handleConnect" :default-zoom="1" :min-zoom="0.2" :max-zoom="4"
      :snap-to-grid="true" class="vue-flow-canvas" @drop="onDrop" @dragover.prevent>
      <template #node-custom="customNodeProps">
        <CustomNode v-bind="customNodeProps" :isValidConnection="isValidConnection" />
      </template>
      <template #node-code="codeNdoeProps">
        <CodeNode v-bind="codeNdoeProps" :isValidConnection="isValidConnection" />
      </template>
      <Background pattern-color="#aaa" :gap="20" />
      <Controls />
      <Panel position="top-center" class="toolbar">
        <NSpace>
          <NTooltip placement="bottom" trigger="hover">
            <template #trigger>
              <NButton quaternary circle :loading="saving" @click="handleSave" class="toolbar-button">
                <template #icon>
                  <NIcon>
                    <SaveOutline />
                  </NIcon>
                </template>
              </NButton>
            </template>
            <span>保存工作流</span>
          </NTooltip>
          <NTooltip placement="bottom" trigger="hover">
            <template #trigger>
              <NButton quaternary circle :loading="resetting" @click="handleReset" class="toolbar-button">
                <template #icon>
                  <NIcon>
                    <RefreshOutline />
                  </NIcon>
                </template>
              </NButton>
            </template>
            <span>重置工作流</span>
          </NTooltip>
          <NTooltip placement="bottom" trigger="hover">
            <template #trigger>
              <NButton quaternary circle :loading="importing" @click="handleImport" class="toolbar-button">
                <template #icon>
                  <NIcon>
                    <DownloadOutline />
                  </NIcon>
                </template>
              </NButton>
            </template>
            <span>导入工作流</span>
          </NTooltip>
          <NTooltip placement="bottom" trigger="hover">
            <template #trigger>
              <NButton quaternary circle @click="handleEditInfo" class="toolbar-button">
                <template #icon>
                  <NIcon>
                    <SettingsOutline />
                  </NIcon>
                </template>
              </NButton>
            </template>
            <span>编辑工作流信息</span>
          </NTooltip>
        </NSpace>
      </Panel>
      <Panel position="top-right" style="margin: 0; height: 100%">
        <NodeConfigPanel v-if="selectedNode" :selected-node="selectedNode" @close="closeNodeConfig"
          :block-types="props.blockTypes" :type-compatibility="typeCompatibility" />
      </Panel>
      <Panel position="top-left" style="margin: 0; height: 100%">
        <NodeListPanel :block-types="props.blockTypes"></NodeListPanel>
      </Panel>
    </VueFlow>

    <!-- 设置对话框 -->
    <NModal v-model:show="showSettingsModal" preset="card" title="工作流设置" class="settings-modal"
      :style="{ width: '600px' }">
      <NForm ref="formRef" :model="formValue" :rules="formRules" label-placement="left" label-width="100"
        require-mark-placement="right-hanging" size="medium" class="settings-form">
        <NFormItem label="工作流ID" path="workflowId">
          <NInput v-model:value="formValue.workflowId" placeholder="请输入 group_id:workflow_id" />
        </NFormItem>
        <NFormItem label="名称" path="name">
          <NInput v-model:value="formValue.name" placeholder="请输入工作流名称" />
        </NFormItem>
        <NFormItem label="描述" path="description">
          <NInput v-model:value="formValue.description" type="textarea" placeholder="请输入工作流描述" />
        </NFormItem>
        <NFormItem label="最大执行时间(秒)" path="config.max_execution_time">
          <NInputNumber v-model:value="formValue.config.max_execution_time" placeholder="执行超过此时间后将强制停止"
            :min="0" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showSettingsModal = false">
            取消
          </NButton>
          <NButton type="primary" :loading="saving" @click="handleSave">
            保存
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 加载遮罩 -->
    <div v-if="props.loading" class="loading-overlay">
      <NSpin size="large" />
    </div>
  </div>
</template>

<style>
.workflow-canvas {
  width: 100vw;
  height: calc(100vh - 28px);
  position: fixed;
  top: 0;
  left: 0;
  background: var(--background-color);
  z-index: 2;
}

.vue-flow-canvas {
  width: 100%;
  height: 100%;
}

.toolbar {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  justify-content: center;
  z-index: 100;
}

.toolbar>* {
  margin: 0 0.5rem;
}

.toolbar-button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.toolbar-button:hover {
  transform: translateY(-2px);
  background-color: rgba(0, 122, 255, 0.1);
}

.toolbar-button:active {
  transform: translateY(0);
}

.settings-modal {
  animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-form {
  margin: 1rem 0;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  z-index: 200;
  display: flex;
  justify-content: center;
  align-items: center;
}

.selected {
  box-shadow: 0 0 0 1px #007bff;
}

/* 添加边缘选中样式 */
.workflow-edge {
  transition: all 0.2s ease;
}

.workflow-edge.selected {
  filter: drop-shadow(0 0 3px rgba(0, 123, 255, 0.5));
  animation: edge-blink 1.5s infinite;
}

@keyframes edge-blink {
  0% {
    filter: drop-shadow(0 0 3px rgba(0, 123, 255, 0.2));
  }

  50% {
    filter: drop-shadow(0 0 5px rgba(0, 123, 255, 1));
  }

  100% {
    filter: drop-shadow(0 0 3px rgba(0, 123, 255, 0.2));
  }
}
</style>