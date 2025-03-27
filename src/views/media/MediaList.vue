<template>
  <div class="media-list-container">
    <n-card title="媒体管理" class="main-card">
      <template #header-extra>
        <n-space>
          <n-button @click="selectAll" class="action-button">
            <div class="i-carbon-select-all mr-1"></div>
            全选本页
          </n-button>
          <n-button @click="selectNoReference" class="action-button">
            <div class="i-carbon-document-blank mr-1"></div>
            选择无引用项
          </n-button>
          <n-button
            type="error"
            :disabled="selectedMediaIds.length === 0"
            @click="handleBatchDelete"
            class="action-button"
          >
            <div class="i-carbon-trash-can mr-1"></div>
            批量删除
          </n-button>
        </n-space>
      </template>

      <n-space vertical size="large">
        <!-- 搜索条件 -->
        <n-card title="搜索条件" size="small" class="search-card">
          <n-grid :cols="4" :x-gap="16">
            <n-grid-item>
              <n-input
                v-model:value="searchParams.query"
                placeholder="搜索关键词"
                clearable
                class="search-input"
              >
                <template #prefix>
                  <div class="i-carbon-search"></div>
                </template>
              </n-input>
            </n-grid-item>
            <n-grid-item>
              <n-select
                v-model:value="searchParams.content_type"
                placeholder="媒体类型"
                :options="contentTypeOptions"
                clearable
                class="search-select"
              >
                <template #prefix>
                  <div class="i-carbon-image-service"></div>
                </template>
              </n-select>
            </n-grid-item>
            <n-grid-item>
              <n-date-picker
                v-model:value="dateRange"
                type="daterange"
                clearable
                class="search-date-picker"
              >
                <template #prefix>
                  <div class="i-carbon-calendar"></div>
                </template>
              </n-date-picker>
            </n-grid-item>
            <n-grid-item>
              <n-space justify="end">
                <n-button @click="resetSearch" class="reset-button">
                  <div class="i-carbon-reset mr-1"></div>
                  重置
                </n-button>
                <n-button type="primary" @click="handleSearch" class="search-button">
                  <div class="i-carbon-search mr-1"></div>
                  搜索
                </n-button>
              </n-space>
            </n-grid-item>
          </n-grid>
        </n-card>

        <!-- 媒体列表 -->
        <div class="media-grid" v-if="!loading">
          <n-grid :cols="5" :x-gap="16" :y-gap="16">
            <n-grid-item v-for="(item, index) in mediaList" :key="item.id">
              <n-card
                :class="{
                  'media-card': true,
                  'media-card-selected': selectedMediaIds.includes(item.id),
                }"
                hoverable
                @click="handlePreview(item)"
                :style="{
                  animationDelay: `${index * 0.05}s`
                }"
              >
                <div class="media-card-content">
                  <div class="media-card-image">
                    <n-image
                      :src="getPreviewUrl(item.id)"
                      object-fit="contain"
                      preview-disabled
                      @click.stop="handlePreview(item)"
                      class="bg"
                    >
                      <template #error>
                        <n-icon :size="100" color="lightGrey">
                          <ImageOutline />
                        </n-icon>
                      </template>
                    </n-image>
                    <div class="media-card-checkbox">
                      <n-checkbox
                        :checked="selectedMediaIds.includes(item.id)"
                        @click.stop
                        @update:checked="
                          (checked) => handleCheckboxChange(checked, item.id)
                        "
                      />
                    </div>
                    <div class="media-card-type-badge">
                      {{ getMediaTypeLabel(item.metadata.content_type) }}
                    </div>
                    <div class="media-card-ref-badge" v-if="hasReferences(item)">
                      <div class="i-carbon-reference mr-1"></div>
                      {{ getReferencesCount(item) }}
                    </div>
                  </div>
                  <div class="media-card-info">
                    <div class="media-card-filename">
                      {{ item.metadata.filename }}
                    </div>
                    <div class="media-card-meta">
                      <span class="media-card-size">
                        <div class="i-carbon-document-size mr-1"></div>
                        {{ formatFileSize(item.metadata.size) }}
                      </span>
                      <span class="media-card-date">
                        <div class="i-carbon-time mr-1"></div>
                        {{ formatDate(item.metadata.upload_time) }}
                      </span>
                    </div>
                  </div>
                </div>
              </n-card>
            </n-grid-item>
          </n-grid>
        </div>

        <n-empty
          v-if="!loading && mediaList.length === 0"
          description="暂无媒体文件"
          class="empty-state"
        >
          <template #icon>
            <div class="i-carbon-no-image text-6xl opacity-50"></div>
          </template>
          <template #extra>
            <n-button type="primary" class="upload-button">
              <div class="i-carbon-upload mr-1"></div>
              上传媒体
            </n-button>
          </template>
        </n-empty>

        <n-spin
          v-if="loading"
          size="large"
          class="loading-spinner"
        />

        <!-- 分页 -->
        <n-pagination
          v-if="!loading && mediaList.length > 0"
          v-model:page="searchParams.page"
          :item-count="total"
          :page-size="searchParams.page_size"
          :show-size-picker="true"
          :page-sizes="[20, 40, 80, 160]"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
          class="pagination"
        />
      </n-space>
    </n-card>

    <!-- 预览对话框 -->
    <n-modal
      v-model:show="showPreviewModal"
      preset="card"
      class="preview-modal"
      :style="{ width: '900px' }"
      title="媒体预览"
      :mask-closable="false"
      :show-footer="false"
    >
      <div v-if="previewItem" class="media-preview">
        <n-grid :cols="2" :x-gap="16">
          <n-grid-item>
            <div class="media-preview-content bg">
              <img
                v-if="previewItem.metadata.content_type.startsWith('image/')"
                :src="getRawUrl(previewItem.id)"
                object-fit="contain"
                class="preview-image"
              />
              <video
                v-else-if="previewItem.metadata.content_type.startsWith('video/')"
                :src="getRawUrl(previewItem.id)"
                controls
                class="preview-video"
              ></video>
              <audio
                v-else-if="previewItem.metadata.content_type.startsWith('audio/')"
                :src="getRawUrl(previewItem.id)"
                controls
                class="preview-audio"
              ></audio>
              <n-card
                v-else
                title="无法预览"
                size="small"
                class="preview-fallback"
              >
                <div class="i-carbon-document-unknown text-6xl mb-4"></div>
                <n-button @click="downloadMedia(previewItem)" class="download-button">
                  <div class="i-carbon-download mr-1"></div>
                  下载文件
                </n-button>
              </n-card>
            </div>
          </n-grid-item>
          <n-grid-item>
            <div class="media-preview-metadata">
              <n-descriptions title="文件信息" :column="1" class="preview-info">
                <n-descriptions-item label="文件名">
                  <div class="flex items-center">
                    <div class="i-carbon-document mr-2"></div>
                    {{ previewItem.metadata.filename }}
                  </div>
                </n-descriptions-item>
                <n-descriptions-item label="大小">
                  <div class="flex items-center">
                    <div class="i-carbon-document-size mr-2"></div>
                    {{ formatFileSize(previewItem.metadata.size) }}
                  </div>
                </n-descriptions-item>
                <n-descriptions-item label="类型">
                  <div class="flex items-center">
                    <div class="i-carbon-image-service mr-2"></div>
                    {{ previewItem.metadata.content_type }}
                  </div>
                </n-descriptions-item>
                <n-descriptions-item label="上传时间">
                  <div class="flex items-center">
                    <div class="i-carbon-time mr-2"></div>
                    {{ formatDateTime(previewItem.metadata.upload_time) }}
                  </div>
                </n-descriptions-item>
                <n-descriptions-item
                  label="来源"
                  v-if="previewItem.metadata.source"
                >
                  <div class="flex items-center">
                    <div class="i-carbon-information-source mr-2"></div>
                    {{ previewItem.metadata.source }}
                  </div>
                </n-descriptions-item>
              </n-descriptions>
              
              <div class="preview-actions">
                <n-button @click="downloadMedia(previewItem)" class="preview-action-button">
                  <div class="i-carbon-download mr-1"></div>
                  下载
                </n-button>
                <n-button 
                  type="error" 
                  @click="handleDeleteMedia(previewItem)"
                  class="preview-action-button"
                >
                  <div class="i-carbon-trash-can mr-1"></div>
                  删除
                </n-button>
                <n-button 
                  @click="showPreviewModal = false" 
                  class="preview-action-button"
                >
                  <div class="i-carbon-close mr-1"></div>
                  关闭
                </n-button>
              </div>
            </div>
          </n-grid-item>
        </n-grid>
        
        <!-- 引用列表表格 -->
        <n-divider>引用列表</n-divider>
        <div class="references-table-container">
          <n-data-table
            :columns="referenceColumns"
            :data="referenceData"
            :bordered="false"
            :single-line="false"
            size="small"
            class="references-table"
            :max-height="300"
          />
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, h, computed } from 'vue'
import {
  NCard,
  NButton,
  NSpace,
  NGrid,
  NGridItem,
  NInput,
  NSelect,
  NDatePicker,
  NImage,
  NCheckbox,
  NEmpty,
  NSpin,
  NText,
  NModal,
  NDivider,
  NDescriptions,
  NDescriptionsItem,
  NIcon,
  NPagination,
  NDataTable,
} from 'naive-ui'
import { ImageOutline } from '@vicons/ionicons5'
import { useMediaViewModel } from './media.vm'
import type { ReferenceRow } from './media.vm'

