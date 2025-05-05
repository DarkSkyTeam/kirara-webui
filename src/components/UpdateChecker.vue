<script setup lang="ts">
import { NModal, NCard, NSpace, NButton, NProgress, NText, NIcon } from 'naive-ui'
import { CloudDownload } from '@vicons/ionicons5'
import { useAppStore } from '@/stores/app'
import { useUpdateViewModel } from '@/views/system/update.vm'

const appStore = useAppStore()
const {
  showUpdateModal,
  updateInProgress,
  updateProgress,
  checkUpdate,
  startUpdate,
  remindLater,
  skipVersion
} = useUpdateViewModel()

// 导出检查更新方法供其他组件使用
defineExpose({
  checkUpdate,
  showUpdateModal
})
</script>

<template>
  <n-modal v-model:show="showUpdateModal" :mask-closable="false">
    <n-card
      style="width: 600px"
      title="发现新版本"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
    >
      <template #header-extra>
        <n-icon size="24">
          <cloud-download />
        </n-icon>
      </template>

      <n-space vertical size="large">
        <div v-if="!updateInProgress">
          <div class="version-info">
            <div class="version-title">后端版本</div>
            <div class="version-row">
              <span class="version-label">当前版本：</span>
              <n-text>{{ appStore.updateInfo?.current_backend_version }}</n-text>
            </div>
            <div class="version-row">
              <span class="version-label">最新版本：</span>
              <n-text :type="appStore.updateInfo?.backend_update_available ? 'success' : ''">
                {{ appStore.updateInfo?.latest_backend_version }}
              </n-text>
            </div>
          </div>

          <div class="version-info">
            <div class="version-title">WebUI 版本</div>
            <div class="version-row">
              <span class="version-label">当前版本：</span>
              <n-text>{{ appStore.updateInfo?.current_webui_version }}</n-text>
            </div>
            <div class="version-row">
              <span class="version-label">最新版本：</span>
              <n-text :type="appStore.updateInfo?.webui_update_available ? 'success' : ''">
                {{ appStore.updateInfo?.latest_webui_version }}
              </n-text>
            </div>
          </div>
        </div>

        <div v-else class="update-progress">
          <div class="progress-step">{{ updateProgress.step }}</div>
          <n-progress
            type="line"
            :percentage="updateProgress.percentage"
            :indicator-placement="'inside'"
            processing
          />
        </div>
      </n-space>

      <template #footer>
        <n-space justify="end">
          <n-button v-if="!updateInProgress" @click="skipVersion"> 跳过此版本 </n-button>
          <n-button v-if="!updateInProgress" @click="remindLater"> 稍后提醒 </n-button>
          <n-button v-if="!updateInProgress" type="primary" @click="startUpdate">
            立即更新
          </n-button>
          <n-text v-else> 更新进行中，请勿关闭窗口... </n-text>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>

<style scoped>
.version-info {
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.version-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 10px;
  color: #333;
}

.version-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.version-label {
  width: 100px;
  color: #666;
}

.update-progress {
  padding: 20px 0;
}

.progress-step {
  margin-bottom: 15px;
  font-size: 14px;
  color: #666;
  text-align: center;
}
</style>
