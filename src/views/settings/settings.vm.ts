import { ref } from 'vue'
import { http } from '@/utils/http'
import { useMessage, useDialog } from 'naive-ui'
import type { SelectOption } from 'naive-ui'

export interface SystemConfig {
  web: {
    host: string
    port: number
    secret_key: string
  }
  plugins: {
    market_base_url: string
  }
  update: {
    pypi_registry: string
    npm_registry: string
  }
}

export function useSettingsViewModel() {
  const config = ref<SystemConfig>({
    web: {
      host: '127.0.0.1',
      port: 8080,
      secret_key: ''
    },
    plugins: {
      market_base_url: 'https://kirara-plugin.app.lss233.com/api/v1'
    },
    update: {
      pypi_registry: 'https://pypi.org/simple',
      npm_registry: 'https://registry.npmjs.org'
    }
  })

  const loading = ref(false)
  const message = useMessage()
  const dialog = useDialog()

  // 预设的镜像源选项
  const pypiRegistryOptions: SelectOption[] = [
    { label: 'PyPI 官方', value: 'https://pypi.org/simple' },
    { label: '阿里云镜像', value: 'https://mirrors.aliyun.com/pypi/simple' },
    { label: '清华镜像', value: 'https://pypi.tuna.tsinghua.edu.cn/simple' }
  ]

  const npmRegistryOptions: SelectOption[] = [
    { label: 'NPM 官方', value: 'https://registry.npmjs.org' },
    { label: '淘宝镜像', value: 'https://registry.npmmirror.com' }
  ]

  // 处理错误信息
  const handleError = (error: any, defaultMessage: string) => {
    console.error(defaultMessage + ':', error)
    if (error.response?.data?.message) {
      message.error(error.response.data.message)
    } else if (error.message) {
      message.error(error.message)
    } else {
      message.error(defaultMessage)
    }
  }

  // 获取系统配置
  const fetchConfig = async () => {
    loading.value = true
    try {
      const response = await http.get<SystemConfig>('/system/config')
      config.value = response
    } catch (error: any) {
      handleError(error, '获取系统配置失败')
    } finally {
      loading.value = false
    }
  }

  // 保存Web配置
  const saveWebConfig = async () => {
    loading.value = true
    try {
      const response = await http.post<{ status: string; restart_required: boolean }>(
        '/system/config/web',
        config.value.web
      )
      if (response.restart_required) {
        dialog.warning({
          title: '需要重启',
          content: '修改Web配置需要重启服务才能生效，是否继续？',
          positiveText: '确定',
          negativeText: '取消',
          onPositiveClick: async () => {
            message.success('保存配置成功')
            // 调用重启接口
            await http.post('/system/restart')
          }
        })
      }
    } catch (error: any) {
      handleError(error, '保存Web配置失败')
    } finally {
      loading.value = false
    }
  }

  // 保存插件配置
  const savePluginsConfig = async () => {
    loading.value = true
    try {
      await http.post('/system/config/plugins', config.value.plugins)
      message.success('保存插件配置成功')
    } catch (error: any) {
      handleError(error, '保存插件配置失败')
    } finally {
      loading.value = false
    }
  }

  // 保存更新源配置
  const saveUpdateConfig = async () => {
    loading.value = true
    try {
      await http.post('/system/config/update', config.value.update)
      message.success('保存更新源配置成功')
    } catch (error: any) {
      handleError(error, '保存更新源配置失败')
    } finally {
      loading.value = false
    }
  }

  return {
    config,
    loading,
    pypiRegistryOptions,
    npmRegistryOptions,
    fetchConfig,
    saveWebConfig,
    savePluginsConfig,
    saveUpdateConfig
  }
}
