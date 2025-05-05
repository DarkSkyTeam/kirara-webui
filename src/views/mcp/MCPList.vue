<template>
  <div class="mcp-container">
    <n-card class="main-card" :bordered="false">
      <div class="mcp-header">
        <div class="mcp-title">
          <n-icon size="28" class="title-icon">
            <IconMCP />
          </n-icon>
          <span>MCP 服务器管理</span>
        </div>
        <div class="mcp-description">管理和配置你的 MCP (Model Context Protocol) 服务器</div>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-section">
        <n-grid :cols="15" :x-gap="16" responsive="screen">
          <n-grid-item span="5 s:15 m:1">
            <n-card embedded :bordered="false">
              <div class="stat-card">
                <div class="stat-icon">
                  <n-icon size="24"><server-outline /></n-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ formattedStatistics?.[0]?.value || 0 }}</div>
                  <div class="stat-label">总服务器</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>
          <n-grid-item span="5 s:15 m:1">
            <n-card embedded :bordered="false">
              <div class="stat-card">
                <div class="stat-icon success">
                  <n-icon size="24"><pulse-outline /></n-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value success">{{ formattedStatistics?.[3]?.value || 0 }}</div>
                  <div class="stat-label">已连接</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>
          <n-grid-item span="5 s:15 m:1">
            <n-card :bordered="false" embedded>
              <div class="stat-card">
                <div class="stat-icon info">
                  <n-icon size="24"><terminal-outline /></n-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value info">{{ formattedStatistics?.[6]?.value || 0 }}</div>
                  <div class="stat-label">工具数</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>
        </n-grid>
      </div>

      <!-- 工具栏和过滤器 -->
      <div class="mcp-toolbar">
        <n-space>
          <n-button type="primary" @click="openCreateModal" class="action-button">
            <template #icon>
              <n-icon><add-outline /></n-icon>
            </template>
            添加服务器
          </n-button>
          <n-button @click="refreshData" class="action-button" :loading="isLoading">
            <template #icon>
              <n-icon><refresh-outline /></n-icon>
            </template>
            刷新
          </n-button>
        </n-space>

        <div class="filter-section">
          <n-input
            v-model:value="filterParams.query"
            placeholder="搜索服务器名称或命令"
            clearable
            class="search-input"
            @keydown.enter="applyFilter"
          >
            <template #prefix>
              <n-icon><search-outline /></n-icon>
            </template>
          </n-input>
          <n-select
            v-model:value="filterParams.connectionType"
            placeholder="连接类型"
            clearable
            :options="filterOptions.connectionType"
            class="filter-select"
          />
          <n-select
            v-model:value="filterParams.status"
            placeholder="状态"
            clearable
            :options="filterOptions.status"
            class="filter-select"
          />
          <n-button @click="resetFilter" class="filter-button">
            <template #icon>
              <n-icon><close-outline /></n-icon>
            </template>
            重置
          </n-button>
          <n-button type="primary" @click="applyFilter" class="filter-button">
            <template #icon>
              <n-icon><search-outline /></n-icon>
            </template>
            搜索
          </n-button>
        </div>
      </div>

      <!-- 服务器卡片列表 -->
      <n-card title="服务器列表" class="server-list-card" :bordered="false">
        <template #header-extra>
          <n-text>总计: {{ totalServers }} 个服务器</n-text>
        </template>

        <n-spin :show="isLoading">
          <div v-if="servers.length === 0" class="empty-state">
            <n-empty description="暂无服务器">
              <template #extra>
                <n-button type="primary" @click="openCreateModal"> 添加第一个服务器 </n-button>
              </template>
            </n-empty>
          </div>
          <div v-else class="server-card-grid">
            <n-card
              v-for="server in servers"
              :key="server.id"
              class="server-card"
              :bordered="false"
            >
              <div
                class="server-status-indicator"
                :class="getStateType(server.connection_state)"
              ></div>
              <div class="server-card-header">
                <div class="server-card-title">
                  <n-space align="center">
                    <n-icon size="20" :color="getStateColor(server.connection_state)">
                      <component
                        :is="server.connection_type === 'stdio' ? TerminalOutline : GlobeOutline"
                      />
                    </n-icon>
                    <span>{{ server.id }}</span>
                    <n-tag
                      size="small"
                      :type="getStateType(server.connection_state)"
                      class="status-tag"
                    >
                      {{ formatConnectionState(server.connection_state) }}
                    </n-tag>
                  </n-space>
                </div>
                <div class="server-card-actions">
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <n-button
                        size="small"
                        quaternary
                        circle
                        @click="viewServerDetail(server.id)"
                        class="action-icon"
                      >
                        <template #icon>
                          <n-icon><eye-outline /></n-icon>
                        </template>
                      </n-button>
                    </template>
                    查看详情
                  </n-tooltip>
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <n-button
                        size="small"
                        quaternary
                        circle
                        @click="openEditModal(server)"
                        class="action-icon"
                      >
                        <template #icon>
                          <n-icon><pencil-outline /></n-icon>
                        </template>
                      </n-button>
                    </template>
                    编辑
                  </n-tooltip>
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <n-button
                        size="small"
                        quaternary
                        circle
                        :type="server.connection_state === 'connected' ? 'warning' : 'success'"
                        @click="
                          server.connection_state === 'connected'
                            ? stopServer(server.id)
                            : startServer(server.id)
                        "
                        :disabled="
                          ['connecting', 'disconnecting'].includes(server.connection_state)
                        "
                        class="action-icon"
                      >
                        <template #icon>
                          <n-icon>
                            <component
                              :is="
                                server.connection_state === 'connected' ? StopOutline : PlayOutline
                              "
                            />
                          </n-icon>
                        </template>
                      </n-button>
                    </template>
                    {{ server.connection_state === 'connected' ? '断开' : '连接' }}
                  </n-tooltip>
                  <n-popconfirm @positive-click="deleteServer(server.id)">
                    <template #trigger>
                      <n-button size="small" quaternary circle type="error" class="action-icon">
                        <template #icon>
                          <n-icon><trash-outline /></n-icon>
                        </template>
                      </n-button>
                    </template>
                    确定要删除这个MCP服务器吗？
                  </n-popconfirm>
                </div>
              </div>

              <div class="server-card-content">
                <div class="server-info">
                  <div class="server-info-item">
                    <div class="info-label">
                      <n-icon size="14"><cube-outline /></n-icon>
                      连接类型:
                    </div>
                    <div class="info-value">
                      <n-tag
                        size="small"
                        :type="server.connection_type === 'stdio' ? 'success' : 'info'"
                      >
                        {{ server.connection_type }}
                      </n-tag>
                    </div>
                  </div>
                  <div class="server-info-item">
                    <div class="info-label">
                      <n-icon size="14"><code-outline /></n-icon>
                      命令:
                    </div>
                    <div class="info-value">
                      <code class="command-code">{{ server.command || '' }} {{ server.args }}</code>
                      <n-button text size="tiny" @click="copyCommand(server)" class="copy-button">
                        <template #icon>
                          <n-icon><copy-outline /></n-icon>
                        </template>
                      </n-button>
                    </div>
                  </div>
                  <div class="server-info-item" v-if="server.description">
                    <div class="info-label">
                      <n-icon size="14"><information-circle-outline /></n-icon>
                      描述:
                    </div>
                    <div class="info-value">{{ server.description }}</div>
                  </div>
                  <div class="server-info-item" v-if="server.url">
                    <div class="info-label">
                      <n-icon size="14"><link-outline /></n-icon>
                      URL:
                    </div>
                    <div class="info-value">
                      <code class="url-code">{{ server.url }}</code>
                      <n-button text size="tiny" @click="copyUrl(server)" class="copy-button">
                        <template #icon>
                          <n-icon><copy-outline /></n-icon>
                        </template>
                      </n-button>
                    </div>
                  </div>
                </div>
              </div>
            </n-card>
          </div>

          <!-- 分页 -->
          <n-pagination
            v-if="totalPages > 1"
            class="pagination"
            v-model:page="currentPage"
            v-model:page-size="pageSize"
            :page-count="totalPages"
            :page-sizes="[10, 20, 50]"
            show-size-picker
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
          />
        </n-spin>
      </n-card>
    </n-card>

    <!-- 添加/编辑服务器模态框 -->
    <n-modal
      v-model:show="showServerModal"
      :title="modalMode === 'create' ? '添加新服务器' : '编辑服务器'"
      preset="card"
      :style="{ width: '600px' }"
      class="server-modal"
      @after-leave="resetForm"
    >
      <n-alert
        v-if="modalMode === 'edit' && isServerRunning"
        type="warning"
        :show-icon="true"
        style="margin-bottom: 16px"
      >
        无法编辑已连接的 MCP 服务器，请先断开连接
      </n-alert>

      <n-form
        ref="formRef"
        :model="formModel"
        label-placement="left"
        label-width="120px"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="服务器ID" path="id" required>
          <n-input
            v-model:value="formModel.id"
            placeholder="例如：api-mcp, local-server"
            :disabled="modalMode === 'edit'"
          />
          <template #feedback>
            <n-text depth="3">服务器唯一标识符，创建后不可修改</n-text>
          </template>
        </n-form-item>

        <n-form-item label="连接类型" path="connection_type" required>
          <div class="connection-type-buttons">
            <n-button
              :type="formModel.connection_type === 'stdio' ? 'primary' : 'default'"
              @click="formModel.connection_type = 'stdio'"
              class="connection-type-button"
              :disabled="modalMode === 'edit' && isServerRunning"
            >
              <template #icon>
                <n-icon><terminal-outline /></n-icon>
              </template>
              stdio
            </n-button>
            <n-button
              :type="formModel.connection_type === 'sse' ? 'primary' : 'default'"
              @click="formModel.connection_type = 'sse'"
              class="connection-type-button"
              :disabled="modalMode === 'edit' && isServerRunning"
            >
              <template #icon>
                <n-icon><globe-outline /></n-icon>
              </template>
              sse
            </n-button>
          </div>
        </n-form-item>

        <!-- stdio 连接类型表单项 -->
        <template v-if="formModel.connection_type === 'stdio'">
          <n-form-item label="命令" path="command" required>
            <n-input
              v-model:value="formModel.command"
              placeholder="例如：python, node"
              :disabled="modalMode === 'edit' && isServerRunning"
            />
            <template #feedback>
              <n-text depth="3">要执行的命令，如 python 或 node</n-text>
            </template>
          </n-form-item>

          <n-form-item label="参数" path="args" required>
            <n-input
              v-model:value="formModel.args"
              placeholder="例如：path/to/script.py"
              :disabled="modalMode === 'edit' && isServerRunning"
            />
            <template #feedback>
              <n-text depth="3">命令的参数，如脚本路径 path/to/script.py</n-text>
            </template>
          </n-form-item>

          <n-form-item label="环境变量" path="env">
            <n-dynamic-input
              v-model:value="formModel.env"
              preset="pair"
              key-placeholder="变量名"
              value-placeholder="变量值"
              :disabled="modalMode === 'edit' && isServerRunning"
            />
            <template #feedback>
              <n-text depth="3">命令执行时的环境变量</n-text>
            </template>
          </n-form-item>
        </template>

        <!-- sse 连接类型表单项 -->
        <template v-else>
          <n-form-item label="URL" path="url" required>
            <n-input
              v-model:value="formModel.url"
              placeholder="例如：http://localhost:8000/sse"
              :disabled="modalMode === 'edit' && isServerRunning"
            />
            <template #feedback>
              <n-text depth="3">SSE 服务器的 URL 地址</n-text>
            </template>
          </n-form-item>

          <n-form-item label="Headers" path="headers">
            <n-dynamic-input
              v-model:value="formModel.headers"
              preset="pair"
              key-placeholder="Header 名"
              value-placeholder="Header 值"
              :disabled="modalMode === 'edit' && isServerRunning"
            />
            <template #feedback>
              <n-text depth="3">请求头信息</n-text>
            </template>
          </n-form-item>
        </template>

        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="formModel.description"
            type="textarea"
            placeholder="服务器的描述信息"
            :disabled="modalMode === 'edit' && isServerRunning"
          />
        </n-form-item>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showServerModal = false">取消</n-button>
          <n-button
            type="primary"
            :loading="isLoading"
            @click="saveServer"
            :disabled="modalMode === 'edit' && isServerRunning"
            >保存</n-button
          >
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, h, computed, onMounted, reactive } from 'vue'
import {
  NButton,
  NCard,
  NInput,
  NSelect,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NIcon,
  NGrid,
  NGridItem,
  NEmpty,
  NSpin,
  NText,
  NTag,
  NDivider,
  NPopconfirm,
  useMessage,
  useDialog,
  NBadge,
  NTooltip,
  NPagination,
  NList,
  NListItem,
  NThing,
  NAlert,
  NDynamicInput
} from 'naive-ui'
import {
  AddOutline,
  RefreshOutline,
  SearchOutline,
  CloseOutline,
  TrashOutline,
  PencilOutline,
  PlayOutline,
  StopOutline,
  CopyOutline,
  TerminalOutline,
  GlobeOutline,
  ServerOutline,
  EyeOutline,
  InformationCircleOutline,
  PulseOutline,
  CubeOutline,
  CodeOutline,
  LinkOutline,
  DownloadOutline
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
  saveServer: originalSaveServer,
  deleteServer,
  startServer,
  stopServer,
  resetForm,
  resetFilter,
  applyFilter,
  handlePageChange,
  handlePageSizeChange,
  refreshData,
  initialize
} = useMCPViewModel()

