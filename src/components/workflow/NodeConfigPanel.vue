<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
    NCard,
    NForm,
    NFormItem,
    NInput,
    NButton,
    NSpace,
    NIcon,
    NSelect,
    NSwitch,
    NInputNumber,
    NEmpty,
    NTag,
    NTooltip,
    NCollapse,
    NCollapseItem,
    NText
} from 'naive-ui'
import { 
    CloseOutline, 
    AddOutline, 
    ArrowForwardOutline, 
    RemoveOutline, 
    SettingsOutline 
} from '@vicons/ionicons5'
import { useVueFlow } from '@vue-flow/core'
import type { Node, Edge } from '@vue-flow/core'
import type { BlockType } from '@/api/block'
import { getTypeColor } from '@/utils/node-colors'

const props = defineProps<{
    selectedNode: Node | null
    blockTypes: BlockType[]
}>()

const emit = defineEmits<{
    'close': []
}>()

const {
    updateNode,
    findNode,
    getConnectedEdges,
    addSelectedNodes,
    nodesSelectionActive,
    removeSelectedNodes,
    getSelectedNodes,
    setCenter,
    getViewport
} = useVueFlow()

// 节点配置表单
const formValue = ref<any>({})

// 监听选中节点变化，更新表单数据
watch(() => props.selectedNode, (node) => {
    if (node) {
        formValue.value = {
            id: node.id,
            ...node.data.config
        }
    } else {
        formValue.value = {}
    }
}, { immediate: true, deep: true })

// 应用配置更改
const applyNodeConfig = () => {
    if (!props.selectedNode) return

    const updatedData = {
        ...props.selectedNode.data,
        config: { ...props.selectedNode.data.config }
    }

    // 更新配置项
    if (props.selectedNode.data.blockType.configs) {
        props.selectedNode.data.blockType.configs.forEach((config: { name: string | number }) => {
            updatedData.config[config.name] = formValue.value[config.name]
        })
    }

    updateNode(props.selectedNode.id, { data: updatedData })
}

// 关闭配置面板
const closeNodeConfig = () => {
    emit('close')
}

// 获取配置项的值
const getConfigValue = (configName: string, defaultValue: any) => {
    if (formValue.value[configName] !== undefined) {
        return formValue.value[configName]
    }
    return defaultValue
}

// 更新配置项的值
const updateConfigValue = (configName: string, value: any) => {
    formValue.value[configName] = value
}

const isListType = (type: string) => {
    return type.startsWith('List[') && type.endsWith(']')
}

// 获取选择框选项
const getSelectOptions = (config: any) => {
    const options = (config.options || []).map((opt: { label: any; value: undefined; description: any }) => {
        // 如果选项是对象，包含label和value
        if (typeof opt === 'object' && opt.label && opt.value !== undefined) {
            return {
                label: opt.label,
                value: opt.value,
                description: opt.description
            }
        }
        // 如果选项是字符串
        return {
            label: opt,
            value: opt
        }
    })

    // 如果是可空的单选框，添加"不指定"选项
    if (!isListType(config.type) && !config.required) {
        options.unshift({
            label: '不指定',
            value: null
        })
    }

    return options
}

// 获取节点的输入连接
const inputConnections = computed(() => {
    if (!props.selectedNode) return []

    const edges = getConnectedEdges([props.selectedNode])

    return edges
        .filter(edge => edge.target === props.selectedNode?.id)
        .map(edge => {
            const sourceNode = findNode(edge.source)
            console.log(sourceNode)
            return {
                ...edge,
                handleLabel: sourceNode?.data.blockType.outputs.find((output: { name: string }) => output.name === edge.sourceHandle)?.label || edge.sourceHandle,
                label: sourceNode?.data?.label || edge.source
            }
        })
})

// 获取节点的输出连接
const outputConnections = computed(() => {
    if (!props.selectedNode) return []

    const edges = getConnectedEdges([props.selectedNode])
    return edges
        .filter(edge => edge.source === props.selectedNode?.id)
        .map(edge => {
            const targetNode = findNode(edge.target)
            return {
                ...edge,
                handleLabel: targetNode?.data.blockType.inputs.find((input: { name: string }) => input.name === edge.targetHandle)?.label || edge.targetHandle,
                label: targetNode?.data?.label || edge.target
            }
        })
})