// 使用MVVM模式的视图模型
const {
  // 状态
  mediaList,
  loading,
  loadingMore,
  hasMore,
  total,
  selectedMediaIds,
  showPreviewModal,
  previewItem,
  searchParams,
  dateRange,
  contentTypeOptions,

  // 方法
  fetchMediaList,
  handleSearch,
  resetSearch,
  loadMore,
  toggleSelectMedia,
  handleCheckboxChange,
  handlePreview,
  handleDeleteMedia,
  handleBatchDelete,
  getPreviewUrl,
  getRawUrl,
  downloadMedia,
  selectAll,
  selectNoReference,

  // 引用相关
  viewReference,
  deleteReference,

  // 工具函数
  formatFileSize,
  formatDate,
  formatDateTime,
} = useMediaViewModel()

// 初始化时加载媒体列表
onMounted(() => {
  fetchMediaList()
})

// 分页处理函数
const handlePageChange = (page: number) => {
  searchParams.page = page
  fetchMediaList()
}

const handlePageSizeChange = (pageSize: number) => {
  searchParams.page_size = pageSize
  searchParams.page = 1 // 切换页面大小时，重置为第一页
  fetchMediaList()
}

// 获取媒体类型标签
const getMediaTypeLabel = (contentType: string) => {
  if (contentType.startsWith('image/')) {
    return '图片';
  } else if (contentType.startsWith('video/')) {
    return '视频';
  } else if (contentType.startsWith('audio/')) {
    return '音频';
  } else {
    return '文件';
  }
};

