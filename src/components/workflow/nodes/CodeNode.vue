<script setup lang="ts">
import { computed, ref } from 'vue'
import { Handle, Position, useVueFlow, type Connection } from '@vue-flow/core'
import { getTypeColor } from '@/utils/node-colors'
import { CodeOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

const props = defineProps(['id', 'data', 'isValidConnection'])
const { getHandleConnections } = useVueFlow()

// 获取短ID
const shortId = computed(() => {
  if (!props.id) return '';
  if (props.id.length > 8) {
    return props.id.slice(-6);
  }
  return props.id;
})

// 获取输入端口颜色
const getInputColor = (type: string, required: boolean) => {
  return getTypeColor(type, required).color_on
}

// 获取输出端口颜色
const getOutputColor = (type: string) => {
  return getTypeColor(type).color_on
}

// 连接验证
const isValidConnection = (connection: Connection) => {
  // 一个输入只能有一个连接
  const incomers = getHandleConnections({
    id: connection.targetHandle,
    nodeId: connection.target,
    type: 'target'
  })
  if (incomers.length > 0) {
    return false
  }

  if (props.isValidConnection) {
    return props.isValidConnection(connection)
  }
  return true
}

// 获取代码预览
const codePreview = computed(() => {
  const code = props.data.config?.code || '';
  if (!code) return '# 请在配置面板编写代码';
  const lines = code.split('\n');
  return lines.length > 5 
    ? lines.slice(0, 5).join('\n') + '\n# ...' 
    : code;
})
</script>

<template>
  <div class="code-node">
    <div class="code-node-header" :style="{ backgroundColor: data.blockType.color || '#4b5563' }">
      <div class="header-content">
        <span class="node-label">{{ data.label }}</span>
        <span class="node-id" :title="id">#{{ shortId }}</span>
      </div>
    </div>
    
    <!-- 端口双列布局 -->
    <div class="ports-container">
      <!-- 左侧输入端口 -->
      <div class="port-column input-ports">
        <div v-for="input in data.inputs" :key="input.name" class="port-container">
          <Handle :id="input.name" type="target" :position="Position.Left"
            :style="{ height: '16px', width: '6px', backgroundColor: getInputColor(input.type, input.required) }"
            :isValidConnection="(connection: Connection) => isValidConnection(connection)" />
          <div class="port-label">{{ input.label || input.name }}</div>
        </div>
      </div>
      
      <!-- 右侧输出端口 -->
      <div class="port-column output-ports">
        <div v-for="output in data.outputs" :key="output.name" class="port-container output-port">
          <div class="port-label">{{ output.label || output.name }}</div>
          <Handle :id="output.name" type="source" :position="Position.Right"
            :style="{ height: '16px', width: '6px', backgroundColor: getOutputColor(output.type) }"
            :is-valid-connection="(connection: Connection) => isValidConnection(connection)" />
        </div>
      </div>
    </div>
    
    <!-- 代码预览区 -->
    <div class="code-node-body">
      <div class="code-preview-header">
        <NIcon size="16" class="code-icon">
          <CodeOutline />
        </NIcon>
        <span class="code-label">代码</span>
      </div>
      <div class="code-preview">
        <pre class="code-preview-content">{{ codePreview }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.code-node {
  background: linear-gradient(to bottom, #111827, #1f2937);
  border-radius: 6px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  max-width: 300px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f9fafb;
}

.code-node-header {
  padding: 10px 14px;
  font-weight: 500;
  color: #f9fafb;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  color: rgba(255, 255, 255, 0.6);
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px 5px;
  border-radius: 4px;
  margin-left: 6px;
  font-family: monospace;
  cursor: default;
  flex-shrink: 0;
}

.code-node-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.code-preview-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.code-icon {
  color: #60a5fa;
}

.code-label {
  font-size: 12px;
  color: #d1d5db;
  font-weight: 500;
}

.code-preview {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  padding: 8px;
  overflow: hidden;
}

.code-preview-content {
  margin: 0;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  color: #9ca3af;
  line-height: 1.4;
}

.ports-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 6px 0;
  background-color: rgba(0, 0, 0, 0.1);
}

.port-column {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.port-container {
  display: flex;
  align-items: center;
  position: relative;
  height: 28px;
}

.output-port {
  justify-content: flex-end;
}

.port-label {
  font-size: 12px;
  color: #d1d5db;
  margin: 0 10px;
}
</style>
