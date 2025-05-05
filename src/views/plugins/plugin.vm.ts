import { ref } from 'vue'
import { http } from '@/utils/http'
import { useMessage } from 'naive-ui'

export interface PluginInfo {
  name: string
  package_name: string
  description: string
  version: string
  author: string
  homepage?: string
  license?: string
  is_internal: boolean
  is_enabled: boolean
  metadata?: {
    category?: string
    tags?: string[]
  }
}

export interface InstallForm {
  package_name: string
  version: string
}

export function usePluginViewModel() {
  const plugins = ref<PluginInfo[]>([])
  const loading = ref(false)
  const showInstallModal = ref(false)
  const installForm = ref<InstallForm>({
    package_name: '',
    version: ''
  })
  const message = useMessage()

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

  // 获取所有插件
  const fetchPlugins = async () => {
    loading.value = true
    try {
      const { plugins: pluginList } = await http.get<{ plugins: PluginInfo[] }>('/plugin/plugins')
      plugins.value = pluginList
    } catch (error: any) {
      handleError(error, '获取插件列表失败')
    } finally {
      loading.value = false
    }
  }

  // 安装插件
  const installPlugin = async () => {
    if (!installForm.value.package_name.trim()) {
      message.warning('请输入插件包名')
      return
    }

    loading.value = true
    try {
      await http.post('/plugin/plugins', installForm.value)
      showInstallModal.value = false
      await fetchPlugins()
      message.success('插件安装成功')
    } catch (error: any) {
      handleError(error, '安装插件失败')
    } finally {
      loading.value = false
    }
  }

  // 卸载插件
  const uninstallPlugin = async (plugin: PluginInfo) => {
    if (plugin.is_internal) {
      message.warning('内部插件不能卸载')
      return
    }

    loading.value = true
    try {
      await http.delete(`/plugin/plugins/${plugin.name}`)
      await fetchPlugins()
      message.success('插件卸载成功')
    } catch (error: any) {
      handleError(error, '卸载插件失败')
    } finally {
      loading.value = false
    }
  }

  // 启用/禁用插件
  const togglePluginStatus = async (plugin: PluginInfo) => {
    if (plugin.is_internal) {
      message.warning('内部插件不能被禁用')
      return
    }

    loading.value = true
    try {
      const action = plugin.is_enabled ? 'disable' : 'enable'
      await http.post(`/plugin/plugins/${plugin.name}/${action}`)
      await fetchPlugins()
      message.success(`插件${plugin.is_enabled ? '禁用' : '启用'}成功`)
    } catch (error: any) {
      handleError(error, '切换插件状态失败')
    } finally {
      loading.value = false
    }
  }

  // 更新插件
  const updatePlugin = async (plugin: PluginInfo) => {
    if (plugin.is_internal) {
      message.warning('内部插件不支持更新')
      return
    }

    loading.value = true
    try {
      await http.put(`/plugin/plugins/${plugin.name}`)
      await fetchPlugins()
      message.success('插件更新成功')
    } catch (error: any) {
      handleError(error, '更新插件失败')
    } finally {
      loading.value = false
    }
  }

  return {
    plugins,
    loading,
    showInstallModal,
    installForm,
    fetchPlugins,
    installPlugin,
    uninstallPlugin,
    togglePluginStatus,
    updatePlugin
  }
}
