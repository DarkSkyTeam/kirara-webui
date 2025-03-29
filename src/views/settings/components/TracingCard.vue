<script setup lang="ts">
import { onMounted } from 'vue'
import { NCard, NSpace, NButton, NForm, NFormItem, NSwitch, NSpin, NText } from 'naive-ui'
import { useTracingViewModel } from '../viewmodels/tracing.vm'

const {
  loading,
  formData,
  fetchConfig,
  handleSubmit
} = useTracingViewModel()

onMounted(() => {
  fetchConfig()
})
</script>

<template>
  <n-card title="内容追踪设置" class="settings-card">
    <div style="margin-bottom: 16px;">
      <n-text>
        配置系统是否记录LLM请求和响应的完整内容，用于调试和分析。
      </n-text>
    </div>
    <n-spin :show="loading">
      <n-form
        :model="formData"
        label-placement="left"
        label-width="160"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="启用LLM内容追踪" path="llm_tracing_content">
          <n-switch v-model:value="formData.llm_tracing_content" />
          <template #feedback>
            <n-text depth="3">
              启用后将记录所有LLM请求和响应的完整内容，可能包含敏感信息
            </n-text>
          </template>
        </n-form-item>
      </n-form>
      <div style="margin-top: 24px;">
        <n-space justify="end">
          <n-button
            type="primary"
            :loading="loading"
            @click="handleSubmit"
          >
            保存配置
          </n-button>
        </n-space>
      </div>
    </n-spin>
  </n-card>
</template>

<style scoped>
.settings-card {
  max-width: 800px;
  margin: 0 auto;
}
</style> 