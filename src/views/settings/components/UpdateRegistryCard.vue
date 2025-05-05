<script setup lang="ts">
import { onMounted } from 'vue'
import { NCard, NSpace, NButton, NForm, NFormItem, NSelect, NSpin, NText } from 'naive-ui'
import { useUpdateViewModel } from '../viewmodels/update.vm'

const {
  loading,
  formData,
  rules,
  pypiRegistryOptions,
  npmRegistryOptions,
  renderLabel,
  fetchConfig,
  handleSubmit
} = useUpdateViewModel()

onMounted(() => {
  fetchConfig()
})
</script>

<template>
  <n-card title="更新源配置" class="settings-card">
    <div style="margin-bottom: 16px">
      <n-text>
        这里配置的镜像源地址会影响插件的安装和项目本体的更新检查。
        请根据你的网络环境选择合适的镜像源，以获得更快的下载速度和更好的使用体验。
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
        <n-form-item label="PyPI镜像源" path="pypi_registry">
          <n-select
            v-model:value="formData.pypi_registry"
            :options="pypiRegistryOptions"
            :render-label="renderLabel"
            filterable
            tag
            placeholder="请选择或输入PyPI镜像源地址"
          />
          <template #feedback>
            <n-text depth="3"
              >用于下载Python包的镜像源，国内用户可以选择阿里云或清华镜像以提高下载速度</n-text
            >
          </template>
        </n-form-item>
        <n-form-item label="NPM镜像源" path="npm_registry">
          <n-select
            v-model:value="formData.npm_registry"
            :options="npmRegistryOptions"
            :render-label="renderLabel"
            filterable
            tag
            placeholder="请选择或输入NPM镜像源地址"
          />
          <template #feedback>
            <n-text depth="3"
              >用于下载前端依赖的镜像源，国内用户可以选择淘宝镜像以提高下载速度</n-text
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
