<script setup lang="ts">
import { NCard, NSpace, NButton, NForm, NFormItem, NInput, NSpin, NText } from 'naive-ui'
import { usePasswordViewModel } from '../viewmodels/password.vm'

const { loading, formData, rules, handleSubmit } = usePasswordViewModel()
</script>

<template>
  <n-card title="修改密码" class="settings-card">
    <div style="margin-bottom: 16px">
      <n-text>
        配置 WebUI 的登录密码，如果你的 WebUI 可被外部访问，请务必设置一个复杂的密码，以免被破解。
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
        <n-form-item label="当前密码" path="old_password">
          <n-input
            v-model:value="formData.old_password"
            type="password"
            show-password-on="click"
            placeholder="请输入当前密码"
          />
          <template #feedback>
            <n-text depth="3">请输入您当前的登录密码</n-text>
          </template>
        </n-form-item>
        <n-form-item label="新密码" path="new_password">
          <n-input
            v-model:value="formData.new_password"
            type="password"
            show-password-on="click"
            placeholder="请输入新密码"
          />
          <template #feedback>
            <n-text depth="3">新密码将用于后续登录，请妥善保管</n-text>
          </template>
        </n-form-item>
        <n-form-item label="确认新密码" path="confirm_password">
          <n-input
            v-model:value="formData.confirm_password"
            type="password"
            show-password-on="click"
            placeholder="请再次输入新密码"
          />
          <template #feedback>
            <n-text depth="3">请再次输入新密码以确认</n-text>
          </template>
        </n-form-item>
      </n-form>
      <div style="margin-top: 24px">
        <n-space justify="end">
          <n-button type="primary" :loading="loading" @click="handleSubmit"> 修改密码 </n-button>
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
