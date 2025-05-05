<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NCard,
  NSpace,
  NButton,
  NGrid,
  NGridItem,
  NTag,
  NInput,
  NPagination,
  NEmpty,
  NLoadingBarProvider,
  useLoadingBar,
  NMessageProvider,
  useMessage,
  NSkeleton,
  NSwitch,
  NModal,
  NIcon
} from 'naive-ui'
import { pluginApi } from '@/api/plugin'
import type { MarketPlugin } from '@/api/plugin'
import {
  SearchOutline,
  HomeOutline,
  HelpCircleOutline,
  DocumentTextOutline
} from '@vicons/ionicons5'

const loadingBar = useLoadingBar()
const message = useMessage()
const plugins = ref<MarketPlugin[]>([])
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)
const loading = ref(false)
const skeletonVisible = ref(true)
const isFirstLoad = ref(true)
const operationStates = ref<
  Record<
    string,
    { loading: boolean; operation: 'install' | 'uninstall' | 'update' | 'toggle' | null }
  >
>({})
const expandedDescriptions = ref<Record<string, boolean>>({})

const errorModal = ref(false)
const errorMessage = ref('')

const isOperating = (plugin: MarketPlugin) => {
  return operationStates.value[plugin.pypiPackage]?.loading || false
}

const getCurrentOperation = (plugin: MarketPlugin) => {
  return operationStates.value[plugin.pypiPackage]?.operation || null
}

const setOperationState = (
  plugin: MarketPlugin,
  operation: 'install' | 'uninstall' | 'update' | 'toggle' | null,
  loading: boolean
) => {
  operationStates.value[plugin.pypiPackage] = { loading, operation }
}

const skeletonPlugins = Array(pageSize.value).fill({
  name: '加载中...',
  description: '插件描述加载中，请稍候...',
  author: '作者加载中',
  pypiPackage: 'package-name',
  pypiInfo: {
    version: '0.0.0',
    homePage: '#'
  }
})

