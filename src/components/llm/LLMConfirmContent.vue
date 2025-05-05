<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import { NSpace, NButton } from 'naive-ui'

const props = defineProps<{
  title: string
  content: string
  loading?: boolean
  confirmText?: string
  cancelText?: string
  confirmType?: 'default' | 'tertiary' | 'primary' | 'info' | 'success' | 'warning' | 'error'
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div class="confirm-content">
    <div class="confirm-title">{{ title }}</div>
    <div class="confirm-body">{{ content }}</div>
    <n-space justify="end" style="margin-top: 24px">
      <n-button @click="handleCancel" class="cancel-button">{{ cancelText || '取消' }}</n-button>
      <n-button
        :type="confirmType || 'primary'"
        @click="handleConfirm"
        :loading="loading"
        class="confirm-button"
      >
        {{ confirmText || '确认' }}
      </n-button>
    </n-space>
  </div>
</template>

<style scoped>
.confirm-content {
  padding: 16px;
}

.confirm-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 16px;
}

.confirm-body {
  margin-bottom: 16px;
  color: var(--text-color-secondary);
}

.cancel-button,
.confirm-button {
  transition: all 0.3s ease;
}

.cancel-button:hover,
.confirm-button:hover {
  transform: translateY(-2px);
}
</style>
