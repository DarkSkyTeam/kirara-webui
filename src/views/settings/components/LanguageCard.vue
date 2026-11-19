<script setup lang="ts">
import { NCard, NSelect, NSpace, NText } from 'naive-ui'
import { locale, localeOptions, setLocale } from '@/i18n'

const handleLocaleChange = (value: 'zh-CN' | 'en-US' | 'ru-RU') => {
  setLocale(value)
}
</script>

<template>
  <n-card :title="$t('界面语言')" class="settings-card">
    <n-space vertical :size="16">
      <n-text depth="3">
        {{ $t('选择 WebUI 的显示语言。切换后页面将自动刷新。') }}
      </n-text>
      <n-select
        :value="locale"
        :options="localeOptions"
        :placeholder="$t('请选择界面语言')"
        @update:value="handleLocaleChange"
      />
    </n-space>
  </n-card>
</template>

<style scoped>
.settings-card {
  max-width: 800px;
  margin: 0 auto;
}
</style>
