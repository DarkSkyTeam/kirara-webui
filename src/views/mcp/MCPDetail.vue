<template>
    <div class="mcp-detail-container">
        <n-card class="main-card" :bordered="false">
            <!-- 顶部导航和标题 -->
            <div class="top-actions">
                <div class="back-button">
                    <n-button quaternary @click="goBack">
                        <template #icon>
                            <n-icon><arrow-back-outline /></n-icon>
                        </template>
                        返回服务器列表
                    </n-button>
                </div>
                <div class="server-title">
                    <n-icon size="24" :color="getStateColor(serverInfo?.connection_state || 'disconnected')">
                        <component
                            :is="serverInfo?.connection_type === 'stdio' ? TerminalOutline : GlobeOutline" />
                    </n-icon>
                    <span>{{ serverInfo?.id }}</span>
                    <n-tag size="small" :type="getStateType(serverInfo?.connection_state || 'disconnected')">
                        {{ formatConnectionState(serverInfo?.connection_state || 'disconnected') }}
                    </n-tag>
                </div>
                <div class="top-right-actions">
                    <n-space>
                        <n-button 
                            :type="serverInfo?.connection_state === 'connected' ? 'warning' : 'success'"
                            @click="serverInfo?.connection_state === 'connected' ? stopServer() : startServer()"
                            :loading="isConnecting || isDisconnecting"
                            :disabled="['connecting', 'disconnecting'].includes(serverInfo?.connection_state || '')">
                            <template #icon>
                                <n-icon>
                                    <component :is="serverInfo?.connection_state === 'connected' ? StopOutline : PlayOutline" />
                                </n-icon>
                            </template>
                            {{ serverInfo?.connection_state === 'connected' ? '断开连接' : '连接服务器' }}
                        </n-button>
                        <n-button @click="refreshDetails" :loading="isLoading">
                            <template #icon>
                                <n-icon><refresh-outline /></n-icon>
                            </template>
                            刷新
                        </n-button>
                    </n-space>
                </div>
            </div>

            <!-- 服务器信息卡片 -->
            <n-grid cols="24" :x-gap="16" :y-gap="16" class="detail-grid" item-responsive responsive="screen">
                <!-- 基本信息卡片 -->
                <n-grid-item span="24 m:12">
                    <n-card title="基本信息" class="detail-card" :bordered="false">
                        <n-descriptions bordered :column="1" label-placement="left">
                            <n-descriptions-item label="服务器ID">
                                {{ serverInfo?.id }}
                            </n-descriptions-item>
                            <n-descriptions-item label="连接类型">
                                <n-tag :type="serverInfo?.connection_type === 'stdio' ? 'success' : 'info'">
                                    {{ serverInfo?.connection_type }}
                                </n-tag>
                            </n-descriptions-item>
                            <n-descriptions-item v-if="serverInfo?.connection_type === 'stdio'" label="命令">
                                <div class="code-container">
                                    <code>{{ serverInfo?.command }} {{ serverInfo?.args }}</code>
                                    <n-button text size="tiny" @click="copyCommand" class="copy-button">
                                        <template #icon>
                                            <n-icon><copy-outline /></n-icon>
                                        </template>
                                    </n-button>
                                </div>
                            </n-descriptions-item>
                            <n-descriptions-item v-if="serverInfo?.connection_type === 'sse'" label="URL">
                                <div class="code-container">
                                    <code>{{ serverInfo?.url }}</code>
                                    <n-button text size="tiny" @click="copyUrl" class="copy-button">
                                        <template #icon>
                                            <n-icon><copy-outline /></n-icon>
                                        </template>
                                    </n-button>
                                </div>
                            </n-descriptions-item>
                            <n-descriptions-item v-if="serverInfo?.description" label="描述">
                                {{ serverInfo?.description }}
                            </n-descriptions-item>
                        </n-descriptions>
                    </n-card>
                </n-grid-item>
                
                <!-- 环境变量或Headers卡片 -->
                <n-grid-item span="24 m:12">
                    <n-card :title="serverInfo?.connection_type === 'stdio' ? '环境变量' : 'Headers'" 
                        class="detail-card" :bordered="false">
                        <div v-if="!hasEnvOrHeaders" class="empty-box">
                            <n-empty :description="`未设置${serverInfo?.connection_type === 'stdio' ? '环境变量' : 'Headers'}`" size="small" />
                        </div>
                        <n-descriptions v-else bordered :column="1" label-placement="left">
                            <n-descriptions-item v-for="(value, key) in envOrHeaders" :key="key" :label="key">
                                {{ value }}
                            </n-descriptions-item>
                        </n-descriptions>
                    </n-card>
                </n-grid-item>
            </n-grid>

            <!-- 工具和资源标签页 -->
            <n-card class="tabs-card" :bordered="false">
                <n-tabs type="line" animated>
                    <!-- 工具标签页 -->
                    <n-tab-pane name="tools" tab="工具">
                        <div class="section-header">
                            <n-button size="small" @click="loadTools" :loading="loadingTools" :disabled="!isConnected">
                                <template #icon>
                                    <n-icon><refresh-outline /></n-icon>
                                </template>
                                刷新工具
                            </n-button>
                        </div>

                        <n-alert v-if="!isConnected" type="warning" :show-icon="true" class="section-alert">
                            请先连接到 MCP 服务器以查看可用的工具
                        </n-alert>

                        <div v-else-if="loadingTools" class="loading-container">
                            <n-spin size="medium" />
                            <p>加载工具中...</p>
                        </div>

                        <n-empty v-else-if="tools.length === 0" description="没有可用的工具" />

                        <div v-else class="tools-list">
                            <n-card v-for="tool in tools" :key="tool.name" class="tool-card" :bordered="false">
                                <div class="tool-header">
                                    <div class="tool-title">
                                        <n-icon size="20"><terminal-outline /></n-icon>
                                        <span>{{ tool.name }}</span>
                                    </div>
                                    <n-button size="small" @click="callTool(tool)" :disabled="!isConnected">
                                        <template #icon>
                                            <n-icon><play-outline /></n-icon>
                                        </template>
                                        执行工具
                                    </n-button>
                                </div>
                                <div class="tool-description">
                                    {{ tool.description || '没有描述' }}
                                </div>
                            </n-card>
                        </div>
                    </n-tab-pane>

                    <!-- 资源标签页 -->
                    <n-tab-pane name="resources" tab="资源">
                        <div class="section-header">
                            <n-button size="small" @click="loadResources" :loading="loadingResources" :disabled="!isConnected">
                                <template #icon>
                                    <n-icon><refresh-outline /></n-icon>
                                </template>
                                刷新资源
                            </n-button>
                        </div>

                        <n-alert v-if="!isConnected" type="warning" :show-icon="true" class="section-alert">
                            请先连接到 MCP 服务器以查看可用的资源
                        </n-alert>

                        <div v-else-if="loadingResources" class="loading-container">
                            <n-spin size="medium" />
                            <p>加载资源中...</p>
                        </div>

                        <n-empty v-else-if="resources.length === 0" description="没有可用的资源" />

                        <div v-else class="resources-list">
                            <n-card v-for="resource in resources" :key="resource.id" class="resource-card" :bordered="false">
                                <div class="resource-header">
                                    <div class="resource-title">
                                        <n-icon size="20"><book-outline /></n-icon>
                                        <span>{{ resource.id }}</span>
                                    </div>
                                    <n-button size="small" @click="viewResource(resource)" :disabled="!isConnected">
                                        <template #icon>
                                            <n-icon><eye-outline /></n-icon>
                                        </template>
                                        查看资源
                                    </n-button>
                                </div>
                                <div class="resource-description">
                                    {{ resource.description || '没有描述' }}
                                </div>
                            </n-card>
                        </div>
                    </n-tab-pane>

                    <!-- 提示标签页 -->
                    <n-tab-pane name="prompts" tab="提示">
                        <div class="section-header">
                            <n-button size="small" @click="loadPrompts" :loading="loadingPrompts" :disabled="!isConnected">
                                <template #icon>
                                    <n-icon><refresh-outline /></n-icon>
                                </template>
                                刷新提示
                            </n-button>
                        </div>

                        <n-alert v-if="!isConnected" type="warning" :show-icon="true" class="section-alert">
                            请先连接到 MCP 服务器以查看可用的提示
                        </n-alert>

                        <div v-else-if="loadingPrompts" class="loading-container">
                            <n-spin size="medium" />
                            <p>加载提示中...</p>
                        </div>

                        <n-empty v-else-if="prompts.length === 0" description="没有可用的提示" />

                        <div v-else class="prompts-list">
                            <n-card v-for="prompt in prompts" :key="prompt.id" class="prompt-card" :bordered="false">
                                <div class="prompt-header">
                                    <div class="prompt-title">
                                        <n-icon size="20"><chatbubble-outline /></n-icon>
                                        <span>{{ prompt.id }}</span>
                                    </div>
                                    <n-button size="small" @click="samplePrompt(prompt)" :disabled="!isConnected">
                                        <template #icon>
                                            <n-icon><play-outline /></n-icon>
                                        </template>
                                        采样提示
                                    </n-button>
                                </div>
                                <div class="prompt-description">
                                    {{ prompt.description || '没有描述' }}
                                </div>
                            </n-card>
                        </div>
                    </n-tab-pane>
                </n-tabs>
            </n-card>
        </n-card>

        <!-- 工具调用模态框 -->
        <n-modal v-model:show="showToolModal" class="tool-modal" preset="card" title="执行工具" :style="{ width: '650px' }">
            <div v-if="selectedTool">
                <div class="modal-description">
                    {{ selectedTool.description || '没有描述' }}
                </div>

                <n-form :model="toolForm" ref="toolFormRef" label-placement="left" label-width="100px" class="tool-form">
                    <n-form-item v-for="param in getToolParams(selectedTool)" :key="param.name" 
                        :label="param.name + (param.required ? ' *' : '')">
                        <n-input v-model:value="toolForm[param.name]" :placeholder="param.description || ''" />
                    </n-form-item>
                </n-form>

                <div class="tool-response" v-if="toolResponse">
                    <n-divider>工具响应</n-divider>
                    <pre>{{ JSON.stringify(toolResponse, null, 2) }}</pre>
                </div>
            </div>
            <template #footer>
                <n-space justify="end">
                    <n-button @click="showToolModal = false">关闭</n-button>
                    <n-button type="primary" :loading="callingTool" @click="executeToolCall">
                        执行
                    </n-button>
                </n-space>
            </template>
        </n-modal>
        
        <!-- 资源查看模态框 -->
        <n-modal v-model:show="showResourceModal" class="resource-modal" preset="card" title="资源内容" :style="{ width: '800px' }">
            <div v-if="resourceContent">
                <n-code :code="typeof resourceContent === 'string' ? resourceContent : JSON.stringify(resourceContent, null, 2)" 
                    language="json" show-line-numbers />
            </div>
            <template #footer>
                <n-space justify="end">
                    <n-button @click="showResourceModal = false">关闭</n-button>
                </n-space>
            </template>
        </n-modal>

        <!-- 采样提示模态框 -->
        <n-modal v-model:show="showPromptModal" class="prompt-modal" preset="card" title="采样提示" :style="{ width: '800px' }">
            <div v-if="selectedPrompt">
                <n-form :model="promptForm" ref="promptFormRef" label-placement="left" label-width="100px" class="prompt-form">
                    <n-form-item label="提示文本">
                        <n-input v-model:value="promptForm.text" type="textarea" :rows="6" placeholder="输入提示文本..." />
                    </n-form-item>
                    <n-form-item label="温度">
                        <n-slider v-model:value="promptForm.temperature" :min="0" :max="1" :step="0.05" />
                        <div class="slider-value">{{ promptForm.temperature }}</div>
                    </n-form-item>
                </n-form>

                <div class="prompt-response" v-if="promptResponse">
                    <n-divider>响应</n-divider>
                    <n-card :bordered="false" class="response-card">
                        {{ promptResponse }}
                    </n-card>
                </div>
            </div>
            <template #footer>
                <n-space justify="end">
                    <n-button @click="showPromptModal = false">关闭</n-button>
                    <n-button type="primary" :loading="samplingPrompt" @click="executeSampling">
                        开始采样
                    </n-button>
                </n-space>
            </template>
        </n-modal>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
    NButton, NCard, NInput, NSpace, NModal, NForm, NFormItem,
    NIcon, NGrid, NGridItem, NEmpty, NSpin, NTag, NDivider,
    useMessage, useDialog, NTabs, NTabPane, NAlert, NTimeline,
    NTimelineItem, NDescriptions, NDescriptionsItem, NCode,
    NSlider
} from 'naive-ui'
import {
    ArrowBackOutline, RefreshOutline, PencilOutline, PlayOutline, StopOutline,
    CopyOutline, TerminalOutline, GlobeOutline, BookOutline, OpenOutline,
    EyeOutline, ChatbubbleOutline, DownloadOutline
} from '@vicons/ionicons5'
import { http } from '@/utils/http'
import { useMCPViewModel } from './mcp.vm'
import type { MCPServer, MCPTool } from './mcp.vm'

