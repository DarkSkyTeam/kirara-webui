<script setup lang="ts">
import { onMounted } from 'vue'
import { NCard, NSpace, NButton, NForm, NFormItem, NSelect, NSpin, NText } from 'naive-ui'
import { useTimezoneViewModel } from '../viewmodels/timezone.vm'

const { loading, formData, rules, timezoneOptions, fetchConfig, handleSubmit } =
  useTimezoneViewModel()

onMounted(() => {
  fetchConfig()
})
</script>

<template>
  <n-card title="时区设置" class="settings-card">
    <div style="margin-bottom: 16px">
      <n-text> 设置系统时区，影响系统中所有时间的显示和记录， Windows 下修改此设置无效。 </n-text>
    </div>
    <n-spin :show="loading">
      <n-form
        :model="formData"
        :rules="rules"
        label-placement="left"
        label-width="120"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="系统时区" path="timezone">
          <n-select
            v-model:value="formData.timezone"
            :options="timezoneOptions"
            placeholder="请选择系统时区"
            filterable
          />
          <template #feedback>
            <n-text depth="3"
              >系统时区将影响所有时间的显示和记录，请选择与您所在地区匹配的时区</n-text
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