// 引用表格列定义
const referenceColumns = [
  {
    title: '#',
    key: 'index',
    width: 60,
    render: (_: ReferenceRow, index: number) => index + 1
  },
  {
    title: '引用模块',
    key: 'module',
    width: 150
  },
  {
    title: '引用 key',
    key: 'key',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row: ReferenceRow) => {
      return h(
        NSpace, 
        { justify: 'center', align: 'center' },
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                quaternary: true,
                onClick: (e) => {
                  e.stopPropagation()
                  viewReference(row.module, row.key)
                }
              },
              {
                default: () => [
                  h('div', { class: 'i-carbon-view mr-1' }),
                  '查看'
                ]
              }
            ),
            h(
              NButton,
              {
                size: 'small',
                quaternary: true,
                type: 'error',
                onClick: (e) => {
                  e.stopPropagation()
                  deleteReference(row)
                }
              },
              {
                default: () => [
                  h('div', { class: 'i-carbon-trash-can mr-1' }),
                  '删除'
                ]
              }
            )
          ]
        }
      )
    }
  }
]

// 处理引用数据
const referenceData = computed(() => {
  if (!previewItem.value || !previewItem.value.metadata.references) {
    return []
  }
  
  return previewItem.value.metadata.references.map(ref => {
    const parts = ref.split(':')
    const module = parts[0]
    const key = parts.slice(1).join(':')
    
    return {
      reference: ref,
      module: module,
      key: key
    }
  })
})