// 跳转到连接的节点
const navigateToNode = (nodeId: string) => {
    const node = findNode(nodeId)
    removeSelectedNodes(getSelectedNodes.value)
    if (node) {
        addSelectedNodes([node])
        nodesSelectionActive.value = true
        const viewport = getViewport()
        const centerX = node.position.x
        const centerY = node.position.y
        setCenter(centerX, centerY, {
            zoom: viewport.zoom
        })
    }
}

// 根据连接点名称获取输入连接
function getInputConnectionsByHandle(handleName: string) {
    if (!props.selectedNode || !inputConnections.value) return [];
    return inputConnections.value.filter(conn => conn.targetHandle === handleName);
}

// 根据连接点名称获取输出连接
function getOutputConnectionsByHandle(handleName: string) {
    if (!props.selectedNode || !outputConnections.value) return [];
    return outputConnections.value.filter(conn => conn.sourceHandle === handleName);
}

// 根据类型获取颜色样式
function getTypeColorStyle(type: string) {
    const typeColor = getTypeColor(type);
    return {
        borderLeftColor: typeColor.color_on,
        borderLeftWidth: '3px',
        borderLeftStyle: 'solid'
    };
}
</script>

<template>
    <NCard title="节点配置" size="small" class="node-config-panel" :bordered="false">
        <template #header>
            <div class="panel-header">
                <NIcon size="18" class="header-icon">
                    <SettingsOutline />
                </NIcon>
                <span class="header-title">节点配置</span>
            </div>
        </template>

        <template #header-extra>
            <div class="header-actions">
                <NButton size="small" @click="closeNodeConfig" class="cancel-button">
                    取消
                </NButton>
                <NButton size="small" type="primary" @click="applyNodeConfig" class="apply-button" 
                    :disabled="!selectedNode">
                    应用
                </NButton>
                <NButton quaternary circle size="small" @click="closeNodeConfig" class="close-button">
                    <template #icon>
                        <NIcon>
                            <CloseOutline />
                        </NIcon>
                    </template>
                </NButton>
            </div>
        </template>

        <div v-if="selectedNode" class="config-content">
            <div class="scrollable-content">
                <!-- 基本信息 -->
                <div class="node-id-section">
                    <div class="node-id-label">节点 ID:</div>
                    <NText code class="node-id-value">{{ formValue.id }}</NText>
                </div>

                <NCollapse arrow-placement="right" default-expanded-names="3">
                    <!-- 输入连接折叠面板 -->
                    <NCollapseItem title="输入连接" name="1">
                        <div v-if="selectedNode.data.blockType.inputs && selectedNode.data.blockType.inputs.length > 0">
                            <div v-for="input in selectedNode.data.blockType.inputs" :key="input.name"
                                class="connection-group">
                                <div class="connection-point-header" :style="getTypeColorStyle(input.type)">
                                    <span class="connection-point-name">{{ input.label || input.name }}</span>
                                    <span class="connection-type-badge">{{ input.type }}</span>
                                    <span v-if="input.required" class="required-badge">必需</span>
                                </div>

                                <div v-if="getInputConnectionsByHandle(input.name).length > 0" class="connection-list">
                                    <div v-for="conn in getInputConnectionsByHandle(input.name)" :key="conn.id"
                                        class="connection-item">
                                        <div class="connection-info">
                                            <NIcon class="connection-icon" size="16">
                                                <AddOutline />
                                            </NIcon>
                                            <div class="connection-details">
                                                <div class="connection-source">
                                                    <span class="connection-label">{{ conn.label }}</span>
                                                    <span class="connection-handle">{{ conn.handleLabel || '-' }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <NButton quaternary circle size="small" @click="navigateToNode(conn.source)"
                                            class="navigate-button">
                                            <template #icon>
                                                <NIcon>
                                                    <ArrowForwardOutline />
                                                </NIcon>
                                            </template>
                                        </NButton>
                                    </div>
                                </div>
                                <div v-else class="no-connections">
                                    <NIcon class="empty-icon" size="16">
                                        <RemoveOutline />
                                    </NIcon>
                                    <span>未连接</span>
                                </div>
                            </div>
                        </div>
                        <div v-else class="no-connection-points">该节点没有输入连接点</div>
                    </NCollapseItem>

                    <!-- 输出连接折叠面板 -->
                    <NCollapseItem title="输出连接" name="2">
                        <div
                            v-if="selectedNode.data.blockType.outputs && selectedNode.data.blockType.outputs.length > 0">
                            <div v-for="output in selectedNode.data.blockType.outputs" :key="output.name"
                                class="connection-group">
                                <div class="connection-point-header" :style="getTypeColorStyle(output.type)">
                                    <span class="connection-point-name">{{ output.label || output.name }}</span>
                                    <span class="connection-type-badge">{{ output.type }}</span>
                                </div>

                                <div v-if="getOutputConnectionsByHandle(output.name).length > 0"
                                    class="connection-list">
                                    <div v-for="conn in getOutputConnectionsByHandle(output.name)" :key="conn.id"
                                        class="connection-item">
                                        <div class="connection-info">
                                            <NIcon class="connection-icon" size="16">
                                                <AddOutline />
                                            </NIcon>
                                            <div class="connection-details">
                                                <div class="connection-target">
                                                    <span class="connection-handle">{{ conn.handleLabel || '-' }}</span>
                                                    <span class="connection-label">{{ conn.label }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <NButton quaternary circle size="small" @click="navigateToNode(conn.target)"
                                            class="navigate-button">
                                            <template #icon>
                                                <NIcon>
                                                    <ArrowForwardOutline />
                                                </NIcon>
                                            </template>
                                        </NButton>
                                    </div>
                                </div>
                                <div v-else class="no-connections">
                                    <NIcon class="empty-icon" size="16">
                                        <RemoveOutline />
                                    </NIcon>
                                    <span>未连接</span>
                                </div>
                            </div>
                        </div>
                        <div v-else class="no-connection-points">该节点没有输出连接点</div>
                    </NCollapseItem>

                    <!-- 参数配置折叠面板 -->
                    <NCollapseItem
                        v-if="selectedNode.data.blockType.configs && selectedNode.data.blockType.configs.length > 0"
                        title="参数配置" name="3">
                        <div v-for="config in selectedNode.data.blockType.configs" :key="config.name"
                            class="config-form-item">
                            <div class="config-label">{{ config.label || config.name }}</div>
                            <div v-if="config.description" class="config-description">{{ config.description }}</div>

                            <!-- 字符串类型配置 -->
                            <NInput v-if="config.type === 'str' && !config.has_options"
                                v-model:value="formValue[config.name]"
                                :placeholder="`请输入${config.label || config.name}`" type="textarea"
                                class="custom-input" />

                            <!-- 单选类型配置 -->
                            <NSelect v-else-if="config.has_options && !isListType(config.type)"
                                v-model:value="formValue[config.name]" :options="getSelectOptions(config)"
                                :placeholder="`请选择${config.label || config.name}`" class="custom-select" />

                            <!-- 多选类型配置 List[actual_type]-->
                            <NSelect v-else-if="config.has_options && isListType(config.type)"
                                v-model:value="formValue[config.name]" :options="getSelectOptions(config)"
                                :placeholder="`请选择${config.label || config.name}`" multiple class="custom-select" />

                            <!-- 布尔类型配置 -->
                            <NSwitch v-else-if="config.type === 'bool'" v-model:value="formValue[config.name]"
                                class="custom-switch" />

                            <!-- 数字类型配置 -->
                            <NInputNumber v-else-if="config.type === 'int' || config.type === 'float'"
                                v-model:value="formValue[config.name]" :precision="config.type === 'float' ? 2 : 0"
                                :placeholder="`请输入${config.label || config.name}`" class="custom-input-number" />
                        </div>
                    </NCollapseItem>
                </NCollapse>
            </div>
        </div>

        <NEmpty v-else description="请选择一个节点进行配置" class="empty-config">
            <template #icon>
                <NIcon size="48" class="empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="8" cy="18" r="4"></circle>
                        <path d="M12 18h8"></path>
                        <path d="M12 12h8"></path>
                        <path d="M12 6h8"></path>
                        <circle cx="4" cy="12" r="1"></circle>
                        <circle cx="4" cy="6" r="1"></circle>
                    </svg>
                </NIcon>
            </template>
        </NEmpty>
    </NCard>
</template>

<style scoped>
.node-config-panel {
    width: 500px;
    background-color: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 0;
    transition: all 0.3s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
}

.header-icon {
    color: #1890ff;
}

.header-title {
    font-weight: 600;
    font-size: 16px;
    color: #1f2937;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.close-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: #ff4d4f;
}

.config-content {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.scrollable-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 4px 16px 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: calc(100vh - 120px);
}

.node-id-section {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background-color: #f9fafb;
    border-radius: 8px;
    margin-bottom: 8px;
}

.node-id-label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
}

.node-id-value {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 13px;
    color: #1890ff;
    background-color: rgba(24, 144, 255, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
}

.config-form-item {
    margin-bottom: 16px;
}

.config-form-item:last-child {
    margin-bottom: 0;
}

.config-label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
}

.config-description {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 8px;
    line-height: 1.4;
}

.custom-input,
.custom-select,
.custom-input-number {
    border-radius: 6px;
    transition: all 0.2s;
    width: 100%;
    margin-top: 4px;
}

.custom-input:hover,
.custom-select:hover,
.custom-input-number:hover {
    border-color: #1890ff;
}

.custom-switch {
    transition: all 0.2s;
    margin-top: 4px;
}

.cancel-button {
    border-radius: 6px;
}

.apply-button {
    border-radius: 6px;
    background-color: #1890ff;
    border-color: #1890ff;
}

.apply-button:hover {
    background-color: #40a9ff;
    border-color: #40a9ff;
}

.empty-config {
    padding: 20px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #999;
    height: 100%;
}

.empty-icon {
    color: #d9d9d9;
    margin-bottom: 12px;
}

.connection-group {
    margin-bottom: 12px;
    background-color: #fff;
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
}

.connection-group:last-child {
    margin-bottom: 0;
}

.connection-point-header {
    padding: 8px 12px;
    background-color: #f9fafb;
    display: flex;
    align-items: center;
    gap: 8px;
}

.connection-point-name {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
}

.connection-type-badge {
    font-size: 11px;
    color: #6b7280;
    background-color: #f3f4f6;
    padding: 1px 6px;
    border-radius: 10px;
}

.required-badge {
    font-size: 11px;
    color: #ef4444;
    background-color: rgba(239, 68, 68, 0.1);
    padding: 1px 6px;
    border-radius: 10px;
    margin-left: auto;
}

.connection-list {
    padding: 4px 0;
}

.connection-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid #f3f4f6;
}

.connection-item:last-child {
    border-bottom: none;
}

.connection-item:hover {
    background-color: #f9fafb;
}

.connection-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
}

.connection-icon {
    color: #9ca3af;
    flex-shrink: 0;
}

.connection-details {
    flex: 1;
    min-width: 0;
}

.connection-source,
.connection-target {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}

.connection-label {
    font-size: 13px;
    color: #374151;
    font-weight: 500;
}

.connection-handle {
    font-size: 12px;
    color: #6b7280;
    background-color: #f3f4f6;
    padding: 1px 6px;
    border-radius: 4px;
}

.navigate-button {
    color: #6b7280;
    transition: all 0.2s;
}

.navigate-button:hover {
    color: #1890ff;
    background-color: rgba(24, 144, 255, 0.1);
}

.no-connections {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    color: #9ca3af;
    font-size: 12px;
    font-style: italic;
}

.empty-icon {
    color: #d1d5db;
}

.no-connection-points {
    font-size: 13px;
    color: #6b7280;
    padding: 12px;
    text-align: center;
    background-color: #f9fafb;
    border-radius: 6px;
}
</style>