const message = useMessage()
const router = useRouter()

// 判断服务器是否正在运行
const isServerRunning = computed(() => {
  if (modalMode.value === 'edit' && formModel.value.id) {
    const server = servers.value.find((s) => s.id === formModel.value.id)
    return server?.connection_state === 'connected' || server?.connection_state === 'connecting'
  }
  return false
})

// 包装保存服务器方法，添加错误处理
const saveServer = async () => {
  try {
    await originalSaveServer()
  } catch (error: any) {
    // 显示后台返回的错误信息
    if (error.response?.data?.message) {
      message.error(error.response.data.message)
    } else {
      message.error('保存服务器失败：' + (error.message || '未知错误'))
    }
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
    name: 'mcp-detail',
    params: { id: serverId }
  })
}

// 格式化连接状态
const formatConnectionState = (state: string) => {
  const stateMap: Record<string, string> = {
    connected: '已连接',
    connecting: '连接中',
    disconnected: '已断开',
    disconnecting: '断开中',
    error: '错误'
  }
  return stateMap[state] || state
}

// 获取状态对应的类型
const getStateType = (state: string) => {
  const typeMap: Record<string, string> = {
    connected: 'success',
    connecting: 'info',
    disconnected: 'warning',
    disconnecting: 'warning',
    error: 'error'
  }
  return typeMap[state] || 'default'
}

