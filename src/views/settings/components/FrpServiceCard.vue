<script setup lang="ts">
import { onMounted, computed, ref, onUnmounted } from 'vue'
import {
  NCard,
  NSpace,
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSpin,
  NText,
  NSwitch,
  NAlert,
  NProgress,
  NTag,
  NDivider
} from 'naive-ui'
import { useFrpcViewModel } from '../viewmodels/frpc.vm'

const {
  loading,
  downloading,
  status,
  formData,
  rules,
  downloadProgress,
  downloadStatus,
  downloadErrorMessage,
  fetchStatus,
  handleSubmit,
  startFrpc,
  stopFrpc,
  downloadFrpc
} = useFrpcViewModel()

const isInstalled = computed(() => status.value?.is_installed || false)
const isRunning = computed(() => status.value?.is_running || false)
const hasError = computed(
  () => status.value?.error_message && status.value.error_message.length > 0
)
const version = computed(() => status.value?.version || '')
const isDownloading = computed(() => downloadStatus.value === 'downloading')
const hasDownloadError = computed(
  () => downloadStatus.value === 'error' && downloadErrorMessage.value
)

const formRef = ref<InstanceType<typeof NForm> | null>(null)

onMounted(() => {
  fetchStatus()
})

const saveConfig = () => {
  formRef.value
    ?.validate((errors) => {
      if (!errors) {
        handleSubmit()
      } else {
        console.error('表单验证失败', errors)
      }
    })
    .catch((error) => {
      console.error('表单验证失败', error)
    })
}
</script>

<template>
  <n-card title="FRP 内网穿透" class="settings-card">
    <div style="margin-bottom: 16px">
      <n-text>
        FRP
        是一个可用于内网穿透的高性能的反向代理应用，可以帮助您将本地服务暴露到公网，方便远程访问和管理，或者接收
        IM 平台的 Webhook。
        <a href="https://gofrp.org/zh-cn/docs/setup/" target="_blank"
          >查看 FRP 官方文档了解如何搭建服务端。</a
        >
      </n-text>
    </div>

    <n-spin :show="loading && !isDownloading">
      <div v-if="!isInstalled" class="frp-not-installed">
        <n-alert type="warning" title="FRP 客户端未安装">
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
              </svg>
            </n-icon>
          </template>
          <div>
            <p>您需要先下载 FRP 客户端才能使用内网穿透功能。</p>
            <n-button
              type="primary"
              :loading="downloading && !isDownloading"
              :disabled="isDownloading"
              @click="downloadFrpc"
              style="margin-top: 8px"
            >
              {{ isDownloading ? '下载中...' : '下载 FRP 客户端' }}
            </n-button>

            <div
              v-if="isDownloading || downloadProgress > 0 || hasDownloadError"
              class="download-progress-container"
            >
              <n-alert
                v-if="hasDownloadError"
                type="error"
                title="下载失败"
                style="margin-bottom: 16px"
              >
                {{ downloadErrorMessage }}
              </n-alert>

              <n-progress
                type="line"
                :percentage="downloadProgress"
                :show-indicator="true"
                :processing="downloadProgress < 100 && !hasDownloadError"
                :status="
                  hasDownloadError ? 'error' : downloadStatus === 'completed' ? 'success' : 'info'
                "
                style="margin-top: 8px"
              />

              <div class="download-status">
                <n-text depth="3">
                  {{
                    hasDownloadError
                      ? '下载失败'
                      : downloadStatus === 'completed'
                      ? '下载完成'
                      : `正在下载 FRP 客户端 (${downloadProgress.toFixed(1)}%)`
                  }}
                </n-text>

                <n-button v-if="hasDownloadError" size="small" @click="downloadFrpc">
                  重试
                </n-button>
              </div>
            </div>
          </div>
        </n-alert>
      </div>

      <div v-else>
        <div class="frp-status">
          <n-space align="center">
            <n-text>状态:</n-text>
            <n-tag :type="isRunning ? 'success' : 'error'">
              {{ isRunning ? '运行中' : '已停止' }}
            </n-tag>
            <n-text v-if="version">版本: {{ version }}</n-text>
            <template v-if="isRunning && status?.remote_url">
              <n-text>远程地址:</n-text>
              <n-tag type="info">
                <a :href="status?.remote_url" target="_blank">{{ status?.remote_url }}</a>
              </n-tag>
            </template>
          </n-space>
        </div>

        <n-alert v-if="hasError" type="error" title="错误信息" style="margin: 16px 0">
          {{ status?.error_message }}
        </n-alert>

        <n-divider />

        <n-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-placement="left"
          label-width="120"
          require-mark-placement="right-hanging"
        >
          <n-form-item label="启用服务" path="enable">
            <n-switch v-model:value="formData.enable" />
            <template #feedback>
              <n-text depth="3">启用后，系统将在启动时自动启动 FRP 服务</n-text>
            </template>
          </n-form-item>

          <n-form-item label="服务器地址" path="server_addr">
            <n-input v-model:value="formData.server_addr" placeholder="请输入 FRP 服务器地址" />
            <template #feedback>
              <n-text depth="3">FRP 服务器的 IP 地址或域名</n-text>
            </template>
          </n-form-item>

          <n-form-item label="服务器端口" path="server_port">
            <n-input-number
              v-model:value="formData.server_port"
              placeholder="请输入 FRP 服务器端口"
            />
            <template #feedback>
              <n-text depth="3">FRP 服务器的端口号，默认为 7000</n-text>
            </template>
          </n-form-item>

          <n-form-item label="连接令牌" path="token">
            <n-input
              v-model:value="formData.token"
              placeholder="请输入连接令牌"
              type="password"
              show-password-on="click"
            />
            <template #feedback>
              <n-text depth="3">FRP 服务器的连接令牌，如果服务器未设置则留空</n-text>
            </template>
          </n-form-item>

          <n-form-item label="远程端口" path="remote_port">
            <n-input-number v-model:value="formData.remote_port" placeholder="请输入远程端口" />
            <template #feedback>
              <n-text depth="3">映射到公网的端口号，设置为 0 表示由服务器随机分配</n-text>
            </template>
          </n-form-item>
        </n-form>

        <div style="margin-top: 24px">
          <n-space justify="end">
            <n-button type="primary" :loading="loading" @click="saveConfig"> 保存配置 </n-button>
          </n-space>
        </div>
      </div>
    </n-spin>
  </n-card>
</template>

<style scoped>
.settings-card {
  max-width: 800px;
  margin: 0 auto;
}

.frp-status {
  margin-bottom: 16px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.frp-not-installed {
  margin-bottom: 16px;
}

.download-progress-container {
  margin-top: 16px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.download-status {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