// 路由和消息提示
const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()

// 从 MCP ViewModel 获取服务器操作方法
const {
    getServerById,
    startServer: startMCPServer,
    stopServer: stopMCPServer,
    fetchServerTools: fetchMCPServerTools,
    openEditModal: openMCPEditModal
} = useMCPViewModel()

// 服务器 ID 和基本信息
const serverId = ref(route.params.id as string)
const serverInfo = ref<MCPServer | null>(null)
const isLoading = ref(false)
const isConnecting = ref(false)
const isDisconnecting = ref(false)

// 连接日志
interface ConnectionLog {
    state: string
    timestamp: number
    message?: string
}
const connectionLogs = ref<ConnectionLog[]>([])

// 工具相关
const tools = ref<MCPTool[]>([])
const loadingTools = ref(false)
const showToolModal = ref(false)
const selectedTool = ref<MCPTool | null>(null)
const toolForm = reactive<Record<string, any>>({})
const toolResponse = ref<any>(null)
const callingTool = ref(false)

// 资源相关
interface MCPResource {
    id: string
    description?: string
}
const resources = ref<MCPResource[]>([])
const loadingResources = ref(false)
const showResourceModal = ref(false)
const selectedResource = ref<MCPResource | null>(null)
const resourceContent = ref<any>(null)

