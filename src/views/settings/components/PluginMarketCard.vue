<script setup lang="ts">
import { onMounted } from 'vue'
import { NCard, NSpace, NButton, NForm, NFormItem, NInput, NSpin, NText } from 'naive-ui'
import { usePluginViewModel } from '../viewmodels/plugin.vm'

const { loading, formData, rules, fetchConfig, handleSubmit } = usePluginViewModel()

onMounted(() => {
  fetchConfig()
})
</script>

<template>
  <n-card title="插件市场配置" class="settings-card">
    <n-spin :show="loading">
      <n-form
        :model="formData"
        :rules="rules"
        label-placement="left"
        label-width="120"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="市场地址" path="market_base_url">
          <n-input v-model:value="formData.market_base_url" placeholder="请输入插件市场基础URL" />
          <template #feedback>
            <n-text depth="3"
              >插件市场的API地址，用于获取插件列表，修改后可能影响插件的安装和更新</n-text
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