const fetchPlugins = async () => {
  loading.value = true
  skeletonVisible.value = isFirstLoad.value

  loadingBar.start()
  try {
    const response = await pluginApi.searchPlugins(
      searchQuery.value,
      currentPage.value,
      pageSize.value
    )
    plugins.value = response.plugins
    totalCount.value = response.totalCount
  } catch (error) {
    console.error('获取插件列表失败:', error)
    message.error('获取插件列表失败')
  } finally {
    loading.value = false
    if (isFirstLoad.value) {
      skeletonVisible.value = false
      isFirstLoad.value = false
    }
    loadingBar.finish()
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchPlugins()
}

const handleSearch = () => {
  currentPage.value = 1
  fetchPlugins()
}

const handleInstall = async (plugin: MarketPlugin) => {
  if (isOperating(plugin)) {
    return
  }

  setOperationState(plugin, 'install', true)
  loadingBar.start()
  try {
    await pluginApi.installPlugin(plugin.pypiPackage)
    message.success('插件安装成功')
    await fetchPlugins()
  } catch (error: any) {
    console.error('安装插件失败:', error)
    errorMessage.value = error.message || '未知错误'
    errorModal.value = true
  } finally {
    setOperationState(plugin, null, false)
    loadingBar.finish()
  }
}

const handleUpdate = async (plugin: MarketPlugin) => {
  if (isOperating(plugin)) {
    return
  }

  setOperationState(plugin, 'update', true)
  loadingBar.start()
  try {
    await pluginApi.updatePlugin(plugin.name)
    message.success('插件更新成功')
    await fetchPlugins()
  } catch (error: any) {
    console.error('更新插件失败:', error)
    errorMessage.value = error.message || '未知错误'
    errorModal.value = true
  } finally {
    setOperationState(plugin, null, false)
    loadingBar.finish()
  }
}

const handleUninstall = async (plugin: MarketPlugin) => {
  if (isOperating(plugin)) {
    return
  }

  setOperationState(plugin, 'uninstall', true)
  loadingBar.start()
  try {
    await pluginApi.uninstallPlugin(plugin.name)
    message.success('插件卸载成功')
    await fetchPlugins()
  } catch (error: any) {
    console.error('卸载插件失败:', error)
    errorMessage.value = error.message || '未知错误'
    errorModal.value = true
  } finally {
    setOperationState(plugin, null, false)
    loadingBar.finish()
  }
}

const handleToggleStatus = async (plugin: MarketPlugin) => {
  if (isOperating(plugin)) {
    return
  }

  setOperationState(plugin, 'toggle', true)
  loadingBar.start()
  try {
    await pluginApi.togglePlugin(plugin.name, !plugin.isEnabled)
    message.success(`插件${plugin.isEnabled ? '禁用' : '启用'}成功`)
    await fetchPlugins()
  } catch (error: any) {
    console.error('切换插件状态失败:', error)
    message.error('切换插件状态失败')
    errorMessage.value = error.message || '未知错误'
    errorModal.value = true
  } finally {
    setOperationState(plugin, null, false)
    loadingBar.finish()
  }
}

const toggleDescription = (plugin: MarketPlugin) => {
  expandedDescriptions.value[plugin.pypiPackage] = !expandedDescriptions.value[plugin.pypiPackage]
}

onMounted(() => {
  fetchPlugins()
})
</script>

<template>
  <n-message-provider>
    <n-loading-bar-provider>
      <div class="plugin-market">
        <n-card title="插件市场" class="market-card">
          <template #header-extra>
            <div class="search-container">
              <n-input
                v-model:value="searchQuery"
                placeholder="搜索插件..."
                class="search-input"
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <n-icon><SearchOutline /></n-icon>
                </template>
              </n-input>
              <n-button type="primary" @click="handleSearch" :disabled="loading"> 搜索 </n-button>
            </div>
          </template>

          <div class="market-description">在这里浏览和安装可用的插件，扩展 Kirara AI 的功能。</div>

          <div class="plugins-grid">
            <template v-if="skeletonVisible">
              <n-card
                v-for="(plugin, index) in skeletonPlugins"
                :key="index"
                size="small"
                class="plugin-card"
                :bordered="true"
              >
                <div class="plugin-header">
                  <n-skeleton text style="width: 60%" :sharp="false">
                    <h3>{{ plugin.name }}</h3>
                  </n-skeleton>
                  <div class="plugin-tags">
                    <n-skeleton text style="width: 80px" :sharp="false">
                      <n-tag size="small" type="success" class="version-tag">
                        v{{ plugin.pypiInfo.version }}
                      </n-tag>
                    </n-skeleton>
                  </div>
                </div>

                <n-skeleton text :repeat="2" :sharp="false" style="margin: 16px 0">
                  <div class="plugin-description">{{ plugin.description }}</div>
                </n-skeleton>

                <div class="plugin-meta">
                  <n-skeleton text style="width: 60%" :sharp="false">
                    <n-space align="center" :size="12">
                      <span>作者: {{ plugin.author }}</span>
                      <span class="separator">·</span>
                      <span>PyPI: {{ plugin.pypiPackage }}</span>
                    </n-space>
                  </n-skeleton>
                </div>

                <div class="plugin-actions">
                  <n-skeleton text style="width: 30%" :sharp="false">
                    <n-space align="center" :size="12">
                      <n-button secondary text>主页</n-button>
                      <n-button secondary text>问题反馈</n-button>
                      <n-button secondary text>插件文档</n-button>
                    </n-space>
                  </n-skeleton>
                  <n-skeleton text style="width: 80px" :sharp="false">
                    <n-button type="primary">安装</n-button>
                  </n-skeleton>
                </div>
              </n-card>
            </template>

            <template v-else-if="plugins.length > 0">
              <n-card
                v-for="plugin in plugins"
                :key="plugin.pypiPackage"
                size="small"
                class="plugin-card"
                :bordered="true"
              >
                <template #header>
                  <div class="plugin-header">
                    <h3>{{ plugin.name }}</h3>
                  </div>
                </template>
                <template #header-extra>
                  <div class="plugin-tags">
                    <template v-if="plugin.isInstalled">
                      <n-tag v-if="plugin.isInstalled" size="small" type="info" class="status-tag">
                        已安装 v{{ plugin.installedVersion }}
                      </n-tag>
                      <n-tag
                        v-if="plugin.isUpgradable"
                        size="small"
                        type="warning"
                        class="update-tag"
                      >
                        可更新至 v{{ plugin.pypiInfo.version }}
                      </n-tag>
                      <n-tag
                        v-if="plugin.isEnabled !== undefined"
                        size="small"
                        :type="plugin.isEnabled ? 'success' : 'error'"
                        class="status-tag"
                      >
                        {{ plugin.isEnabled ? '已启用' : '已禁用' }}
                      </n-tag>
                    </template>
                    <n-tag v-else size="small" type="success" class="version-tag">
                      v{{ plugin.pypiInfo.version }}
                    </n-tag>
                  </div>
                </template>

                <div
                  class="plugin-description"
                  :class="{ expanded: expandedDescriptions[plugin.pypiPackage] }"
                >
                  {{ plugin.description }}
                </div>
                <n-button
                  v-if="plugin.description && plugin.description.length > 100"
                  text
                  size="small"
                  @click="toggleDescription(plugin)"
                  class="toggle-description"
                >
                  {{ expandedDescriptions[plugin.pypiPackage] ? '收起' : '展开' }}
                </n-button>

                <div class="plugin-meta">
                  <n-space align="center" :size="12">
                    <span>作者: {{ plugin.author }}</span>
                    <span class="separator">·</span>
                    <span>PyPI: {{ plugin.pypiPackage }}</span>
                  </n-space>
                </div>

                <div class="plugin-actions">
                  <n-space align="center" :size="12">
                    <n-button
                      quaternary
                      size="small"
                      tag="a"
                      :href="plugin.pypiInfo.homePage"
                      target="_blank"
                    >
                      <template #icon>
                        <n-icon><HomeOutline /></n-icon>
                      </template>
                      主页
                    </n-button>
                    <n-button
                      quaternary
                      size="small"
                      tag="a"
                      :href="plugin.pypiInfo.bugTrackerUrl"
                      target="_blank"
                      v-if="plugin.pypiInfo.bugTrackerUrl"
                    >
                      <template #icon>
                        <n-icon><HelpCircleOutline /></n-icon>
                      </template>
                      问题反馈
                    </n-button>
                    <n-button
                      quaternary
                      size="small"
                      tag="a"
                      :href="plugin.pypiInfo.documentUrl"
                      target="_blank"
                      v-if="plugin.pypiInfo.documentUrl"
                    >
                      <template #icon>
                        <n-icon><DocumentTextOutline /></n-icon>
                      </template>
                      插件文档
                    </n-button>
                  </n-space>
                  <div class="action-buttons">
                    <template v-if="plugin.isInstalled">
                      <n-button
                        v-if="plugin.isUpgradable"
                        type="warning"
                        size="small"
                        :loading="isOperating(plugin) && getCurrentOperation(plugin) === 'update'"
                        @click="handleUpdate(plugin)"
                        class="action-button"
                      >
                        更新
                      </n-button>
                      <n-button
                        v-if="plugin.isEnabled !== undefined"
                        :type="plugin.isEnabled ? 'error' : 'success'"
                        size="small"
                        :loading="isOperating(plugin) && getCurrentOperation(plugin) === 'toggle'"
                        @click="handleToggleStatus(plugin)"
                        class="action-button"
                      >
                        {{ plugin.isEnabled ? '禁用' : '启用' }}
                      </n-button>
                      <n-button
                        type="error"
                        size="small"
                        :loading="
                          isOperating(plugin) && getCurrentOperation(plugin) === 'uninstall'
                        "
                        @click="handleUninstall(plugin)"
                        class="action-button"
                      >
                        卸载
                      </n-button>
                    </template>
                    <n-button
                      v-else
                      type="primary"
                      size="small"
                      :loading="isOperating(plugin) && getCurrentOperation(plugin) === 'install'"
                      @click="handleInstall(plugin)"
                      class="action-button"
                    >
                      安装
                    </n-button>
                  </div>
                </div>
              </n-card>
            </template>

            <n-empty v-else description="没有找到插件" />
          </div>

          <div class="pagination-container" v-if="totalCount > 0">
            <n-pagination
              v-model:page="currentPage"
              :page-count="Math.ceil(totalCount / pageSize)"
              @update:page="handlePageChange"
            />
          </div>
        </n-card>

        <n-modal
          v-model:show="errorModal"
          title="操作失败"
          preset="dialog"
          type="error"
          style="width: 600px"
        >
          错误信息：
          <div class="error-message">{{ errorMessage }}</div>
          <template #action>
            <n-button @click="errorModal = false">关闭</n-button>
          </template>
        </n-modal>
      </div>
    </n-loading-bar-provider>
  </n-message-provider>
</template>

<style scoped>
.plugin-market {
  height: 100%;
}

.market-card {
  animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: calc(100vh - 28px);
}

.market-description {
  margin-bottom: 24px;
  color: var(--text-color-secondary);
  line-height: 1.6;
}

.search-container {
  display: flex;
  gap: 8px;
  width: 300px;
}

.search-input {
  flex: 1;
}

.plugins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.plugin-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
  border-radius: var(--border-radius);
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
}

.plugin-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--box-shadow-hover);
}

.plugin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plugin-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.plugin-tags {
  display: flex;
  gap: 8px;
}

.plugin-description {
  margin: 16px 0;
  color: var(--text-color-secondary);
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  height: 50px;
  -webkit-box-orient: vertical;
}

.plugin-description.expanded {
  -webkit-line-clamp: unset;
}

.toggle-description {
  margin-top: -8px;
  margin-bottom: 16px;
  color: var(--primary-color);
}

.plugin-meta {
  margin-top: auto;
  padding-top: 16px;
  color: var(--text-color-tertiary);
  font-size: 12px;
}

.separator {
  color: var(--text-color-tertiary);
}

.plugin-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-button {
  min-width: 60px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.error-message {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
  padding: 16px;
  background-color: var(--bg-color);
  border-radius: var(--border-radius-small);
  margin-bottom: 16px;
  color: var(--error-color);
}

@media (max-width: 768px) {
  .plugins-grid {
    grid-template-columns: 1fr;
  }

  .plugin-actions {
    flex-direction: column;
    gap: 16px;
  }

  .action-buttons {
    width: 100%;
    justify-content: flex-end;
  }

  .search-container {
    width: 100%;
  }
}
</style>
