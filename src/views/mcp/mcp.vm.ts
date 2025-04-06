import { ref, computed } from 'vue'
import { http } from '@/utils/http'
import { useMessage, useDialog } from 'naive-ui'
import { useRouter } from 'vue-router'

// MCP服务器接口定义
export interface MCPServer {
    id: string
    description: string | null
    connection_type: 'stdio' | 'sse'
    command: string | null
    args: string
    url: string | null
    connection_state: string
}

// MCP服务器统计信息
export interface MCPStatistics {
    total_servers: number
    stdio_servers: number
    sse_servers: number
    connected_servers: number
    disconnected_servers: number
    error_servers: number
    total_tools: number
}

// MCP服务器工具定义
export interface MCPTool {
    name: string
    description: string | null
    input_schema: Record<string, any>
}

// 分页响应接口
export interface PagedResponse<T> {
    items: T[]
    total: number
    page: number
    page_size: number
    total_pages: number
}

/**
 * MCP服务器视图模型
 */
export function useMCPViewModel() {
    const router = useRouter()
    const message = useMessage()
    const dialog = useDialog()

    // 状态
    const servers = ref<MCPServer[]>([])
    const statistics = ref<MCPStatistics | null>(null)
    const currentServer = ref<MCPServer | null>(null)
    const serverTools = ref<MCPTool[]>([])
    const isLoading = ref(false)
    const totalServers = ref(0)
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalPages = ref(1)

    // 过滤和搜索
    const filterParams = ref({
        connectionType: null as string | null,
        status: null as string | null,
        query: ''
    })

    // 表单
    const formModel = ref({
        id: '',
        description: '',
        command: '',
        args: '',
        connection_type: 'stdio' as 'stdio' | 'sse'
    })

    // 模态框状态
    const showServerModal = ref(false)
    const modalMode = ref<'create' | 'edit'>('create')

    // 过滤选项
    const filterOptions = computed(() => ({
        connectionType: [
            { label: '标准IO', value: 'stdio' },
            { label: 'SSE', value: 'sse' }
        ],
        status: [
            { label: '已连接', value: 'connected' },
            { label: '已断开', value: 'disconnected' },
            { label: '错误', value: 'error' }
        ]
    }))

    // 统计信息格式化
    const formattedStatistics = computed(() => {
        if (!statistics.value) return []

        return [
            { label: '总服务器数', value: statistics.value.total_servers },
            { label: '标准IO服务器', value: statistics.value.stdio_servers },
            { label: 'SSE服务器', value: statistics.value.sse_servers },
            { label: '已连接', value: statistics.value.connected_servers, type: 'success' },
            { label: '已断开', value: statistics.value.disconnected_servers, type: 'warning' },
            { label: '错误', value: statistics.value.error_servers, type: 'error' },
            { label: '工具总数', value: statistics.value.total_tools, type: 'info' }
        ]
    })

    // 获取服务器列表
    const fetchServers = async () => {
        try {
            isLoading.value = true
            const params = {
                page: currentPage.value,
                page_size: pageSize.value,
                connection_type: filterParams.value.connectionType,
                status: filterParams.value.status,
                query: filterParams.value.query || undefined
            }
            
            const response = await http.get<PagedResponse<MCPServer>>('/mcp/servers', { params })
            servers.value = response.items
            totalServers.value = response.total
            totalPages.value = response.total_pages
        } catch (error) {
            message.error('获取MCP服务器列表失败')
            console.error('获取MCP服务器列表失败:', error)
        } finally {
            isLoading.value = false
        }
    }

    // 获取统计信息
    const fetchStatistics = async () => {
        try {
            const response = await http.get<MCPStatistics>('/mcp/statistics')
            statistics.value = response
        } catch (error) {
            console.error('获取MCP统计信息失败:', error)
        }
    }

    // 获取服务器详情
    const getServerDetail = async (serverId: string) => {
        try {
            isLoading.value = true
            const response = await http.get<MCPServer>(`/mcp/servers/${serverId}`)
            currentServer.value = response
            return response
        } catch (error) {
            message.error('获取MCP服务器详情失败')
            console.error('获取MCP服务器详情失败:', error)
            return null
        } finally {
            isLoading.value = false
        }
    }

    // 获取服务器工具列表
    const getServerTools = async (serverId: string) => {
        try {
            isLoading.value = true
            const response = await http.get<MCPTool[]>(`/mcp/servers/${serverId}/tools`)
            serverTools.value = response
            return response
        } catch (error) {
            message.error('获取MCP服务器工具列表失败')
            console.error('获取MCP服务器工具列表失败:', error)
            return []
        } finally {
            isLoading.value = false
        }
    }

    // 创建服务器
    const createServer = async () => {
        try {
            isLoading.value = true

            // 验证ID是否唯一
            const checkResponse = await http.get<{is_available: boolean}>(`/mcp/servers/check/${formModel.value.id}`)
            if (!checkResponse.is_available) {
                message.error('服务器ID已存在，请使用唯一的ID')
                return
            }

            await http.post('/mcp/servers', formModel.value)
            message.success('MCP服务器创建成功')
            showServerModal.value = false
            resetForm()
            fetchServers()
            fetchStatistics()
        } catch (error) {
            message.error('创建MCP服务器失败')
            console.error('创建MCP服务器失败:', error)
        } finally {
            isLoading.value = false
        }
    }

    // 更新服务器
    const updateServer = async () => {
        try {
            isLoading.value = true
            await http.put(`/mcp/servers/${formModel.value.id}`, formModel.value)
            message.success('MCP服务器更新成功')
            showServerModal.value = false
            resetForm()
            fetchServers()
            fetchStatistics()
        } catch (error) {
            message.error('更新MCP服务器失败')
            console.error('更新MCP服务器失败:', error)
        } finally {
            isLoading.value = false
        }
    }

    // 删除服务器
    const deleteServer = async (serverId: string) => {
        try {
            isLoading.value = true
            await http.delete(`/mcp/servers/${serverId}`)
            message.success('MCP服务器删除成功')
            fetchServers()
            fetchStatistics()
        } catch (error) {
            message.error('删除MCP服务器失败')
            console.error('删除MCP服务器失败:', error)
        } finally {
            isLoading.value = false
        }
    }

    // 启动服务器改为连接服务器
    const startServer = async (serverId: string) => {
        try {
            isLoading.value = true
            await http.post(`/mcp/servers/${serverId}/start`)
            message.success('MCP服务器连接成功')
            fetchServers()
            fetchStatistics()
        } catch (error) {
            message.error('连接MCP服务器失败')
            console.error('连接MCP服务器失败:', error)
        } finally {
            isLoading.value = false
        }
    }

    // 停止服务器改为断开服务器
    const stopServer = async (serverId: string) => {
        try {
            isLoading.value = true
            await http.post(`/mcp/servers/${serverId}/stop`)
            message.success('MCP服务器断开成功')
            fetchServers()
            fetchStatistics()
        } catch (error) {
            message.error('断开MCP服务器失败')
            console.error('断开MCP服务器失败:', error)
        } finally {
            isLoading.value = false
        }
    }

    // 打开创建模态框
    const openCreateModal = () => {
        modalMode.value = 'create'
        resetForm()
        showServerModal.value = true
    }

    // 打开编辑模态框
    const openEditModal = (server: MCPServer) => {
        modalMode.value = 'edit'
        formModel.value = {
            id: server.id,
            description: server.description || '',
            command: server.command || '',
            args: server.args,
            connection_type: server.connection_type as 'stdio' | 'sse'
        }
        showServerModal.value = true
    }

    // 保存服务器
    const saveServer = async () => {
        if (modalMode.value === 'create') {
            await createServer()
        } else {
            await updateServer()
        }
    }

    // 重置表单
    const resetForm = () => {
        formModel.value = {
            id: '',
            description: '',
            command: '',
            args: '',
            connection_type: 'stdio'
        }
    }

    // 过滤器操作
    const resetFilter = () => {
        filterParams.value = {
            connectionType: null,
            status: null,
            query: ''
        }
        currentPage.value = 1
        fetchServers()
    }

    const applyFilter = () => {
        currentPage.value = 1
        fetchServers()
    }

    // 分页操作
    const handlePageChange = (page: number) => {
        currentPage.value = page
        fetchServers()
    }

    const handlePageSizeChange = (size: number) => {
        pageSize.value = size
        currentPage.value = 1
        fetchServers()
    }

    // 刷新数据
    const refreshData = () => {
        fetchServers()
        fetchStatistics()
    }

    // 初始化
    const initialize = async () => {
        await fetchServers()
        await fetchStatistics()
    }

    // 获取单个服务器的工具列表
    const fetchServerTools = async (serverId: string) => {
        try {
            const response = await http.get<MCPTool[]>(`/mcp/servers/${serverId}/tools`)
            return response
        } catch (error) {
            console.error('获取MCP服务器工具列表失败:', error)
            return []
        }
    }

    return {
        // 状态
        servers,
        formattedStatistics,
        currentServer,
        serverTools,
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

        // 方法
        fetchServers,
        fetchStatistics,
        getServerDetail,
        getServerTools,
        createServer,
        updateServer,
        deleteServer,
        startServer,
        stopServer,
        openCreateModal,
        openEditModal,
        saveServer,
        resetForm,
        resetFilter,
        applyFilter,
        handlePageChange,
        handlePageSizeChange,
        refreshData,
        initialize,
        fetchServerTools
    }
} 