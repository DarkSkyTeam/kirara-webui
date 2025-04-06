<template>
    <div class="mcp-container">
        <n-card title="MCP 服务器管理" class="main-card">
            <n-space vertical>
                管理和配置你的 MCP (Model Context Protocol) 服务器

                <!-- 统计卡片 -->
                <n-grid :cols="5" :x-gap="16">
                    <n-grid-item>
                        <n-card title="总服务器" class="stat-card">
                            <div class="stat-value">{{ formattedStatistics?.[0]?.value || 0 }}</div>
                        </n-card>
                    </n-grid-item>
                    <n-grid-item>
                        <n-card title="运行中服务器" class="stat-card">
                            <div class="stat-value success">{{ formattedStatistics?.[3]?.value || 0 }}</div>
                        </n-card>
                    </n-grid-item>
                    <n-grid-item>
                        <n-card title="工具总数" class="stat-card">
                            <div class="stat-value info">{{ formattedStatistics?.[6]?.value || 0 }}</div>
                        </n-card>
                    </n-grid-item>
                </n-grid>

                <!-- 工具栏和过滤器 -->
                <div class="mcp-toolbar">
                    <n-space>
                        <n-button type="primary" @click="openCreateModal">
                            <template #icon>
                                <n-icon>
                                    <add-outline />
                                </n-icon>
                            </template>
                            添加服务器
                        </n-button>
                        <n-button @click="refreshData">
                            <template #icon>
                                <n-icon>
                                    <refresh-outline />
                                </n-icon>
                            </template>
                            刷新
                        </n-button>
                    </n-space>

                    <n-space>
                        <n-input v-model:value="filterParams.query" placeholder="搜索服务器名称或命令" clearable
                            style="width: 220px;" @keydown.enter="applyFilter">
                            <template #prefix>
                                <n-icon>
                                    <search-outline />
                                </n-icon>
                            </template>
                        </n-input>
                        <n-select v-model:value="filterParams.connectionType" placeholder="连接类型" clearable
                            :options="filterOptions.connectionType" style="width: 120px;" />
                        <n-select v-model:value="filterParams.status" placeholder="状态" clearable
                            :options="filterOptions.status" style="width: 120px;" />
                        <n-button @click="resetFilter">
                            <template #icon>
                                <n-icon>
                                    <close-outline />
                                </n-icon>
                            </template>
                            重置
                        </n-button>
                        <n-button type="primary" @click="applyFilter">
                            <template #icon>
                                <n-icon>
                                    <search-outline />
                                </n-icon>
                            </template>
                            搜索
                        </n-button>
                    </n-space>
                </div>

                <!-- 服务器卡片列表 -->
                <div class="mcp-server-list">
                    <n-card title="服务器列表" class="server-list-card">
                        <template #header-extra>
                            <n-space>
                                <n-text>总计: {{ totalServers }} 个服务器</n-text>
                            </n-space>
                        </template>

                        <n-spin :show="isLoading">
                            <div v-if="servers.length === 0" class="empty-state">
                                <n-empty description="暂无服务器" />
                            </div>
                            <div v-else class="server-card-grid">
                                <n-card v-for="server in servers" :key="server.id" class="server-card" :bordered="false">
                                    <template #header>
                                        <div class="server-card-header">
                                            <div class="server-card-title">
                                                <n-space align="center">
                                                    <n-icon size="20" :color="getStateColor(server.connection_state)">
                                                        <component :is="server.connection_type === 'stdio' ? TerminalOutline : GlobeOutline" />
                                                    </n-icon>
                                                    <span>{{ server.id }}</span>
                                                    <n-tag size="small" :type="getStateType(server.connection_state)">
                                                        {{ formatConnectionState(server.connection_state) }}
                                                    </n-tag>
                                                </n-space>
                                            </div>
                                            <div class="server-card-actions">
                                                <n-space>
                                                    <n-tooltip trigger="hover">
                                                        <template #trigger>
                                                            <n-button size="small" quaternary circle 
                                                                @click="viewServerDetail(server.id)">
                                                                <template #icon>
                                                                    <n-icon><open-outline /></n-icon>
                                                                </template>
                                                            </n-button>
                                                        </template>
                                                        查看详情
                                                    </n-tooltip>
                                                    <n-tooltip trigger="hover">
                                                        <template #trigger>
                                                            <n-button size="small" quaternary circle 
                                                                @click="openEditModal(server)">
                                                                <template #icon>
                                                                    <n-icon><pencil-outline /></n-icon>
                                                                </template>
                                                            </n-button>
                                                        </template>
                                                        编辑
                                                    </n-tooltip>
                                                    <n-tooltip trigger="hover">
                                                        <template #trigger>
                                                            <n-button size="small" quaternary circle 
                                                                :type="server.connection_state === 'connected' ? 'warning' : 'success'"
                                                                @click="server.connection_state === 'connected' ? stopServer(server.id) : startServer(server.id)"
                                                                :disabled="['connecting', 'disconnecting'].includes(server.connection_state)">
                                                                <template #icon>
                                                                    <n-icon>
                                                                        <component :is="server.connection_state === 'connected' ? StopOutline : PlayOutline" />
                                                                    </n-icon>
                                                                </template>
                                                            </n-button>
                                                        </template>
                                                        {{ server.connection_state === 'connected' ? '断开' : '连接' }}
                                                    </n-tooltip>
                                                    <n-popconfirm @positive-click="deleteServer(server.id)">
                                                        <template #trigger>
                                                            <n-button size="small" quaternary circle type="error">
                                                                <template #icon>
                                                                    <n-icon><trash-outline /></n-icon>
                                                                </template>
                                                            </n-button>
                                                        </template>
                                                        确定要删除这个MCP服务器吗？
                                                    </n-popconfirm>
                                                </n-space>
                                            </div>
                                        </div>
                                    </template>

                                    <div class="server-card-content">
                                        <div class="server-info">
                                            <div class="server-info-item">
                                                <div class="info-label">连接类型:</div>
                                                <div class="info-value">
                                                    <n-tag size="small" :type="server.connection_type === 'stdio' ? 'success' : 'info'">
                                                        {{  server.connection_type }}
                                                    </n-tag>
                                                </div>
                                            </div>
                                            <div class="server-info-item">
                                                <div class="info-label">命令:</div>
                                                <div class="info-value">
                                                    <code>{{ server.command || '' }} {{ server.args }}</code>
                                                    <n-button text size="tiny" @click="copyCommand(server)">
                                                        <template #icon>
                                                            <n-icon><copy-outline /></n-icon>
                                                        </template>
                                                    </n-button>
                                                </div>
                                            </div>
                                            <div class="server-info-item" v-if="server.description">
                                                <div class="info-label">描述:</div>
                                                <div class="info-value">{{ server.description }}</div>
                                            </div>
                                            <div class="server-info-item" v-if="server.url">
                                                <div class="info-label">URL:</div>
                                                <div class="info-value">
                                                    <code>{{ server.url }}</code>
                                                    <n-button text size="tiny" @click="copyUrl(server)">
                                                        <template #icon>
                                                            <n-icon><copy-outline /></n-icon>
                                                        </template>
                                                    </n-button>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 工具列表 -->
                                        <div class="server-tools" v-if="server.connection_state === 'connected'">
                                            <n-divider>工具列表</n-divider>
                                            
                                            <div v-if="serverToolsMap[server.id]?.length" class="tools-list">
                                                <n-list hoverable clickable>
                                                    <n-list-item v-for="tool in serverToolsMap[server.id]" :key="tool.name">
                                                        <n-thing :title="tool.name" :description="tool.description">
                                                            <template #avatar>
                                                                <n-icon size="24" color="#2080f0">
                                                                    <terminal-outline />
                                                                </n-icon>
                                                            </template>
                                                            <template #header-extra>
                                                                <n-tag size="small" type="info">工具</n-tag>
                                                            </template>
                                                        </n-thing>
                                                    </n-list-item>
                                                </n-list>
                                            </div>
                                            <div v-else-if="serverToolsMap[server.id]?.length === 0" class="empty-tools">
                                                <n-empty size="small" description="暂无工具" />
                                            </div>
                                            <div v-else class="load-tools">
                                                <n-button size="small" @click="loadServerTools(server.id)">
                                                    加载工具列表
                                                </n-button>
                                            </div>
                                            
                                        </div>
                                    </div>
                                </n-card>
                            </div>

                            <!-- 分页 -->
                            <n-pagination v-if="totalPages > 1" class="pagination"
                                v-model:page="currentPage"
                                v-model:page-size="pageSize"
                                :page-count="totalPages"
                                :page-sizes="[10, 20, 50]"
                                show-size-picker
                                @update:page="handlePageChange"
                                @update:page-size="handlePageSizeChange" />
                        </n-spin>
                    </n-card>
                </div>
            </n-space>
        </n-card>

        <!-- 添加/编辑服务器模态框 -->
        <n-modal v-model:show="showServerModal" :title="modalMode === 'create' ? '添加新服务器' : '编辑服务器'" preset="card"
            style="width: 600px;" @after-leave="resetForm">
            <n-form ref="formRef" :model="formModel" label-placement="left" label-width="120px"
                require-mark-placement="right-hanging">
                <n-form-item label="服务器ID" path="id" required>
                    <n-input v-model:value="formModel.id" placeholder="例如：api-mcp, local-server"
                        :disabled="modalMode === 'edit'" />
                    <template #feedback>
                        <n-text depth="3">服务器唯一标识符，创建后不可修改</n-text>
                    </template>
                </n-form-item>

                <n-form-item label="连接类型" path="connection_type" required>
                    <n-space>
                        <n-button :type="formModel.connection_type === 'stdio' ? 'primary' : 'default'"
                            @click="formModel.connection_type = 'stdio'" style="width: 120px; text-align: center">
                            <template #icon>
                                <n-icon><terminal-outline /></n-icon>
                            </template>
                            {{ formModel.connection_type }}
                        </n-button>
                        <n-button :type="formModel.connection_type === 'sse' ? 'primary' : 'default'"
                            @click="formModel.connection_type = 'sse'" style="width: 120px; text-align: center">
                            <template #icon>
                                <n-icon><globe-outline /></n-icon>
                            </template>
                            {{ formModel.connection_type }}
                        </n-button>
                    </n-space>
                </n-form-item>

                <n-form-item label="命令" path="command" required>
                    <n-input v-model:value="formModel.command" placeholder="例如：python, node" />
                    <template #feedback>
                        <n-text depth="3">要执行的命令，如 python 或 node</n-text>
                    </template>
                </n-form-item>

                <n-form-item label="参数" path="args" required>
                    <n-input v-model:value="formModel.args" placeholder="例如：path/to/script.py" />
                    <template #feedback>
                        <n-text depth="3">命令的参数，如脚本路径 path/to/script.py</n-text>
                    </template>
                </n-form-item>

                <n-form-item label="描述" path="description">
                    <n-input v-model:value="formModel.description" type="textarea" placeholder="服务器的描述信息" />
                </n-form-item>
            </n-form>

            <template #footer>
                <n-space justify="end">
                    <n-button @click="showServerModal = false">取消</n-button>
                    <n-button type="primary" :loading="isLoading" @click="saveServer">保存</n-button>
                </n-space>
            </template>
        </n-modal>
    </div>