// 提示相关
interface MCPPrompt {
    id: string
    description?: string
}
const prompts = ref<MCPPrompt[]>([])
const loadingPrompts = ref(false)
const showPromptModal = ref(false)
const selectedPrompt = ref<MCPPrompt | null>(null)
const promptForm = reactive({
    text: '',
    temperature: 0.7
})
const promptResponse = ref<string>('')
const samplingPrompt = ref(false)

// 计算属性
const isConnected = computed(() => serverInfo.value?.connection_state === 'connected')

const envOrHeaders = computed(() => {
    if (!serverInfo.value) return {}
    return serverInfo.value.connection_type === 'stdio' 
        ? serverInfo.value.env || {}
        : serverInfo.value.headers || {}
})

const hasEnvOrHeaders = computed(() => {
    return Object.keys(envOrHeaders.value).length > 0
})

// 工具参数计算属性
const getToolParams = (tool: MCPTool) => {
    if (!tool.input_schema || typeof tool.input_schema !== 'object') return []
    
    // 假设 input_schema 是 JSON Schema 格式，从中提取属性作为参数
    const schema = tool.input_schema
    const params = []
    
    if (schema.properties) {
        for (const [name, prop] of Object.entries<any>(schema.properties)) {
            params.push({
                name,
                description: prop.description || '',
                required: schema.required?.includes(name) || false
            })
        }
    }
    
    return params
}

