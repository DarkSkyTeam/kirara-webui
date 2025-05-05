<script setup lang="ts">
import { onMounted } from 'vue'
import {
  NCard,
  NSpace,
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSpin,
  NText
} from 'naive-ui'
import { useWebViewModel } from '../viewmodels/web.vm'

const { loading, formData, rules, fetchConfig, handleSubmit } = useWebViewModel()

onMounted(() => {
  fetchConfig()
})
</script>

<template>
  <n-card title="Web服务配置" class="settings-card">
    <div style="margin-bottom: 16px">
      <n-text>
        WebUI 服务和 HTTP 服务是绑定在同一 IP 地址和端口号上的，
        你可以在这里修改监听地址，配置成外部可访问的模式。
      </n-text>
    </div>
    <n-spin :show="loading">
      <n-form
        :model="formData"
        :rules="rules"
        label-placement="left"
        label-width="120"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="服务地址" path="host">
          <n-input v-model:value="formData.host" placeholder="请输入Web服务绑定的IP地址" />
          <template #feedback>
            <n-text depth="3"
              >Web服务监听的IP地址，设置为0.0.0.0可以允许从任意IP访问，设置为127.0.0.1则只允许本机访问</n-text
            >
          </template>
        </n-form-item>
        <n-form-item label="服务端口" path="port">
          <n-input-number v-model:value="formData.port" placeholder="请输入Web服务端口号" />
          <template #feedback>
            <n-text depth="3"
              >Web服务监听的端口号，请确保该端口未被其他程序占用，否则会导致服务无法启动。</n-text
            >
          </template>
        </n-form-item>
      </n-form>
      <div style="margin-top: 24px">
        <n-space justify="end">
          <n-button type="primary" :loading="loading" @click="handleSubmit"> 保存配置 </n-button>
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