// 获取状态对应的颜色
const getStateColor = (state: string) => {
  const colorMap: Record<string, string> = {
    connected: '#18a058',
    connecting: '#2080f0',
    disconnected: '#d03050',
    disconnecting: '#f0a020',
    error: '#d03050'
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

.main-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.mcp-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.mcp-title {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.title-icon {
  margin-right: 12px;
  color: #2080f0;
}

.mcp-description {
  color: var(--n-text-color-3);
  font-size: 14px;
}

.stats-section {
  margin: 24px 0;
}

.stat-card {
  padding: 16px;
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: rgba(32, 128, 240, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: #2080f0;
}

.stat-icon.success {
  background-color: rgba(24, 160, 88, 0.1);
  color: #18a058;
}

.stat-icon.info {
  background-color: rgba(32, 128, 240, 0.1);
  color: #2080f0;
}

.stat-icon.warning {
  background-color: rgba(240, 160, 32, 0.1);
  color: #f0a020;
}

.stat-icon.error {
  background-color: rgba(208, 48, 80, 0.1);
  color: #d03050;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: var(--n-text-color-3);
}

.mcp-toolbar {
  display: flex;
  justify-content: space-between;
  margin: 24px 0;
  flex-wrap: wrap;
  gap: 16px;
}

.action-button {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.action-button:hover {
  transform: translateY(-2px);
}

.filter-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.search-input {
  width: 220px;
  border-radius: 8px;
}

.filter-select {
  width: 120px;
  border-radius: 8px;
}

.filter-button {
  border-radius: 8px;
}

.server-list-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.empty-state {
  padding: 48px 0;
  display: flex;
  justify-content: center;
}

.server-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.server-card {
  transition: all 0.3s ease;
  height: 100%;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.server-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.server-status-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.server-status-indicator.success {
  background-color: #18a058;
}

.server-status-indicator.info {
  background-color: #2080f0;
}

.server-status-indicator.warning {
  background-color: #f0a020;
}

.server-status-indicator.error {
  background-color: #d03050;
}

.server-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.server-card-title {
  font-weight: 600;
  font-size: 16px;
}

.status-tag {
  margin-left: 8px;
}

.server-card-actions {
  display: flex;
  gap: 4px;
}

.action-icon {
  transition: all 0.2s ease;
}

.action-icon:hover {
  transform: scale(1.1);
}

.server-card-content {
  padding: 16px;
}

.server-info {
  margin-bottom: 16px;
}

.server-info-item {
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
}

.info-label {
  width: 90px;
  color: var(--n-text-color-3);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.info-value {
  flex: 1;
  display: flex;
  align-items: center;
}

.command-code,
.url-code {
  background-color: rgba(0, 0, 0, 0.04);
  padding: 4px 8px;
  border-radius: 6px;
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  display: inline-block;
  font-size: 12px;
}

.copy-button {
  margin-left: 4px;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.copy-button:hover {
  opacity: 1;
}

.server-tools {
  margin-top: 16px;
}

.tools-list {
  margin-top: 8px;
}

.tool-item {
  transition: all 0.2s ease;
  border-radius: 8px;
}

.tool-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.empty-tools,
.load-tools {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.server-modal {
  width: 600px;
  border-radius: 12px;
}

.connection-type-buttons {
  display: flex;
  gap: 16px;
}

.connection-type-button {
  flex: 1;
  border-radius: 8px;
  transition: all 0.2s ease;
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

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

.server-card.new-server {
  animation: pulse 1s ease-in-out;
}

@media (max-width: 768px) {
  .mcp-toolbar {
    flex-direction: column;
  }

  .filter-section {
    width: 100%;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .stat-value {
    font-size: 24px;
  }

  .server-card-grid {
    grid-template-columns: 1fr;
  }

  .server-modal {
    width: 90vw;
  }
}
</style>