// 初始化加载
onMounted(async () => {
    await loadServerDetails()
    // 添加初始连接状态到日志
    if (serverInfo.value) {
        addConnectionLog(serverInfo.value.connection_state)
    }
})

// 加载服务器详情
const loadServerDetails = async () => {
    isLoading.value = true
    try {
        serverInfo.value = await getServerById(serverId.value)
        if (isConnected.value) {
            await loadTools()
            await loadResources()
            await loadPrompts()
        }
    } catch (error) {
        console.error('加载服务器详情失败:', error)
        message.error('加载服务器详情失败')
    } finally {
        isLoading.value = false
    }
}

// 刷新服务器详情
const refreshDetails = async () => {
    await loadServerDetails()
}

// 返回服务器列表
const goBack = () => {
    router.push({ name: 'mcp' })
}

// 启动服务器
const startServer = async () => {
    if (!serverInfo.value) return
    
    isConnecting.value = true
    try {
        await startMCPServer(serverId.value)
        // 刷新服务器状态
        serverInfo.value = await getServerById(serverId.value)
        message.success('服务器连接成功')
        addConnectionLog('connected', '服务器连接成功')
        
        // 加载工具和资源
        await loadTools()
        await loadResources()
        await loadPrompts()
    } catch (error: any) {
        console.error('连接服务器失败:', error)
        message.error('连接服务器失败: ' + (error.message || '未知错误'))
        addConnectionLog('error', '连接服务器失败: ' + (error.message || '未知错误'))
    } finally {
        isConnecting.value = false
    }
}

