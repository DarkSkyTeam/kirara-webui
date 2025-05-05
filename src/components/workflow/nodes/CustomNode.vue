<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position, useVueFlow, type Connection } from '@vue-flow/core'
import { getTypeColor } from '@/utils/node-colors'

const props = defineProps(['id', 'data', 'isValidConnection'])
const { getHandleConnections } = useVueFlow()

const shortId = computed(() => {
  if (!props.id) return ''
  if (props.id.length > 8) {
    return props.id.slice(-6)
  }
  return props.id
})

const getInputColor = (type: string, required: boolean) => {
  return getTypeColor(type, required).color_on
}

const getOutputColor = (type: string) => {
  return getTypeColor(type).color_on
}

const isValidConnection = (connection: Connection) => {
  // one input can only have one connection
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
</script>

<template>
  <div class="custom-node">
    <div class="custom-node-header" :style="{ backgroundColor: data.blockType.color || '#f0f0f0' }">
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
          <Handle
            :id="input.name"
            type="target"
            :position="Position.Left"
            :style="{
              height: '16px',
              width: '6px',
              backgroundColor: getInputColor(input.type, input.required)
            }"
            :isValidConnection="(connection: Connection) => isValidConnection(connection)"
          />
          <div class="port-label">{{ input.label || input.name }}</div>
        </div>
      </div>

      <!-- 右侧输出端口 -->
      <div class="port-column output-ports">
        <div v-for="output in data.outputs" :key="output.name" class="port-container output-port">
          <div class="port-label">{{ output.label || output.name }}</div>
          <Handle
            :id="output.name"
            type="source"
            :position="Position.Right"
            :style="{ height: '16px', width: '6px', backgroundColor: getOutputColor(output.type) }"
            :is-valid-connection="(connection: Connection) => isValidConnection(connection)"
          />
        </div>
      </div>
    </div>
    <div class="custom-node-body">
      <div
        v-if="data.blockType.configs && data.blockType.configs.length > 0"
        class="config-preview"
      >
        <div
          v-for="config in data.blockType.configs"
          :key="config.name"
          class="config-preview-item"
        >
          <div class="config-name">{{ config.label || config.name }}</div>
          <div class="config-value">
            <!-- 布尔类型配置预览 -->
            <template v-if="config.type === 'bool'">
              <span
                class="config-badge"
                :class="data.config?.[config.name] ? 'config-badge-true' : 'config-badge-false'"
              >
                {{ data.config?.[config.name] ? '是' : '否' }}
              </span>
            </template>

            <!-- 字符串类型配置预览 -->
            <template v-else-if="config.type === 'str'">
              <span class="config-value-text" :title="data.config?.[config.name] || '未设置'">
                {{ data.config?.[config.name] || '未设置' }}
              </span>
            </template>

            <!-- 数组类型配置预览 -->
            <template v-else-if="config.type.startsWith('List[') && config.type.endsWith(']')">
              <span class="config-value-text" :title="data.config?.[config.name] || '未设置'">
                {{ data.config?.[config.name]?.join(',') || '未设置' }}
              </span>
            </template>

            <!-- 数字类型配置预览 -->
            <template v-else-if="config.type === 'int' || config.type === 'float'">
              <span class="config-value-number">
                {{ data.config?.[config.name] ?? config.default ?? 0 }}
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-node {
  background: linear-gradient(to bottom, #f8f9fa, #ffffff);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-width: 200px;
  max-width: 300px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border: 1px solid rgba(0, 0, 0, 0.06);
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
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.config-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 6px 8px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.02);
  transition: background-color 0.2s;
}

.config-preview-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.config-name {
  color: #555;
  font-weight: 500;
  flex-shrink: 0;
  width: 45%;
}

.config-value {
  flex-grow: 1;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.config-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.config-badge-true {
  background-color: rgba(24, 144, 255, 0.1);
  color: #1890ff;
  border: none;
}

.config-badge-false {
  background-color: rgba(0, 0, 0, 0.04);
  color: #999;
  border: none;
}

.config-value-text {
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  display: inline-block;
  font-weight: 500;
}

.config-value-number {
  color: #0369a1;
  font-family: monospace;
  font-weight: 500;
}

.ports-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 6px 0;
  background-color: rgba(0, 0, 0, 0.01);
}

.port-section {
  display: flex;
  flex-direction: column;
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
  color: #555;
  margin: 0 10px;
}
</style>
