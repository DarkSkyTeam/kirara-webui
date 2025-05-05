import { ref } from 'vue'
import { http } from '@/utils/http'
import { useMessage, useDialog } from 'naive-ui'
import type { FormRules, FormItemRule } from 'naive-ui'

export interface WebForm {
  host: string
  port: number
}

export interface WebConfig {
  web: WebForm
}

export function useWebViewModel() {
  const loading = ref(false)
  const message = useMessage()
  const dialog = useDialog()

  const formData = ref<WebForm>({
    host: '127.0.0.1',
    port: 8080
  })

  const rules: FormRules = {
    host: {
      required: true,
      message: '请输入服务地址',
      trigger: 'blur'
    },
    port: [
      {
        required: true,
        message: '请输入服务端口',
        trigger: 'blur'
      },
      {
        validator: (rule: FormItemRule, value: number) => {
          return (value > 0 && value < 65536) || new Error('端口号必须在1-65535之间')
        }
      }
    ]
  }

  const fetchConfig = async () => {
    loading.value = true
    try {
      const response = await http.get<WebConfig>('/system/config')
      formData.value = response.web
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
      dialog.warning({
        title: '修改确认',
        content:
          '修改Web服务配置可能会导致服务暂时不可用，修改后需要重启服务才能生效。如果配置了错误的地址或端口，可能会导致无法访问Web界面，请确认配置正确。是否继续？',
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            const response = await http.post<{ status: string; restart_required: boolean }>(
              '/system/config/web',
              formData.value
            )
            if (response.restart_required) {
              dialog.warning({
                title: '重启确认',
                content: `服务将在5秒后重启，新的监听地址将为：http://${formData.value.host}:${formData.value.port}，请自行访问。`,
                positiveText: '知道了',
                closable: false,
                maskClosable: false,
                onPositiveClick: async () => {
                  message.success('配置已保存，正在重启服务...')
                  dialog.destroyAll()
                  await http.post('/system/restart')
                }
              })
            }
          } catch (error: any) {
            if (error.response?.data?.message) {
              message.error(error.response.data.message)
            } else {
              message.error('保存配置失败')
            }
          }
        }
      })
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
