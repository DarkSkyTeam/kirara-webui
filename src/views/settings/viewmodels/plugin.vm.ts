import { ref } from 'vue'
import { http } from '@/utils/http'
import { useMessage } from 'naive-ui'
import type { FormRules } from 'naive-ui'

export interface PluginForm {
  market_base_url: string
}

export interface PluginConfig {
  plugins: PluginForm
}

export function usePluginViewModel() {
  const loading = ref(false)
  const message = useMessage()

  const formData = ref<PluginForm>({
    market_base_url: 'https://kirara-plugin.app.lss233.com/api/v1'
  })

  const rules: FormRules = {
    market_base_url: {
      required: true,
      message: '请输入插件市场地址',
      trigger: 'blur'
    }
  }

  const fetchConfig = async () => {
    loading.value = true
    try {
      const response = await http.get<PluginConfig>('/system/config')
      formData.value = response.plugins
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message)
      } else {
        message.error('获取配置失败')
      }
    } finally {
      loading.value = false
    }
  }

  const handleSubmit = async () => {
    loading.value = true
    try {
      await http.post('/system/config/plugins', formData.value)
      message.success('保存配置成功')
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message)
      } else {
        message.error('保存配置失败')
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    formData,
    rules,
    fetchConfig,
    handleSubmit
  }
}
