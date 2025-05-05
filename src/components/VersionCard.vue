<script setup lang="ts">
import { NCard, NSpace, NText, NButton } from 'naive-ui'
import { useAppStore } from '@/stores/app'
import { useUpdateViewModel } from '@/views/system/update.vm'
import { version } from '@/utils/version'

const appStore = useAppStore()
const { checkUpdate } = useUpdateViewModel()

// 从环境变量获取版本号
const webUIVersion = import.meta.env.VITE_APP_VERSION || 'unknown'

const handleCheckUpdate = () => {
  checkUpdate()
}
</script>

<template>
  <n-card title="版本信息" :bordered="false" class="version-card">
    <n-space vertical>
      <div class="version-row">
        <span class="version-label">WebUI 版本：</span>
        <n-text>{{ webUIVersion }}</n-text>
        <n-text
          v-if="appStore.updateInfo?.webui_update_available"
          type="success"
          style="margin-left: 8px"
        >
          (有更新: {{ appStore.updateInfo?.latest_webui_version }})
        </n-text>
      </div>

      <div class="version-row">
        <span class="version-label">后端版本：</span>
        <n-text>{{ appStore.systemStatus.version }}</n-text>
        <n-text
          v-if="appStore.updateInfo?.backend_update_available"
          type="success"
          style="margin-left: 8px"
        >
          (有更新: {{ appStore.updateInfo?.latest_backend_version }})
        </n-text>
      </div>

      <div style="text-align: right; margin-top: 12px">
        <n-button type="primary" size="small" @click="handleCheckUpdate"> 检查更新 </n-button>
      </div>
    </n-space>
  </n-card>
</template>

<style scoped>
.version-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
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
</style>