</template>

<script setup lang="ts">
import { ref, h, computed, onMounted, reactive } from 'vue'
import {
    NButton, NCard, NInput, NSelect, NSpace, NModal, NForm, NFormItem,
    NIcon, NGrid, NGridItem, NEmpty, NSpin, NText, NTag, NDivider,
    NPopconfirm, useMessage, useDialog, NBadge, NTooltip, NPagination,
    NList, NListItem, NThing
} from 'naive-ui'
import {
    AddOutline, RefreshOutline, SearchOutline, CloseOutline,
    TrashOutline, PencilOutline, PlayOutline, StopOutline,
    CopyOutline, TerminalOutline, GlobeOutline,
    BookOutline, OpenOutline, InformationCircleOutline
} from '@vicons/ionicons5'
import IconMCP from '@/components/icons/IconMCP.vue'
import { useMCPViewModel } from './mcp.vm'
import type { MCPServer, MCPTool } from './mcp.vm'
import { useRouter } from 'vue-router'

const {
    servers,
    formattedStatistics,
    isLoading,
    totalServers,
    currentPage,
    pageSize,
    totalPages,
    filterParams,
    filterOptions,
    formModel,
    showServerModal,
    modalMode,

    fetchServers,
    fetchStatistics,
    openCreateModal,
    openEditModal,
    saveServer,
    deleteServer,
    startServer,
    stopServer,
    resetForm,
    resetFilter,
    applyFilter,
    handlePageChange,
    handlePageSizeChange,
    refreshData,
    initialize,
    fetchServerTools
} = useMCPViewModel()

