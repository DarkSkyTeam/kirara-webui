<template>
  <div class="media-list-container">
    <n-card title="媒体管理">
      <template #header-extra>
        <n-space>
          <n-button @click="selectAll">全选本页</n-button>
          <n-button
            type="error"
            :disabled="selectedMediaIds.length === 0"
            @click="handleBatchDelete"
          >
            批量删除
          </n-button>
        </n-space>
      </template>

      <n-space vertical size="large">
        <!-- 搜索条件 -->
        <n-card title="搜索条件" size="small">
          <n-grid :cols="4" :x-gap="16">
            <n-grid-item>
              <n-input
                v-model:value="searchParams.query"
                placeholder="搜索关键词"
                clearable
              />
            </n-grid-item>
            <n-grid-item>
              <n-select
                v-model:value="searchParams.content_type"
                placeholder="媒体类型"
                :options="contentTypeOptions"
                clearable
              />
            </n-grid-item>
            <n-grid-item>
              <n-date-picker
                v-model:value="dateRange"
                type="daterange"
                clearable
                style="width: 100%"
              />
            </n-grid-item>
            <n-grid-item>
              <n-space justify="end">
                <n-button @click="resetSearch">重置</n-button>
                <n-button type="primary" @click="handleSearch">搜索</n-button>
              </n-space>
            </n-grid-item>
          </n-grid>
        </n-card>

        <!-- 媒体列表 -->
        <div class="media-grid" v-if="!loading">
          <n-grid :cols="5" :x-gap="16" :y-gap="16">
            <n-grid-item v-for="item in mediaList" :key="item.id">
              <n-card
                :class="{
                  'media-card': true,
                  'media-card-selected': selectedMediaIds.includes(item.id),
                }"
                hoverable
                @click="handlePreview(item)"
              >
                <div class="media-card-content">
                  <div class="media-card-image">
                    <n-image
                      :src="getPreviewUrl(item.id)"
                      object-fit="contain"
                      preview-disabled
                      @click.stop="handlePreview(item)"
                      style="height: 100%; background-color: oklch(0.967 0.003 264.542)"
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
                  </div>
                  <div class="media-card-info">
                    <div class="media-card-filename">
                      {{ item.metadata.filename }}
                    </div>
                    <div class="media-card-meta">
                      {{ formatFileSize(item.metadata.size) }} |
                      {{ formatDate(item.metadata.upload_time) }}
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
        />

        <n-spin
          v-if="loading"
          size="large"
          style="display: flex; justify-content: center"
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
          style="display: flex; justify-content: center; margin-top: 16px"
        />
      </n-space>
    </n-card>

    <!-- 预览对话框 -->
    <n-modal
      v-model:show="showPreviewModal"
      preset="card"
      :style="{ width: '900px', borderRadius: '12px' }"
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
                style="max-height: 400px"
              />
              <video
                v-else-if="previewItem.metadata.content_type.startsWith('video/')"
                :src="getRawUrl(previewItem.id)"
                controls
                style="max-height: 400px; width: 100%; border-radius: 8px"
              ></video>
              <audio
                v-else-if="previewItem.metadata.content_type.startsWith('audio/')"
                :src="getRawUrl(previewItem.id)"
                controls
                style="width: 100%; border-radius: 8px"
              ></audio>
              <n-card
                v-else
                title="无法预览"
                size="small"
                style="border-radius: 8px"
              >
                <n-button @click="downloadMedia(previewItem)">
                  下载文件
                </n-button>
              </n-card>
            </div>
          </n-grid-item>
          <n-grid-item>
            <div class="media-preview-metadata">
              <n-descriptions title="文件信息" :column="1">
                <n-descriptions-item label="文件名">
                  {{ previewItem.metadata.filename }}
                </n-descriptions-item>
                <n-descriptions-item label="大小">
                  {{ formatFileSize(previewItem.metadata.size) }}
                </n-descriptions-item>
                <n-descriptions-item label="类型">
                  {{ previewItem.metadata.content_type }}
                </n-descriptions-item>
                <n-descriptions-item label="上传时间">
                  {{ formatDateTime(previewItem.metadata.upload_time) }}
                </n-descriptions-item>
                <n-descriptions-item
                  label="来源"
                  v-if="previewItem.metadata.source"
                >
                  {{ previewItem.metadata.source }}
                </n-descriptions-item>
              </n-descriptions>
            </div>
          </n-grid-item>
        </n-grid>
      </div>
      <template #footer>
        <n-space justify="end">
          <n-button
            type="error"
            @click="handleDeleteMedia(previewItem)"
            style="border-radius: 8px"
          >
            删除
          </n-button>
          <n-button @click="showPreviewModal = false" style="border-radius: 8px">
            关闭
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
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
} from 'naive-ui'
import { ImageOutline } from '@vicons/ionicons5'
import { useMediaViewModel } from './media.vm'

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
</script>

<style scoped>
.media-list-container {
  padding: 16px;
  animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.media-grid {
  margin-top: 16px;
}

.media-card {
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.media-card-selected {
  border: 2px solid var(--primary-color);
}

.media-card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.media-card-image {
  position: relative;
  height: 180px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
}

.media-card-image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-card-checkbox {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 4px;
  padding: 2px;
}

.media-card-info {
  padding: 8px 0;
}

.media-card-filename {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.media-card-meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.media-load-more {
  margin-top: 24px;
  padding-bottom: 16px;
}

/* 模态框样式 */
.media-preview-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  background-color: oklch(0.967 0.003 264.542);
}

.media-preview-content img,
.media-preview-content video,
.media-preview-content audio {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 添加动画效果 */
.media-card {
  transition: transform 0.3s ease;
}

.media-card:hover {
  transform: scale(1.05);
}
</style> 