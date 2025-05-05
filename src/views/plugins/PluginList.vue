<script setup lang="ts">
import { h, onMounted } from 'vue'
import {
  NCard,
  NSpace,
  NButton,
  NDataTable,
  NTag,
  NSwitch,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSpin,
  NIcon
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useRouter } from 'vue-router'
import { usePluginViewModel } from './plugin.vm'
import type { PluginInfo } from './plugin.vm'
import { AddOutline } from '@vicons/ionicons5'

const router = useRouter()
const {
  plugins,
  loading,
  showInstallModal,
  installForm,
  fetchPlugins,
  installPlugin,
  uninstallPlugin,
  togglePluginStatus,
  updatePlugin
} = usePluginViewModel()

const createColumns = (): DataTableColumns<PluginInfo> => {
  return [
    {
      title: '名称',
      key: 'name',
      render(row) {
        return h('div', {}, [
          h('div', {}, row.name),
          h('div', { style: 'font-size: 12px; color: var(--n-text-color-3);' }, row.package_name)
        ])
      }
    },
    {
      title: '描述',
      key: 'description'
    },
    {
      title: '版本',
      key: 'version'
    },
    {
      title: '作者',
      key: 'author'
    },
    {
      title: '类型',
      key: 'is_internal',
      render(row) {
        return h(
          NTag,
          {
            type: row.is_internal ? 'info' : 'success'
          },
          { default: () => (row.is_internal ? '内部插件' : '第三方插件') }
        )
      }
    },
    {
      title: '状态',
      key: 'is_enabled',
      render(row) {
        return h(NSwitch, {
          value: row.is_enabled,
          disabled: row.is_internal,
          onUpdateValue: () => togglePluginStatus(row)
        })
      }
    },
    {
      title: '操作',
      key: 'actions',
      render(row) {
        return h(
          NSpace,
          {},
          {
            default: () => [
              h(
                NButton,
                {
                  size: 'small',
                  disabled: row.is_internal,
                  onClick: () => updatePlugin(row)
                },
                { default: () => '更新' }
              ),
              h(
                NButton,
                {
                  size: 'small',
                  type: 'error',
                  disabled: row.is_internal,
                  onClick: () => uninstallPlugin(row)
                },
                { default: () => '卸载' }
              )
            ]
          }
        )
      }
    }
  ]
}

onMounted(() => {
  fetchPlugins()
})
</script>

<template>
  <div class="plugin-list">
    <n-space vertical :size="16">
      <n-card title="已安装插件">
        <template #header-extra>
          <NButton type="primary" @click="showInstallModal = true" class="create-button">
            <template #icon>
              <NIcon>
                <AddOutline />
              </NIcon>
            </template>
            安装插件
          </NButton>
        </template>
        <n-spin :show="loading">
          <n-data-table :columns="createColumns()" :data="plugins" />
        </n-spin>
      </n-card>
    </n-space>

    <!-- 安装插件表单 -->
    <n-modal v-model:show="showInstallModal">
      <n-card style="width: 400px" title="安装插件">
        <n-form :model="installForm" label-placement="left" label-width="100">
          <n-form-item label="Pypi 包名" path="package_name">
            <n-input
              v-model:value="installForm.package_name"
              placeholder="请输入插件的 Pypi 包名"
            />
          </n-form-item>
          <n-form-item label="版本" path="version">
            <n-input v-model:value="installForm.version" placeholder="请输入版本号（可选）" />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showInstallModal = false">取消</n-button>
            <n-button type="primary" :loading="loading" @click="installPlugin">确定</n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<style scoped>
.plugin-list {
  height: 100%;
}
</style>