// 检查媒体项是否有引用
const hasReferences = (item: any) => {
  return item.metadata.references && item.metadata.references.length > 0
}

// 获取媒体项的引用数量
const getReferencesCount = (item: any) => {
  return item.metadata.references ? item.metadata.references.length : 0
}
</script>

<style scoped>
.media-list-container {
  padding: 1.5rem;
  animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-card {
  border-radius: 20px;
  background: linear-gradient(135deg, var(--card-bg-color) 0%, color-mix(in oklab, var(--card-bg-color), var(--primary-color) 5%) 100%);
}

.action-button, .reset-button, .search-button {
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-button {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-hover) 100%);
  border: none;
}

.media-grid {
  margin-top: 1.5rem;
}

.media-card-selected {
  border: 2px solid var(--primary-color);
  box-shadow: 0 8px 25px rgba(64, 128, 255, 0.25);
}

.media-card:hover {
  transform: translateY(-5px) scale(1.02);
}

.media-card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.media-card-image {
  position: relative;
  height: 160px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-color);
  border-radius: var(--border-radius) var(--border-radius) 0 0;
}

.media-card-image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.media-card:hover .media-card-image :deep(img) {
  transform: scale(1.05);
}

.media-card-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
}

.media-card-type-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  z-index: 2;
}

.media-card-ref-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(64, 128, 255, 0.8);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  z-index: 2;
  transition: all 0.3s ease;
}

.media-card:hover .media-card-ref-badge {
  background-color: var(--primary-color);
  transform: translateY(-2px);
}

.media-card-info {
  padding: 0.5rem;
}

.media-card-filename {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.media-card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.media-card-size, .media-card-date {
  display: flex;
  align-items: center;
}

.empty-state {
  padding: 3rem;
  background: linear-gradient(135deg, var(--card-bg-color) 0%, color-mix(in oklab, var(--card-bg-color), var(--primary-color) 5%) 100%);
  border-radius: 20px;
  margin: 2rem 0;
}

.upload-button {
  margin-top: 1rem;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-hover) 100%);
  border: none;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  padding: 3rem;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

.media-preview {
  padding: 1rem;
}

.media-preview-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  border-radius: 16px;
  overflow: hidden;
  background-color: oklch(0.967 0.003 264.542);
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.preview-image:hover {
  transform: scale(1.02);
}

.preview-video, .preview-audio {
  max-width: 100%;
  max-height: 100%;
  border-radius: 12px;
}

.preview-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border-radius: 16px;
}

.media-preview-metadata {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.preview-info {
  background-color: color-mix(in oklab, var(--card-bg-color), var(--primary-color) 2%);
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.preview-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.preview-action-button {
  height: 40px;
  border-radius: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.download-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-hover) 100%);
  border: none;
  font-weight: 600;
}

/* 响应式调整 */
@media (max-width: 992px) {
  .preview-modal {
    width: 90%;
  }
  
  .media-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .media-list-container {
    padding: 1rem;
  }
  
  .media-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .media-preview {
    flex-direction: column;
  }
  
  .media-preview-content,
  .media-preview-metadata {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .media-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 引用表格样式 */
.references-table-container {
  margin-top: 16px;
}

.references-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.references-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.references-table {
  border-radius: var(--border-radius);
  overflow: hidden;
  max-height: 300px;
}

.references-empty {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 预览模态框样式调整 */
.preview-modal {
  max-width: 90vw;
}

@media (max-width: 768px) {
  .preview-modal {
    width: 95vw !important;
  }
  
  .references-table {
    max-height: 200px;
  }
}
</style> 