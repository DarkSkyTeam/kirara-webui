<script setup lang="ts">
import { imApi } from '@/api/im'
import type { IMAdapter, IMAdapterInfo } from '@/api/im'
import { ref, onMounted, h } from 'vue'
import {
  NCard,
  NSpace,
  NButton,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSpin,
  useMessage,
  NGrid,
  NGridItem,
  NIcon,
  NTag,
  NAvatar
} from 'naive-ui'
import { useRouter } from 'vue-router'

const message = useMessage()
const adapterTypes = ref<string[]>([])
const adapters = ref<IMAdapter[]>([])
const loading = ref(false)
const router = useRouter()
const adapterInfos = ref<Record<string, IMAdapterInfo>>({})

// 获取适配器类型
const fetchAdapterTypes = async () => {
  try {
    const { types, adapters } = await imApi.getAdapterTypes()
    adapterTypes.value = types
    adapterInfos.value = adapters ?? {}
  } catch (error) {
    message.error('获取适配器类型失败: ' + error)
    console.error('获取适配器类型失败:', error)
  }
}

// 获取所有适配器
const fetchAdapters = async () => {
  try {
    const response = await imApi.getAdapters()
    adapters.value = response.adapters || []
  } catch (error) {
    message.error('获取适配器列表失败: ' + error)
    console.error('获取适配器列表失败:', error)
  }
}

// 检查适配器是否已配置
const isAdapterConfigured = (adapterType: string) => {
  return adapters.value.some((a) => a.adapter === adapterType)
}

// 点击适配器卡片
const handleAdapterClick = async (adapterType: string) => {
  // 导航到适配器类型的配置页面
  router.push(`/im/adapters/${adapterType}`)
}

onMounted(() => {
  fetchAdapterTypes()
  fetchAdapters()
})
</script>

<template>
  <div class="im-view">
    <n-card title="聊天平台管理" class="im-card">
      <template #header-extra>
        <n-button type="primary" @click="fetchAdapterTypes" class="refresh-button"> 刷新 </n-button>
      </template>

      <div class="im-view-description">
        在这里配置 Kirara AI 与聊天平台的连接方式，更多介绍请阅读<a
          href="https://kirara-docs.app.lss233.com/guide/configuration/im.html"
          target="_blank"
          >官方文档</a
        >。
      </div>

      <n-spin :show="loading">
        <n-grid :cols="3" :x-gap="16" :y-gap="16" responsive="screen">
          <n-grid-item v-for="type in adapterTypes" :key="type" :span="1">
            <n-card class="adapter-card" hoverable @click="handleAdapterClick(type)">
              <template #header>
                <div class="adapter-card-header">
                  <n-space>
                    <n-avatar
                      :size="30"
                      round
                      :src="'/assets/icons/im/' + type + '.png'"
                      fallback-src="/assets/icons/im/fallback-im.svg"
                    />
                    <span class="adapter-type">{{
                      adapterInfos[type]?.localized_name || type
                    }}</span>
                  </n-space>

                  <n-tag
                    :type="isAdapterConfigured(type) ? 'success' : 'default'"
                    size="small"
                    round
                  >
                    {{ isAdapterConfigured(type) ? '已配置' : '未配置' }}
                  </n-tag>
                </div>
              </template>
              <div class="adapter-card-content">
                {{ adapterInfos[type]?.localized_description }}
              </div>
            </n-card>
          </n-grid-item>
        </n-grid>
      </n-spin>
    </n-card>
  </div>
</template>

<style scoped>
.im-view {
  height: 100%;
  padding: var(--n-padding-md);
}

.im-card {
  animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 24px;
  height: var(--n-window-height);
}

.im-view-description {
  margin-bottom: 24px;
  color: var(--text-color-secondary);
  line-height: 1.6;
}

.adapter-card {
  cursor: pointer;
  transition: all 0.3s;
  height: 100%;
}

.adapter-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--box-shadow-hover);
}

.adapter-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.adapter-type {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-color);
}

.adapter-card-content {
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.adapter-info {
  margin: 0;
  color: var(--text-color-secondary);
}

.adapter-hint {
  margin: 0;
  color: var(--text-color-tertiary);
  font-style: italic;
}

.adapter-edit-container {
  display: flex;
  min-height: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.adapter-basic-form {
  flex: 0 0 400px;
  padding-right: 16px;
}

.adapter-extra-form {
  flex: 1;
  padding-left: 16px;
  padding-right: 16px;
  border-left: 1px solid var(--border-color);
}

.refresh-button {
  margin-left: 8px;
}

@media (max-width: 768px) {
  .adapter-edit-container {
    flex-direction: column;
  }

  .adapter-basic-form {
    flex: none;
    padding-right: 0;
    margin-bottom: 16px;
  }

  .adapter-extra-form {
    flex: none;
    padding-left: 0;
    border-left: none;
    border-top: 1px solid var(--border-color);
    padding-top: 16px;
  }
}
</style>