// 停止服务器
const stopServer = async () => {
    if (!serverInfo.value) return
    
    isDisconnecting.value = true
    try {
        await stopMCPServer(serverId.value)
        // 刷新服务器状态
        serverInfo.value = await getServerById(serverId.value)
        message.success('服务器已断开连接')
        addConnectionLog('disconnected', '服务器已断开连接')
    } catch (error: any) {
        console.error('断开服务器失败:', error)
        message.error('断开服务器失败: ' + (error.message || '未知错误'))
        addConnectionLog('error', '断开服务器失败: ' + (error.message || '未知错误'))
    } finally {
        isDisconnecting.value = false
    }
}

// 打开编辑模态框
const openEditModal = () => {
    if (serverInfo.value) {
        openMCPEditModal(serverInfo.value)
    }
}

// 加载工具列表
const loadTools = async () => {
    if (!isConnected.value) return
    
    loadingTools.value = true
    try {
        tools.value = await fetchMCPServerTools(serverId.value)
    } catch (error) {
        console.error('加载工具列表失败:', error)
        message.error('加载工具列表失败')
    } finally {
        loadingTools.value = false
    }
}

// 加载资源列表
const loadResources = async () => {
    if (!isConnected.value) return
    
    loadingResources.value = true
    try {
        const response = await http.get<MCPResource[]>(`/mcp/servers/${serverId.value}/resources`)
        resources.value = response || []
    } catch (error) {
        console.error('加载资源列表失败:', error)
        message.error('加载资源列表失败')
        resources.value = []
    } finally {
        loadingResources.value = false
    }
}

// 加载提示列表
const loadPrompts = async () => {
    if (!isConnected.value) return
    
    loadingPrompts.value = true
    try {
        const response = await http.get<MCPPrompt[]>(`/mcp/servers/${serverId.value}/prompts`)
        prompts.value = response || []
    } catch (error) {
        console.error('加载提示列表失败:', error)
        message.error('加载提示列表失败')
        prompts.value = []
    } finally {
        loadingPrompts.value = false
    }
}

// 调用工具
const callTool = (tool: MCPTool) => {
    selectedTool.value = tool
    // 重置表单和响应
    Object.keys(toolForm).forEach(key => delete toolForm[key])
    // 初始化表单字段
    const params = getToolParams(tool)
    if (params.length > 0) {
        params.forEach(param => {
            toolForm[param.name] = ''
        })
    }
    toolResponse.value = null
    showToolModal.value = true
}

// 执行工具调用
const executeToolCall = async () => {
    if (!selectedTool.value) return
    
    callingTool.value = true
    try {
        const response = await http.post<any>(`/mcp/servers/${serverId.value}/tools/call`, {
            toolName: selectedTool.value.name,
            params: toolForm
        })
        toolResponse.value = response
        message.success('工具执行成功')
    } catch (error: any) {
        console.error('工具执行失败:', error)
        message.error('工具执行失败: ' + (error.message || '未知错误'))
        toolResponse.value = { error: error.message || '未知错误' }
    } finally {
        callingTool.value = false
    }
}

// 查看资源
const viewResource = async (resource: MCPResource) => {
    selectedResource.value = resource
    resourceContent.value = null
    showResourceModal.value = true
    
    try {
        const response = await http.get<any>(`/mcp/servers/${serverId.value}/resources/${resource.id}`)
        resourceContent.value = response
    } catch (error) {
        console.error('加载资源内容失败:', error)
        message.error('加载资源内容失败')
        resourceContent.value = { error: '加载资源失败' }
    }
}

// 采样提示
const samplePrompt = (prompt: MCPPrompt) => {
    selectedPrompt.value = prompt
    promptForm.text = ''
    promptForm.temperature = 0.7
    promptResponse.value = ''
    showPromptModal.value = true
}

// 执行采样
const executeSampling = async () => {
    if (!selectedPrompt.value) return
    
    samplingPrompt.value = true
    try {
        const response = await http.post<{text: string}>(`/mcp/servers/${serverId.value}/prompts/sample`, {
            promptId: selectedPrompt.value.id,
            text: promptForm.text,
            temperature: promptForm.temperature
        })
        promptResponse.value = response.text || JSON.stringify(response)
    } catch (error: any) {
        console.error('提示采样失败:', error)
        message.error('提示采样失败: ' + (error.message || '未知错误'))
        promptResponse.value = '错误: ' + (error.message || '未知错误')
    } finally {
        samplingPrompt.value = false
    }
}

// 添加连接日志
const addConnectionLog = (state: string, message?: string) => {
    connectionLogs.value.unshift({
        state,
        timestamp: Date.now(),
        message
    })
}