const message = useMessage()
const router = useRouter()

// 存储每个服务器的工具列表
const serverToolsMap = reactive<Record<string, MCPTool[]>>({})
const loadingTools = reactive<Record<string, boolean>>({})

// 加载服务器工具列表
const loadServerTools = async (serverId: string) => {
    if (loadingTools[serverId]) return
    
    loadingTools[serverId] = true
    try {
        const tools = await fetchServerTools(serverId)
        serverToolsMap[serverId] = tools
    } catch (error) {
        console.error('加载工具列表失败:', error)
        message.error('加载工具列表失败')
    } finally {
        loadingTools[serverId] = false
    }
}

// 复制命令到剪贴板
const copyCommand = (server: MCPServer) => {
    const command = `${server.command || ''} ${server.args}`
    navigator.clipboard.writeText(command)
    message.success('命令已复制到剪贴板')
}

// 复制URL到剪贴板
const copyUrl = (server: MCPServer) => {
    if (server.url) {
        navigator.clipboard.writeText(server.url)
        message.success('URL已复制到剪贴板')
    }
}

// 查看服务器详情
const viewServerDetail = (serverId: string) => {
    router.push({
        name: 'MCPDetail',
        params: { id: serverId }
    })
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
const getStateType = (state: string) => {
    const typeMap: Record<string, string> = {
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

// 页面加载时初始化
onMounted(() => {
    initialize()
})
</script>

<style scoped>
.mcp-container {
    padding: 1.5rem;
    animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mcp-header {
    margin-bottom: 24px;
}

.mcp-title {
    display: flex;
    align-items: center;
    font-size: 24px;
    margin-bottom: 8px;
}

.mcp-description {
    color: var(--n-text-color-3);
}

.mcp-toolbar {
    display: flex;
    justify-content: space-between;
    margin: 24px 0;
    flex-wrap: wrap;
    gap: 16px;
}

.stat-card {
    margin-bottom: 16px;
}

.stat-value {
    font-size: 32px;
    font-weight: 600;
    text-align: center;
}

.server-list-card {
    margin-bottom: 24px;
}

.empty-state {
    padding: 32px 0;
    display: flex;
    justify-content: center;
}

.server-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
}

.server-card {
    transition: all 0.3s ease;
    height: 100%;
}

.server-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.server-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.server-card-title {
    font-weight: 500;
    font-size: 16px;
}

.server-card-content {
    padding: 8px 0;
}

.server-info {
    margin-bottom: 16px;
}

.server-info-item {
    display: flex;
    margin-bottom: 8px;
}

.info-label {
    width: 80px;
    color: var(--n-text-color-3);
    flex-shrink: 0;
}

.info-value {
    flex: 1;
    display: flex;
    align-items: center;
}

.server-tools {
    margin-top: 16px;
}

.tools-list {
    margin-top: 8px;
}

.tool-tag {
    display: flex;
    align-items: center;
}

.empty-tools, .load-tools {
    display: flex;
    justify-content: center;
    padding: 16px 0;
}

.pagination {
    margin-top: 24px;
    display: flex;
    justify-content: center;
}

code {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
    display: inline-block;
}

.stat-value.success {
    color: #18a058;
}

.stat-value.info {
    color: #2080f0;
}

.stat-value.warning {
    color: #f0a020;
}

.stat-value.error {
    color: #d03050;
}

@media (max-width: 768px) {
    .mcp-toolbar {
        flex-direction: column;
    }

    .stat-value {
        font-size: 24px;
    }
    
    .server-card-grid {
        grid-template-columns: 1fr;
    }
}
</style>