// 复制命令到剪贴板
const copyCommand = () => {
    if (!serverInfo.value) return
    
    const command = `${serverInfo.value.command || ''} ${serverInfo.value.args || ''}`
    navigator.clipboard.writeText(command)
    message.success('命令已复制到剪贴板')
}

// 复制URL到剪贴板
const copyUrl = () => {
    if (!serverInfo.value || !serverInfo.value.url) return
    
    navigator.clipboard.writeText(serverInfo.value.url)
    message.success('URL已复制到剪贴板')
}

// 格式化连接状态
const formatConnectionState = (state: string) => {
    const stateMap: Record<string, string> = {
        'connected': '已连接',
        'connecting': '连接中',
        'disconnected': '已断开',
        'disconnecting': '断开中',
        'error': '错误'
    }
    return stateMap[state] || state
}

// 获取状态对应的类型
const getStateType = (state: string): "success" | "warning" | "error" | "info" | "default" | undefined => {
    const typeMap: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
        'connected': 'success',
        'connecting': 'info',
        'disconnected': 'warning',
        'disconnecting': 'warning',
        'error': 'error'
    }
    return typeMap[state] || 'default'
}

// 获取状态对应的颜色
const getStateColor = (state: string) => {
    const colorMap: Record<string, string> = {
        'connected': '#18a058',
        'connecting': '#2080f0',
        'disconnected': '#d03050',
        'disconnecting': '#f0a020',
        'error': '#d03050'
    }
    return colorMap[state] || '#d03050'
}

// 格式化时间
const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
}
</script>

<style scoped>
.mcp-detail-container {
    padding: 1.5rem;
    animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-card {
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    overflow: hidden;
}

.top-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.server-title {
    display: flex;
    align-items: center;
    font-size: 20px;
    font-weight: 600;
    gap: 12px;
}

.back-button {
    display: flex;
    align-items: center;
}

.top-right-actions {
    display: flex;
    gap: 8px;
}

.detail-grid {
    margin-bottom: 24px;
}

.detail-card {
    height: 100%;
    border-radius: 12px;
    transition: all 0.3s ease;
}

.detail-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.code-container {
    display: flex;
    align-items: center;
}

.code-container code {
    background-color: rgba(0, 0, 0, 0.04);
    padding: 4px 8px;
    border-radius: 6px;
    font-family: monospace;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
}

.copy-button {
    margin-left: 8px;
}

.tabs-card {
    border-radius: 12px;
    margin-top: 16px;
}

.section-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
}

.section-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.section-alert {
    margin-bottom: 16px;
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 0;
    gap: 16px;
}

.loading-container p {
    color: rgba(0, 0, 0, 0.45);
}

.tools-list, .resources-list, .prompts-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
}

.tool-card, .resource-card, .prompt-card {
    border-radius: 8px;
    transition: all 0.2s ease;
}

.tool-card:hover, .resource-card:hover, .prompt-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.tool-header, .resource-header, .prompt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.tool-title, .resource-title, .prompt-title {
    display: flex;
    align-items: center;
    font-weight: 600;
    gap: 8px;
}

.tool-description, .resource-description, .prompt-description {
    color: rgba(0, 0, 0, 0.65);
    font-size: 14px;
    margin-top: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.tool-modal, .resource-modal, .prompt-modal {
    width: 650px;
}

.modal-description {
    margin-bottom: 16px;
    color: rgba(0, 0, 0, 0.65);
}

.tool-form, .prompt-form {
    margin: 16px 0;
}

.tool-response, .prompt-response {
    margin-top: 16px;
}

.tool-response pre {
    background-color: rgba(0, 0, 0, 0.02);
    padding: 12px;
    border-radius: 8px;
    overflow: auto;
    font-family: monospace;
    font-size: 13px;
}

.response-card {
    background-color: rgba(0, 0, 0, 0.02);
    font-family: monospace;
    white-space: pre-wrap;
}

.slider-value {
    text-align: center;
    margin-top: 4px;
    color: rgba(0, 0, 0, 0.65);
}

.empty-box {
    padding: 20px 0;
    display: flex;
    justify-content: center;
}

@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .top-actions {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
    }
    
    .top-right-actions {
        width: 100%;
        justify-content: space-between;
    }
    
    .tools-list, .resources-list, .prompts-list {
        grid-template-columns: 1fr;
    }
    
    .tool-modal, .resource-modal, .prompt-modal {
        width: 90vw;
    }
}
</style> 